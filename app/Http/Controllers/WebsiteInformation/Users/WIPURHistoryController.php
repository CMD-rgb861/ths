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
            ])
            ->where('user_id', $user->id)
            ->where(function ($query) {
                $query->whereHas('status', function ($statusQuery) {
                    $statusQuery->whereIn('name', ['Completed', 'Cancelled', 'Unserviceable']);
                })->orWhereHas('steps', function ($stepQuery) {
                    $stepQuery->where('step', 'supervisor')
                        ->where('is_declined', true);
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
                    $stepQuery->where('step', 'supervisor')
                        ->where('is_declined', true);
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
            $isDeclined = $latestStep?->step === 'supervisor' && $latestStep->is_declined;

            return [
                'id' => $requestItem->id,
                'control_number' => $requestItem->control_number,
                'requested_by' => $requestItem->requested_by,
                'request_desc' => $requestItem->request_desc,
                'department' => $requestItem->department?->name,
                'status' => $isDeclined ? 'Declined' : ($requestItem->status?->name ?? 'Unknown'),
                'sub_status' => $isDeclined ? null : $requestItem->currentWorkflowStatus(),
                'return_reason' => $latestStep?->status === 'returned' ? $latestStep->remarks : null,
                'decline_reason' => $isDeclined ? $latestStep->decline_reason : null,
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
            'status_options' => RequestStatus::whereIn('name', ['Completed', 'Cancelled', 'Unserviceable'])
                ->get(['id', 'name'])
                ->push(['id' => 'declined', 'name' => 'Declined'])
                ->values(),
        ]);
    }
}
