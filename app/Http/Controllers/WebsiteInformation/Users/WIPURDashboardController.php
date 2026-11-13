<?php

namespace App\Http\Controllers\WebsiteInformation\Users;

use App\Http\Controllers\Controller;
use App\Models\RequestStatus;
use App\Models\WipurRequestEvent;
use App\Models\WipurRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WIPURDashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user, 401, 'Unauthenticated.');

        $query = WipurRequest::query()
            ->with([
                'status',
                'department:id,name,shorten',
                'attachments',
                'latestStep',
            ])
            ->where('user_id', $user->id)
            ->where(function ($q) {
                // 1. Exclude terminal statuses (Completed, Cancelled, Unserviceable)
                $q->whereDoesntHave('status', function ($statusQuery) {
                    $statusQuery->whereIn('name', ['Completed', 'Cancelled', 'Unserviceable']);
                })
                // 2. Exclude declined requests (by Supervisor OR Admin)
                ->whereDoesntHave('steps', function ($stepQuery) {
                    $stepQuery->where('is_declined', true);
                });
            })
            ->orderByDesc('created_at');

        if ($request->filled('status')) {
            $statusValue = trim((string) $request->input('status'));
            $statusName = strtolower($statusValue);

            if ($statusName === 'pending') {
                $query->where('status_id', function ($q) {
                    $q->select('id')->from('request_statuses')->where('name', 'Pending');
                });
            } elseif ($statusName === 'ongoing') {
                $query->where('status_id', function ($q) {
                    $q->select('id')->from('request_statuses')->whereIn('name', ['Ongoing', 'In Progress']);
                });
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
            $statusLabel = $requestItem->status?->name ?? 'Pending';
            $currentWorkflowStatus = $requestItem->currentWorkflowStatus();

            return [
                'id' => $requestItem->id,
                'control_number' => $requestItem->control_number,
                'department' => $requestItem->department?->name,
                'status' => $statusLabel,
                'sub_status' => $currentWorkflowStatus,
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
            'latestStep',
            'events.actor',
        ]);

        $latestStep = $wipurRequest->latestStep;
        
        // Find if there is a decline anywhere in the steps
        $declinedStep = $wipurRequest->steps()->where('is_declined', true)->first();
        $isDeclined = (bool) $declinedStep;

        return response()->json([
            'data' => [
                'id' => $wipurRequest->id,
                'control_number' => $wipurRequest->control_number,
                'requested_by' => $wipurRequest->requested_by,
                'request_desc' => $wipurRequest->request_desc,
                'department' => $wipurRequest->department?->name,
                'status' => $isDeclined ? 'Declined' : $wipurRequest->status?->name,
                'sub_status' => $wipurRequest->currentWorkflowStatus(),
                'is_declined' => $isDeclined,
                'declined_by' => $isDeclined ? $declinedStep->step : null,
                'return_reason' => $latestStep?->status === 'returned' ? $latestStep->remarks : null,
                'decline_reason' => $isDeclined ? $declinedStep->decline_reason : null,
                'approved_by' => $wipurRequest->approved_by,
                'processed_by' => $wipurRequest->processed_by,
                'acknowledged_by' => $wipurRequest->acknowledged_by,
                'attachments' => $wipurRequest->attachments->map(fn ($attachment) => [
                    'id' => $attachment->id,
                    'original_name' => $attachment->original_name,
                    'file_path' => $attachment->file_path,
                    'type' => $attachment->type,
                ])->values(),
                'events' => $wipurRequest->events
                    ->sortBy('created_at')
                    ->values()
                    ->map(fn ($event) => [
                        'event_type' => $event->event_type,
                        'from_status' => $event->from_status,
                        'to_status' => $event->to_status,
                        'request_desc' => $event->request_desc,
                        'remarks' => $event->remarks,
                        'metadata' => $event->metadata,
                        'actor' => $event->actor?->name,
                        'created_at' => $event->created_at?->toIso8601String(),
                    ]),
                'created_at_human' => optional($wipurRequest->created_at)->format('M d, Y'),
            ],
        ]);
    }

    private function countsForUser(int $userId): array
    {
        $base = WipurRequest::where('user_id', $userId)
            ->where(function ($q) {
                // Exclude terminal statuses
                $q->whereDoesntHave('status', function ($statusQuery) {
                    $statusQuery->whereIn('name', ['Completed', 'Cancelled', 'Unserviceable']);
                })
                // Exclude declined requests
                ->whereDoesntHave('steps', function ($stepQuery) {
                    $stepQuery->where('is_declined', true);
                });
            });

        return [
            'all' => (clone $base)->count(),
            'Pending' => (clone $base)->where('status_id', RequestStatus::where('name', 'Pending')->value('id'))->count(),
            'Ongoing' => (clone $base)->where('status_id', RequestStatus::where('name', 'Ongoing')->value('id'))->count(),
        ];
    }

    public function cancel(Request $request, WipurRequest $wipurRequest): JsonResponse
    {
        $user = $request->user();
        abort_unless($user, 401, 'Unauthenticated.');

        if ((int) $wipurRequest->user_id !== (int) $user->id) {
            abort(403, 'Forbidden.');
        }

        $cancelledStatus = RequestStatus::where('name', 'Cancelled')->first();

        if (! $cancelledStatus) {
            return response()->json(['message' => 'Cancelled status not configured.'], 500);
        }

        $updatedRequest = DB::transaction(function () use ($wipurRequest, $cancelledStatus, $user) {
            $lockedRequest = WipurRequest::query()
                ->whereKey($wipurRequest->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedRequest->is_cancelled) {
                abort(400, 'Request is already cancelled.');
            }

            $isDeclined = $lockedRequest->steps()
                ->where('is_declined', true)
                ->exists();
            abort_if($isDeclined, 422, 'Declined requests cannot be cancelled.');

            WipurRequestEvent::record([
                'wipur_request_id' => $lockedRequest->id,
                'actor_user_id' => $user->id,
                'event_type' => 'cancelled',
                'from_status' => $lockedRequest->currentWorkflowStatus(),
                'to_status' => 'cancelled',
                'request_desc' => $lockedRequest->request_desc,
                'remarks' => 'Request cancelled by the requester.',
            ]);

            $lockedRequest->update([
                'status_id' => $cancelledStatus->id,
                'is_cancelled' => true,
                'cancelled_by' => $user->name,
            ]);

            return $lockedRequest;
        });

        return response()->json([
            'message' => 'Request cancelled successfully.',
            'data' => $updatedRequest->fresh(),
        ]);
    }
}