<?php

namespace App\Http\Controllers\WebsiteInformation\Users;

use App\Http\Controllers\Controller;
use App\Models\RequestStatus;
use App\Models\WipurRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WIPURDashboardController extends Controller
{
    /**
     * GET /api/website-information/my-requests
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user, 401, 'Unauthenticated.');

        $query = WipurRequest::query()
            ->with([
                'status',
                'department:id,name,shorten',
                'attachments',
            ])
            ->where('user_id', $user->id)
            ->whereHas('status', function ($q) {
                $q->whereNotIn('name', ['Completed', 'Cancelled', 'Unserviceable']);
            })
            ->orderByDesc('created_at');

        if ($request->filled('status')) {
            $statusName = trim((string) $request->input('status'));
            $status = RequestStatus::where('name', $statusName)->first();

            if ($status) {
                $query->where('status_id', $status->id);
            }
        }

        if ($request->filled('search')) {
            $search = '%' . trim((string) $request->input('search')) . '%';
            $query->where(function ($q) use ($search) {
                $q->where('control_number', 'like', $search)
                    ->orWhere('requested_by', 'like', $search)
                    ->orWhere('request_desc', 'like', $search);
            });
        }

        $perPage = min(max((int) $request->input('per_page', 50), 1), 200);
        $paginated = $query->paginate($perPage);

        $rows = collect($paginated->items())->map(function (WipurRequest $requestItem) {
            $statusName = $requestItem->status?->name ?? 'Unknown';

            return [
                'id' => $requestItem->id,
                'control_number' => $requestItem->control_number,
                'department' => $requestItem->department?->name,
                'status' => $statusName,
                'sub_status' => $requestItem->sub_status,
                'date_requested' => $requestItem->date_requested?->format('Y-m-d'),
                'date_requested_human' => $requestItem->date_requested?->format('M d, Y'),
                'is_cancelled' => (bool) $requestItem->is_cancelled,
                'is_conformed' => (bool) $requestItem->is_conformed,
            ];
        })->values();

        return response()->json([
            'data' => $rows,
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ],
            'counts' => $this->countsForUser($user->id),
        ]);
    }

    /**
     * GET /api/website-information/requests/{wipurRequest}
     */
    public function show(Request $request, WipurRequest $wipurRequest): JsonResponse
    {
        $user = $request->user();
        abort_unless($user, 401, 'Unauthenticated.');

        if ((int) $wipurRequest->user_id !== (int) $user->id) {
            abort(403, 'Forbidden.');
        }

        $wipurRequest->load([
            'status',
            'department:id,name',
            'attachments',
        ]);

        return response()->json([
            'data' => [
                'id' => $wipurRequest->id,
                'control_number' => $wipurRequest->control_number,
                'requested_by' => $wipurRequest->requested_by,
                'request_desc' => $wipurRequest->request_desc,
                'department' => $wipurRequest->department?->name,
                'status' => $wipurRequest->status?->name,
                'sub_status' => $wipurRequest->sub_status,
                'approved_by' => $wipurRequest->approved_by,
                'processed_by' => $wipurRequest->processed_by,
                'acknowledged_by' => $wipurRequest->acknowledged_by,
                'attachments' => $wipurRequest->attachments->map(fn ($attachment) => [
                    'id' => $attachment->id,
                    'original_name' => $attachment->original_name,
                    'file_path' => $attachment->file_path,
                    'type' => $attachment->type,
                ])->values(),
                'created_at_human' => optional($wipurRequest->created_at)->format('M d, Y'),
            ],
        ]);
    }

    private function countsForUser(int $userId): array
    {
        $statuses = RequestStatus::pluck('name', 'id');

        $base = WipurRequest::where('user_id', $userId)
            ->whereHas('status', function ($q) {
                $q->whereNotIn('name', ['Completed', 'Cancelled', 'Unserviceable']);
            });

        return [
            'all' => (clone $base)->count(),
            'Pending' => (clone $base)->where('status_id', $statuses->search('Pending'))->count(),
            'Ongoing' => (clone $base)->where('status_id', $statuses->search('Ongoing'))->count(),
        ];
    }

    public function cancel(Request $request, WipurRequest $wipurRequest): JsonResponse
    {
        $user = $request->user();
        abort_unless($user, 401, 'Unauthenticated.');

        if ((int) $wipurRequest->user_id !== (int) $user->id) {
            abort(403, 'Forbidden.');
        }

        if ($wipurRequest->is_cancelled) {
            return response()->json(['message' => 'Request is already cancelled.'], 400);
        }

        $cancelledStatus = RequestStatus::where('name', 'Cancelled')->first();

        if (! $cancelledStatus) {
            return response()->json(['message' => 'Cancelled status not configured.'], 500);
        }

        $wipurRequest->update([
            'status_id' => $cancelledStatus->id,
            'is_cancelled' => true,
            'cancelled_by' => $user->name,
        ]);

        return response()->json([
            'message' => 'Request cancelled successfully.',
            'data' => $wipurRequest,
        ]);
    }
}