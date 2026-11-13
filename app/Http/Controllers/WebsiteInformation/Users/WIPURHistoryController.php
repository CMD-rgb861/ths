<?php

namespace App\Http\Controllers\WebsiteInformation\Users;

use App\Http\Controllers\Controller;
use App\Models\RequestStatus;
use App\Models\WipurRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WIPURHistoryController extends Controller
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
                'steps', // Load all steps
            ])
            ->where('user_id', $user->id)
            ->where(function ($query) {
                // 1. Regular final statuses
                $query->whereHas('status', function ($statusQuery) {
                    $statusQuery->whereIn('name', ['Completed', 'Cancelled', 'Unserviceable', 'Approved']);
                })
                // 2. Declined by anyone (Supervisor or Admin)
                ->orWhereHas('steps', function ($stepQuery) {
                    $stepQuery->where('is_declined', true);
                });
            })
            ->orderByDesc('updated_at');

        if ($request->filled('search')) {
            $search = '%' . trim((string) $request->input('search')) . '%';
            $query->where(function ($q) use ($search) {
                $q->where('control_number', 'like', $search)
                    ->orWhere('requested_by', 'like', $search)
                    ->orWhere('request_desc', 'like', $search);
            });
        }

        if ($request->filled('status')) {
            $statusName = trim((string) $request->input('status'));
            if ($statusName === 'Declined') {
                $query->whereHas('steps', function ($stepQuery) {
                    $stepQuery->where('is_declined', true);
                });
            } else {
                $status = RequestStatus::where('name', $statusName)->first();
                if ($status) {
                    $query->where('status_id', $status->id);
                }
            }
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->input('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->input('date_to'));
        }

        $perPage = min(max((int) $request->input('per_page', 10), 1), 100);
        $paginated = $query->paginate($perPage);

        $rows = collect($paginated->items())->map(function (WipurRequest $requestItem) {
            $latestStep = $requestItem->latestStep;
            $declinedStep = $requestItem->steps->firstWhere('is_declined', true);
            $adminStep = $requestItem->steps->firstWhere('step', 'admin');

            $displayStatus = $requestItem->status?->name ?? 'Unknown';
            $subStatus = $requestItem->currentWorkflowStatus();
            $reason = null;
            $declinedBy = null;

            // 1. Declined (Supervisor or Admin)
            if ($declinedStep) {
                $displayStatus = 'Declined';
                $declinedBy = $declinedStep->step;
                $reason = $declinedStep->decline_reason;
            } 
            // 2. Returned by Supervisor (waiting for user to resubmit)
            elseif ($latestStep && $latestStep->status === 'returned') {
                $displayStatus = 'Returned';
                $reason = $latestStep->remarks; 
            }
            // 3. Approved by Admin (but not yet completed by Admin)
            elseif ($displayStatus === 'Approved' && (!$adminStep || $adminStep->status !== 'completed')) {
                $displayStatus = 'Approved by Admin';
                $subStatus = 'approved'; 
            }
            // 4. Fully Completed
            elseif ($displayStatus === 'Completed' || ($adminStep && $adminStep->status === 'completed')) {
                $displayStatus = 'Completed';
                $subStatus = 'completed';
            }

            return [
                'id' => $requestItem->id,
                'control_number' => $requestItem->control_number,
                'requested_by' => $requestItem->requested_by,
                'request_desc' => $requestItem->request_desc,
                'department' => $requestItem->department?->name,
                'status' => $displayStatus,
                'sub_status' => $subStatus,
                'declined_by' => $declinedBy,
                'reason' => $reason,
                'created_at' => optional($requestItem->created_at)->toIso8601String(),
                'created_at_human' => optional($requestItem->created_at)->format('M d, Y'),
                'attachments' => $requestItem->attachments,
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
            'status_options' => RequestStatus::whereIn('name', ['Completed', 'Cancelled', 'Unserviceable', 'Approved'])
                ->get(['id', 'name'])
                ->push(['id' => 'declined', 'name' => 'Declined'])
                ->values(),
        ]);
    }
}