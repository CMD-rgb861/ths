<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\JobOrder;

class SerialNumberController extends Controller
{
    /**
     * Search job orders by serial number (partial or exact match).
     * Returns count and list of job orders with the same serial number.
     */
    public function search(Request $request)
    {
        $serial = $request->input('serial_number');
        if (!$serial || strlen($serial) < 2) {
            return response()->json([
                'count' => 0,
                'jobs' => [],
            ]);
        }

        $jobs = JobOrder::whereHas('actionReport', function ($q) use ($serial) {
                $q->where('serial_number', $serial);
            })
            ->with(['department', 'requester', 'categories'])
            ->get();

        return response()->json([
            'count' => $jobs->count(),
            'jobs' => $jobs,
        ]);
    }
}
