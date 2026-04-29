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

            $query = JobOrder::whereHas('requestStatus', function ($q) {
                // Only Pending and Ongoing request statuses
                $q->whereIn('name', ['Pending', 'Ongoing']);
            })
            ->orderBy('created_at', 'asc'); // Queue order (oldest first)

            $jobs = $query->get(['id', 'job_order_no', 'created_at', 'requested_by']);

            // Add flag to highlight user's own job
            $jobsWithFlag = $jobs->map(function ($job) use ($userId) {
                return [
                    'id' => $job->id,
                    'job_order_no' => $job->job_order_no,
                    'created_at' => $job->created_at,
                    'is_user_job' => $job->requested_by === $userId, // ← Flag for highlighting
                ];
            });

            return response()->json([
                'data' => $jobsWithFlag,
                'count' => $jobsWithFlag->count(),
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch queue',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get queue position for a specific job
     */
    public function getPosition(Request $request, JobOrder $jobOrder)
    {
        try {
            // Check if job is pending or ongoing
            $requestStatusName = $jobOrder->requestStatus?->name ?? $jobOrder->status;
            
            if (!in_array($requestStatusName, ['Pending', 'Ongoing'])) {
                return response()->json([
                    'message' => 'Job is not in the queue (not Pending or Ongoing status).'
                ], 400);
            }

            // Get all pending and ongoing jobs ordered by creation date
            $allQueuedJobs = JobOrder::whereHas('requestStatus', function ($q) {
                $q->whereIn('name', ['Pending', 'Ongoing']);
            })
            ->orderBy('created_at', 'asc')
            ->get(['id']);

            // Find position (1-indexed)
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
                'position' => $position + 1, // Convert to 1-indexed
                'total_in_queue' => $allQueuedJobs->count(),
                'is_user_job' => $jobOrder->requested_by === $request->user()->id, // ← Flag
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

            // Get only this user's pending/ongoing jobs
            $userJobs = JobOrder::where('requested_by', $userId)
                ->whereHas('requestStatus', function ($q) {
                    $q->whereIn('name', ['Pending', 'Ongoing']);
                })
                ->orderBy('created_at', 'asc')
                ->get(['id', 'job_order_no', 'created_at', 'requested_by']);

            // Get all pending and ongoing jobs in order (for position calculation)
            $allQueuedJobs = JobOrder::whereHas('requestStatus', function ($q) {
                $q->whereIn('name', ['Pending', 'Ongoing']);
            })
            ->orderBy('created_at', 'asc')
            ->get(['id']);

            // Map user jobs with their positions in the full queue
            $jobsWithPositions = $userJobs->map(function ($job) use ($allQueuedJobs, $userId) {
                $position = $allQueuedJobs->search(function ($queuedJob) use ($job) {
                    return $queuedJob->id === $job->id;
                });

                return [
                    'id' => $job->id,
                    'job_order_no' => $job->job_order_no,
                    'position' => $position !== false ? $position + 1 : null,
                    'total_in_queue' => $allQueuedJobs->count(),
                    'is_user_job' => $job->requested_by === $userId, // �� Flag
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
}