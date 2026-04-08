<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\JobOrder;

class SerialNumberController extends Controller
{
    /**
     * Search job orders by serial number (exact match).
     * Returns total count and a limited list of job orders
     * including the related data needed by the compare modal.
     */
    public function search(Request $request)
    {
        $serial = trim((string) $request->input('serial_number', ''));

        if ($serial === '' || strlen($serial) < 4) {
            return response()->json([
                'count' => 0,
                'jobs' => [],
            ]);
        }

        // Default 20, max 50
        $limit = min(max((int) $request->input('limit', 20), 1), 50);

        // Exclude current job order if provided
        $excludeId = $request->input('exclude_job_id');
        $query = JobOrder::whereHas('actionReport', function ($q) use ($serial) {
                $q->where('serial_number', $serial);
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
                'request_description', // <-- this must exist in your job_orders table
            ]);

        return response()->json([
            'count' => $totalCount,
            'jobs' => $jobs,
        ]);
    }
}