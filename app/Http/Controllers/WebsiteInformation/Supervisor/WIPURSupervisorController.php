<?php

namespace App\Http\Controllers\WebsiteInformation\Supervisor;

use App\Http\Controllers\Controller;
use App\Models\WipurRequest;
use App\Models\WipurRequestEvent;
use App\Models\WipurStep;
use App\Models\WipurRoleUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class WIPURSupervisorController extends Controller
{
    // =========================================================================
    // API ENDPOINTS
    // =========================================================================

    public function index(Request $request): JsonResponse
    {
        return $this->pending($request);
    }

    public function pending(Request $request): JsonResponse
    {
        $user = $this->authorizeSupervisor();
        $departmentIds = $this->getAllowedDepartmentIds($user);

        if ($departmentIds->isEmpty()) {
            return $this->emptyPaginatedResponse();
        }

        $query = WipurRequest::query()
            ->with([
                'department:id,name',
                'status:id,name',
                'user:id,name',
                'attachments',
                'steps' => function ($q) {
                    $q->where('step', 'supervisor')->orderByDesc('updated_at')->orderByDesc('id');
                },
            ])
            ->whereIn('department_id', $departmentIds)
            ->where(function ($q) {
                $q->whereDoesntHave('steps')
                  ->orWhereHas('steps', function ($stepQuery) {
                      $stepQuery->where('step', 'supervisor')
                          ->whereIn('status', [
                              'waiting_for_approval',
                              'waiting_for_supervisor_approval',
                          ]);
                  });
            })
            ->orderByRaw('COALESCE(date_requested, created_at) ASC');

        $this->applyFilters($query, $request);

        $perPage = min(max((int) $request->input('per_page', 10), 1), 50);
        $paginated = $query->paginate($perPage);

        return response()->json([
            'data' => $paginated->items() ? collect($paginated->items())->map(fn ($req) => $this->serializeQueueItem($req))->values() : [],
            'meta' => $this->buildPaginationMeta($paginated),
        ]);
    }

    public function returned(Request $request): JsonResponse
    {
        $user = $this->authorizeSupervisor();
        $departmentIds = $this->getAllowedDepartmentIds($user);

        if ($departmentIds->isEmpty()) {
            return $this->emptyPaginatedResponse();
        }

        $query = WipurRequest::query()
            ->with([
                'department:id,name',
                'status:id,name',
                'user:id,name',
                'attachments',
                'steps' => function ($q) {
                    $q->where('step', 'supervisor')->orderByDesc('updated_at')->orderByDesc('id');
                },
            ])
            ->whereIn('department_id', $departmentIds)
            ->whereHas('steps', function ($stepQuery) {
                $stepQuery->where('step', 'supervisor')
                    ->where('status', 'returned');
            })
            ->orderByDesc('updated_at');

        $this->applyFilters($query, $request);

        $perPage = min(max((int) $request->input('per_page', 10), 1), 50);
        $paginated = $query->paginate($perPage);

        return response()->json([
            'data' => $paginated->items() ? collect($paginated->items())->map(fn ($req) => $this->serializeQueueItem($req))->values() : [],
            'meta' => $this->buildPaginationMeta($paginated),
        ]);
    }

    public function audit(Request $request): JsonResponse
    {
        $user = $this->authorizeSupervisor();
        $departmentIds = $this->getAllowedDepartmentIds($user);

        $query = WipurRequestEvent::query()
            ->with(['request.department', 'request.user', 'actor'])
            ->whereIn('event_type', [
                'supervisor_approved',
                'supervisor_returned',
                'supervisor_declined',
            ])
            ->where('actor_user_id', $user->id)
            ->whereHas('request', function ($q) use ($departmentIds) {
                $q->whereIn('department_id', $departmentIds);
            })
            ->orderByDesc('created_at');

        $this->applyFilters($query, $request);

        $perPage = min(max((int) $request->input('per_page', 10), 1), 50);
        $paginated = $query->paginate($perPage);

        return response()->json([
            'data' => $paginated->items()
                ? collect($paginated->items())->map(fn ($event) => $this->serializeAuditEvent($event))->values()
                : [],
            'meta' => $this->buildPaginationMeta($paginated),
        ]);
    }

    public function show(Request $request, WipurRequest $wipurRequest): JsonResponse
    {
        $user = $this->authorizeSupervisor();
        
        if (! $this->getAllowedDepartmentIds($user)->contains($wipurRequest->department_id)) {
            abort(403, 'Forbidden: This request is not assigned to your department.');
        }

        $wipurRequest->load(['department', 'user', 'status', 'attachments', 'latestStep']);

        return response()->json([
            'data' => [
                'id' => $this->formatRequestId($wipurRequest),
                'request_id' => $wipurRequest->id,
                'control_number' => $wipurRequest->control_number,
                'requester' => $wipurRequest->requested_by ?? $wipurRequest->user?->name ?? 'Unknown',
                'department' => $wipurRequest->department?->name ?? 'Unassigned',
                'submittedAt' => $wipurRequest->date_requested
                    ? $wipurRequest->date_requested->format('Y-m-d h:i A')
                    : optional($wipurRequest->created_at)->format('Y-m-d h:i A'),
                'remarks' => $wipurRequest->request_desc ?: 'No details provided.',
                'attachments' => $wipurRequest->attachments->map(fn ($file) => [
                    'id' => $file->id,
                    'original_name' => $file->original_name,
                    'file_path' => $file->file_path,
                    'type' => $file->type,
                ])->values(),
            ],
        ]);
    }

    // =========================================================================
    // DATA SERIALIZERS
    // =========================================================================

    private function serializeQueueItem(WipurRequest $requestItem): array
    {
        $subStatus = $requestItem->currentWorkflowStatus() ?? 'waiting_for_supervisor_approval';
        $stepRemarks = $requestItem->latestStep?->remarks;
        $declineReason = $requestItem->latestStep?->decline_reason;

        return [
            'id' => $this->formatRequestId($requestItem),
            'request_id' => $requestItem->id,
            'control_number' => $requestItem->control_number,
            'requester' => $requestItem->requested_by ?? $requestItem->user?->name ?? 'Unknown',
            'department' => $requestItem->department?->name ?? 'Unassigned',
            'submittedAt' => $requestItem->date_requested
                ? $requestItem->date_requested->format('Y-m-d h:i A')
                : optional($requestItem->created_at)->format('Y-m-d h:i A'),
            'submittedRelative' => $requestItem->date_requested
                ? $requestItem->date_requested->diffForHumans()
                : optional($requestItem->created_at)->diffForHumans(),
            'requestType' => $this->mapStatusLabel($subStatus),
            'remarks' => $requestItem->request_desc ?: 'No details provided.', 
            'step_remarks' => $stepRemarks, 
            'decline_reason' => $declineReason,
            'priority' => 'normal',
            'attachmentsCount' => $requestItem->attachments->count(),
            'attachments' => $requestItem->attachments->map(fn ($file) => [
                'id' => $file->id,
                'original_name' => $file->original_name,
                'file_path' => $file->file_path,
                'type' => $file->type,
            ])->values(),
            'sub_status' => $subStatus,
        ];
    }

    private function serializeAuditEvent(WipurRequestEvent $event): array
    {
        $request = $event->request;

        return [
            'id' => $request ? $this->formatRequestId($request) : '—',
            'request_id' => $request?->id,
            'requester' => $request?->requested_by ?? $request?->user?->name ?? 'Unknown requester',
            'department' => $request?->department?->name ?? 'Unassigned',
            'decision' => match ($event->event_type) {
                'supervisor_approved' => 'Approved',
                'supervisor_returned' => 'Returned',
                'supervisor_declined' => 'Declined',
                default => 'Updated',
            },
            'decidedBy' => $event->actor?->name ?? 'Unknown supervisor',
            'date' => $event->created_at?->format('Y-m-d'),
            'dateLabel' => $event->created_at?->format('M j, Y'),
            'remarks' => $event->remarks ?: 'No remarks provided.',
            'request_desc' => $event->request_desc,
            'metadata' => $event->metadata,
        ];
    }

    // =========================================================================
    // AUTHORIZATION & SECURITY
    // =========================================================================

    private function authorizeSupervisor()
    {
        $user = request()->user();
        abort_unless($user && $user->isWipurSupervisor(), 403, 'Forbidden: WIPUR supervisor access only.');

        return $user;
    }

    private function getAllowedDepartmentIds($user): Collection
    {
        if (! $user) {
            return collect();
        }

        return WipurRoleUser::query()
            ->where('user_id', $user->id)
            ->whereNotNull('department_id')
            ->pluck('department_id')
            ->filter()
            ->unique()
            ->values();
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    private function applyFilters($query, Request $request): void
    {
        // General Search
        if ($request->filled('search')) {
            $search = '%' . trim((string) $request->input('search')) . '%';
            
            $query->where(function ($q) use ($search) {
                if ($q->getModel() instanceof WipurRequestEvent) {
                    $q->whereHas('request', function ($rq) use ($search) {
                        $rq->where('control_number', 'like', $search)
                           ->orWhere('requested_by', 'like', $search)
                           ->orWhere('request_desc', 'like', $search);
                    });
                } else {
                    $q->where('control_number', 'like', $search)
                      ->orWhere('requested_by', 'like', $search)
                      ->orWhere('request_desc', 'like', $search);
                }
            });
        }

        // Department Filter
        if ($request->filled('department_id')) {
            $deptId = $request->input('department_id');
            if ($query->getModel() instanceof WipurRequestEvent) {
                $query->whereHas('request', fn($q) => $q->where('department_id', $deptId));
            } else {
                $query->where('department_id', $deptId);
            }
        }

        // Date Range Filters
        if ($request->filled('start_date')) {
            $startDate = $request->input('start_date') . ' 00:00:00';
            if ($query->getModel() instanceof WipurRequestEvent) {
                $query->where('created_at', '>=', $startDate);
            } else {
                $query->where('date_requested', '>=', $startDate);
            }
        }

        if ($request->filled('end_date')) {
            $endDate = $request->input('end_date') . ' 23:59:59';
            if ($query->getModel() instanceof WipurRequestEvent) {
                $query->where('created_at', '<=', $endDate);
            } else {
                $query->where('date_requested', '<=', $endDate);
            }
        }
    }

    private function buildPaginationMeta($paginated): array
    {
        return [
            'current_page' => $paginated->currentPage(),
            'last_page' => $paginated->lastPage(),
            'per_page' => $paginated->perPage(),
            'total' => $paginated->total(),
        ];
    }

    private function emptyPaginatedResponse(): JsonResponse
    {
        return response()->json([
            'data' => [],
            'meta' => ['current_page' => 1, 'last_page' => 1, 'per_page' => 10, 'total' => 0],
        ]);
    }

    private function mapStatusLabel(?string $status): string
    {
        return match (strtolower(trim((string) $status))) {
            'waiting_for_supervisor_approval' => 'Awaiting Supervisor Review',
            'waiting_for_admin_approval' => 'Awaiting Admin Review',
            'returned' => 'Returned for Revision',
            'approved' => 'Approved',
            'declined' => 'Declined',
            'completed' => 'Completed',
            default => 'Pending',
        };
    }

    private function formatRequestId(WipurRequest $request): string
    {
        $number = $request->control_number ?: str_pad((string) $request->id, 4, '0', STR_PAD_LEFT);
        return $number;
    }
}