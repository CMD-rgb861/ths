<?php

namespace App\Http\Controllers\GeneralJobOrderControllers\Users;

use App\Http\Controllers\Controller;
use App\Models\GjorJobOrder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RequestQueueController extends Controller
{
    /**
     * GET /api/gjor/queue/window
     * Returns a compact list of the queue specifically for the user view.
     */
    public function getUserWindow(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user, 401, 'Unauthenticated.');

        // Fetch all Pending and Ongoing requests
        // Sort: Ongoing first (jump to top), then by request_no (ascending)
        $allQueuedJobs = GjorJobOrder::query()
            ->join('request_statuses', 'gjor_job_orders.status_id', '=', 'request_statuses.id')
            ->whereIn('request_statuses.name', ['Pending', 'Ongoing'])
            ->orderByRaw("CASE WHEN request_statuses.name = 'Ongoing' THEN 0 ELSE 1 END")
            ->orderBy('gjor_job_orders.request_no', 'asc')
            ->get([
                'gjor_job_orders.id',
                'gjor_job_orders.request_no',
                'gjor_job_orders.user_id',
                'request_statuses.name as status_name'
            ]);

        $total = $allQueuedJobs->count();

        if ($total === 0) {
            return response()->json([
                'total_in_queue' => 0,
                'entries' => [],
            ]);
        }

        // 1. Find all positions where the user's jobs are located
        $visiblePositions = [];
        $allQueuedJobs->each(function ($job, $idx) use ($user, &$visiblePositions) {
            if ($job->user_id === $user->id) {
                $visiblePositions[] = $idx + 1; // Position is 1-based
            }
        });

        // 2. Always include the first and last positions for context
        $visiblePositions[] = 1;
        $visiblePositions[] = $total;

        // 3. De-dupe and sort
        $visiblePositions = array_values(array_unique($visiblePositions));
        sort($visiblePositions);

        // 4. Build entries with gap markers
        $entries = [];
        $previous = 0;

        foreach ($visiblePositions as $pos) {
            // Insert gap marker if there's a jump in positions
            if ($pos > $previous + 1) {
                $entries[] = [
                    'kind' => 'gap',
                    'from' => $previous + 1,
                    'to'   => $pos - 1,
                ];
            }

            $job = $allQueuedJobs[$pos - 1];
            $entries[] = [
                'kind'         => 'job',
                'position'     => $pos,
                'id'           => $job->id,
                'request_no'   => $job->request_no,
                'status'       => $job->status_name,
                'is_user_job'  => $job->user_id === $user->id,
            ];

            $previous = $pos;
        }

        return response()->json([
            'total_in_queue' => $total,
            'entries' => $entries,
        ]);
    }
}