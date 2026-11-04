<?php

namespace App\Http\Controllers\GeneralJobOrderControllers\Users;

use App\Http\Controllers\Controller;
use App\Models\GjorJobOrder;
use App\Models\RequestStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HistoryController extends Controller
{
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
                'attachments',
            ])
            ->where('user_id', $user->id)
            // ✅ Force history to ONLY show completed, cancelled, or unserviceable
            ->whereHas('status', function ($q) {
                $q->whereIn('name', ['Completed', 'Cancelled', 'Unserviceable']);
            })
            ->orderByDesc('updated_at');

        // ── Search ───────────────────────────────────────────────
        if ($request->filled('search')) {
            $search = '%' . trim((string) $request->input('search')) . '%';
            $query->where(function ($q) use ($search) {
                $q->where('request_no', 'like', $search)
                  ->orWhere('purpose', 'like', $search)
                  ->orWhere('others_desc', 'like', $search);
            });
        }

        // ── Status filter ────────────────────────────────────────
        if ($request->filled('status')) {
            $statusName = trim((string) $request->input('status'));
            $status = RequestStatus::where('name', $statusName)->first();
            if ($status) {
                $query->where('status_id', $status->id);
            }
        }

        // ── Date range filter ────────────────────────────────────
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->input('date_from'));
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->input('date_to'));
        }

        // ── Category (Request For) filter ────────────────────────
        if ($request->filled('request_for_id')) {
            $requestForId = $request->input('request_for_id');
            $query->whereHas('requestForItems', function ($q) use ($requestForId) {
                $q->where('request_for_id', $requestForId);
            });
        }

        // ── Pagination ───────────────────────────────────────────
        $perPage = min(max((int) $request->input('per_page', 10), 1), 100);
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
                'attachments'      => $job->attachments, // Included for the modal
                'others_desc'      => $job->others_desc,
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
            'status_options' => RequestStatus::whereIn('name', ['Completed', 'Cancelled', 'Unserviceable'])->get(['id', 'name']),
        ]);
    }
}