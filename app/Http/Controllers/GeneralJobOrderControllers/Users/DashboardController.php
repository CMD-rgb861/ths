<?php

namespace App\Http\Controllers\GeneralJobOrderControllers\Users;

use App\Http\Controllers\Controller;
use App\Models\GjorJobOrder;
use App\Models\RequestStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * GET /api/gjor/job-orders/{jobOrder}
     * Returns one authenticated user's GJOR job order for the dashboard modal.
     */
    public function show(Request $request, GjorJobOrder $jobOrder): JsonResponse
    {
        $user = $request->user();
        abort_unless($user, 401, 'Unauthenticated.');

        if ((int) $jobOrder->user_id !== (int) $user->id) {
            abort(403, 'Forbidden.');
        }

        $jobOrder->load([
            'status',
            'department:id,name',
            'attachments',
            'requestForItems.requestFor:id,name',
        ]);

        $purpose = (string) $jobOrder->purpose;
        $location = trim((string) ($jobOrder->location ?? ''));

        if ($location === '' && preg_match('/^Location:\s*(.+?)\n\n/s', $purpose, $match)) {
            $location = trim($match[1]);
            $purpose = trim(substr($purpose, strlen($match[0])));
        }

        return response()->json([
            'data' => [
                'id' => $jobOrder->id,
                'request_no' => $jobOrder->request_no,
                'purpose' => $purpose,
                'location' => $location,
                'contact_no' => $jobOrder->contact_no,
                'department' => $jobOrder->department?->name,
                'status' => $jobOrder->status?->name,
                'sub_status' => $jobOrder->sub_status,
                'requested_by' => $jobOrder->requested_by,
                'others_desc' => $jobOrder->others_desc,
                'request_for_items' => $jobOrder->requestForItems->map(fn ($item) => [
                    'name' => $item->requestFor?->name ?? '—',
                    'quantity' => (int) $item->quantity,
                ])->values(),
                'attachments' => $jobOrder->attachments->map(fn ($attachment) => [
                    'id' => $attachment->id,
                    'original_name' => $attachment->original_name,
                    'file_path' => $attachment->file_path,
                    'type' => $attachment->type,
                ])->values(),
                'created_at_human' => optional($jobOrder->created_at)->format('M d, Y'),
            ],
        ]);
    }

    /**
     * GET /api/gjor/my-job-orders
     * Returns the authenticated user's active GJOR job orders.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user, 401, 'Unauthenticated.');

        $query = GjorJobOrder::query()
            ->with([
                'status',
                'department:id,name,shorten',
                'requestFor:id,name',
                'requestForItems.requestFor:id,name',
            ])
            ->where('user_id', $user->id)
            // ✅ EXCLUDE completed/cancelled requests from the dashboard
            ->whereHas('status', function ($q) {
                $q->whereNotIn('name', ['Completed', 'Cancelled', 'Unserviceable']);
            })
            ->orderByDesc('created_at');

        // ── "Pending Confirmation" tab vs "My Requests" tab ───────
        if ($request->boolean('pending_confirmation')) {
            $query->where('sub_status', 'Waiting for Confirmation')
                  ->where('is_conformed', false)
                  ->where('is_cancelled', false);
        } else {
            $query->where(function ($q) {
                $q->whereNull('sub_status')
                  ->orWhere('sub_status', '!=', 'Waiting for Confirmation');
            });
        }

        // ── Status filter ─────
        if ($request->filled('status')) {
            $statusName = trim((string) $request->input('status'));
            $status = RequestStatus::where('name', $statusName)->first();
            if ($status) {
                $query->where('status_id', $status->id);
            }
        }

        // ── Search ─────────
        if ($request->filled('search')) {
            $search = '%' . trim((string) $request->input('search')) . '%';
            $query->where(function ($q) use ($search) {
                $q->where('request_no', 'like', $search)
                  ->orWhere('purpose', 'like', $search)
                  ->orWhere('others_desc', 'like', $search);
            });
        }

        // ── Pagination ───────────────────────────────────────────
        $perPage = min(max((int) $request->input('per_page', 50), 1), 200);
        $paginated = $query->paginate($perPage);

        // ── Shape the response ───────────────────────────────────
        $rows = collect($paginated->items())->map(function (GjorJobOrder $job) {
            $statusName = $job->status?->name ?? 'Unknown';

            $purpose = (string) $job->purpose;
            $location = trim((string) ($job->location ?? ''));

            if ($location === '' && preg_match('/^Location:\s*(.+?)\n\n/s', $purpose, $m)) {
                $location = trim($m[1]);
                $purpose = trim(substr($purpose, strlen($m[0])));
            }

            return [
                'id'             => $job->id,
                'request_no'     => $job->request_no,
                'purpose'        => $purpose,
                'location'       => $location,
                'contact_no'     => $job->contact_no,
                'department'     => $job->department?->name,
                'status'         => $statusName,
                'sub_status'     => $job->sub_status,
                'requested_by'   => $job->requested_by,
                'request_for_summary' => $job->request_for_summary,
                'request_for_items'   => $job->requestForItems->map(fn ($r) => [
                    'name'     => $r->requestFor?->name ?? '—',
                    'quantity' => $r->quantity,
                ])->values(),
                'created_at'       => optional($job->created_at)->toIso8601String(),
                'created_at_human' => optional($job->created_at)->format('M d, Y'),
                'is_cancelled'     => (bool) $job->is_cancelled,
                'is_conformed'     => (bool) $job->is_conformed,
            ];
        })->values();

        return response()->json([
            'data' => $rows,
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page'    => $paginated->lastPage(),
                'per_page'     => $paginated->perPage(),
                'total'        => $paginated->total(),
            ],
            'counts' => $this->countsForUser($user->id),
        ]);
    }

    /**
     * Counts grouped by status name — used for the tab badges.
     */
    private function countsForUser(int $userId): array
    {
        $statuses = RequestStatus::pluck('name', 'id');

        $base = GjorJobOrder::where('user_id', $userId)
            // ✅ EXCLUDE completed/cancelled requests from the counts
            ->whereHas('status', function ($q) {
                $q->whereNotIn('name', ['Completed', 'Cancelled', 'Unserviceable']);
            });

        $myRequestsBase = (clone $base)->where(function ($q) {
            $q->whereNull('sub_status')
              ->orWhere('sub_status', '!=', 'Waiting for Confirmation');
        });

        return [
            'all'       => (clone $myRequestsBase)->count(),
            'Pending'   => (clone $myRequestsBase)->where('status_id', $statuses->search('Pending'))->count(),
            'Ongoing'   => (clone $myRequestsBase)->where('status_id', $statuses->search('Ongoing'))->count(),
            'Completed' => 0, // Hidden from dashboard
            
            'pending_confirmation' => (clone $base)
                ->where('sub_status', 'Waiting for Confirmation')
                ->where('is_conformed', false)
                ->where('is_cancelled', false)
                ->count(),
        ];
    }

    public function cancel(Request $request, GjorJobOrder $jobOrder): JsonResponse
    {
        $user = $request->user();
        abort_unless($user, 401, 'Unauthenticated.');

        if ((int) $jobOrder->user_id !== (int) $user->id) {
            abort(403, 'Forbidden.');
        }

        if ($jobOrder->is_cancelled) {
            return response()->json(['message' => 'Request is already cancelled.'], 400);
        }

        $cancelledStatus = RequestStatus::where('name', 'Cancelled')->first();
        
        if (!$cancelledStatus) {
            return response()->json(['message' => 'Cancelled status not configured.'], 500);
        }

        $jobOrder->update([
            'status_id'    => $cancelledStatus->id,
            'is_cancelled' => true,
            'cancelled_by' => $user->name,
        ]);

        return response()->json([
            'message' => 'Request cancelled successfully.',
            'data'    => $jobOrder
        ]);
    }
}