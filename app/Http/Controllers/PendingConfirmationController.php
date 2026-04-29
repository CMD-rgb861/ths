<?php

namespace App\Http\Controllers;

use App\Models\JobOrder;
use Illuminate\Http\Request;

class PendingConfirmationController extends Controller
{
    /**
     * Return job orders where the requester has not yet confirmed (conformed = false)
     * and status is Ongoing, Closed, or request status is Completed.
     * Only accessible by admin/technician roles (add middleware as needed).
     */
    public function index(Request $request)
    {
        $query = JobOrder::with(['actionReport', 'requester', 'department', 'categories'])
            ->whereHas('actionReport', function ($q) {
                $q->where('conformed', false)
                  ->where(function ($q2) {
                      $q2->where('status', 'Ongoing')
                         ->orWhere('status', 'Closed');
                  });
            })
            ->orWhere(function ($q) {
                $q->whereHas('actionReport', function ($q2) {
                    $q2->where('conformed', false);
                })
                ->whereHas('requestStatus', function ($q3) {
                    $q3->where('name', 'Completed');
                });
            });

        // Optionally add pagination
        $perPage = $request->input('per_page', 20);
        $results = $query->paginate($perPage);

        return response()->json($results);
    }
}
