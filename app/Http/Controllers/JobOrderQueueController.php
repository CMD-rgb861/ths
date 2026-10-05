<?php

namespace App\Http\Controllers;

use App\Models\JobOrder;
use Illuminate\Http\Request;

class JobOrderQueueController extends Controller
{
    /**
     * Get all pending and ongoing job orders in queue order (sorted by creation date)
     * Highlights the current user's job
     */
    public function index(Request $request)
    {
        try {
            $userId = $request->user()->id;

            $perPage = min(max((int) $request->input('per_page', 10), 1), 50);
            $page    = max((int) $request->input('page', 1), 1);

            $paginated = JobOrder::with([
                    'requester:id,name',
                    'department:id,name',
                ])
                ->whereHas('requestStatus', function ($q) {
                    $q->whereIn('name', ['Pending', 'Ongoing']);
                })
                ->orderBy('created_at', 'asc')
                ->paginate($perPage, ['*'], 'page', $page);

            // Position numbers should be continuous across pages,
            // so we compute the offset once from the paginator.
            $offset = ($paginated->currentPage() - 1) * $paginated->perPage();

            $items = collect($paginated->items())->values()->map(function ($job, $idx) use ($userId, $offset) {
                return [
                    'id' => $job->id,
                    'job_order_no' => $job->job_order_no,
                    'created_at' => $job->created_at,
                    'position' => $offset + $idx + 1,
                    'is_user_job' => $job->requested_by === $userId,
                    'requester' => $job->requester ? [
                        'id' => $job->requester->id,
                        'name' => $job->requester->name,
                    ] : null,
                    'department' => $job->department ? [
                        'id' => $job->department->id,
                        'name' => $job->department->name,
                    ] : null,
                ];
            });

            return response()->json([
                'data' => $items,
                'count' => $paginated->total(),
                'meta' => [
                    'current_page' => $paginated->currentPage(),
                    'last_page'    => $paginated->lastPage(),
                    'per_page'     => $paginated->perPage(),
                    'total'        => $paginated->total(),
                    'from'         => $paginated->firstItem(),
                    'to'           => $paginated->lastItem(),
                ],
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch queue',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get queue position for a specific job
     */
    public function getPosition(Request $request, JobOrder $jobOrder)
    {
        try {
            $requestStatusName = $jobOrder->requestStatus?->name ?? $jobOrder->status;

            if (!in_array($requestStatusName, ['Pending', 'Ongoing'])) {
                return response()->json([
                    'message' => 'Job is not in the queue (not Pending or Ongoing status).'
                ], 400);
            }

            $allQueuedJobs = JobOrder::whereHas('requestStatus', function ($q) {
                $q->whereIn('name', ['Pending', 'Ongoing']);
            })
            ->orderBy('created_at', 'asc')
            ->get(['id']);

            $position = $allQueuedJobs->search(function ($job) use ($jobOrder) {
                return $job->id === $jobOrder->id;
            });

            if ($position === false) {
                return response()->json([
                    'message' => 'Job not found in queue.'
                ], 404);
            }

            return response()->json([
                'job_id' => $jobOrder->id,
                'job_order_no' => $jobOrder->job_order_no,
                'position' => $position + 1,
                'total_in_queue' => $allQueuedJobs->count(),
                'is_user_job' => $jobOrder->requested_by === $request->user()->id,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch position',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get queue statistics for dashboard/header
     */
    public function getStats(Request $request)
    {
        try {
            $totalQueued = JobOrder::whereHas('requestStatus', function ($q) {
                $q->whereIn('name', ['Pending', 'Ongoing']);
            })->count();

            return response()->json([
                'total_in_queue' => $totalQueued,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch stats',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get user's own jobs with their positions in the full queue
     */
    public function getUserJobsInQueue(Request $request)
    {
        try {
            $userId = $request->user()->id;

            $userJobs = JobOrder::where('requested_by', $userId)
                ->whereHas('requestStatus', function ($q) {
                    $q->whereIn('name', ['Pending', 'Ongoing']);
                })
                ->orderBy('created_at', 'asc')
                ->get(['id', 'job_order_no', 'created_at', 'requested_by']);

            $allQueuedJobs = JobOrder::whereHas('requestStatus', function ($q) {
                $q->whereIn('name', ['Pending', 'Ongoing']);
            })
            ->orderBy('created_at', 'asc')
            ->get(['id']);

            $jobsWithPositions = $userJobs->map(function ($job) use ($allQueuedJobs, $userId) {
                $position = $allQueuedJobs->search(function ($queuedJob) use ($job) {
                    return $queuedJob->id === $job->id;
                });

                return [
                    'id' => $job->id,
                    'job_order_no' => $job->job_order_no,
                    'position' => $position !== false ? $position + 1 : null,
                    'total_in_queue' => $allQueuedJobs->count(),
                    'is_user_job' => $job->requested_by === $userId,
                ];
            });

            return response()->json([
                'data' => $jobsWithPositions,
                'count' => $jobsWithPositions->count(),
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch user jobs',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * User's own jobs with surrounding context (first + last + gap markers).
     * Returns a compact list the frontend can render as a single page.
     */
    public function getUserWindow(Request $request)
    {
        try {
            $userId = $request->user()->id;

            // All queued jobs, ordered
            $allQueuedJobs = JobOrder::whereHas('requestStatus', function ($q) {
                    $q->whereIn('name', ['Pending', 'Ongoing']);
                })
                ->orderBy('created_at', 'asc')
                ->get(['id', 'job_order_no', 'created_at', 'requested_by']);

            $total = $allQueuedJobs->count();

            if ($total === 0) {
                return response()->json([
                    'total_in_queue' => 0,
                    'entries' => [],
                ], 200);
            }

            // Positions the user should see:
            //   - all their own jobs
            //   - the first job
            //   - the last job
            $visiblePositions = [];

            $allQueuedJobs->each(function ($job, $idx) use ($userId, &$visiblePositions) {
                $position = $idx + 1;
                if ($job->requested_by === $userId) {
                    $visiblePositions[] = $position;
                }
            });

            // Always include the first and last positions for context
            $visiblePositions[] = 1;
            $visiblePositions[] = $total;

            // De-dupe + sort
            $visiblePositions = array_values(array_unique($visiblePositions));
            sort($visiblePositions);

            // Build entries with gap markers
            $entries = [];
            $previous = 0;

            foreach ($visiblePositions as $pos) {
                if ($pos > $previous + 1) {
                    $entries[] = [
                        'kind' => 'gap',
                        'from' => $previous + 1,
                        'to'   => $pos - 1,
                    ];
                }

                $job = $allQueuedJobs[$pos - 1];
                $entries[] = [
                    'kind' => 'job',
                    'position' => $pos,
                    'id' => $job->id,
                    'job_order_no' => $job->job_order_no,
                    'is_user_job' => $job->requested_by === $userId,
                ];

                $previous = $pos;
            }

            return response()->json([
                'total_in_queue' => $total,
                'entries' => $entries,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch user window',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}