<?php

namespace App\Http\Controllers\WebsiteInformation\Users;

use App\Http\Controllers\Controller;
use App\Models\RequestStatus;
use App\Models\WipurRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WIPURRequestQueueController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user, 401, 'Unauthenticated.');

        // 1. Get the terminal statuses to exclude
        $terminalStatusIds = RequestStatus::whereIn('name', [
            'Completed', 
            'Cancelled', 
            'Unserviceable'
        ])->pluck('id')->all();

        // 2. Fetch the global active queue (ordered by oldest first)
        $queue = WipurRequest::query()
            ->with(['status'])
            ->where(function ($query) use ($terminalStatusIds) {
                $query->whereNull('status_id')
                    ->orWhereNotIn('status_id', $terminalStatusIds);
            })
            ->whereDoesntHave('steps', function ($stepQuery) {
                $stepQuery->where('is_declined', true);
            })
            ->orderBy('created_at', 'asc') // First come, first served
            ->orderBy('id', 'asc')
            ->get();

        $totalInQueue = $queue->count();
        
        // 3. Find the current user's first request in the queue
        $userFirstIndex = $queue->search(function ($item) use ($user) {
            return (int) $item->user_id === (int) $user->id;
        });

        $userPosition = $userFirstIndex !== false ? $userFirstIndex + 1 : null;

        // 4. Build a window of entries to show (e.g., 2 above and 3 below)
        $displayEntries = [];
        
        if ($userPosition !== null) {
            // Slice a chunk around the user's position (index is 0-based)
            $start = max(0, $userFirstIndex - 2);
            $end = min($totalInQueue, $userFirstIndex + 4);
            $window = $queue->slice($start, $end - $start);

            // Add gap at the beginning if we skipped items
            if ($start > 0) {
                $displayEntries[] = [
                    'kind' => 'gap',
                    'from' => 1,
                    'to' => $start,
                ];
            }

            foreach ($window as $index => $item) {
                $displayEntries[] = [
                    'id' => $item->id,
                    'request_no' => $item->control_number,
                    'position' => $start + $index + 1,
                    'status' => $item->status?->name ?? 'Pending',
                    'sub_status' => $item->currentWorkflowStatus(),
                    'is_user_job' => (int) $item->user_id === (int) $user->id,
                ];
            }

            // Add gap at the end if we skipped items
            if ($end < $totalInQueue) {
                $displayEntries[] = [
                    'kind' => 'gap',
                    'from' => $end + 1,
                    'to' => $totalInQueue,
                ];
            }
        } else {
            // The user has no active jobs. Show the top 5 of the queue.
            $window = $queue->take(5);
            
            foreach ($window as $index => $item) {
                $displayEntries[] = [
                    'id' => $item->id,
                    'request_no' => $item->control_number,
                    'position' => $index + 1,
                    'status' => $item->status?->name ?? 'Pending',
                    'sub_status' => $item->currentWorkflowStatus(),
                    'is_user_job' => false,
                ];
            }

            if ($totalInQueue > 5) {
                $displayEntries[] = [
                    'kind' => 'gap',
                    'from' => 6,
                    'to' => $totalInQueue,
                ];
            }
        }

        return response()->json([
            'entries' => $displayEntries,
            'total_in_queue' => $totalInQueue,
            'user_position' => $userPosition,
        ]);
    }
}