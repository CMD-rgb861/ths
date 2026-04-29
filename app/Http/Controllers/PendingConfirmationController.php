<?php

namespace App\Http\Controllers;

use App\Models\JobOrder;
use Illuminate\Http\Request;

class PendingConfirmationController extends Controller
{
    public function index(Request $request)
    {
        $query = JobOrder::with([
                'actionReport',
                'requester',
                'department',
                'categories'
            ])
            ->whereHas('requestStatus', function ($q) {
                // ✅ Request status
                $q->whereIn('name', ['Ongoing', 'Completed']);
            })
            ->whereHas('actionReport', function ($q) {
                $q->where('conformed', false)

                  // ✅ THIS is the real "service status"
                  ->whereIn('action_taken', ['Closed', 'Unserviceable', 'Diagnosed', 'Serviced'])

                  ->where(function ($q2) {
                      $q2->whereNotNull('diagnosis')->where('diagnosis', '<>', '');

                      $q2->orWhere(function ($q3) {
                          $q3->whereNotNull('action_taken')
                             ->where('action_taken', '<>', '');
                      });

                      $q2->orWhere(function ($q3) {
                          $q3->whereNotNull('serviced_by');
                      });

                      $q2->orWhere(function ($q3) {
                          $q3->whereNotNull('date_started');
                      });

                      $q2->orWhere(function ($q3) {
                          $q3->whereNotNull('date_finished');
                      });

                      $q2->orWhere(function ($q3) {
                          $q3->whereNotNull('remarks')
                             ->where('remarks', '<>', '');
                      });
                  });
            })
            // ✅ EXCLUDE DECLINED JOBS (Completed + Closed + Remarks but NO service work)
            ->whereHas('actionReport', function ($q) {
                $q->where(function ($q2) {
                    // If action_taken is 'Closed', must have service work details
                    $q2->where('action_taken', '!=', 'Closed')
                       ->orWhere(function ($q3) {
                           // If Closed, then at least one of these must be present
                           $q3->whereNotNull('diagnosis')->where('diagnosis', '<>', '')
                              ->orWhereNotNull('serviced_by')
                              ->orWhereNotNull('date_started')
                              ->orWhereNotNull('date_finished')
                              ->orWhereNotNull('serial_number')
                              ->orWhereNotNull('software_name');
                       });
                });
            });

        if (!$request->user()->isAdmin() && !$request->user()->isTechnician()) {
            $query->where('requested_by', $request->user()->id);
        }

        $perPage = $request->input('per_page', 20);
        $results = $query->paginate($perPage);

        return response()->json($results);
    }
}