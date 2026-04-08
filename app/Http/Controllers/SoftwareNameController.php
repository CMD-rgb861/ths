<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\JobOrder;

class SoftwareNameController extends Controller
{
    /**
     * Search job orders by software name (exact match).
     * Returns total count and a limited list of job orders
     * including the related data needed by the compare modal.
     */
    public function search(Request $request)
    {
        $software = trim((string) $request->input('software_name', ''));

        if ($software === '' || strlen($software) < 3) {
            return response()->json([
                'count' => 0,
                'jobs' => [],
            ]);
        }

        // Default 20, max 50
        $limit = min(max((int) $request->input('limit', 20), 1), 50);

        // Exclude current job order if provided
        $excludeId = $request->input('exclude_job_id');
        $query = JobOrder::whereHas('actionReport', function ($q) use ($software) {
                $q->where('software_name', $software);
            })
            ->with([
                'department:id,name',
                'requester:id,name',
                'categories:id,name',
                'actionReport:id,job_order_id,diagnosis,action_taken,status,serviced_by,date_started,date_finished,remarks,serial_number,brand_name,brand_model,software_name,accepted_at,confirmed_at,cancelled_at,cancelled_by',
            ])
            ->orderByDesc('created_at');

        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        $totalCount = (clone $query)->count();

        $jobs = $query
            ->limit($limit)
            ->get([
                'id',
                'job_order_no',
                'department_id',
                'requested_by',
                'created_at',
                'status',
            ]);

        return response()->json([
            'count' => $totalCount,
            'jobs' => $jobs,
        ]);
    }
}
