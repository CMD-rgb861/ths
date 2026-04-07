<?php

namespace App\Http\Controllers;

use App\Models\JobOrder;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use setasign\Fpdi\Tcpdf\Fpdi;
use App\Notifications\JobOrderPendingNotification;
use App\Models\ClientSatisfactionMeasurement;
use App\Models\ServiceStatus;
use App\Models\RequestStatus;

class ActionReportController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | STORE ACTION REPORT
    |--------------------------------------------------------------------------
    */
    public function store(Request $request, JobOrder $jobOrder)
    {
        if ($jobOrder->actionReport) {
            abort(409, 'Action Report already exists.');
        }

        $validated = $request->validate([
            'diagnosis'     => ['nullable', 'string'],
            'action_taken'  => ['nullable', 'string', 'exists:service_statuses,name'],
            'serviced_by'   => ['nullable', 'exists:users,id'],
            'date_started'  => ['nullable', 'date'],
            'remarks'       => ['nullable', 'string'],
        ]);

        // Validate technician
        if (!empty($validated['serviced_by'])) {
            $technician = User::where('id', $validated['serviced_by'])
                ->whereHas('roles', function ($q) {
                    $q->where('name', 'technician');
                })
                ->first();

            if (!$technician) {
                return response()->json([
                    'message' => 'Selected user is not a technician.'
                ], 422);
            }
        }

        $validated['status'] = 'Ongoing';
        $validated['conformed'] = false;

        $actionReport = $jobOrder->actionReport()->create($validated);

        // Send notification to the admin about the new pending job order
        $admins = User::whereHas('roles', function ($q) {
            $q->where('name', 'admin');
        })->get();
        foreach ($admins as $admin) {
            $admin->notify(new JobOrderPendingNotification($jobOrder));
        }

        return $actionReport->load([
            'servicedBy',
            'acceptedBy',
            'cancelledBy',
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE ACTION REPORT (ADMIN SIDE)
    |--------------------------------------------------------------------------
    */
    public function update(Request $request, JobOrder $jobOrder)
    {
        $actionReport = $jobOrder->actionReport;

        if (!$actionReport) {
            abort(404, 'Action Report not found.');
        }

        $validated = $request->validate([
            'diagnosis'     => ['nullable', 'string'],
            'action_taken'  => ['nullable', 'string', 'exists:service_statuses,name'],
            'serviced_by'   => ['nullable', 'exists:users,id'],
            'date_started'  => ['nullable', 'date'],
            'date_finished' => ['nullable', 'date'],
            'remarks'       => ['nullable', 'string'],
            'serial_number' => ['nullable', 'string'],
            'brand_name' => ['nullable', 'string'],
            'brand_model' => ['nullable', 'string'],
            'software_name' => ['nullable', 'string'],
        ]);

        // Validate technician
        if (!empty($validated['serviced_by'])) {
            $technician = User::where('id', $validated['serviced_by'])
                ->whereHas('roles', function ($q) {
                    $q->where('name', 'technician');
                })
                ->first();

            if (!$technician) {
                return response()->json([
                    'message' => 'Selected user is not a technician.'
                ], 422);
            }
        }

        // --- CHANGED: If admin is denying, set Completed/Closed ---
        if (
            $request->user()->isAdmin() &&
            isset($validated['action_taken']) &&
            strtolower($validated['action_taken']) === 'cancelled'
        ) {
            $completedStatusId = RequestStatus::where('name', 'Completed')->value('id');
            $jobOrder->update(['status' => $completedStatusId]);
            $actionReport->update([
                'status' => 'Completed',
                'action_taken' => 'Closed',
                'remarks' => $validated['remarks'] ?? $actionReport->remarks,
            ]);
            return $actionReport->fresh()->load([
                'servicedBy',
                'acceptedBy',
                'cancelledBy',
            ]);
        }

        $validated['status'] = 'Ongoing';
        $actionReport->update($validated);

        // Send notification to the admin about the updated job order (status is Ongoing)
        $admins = User::whereHas('roles', function ($q) {
            $q->where('name', 'admin');
        })->get(); // 1 = admin
        foreach ($admins as $admin) {
            $admin->notify(new JobOrderPendingNotification($jobOrder));
        }

        return $actionReport->fresh()->load([
            'servicedBy',
            'acceptedBy',
            'cancelledBy',
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | REQUESTER CONFIRM (CONFORM)
    |--------------------------------------------------------------------------
    */
    public function confirm(JobOrder $jobOrder)
    {
        $actionReport = $jobOrder->actionReport;

        if (!$actionReport) {
            abort(404, 'Action Report not found.');
        }

        // Only requester can confirm
        if ($jobOrder->requested_by !== Auth::id()) {
            abort(403, 'Unauthorized.');
        }

        if ($actionReport->conformed) {
            return response()->json([
                'message' => 'Already confirmed.'
            ], 400);
        }

        // Safety check
        if (
            empty(trim($actionReport->diagnosis)) ||
            empty(trim($actionReport->action_taken))
        ) {
            return response()->json([
                'message' => 'Diagnosis and Action Taken must be filled before confirmation.'
            ], 422);
        }

        DB::transaction(function () use ($actionReport) {
            // ✅ Update action report: set conformed, but keep status as Ongoing
            $actionReport->update([
                'conformed'     => true,
                'confirmed_at'  => now(),
                'confirmed_by'  => Auth::id(),
                // Do NOT set status to Completed, keep as Ongoing
                // Do NOT set date_finished here
            ]);
            // Do NOT update job order status to Completed
        });

        return response()->json([
            'message' => 'Action report confirmed successfully.',
            'data'    => $actionReport->fresh()
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | UPLOAD FILES
    |--------------------------------------------------------------------------
    */
    public function uploadFiles(Request $request, JobOrder $jobOrder)
    {
        $request->validate([
            'files.*' => 'required|file|mimes:jpg,jpeg,png,pdf|max:10240',
        ]);

        foreach ($request->file('files') as $file) {
            $file->store("job_orders/{$jobOrder->id}", 'public');
        }

        return response()->json([
            'message' => 'Files uploaded successfully'
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | UPDATE into UNSERVICEABLE (ADMIN SIDE)
    |--------------------------------------------------------------------------
    */
    public function updateUnserviceable(Request $request, JobOrder $jobOrder)
    {
        $actionReport = $jobOrder->actionReport;

        if (!$actionReport) {
            return response()->json([
                'message' => 'Action Report not found.'
            ], 404);
        }

        // If "clear" flag is set, blank out unserviceable columns
        if ($request->has('clear') && $request->boolean('clear')) {
            $actionReport->update([
                'item' => null,
                'findings' => null,
                'noted_by_its' => null,
                'noted_by_pc' => null,
                'unserviceable_date' => null,
            ]);
            return response()->json(
                $jobOrder->fresh()->load([
                    'department',
                    'requester',
                    'categories',
                    'attachments',
                    'actionReport.servicedBy',
                    'actionReport.acceptedBy',
                    'actionReport.cancelledBy',
                ]),
                200
            );
        }

        $validated = $request->validate([
            'item' => ['required', 'string'],
            'findings' => ['required', 'string'],
            'noted_by_its' => ['required', 'string'],
            'noted_by_pc' => ['required', 'string'],
            'date' => ['required', 'date'],
        ]);

        $actionReport->update([
            'item' => $validated['item'],
            'findings' => $validated['findings'],
            'noted_by_its' => $validated['noted_by_its'],
            'noted_by_pc' => $validated['noted_by_pc'],
            'unserviceable_date' => $validated['date'],
        ]);

        return response()->json(
            $jobOrder->fresh()->load([
                'department',
                'requester',
                'categories',
                'attachments',
                'actionReport.servicedBy',
                'actionReport.acceptedBy',
                'actionReport.cancelledBy',
            ]),
            200
        );
    }

    /**
     * Store Client Satisfaction Measurement (CSM) for a job order's action report
     */
    public function storeCsm(Request $request, JobOrder $jobOrder)
    {
        $actionReport = $jobOrder->actionReport;

        if (!$actionReport) {
            return response()->json(['message' => 'Action Report not found.'], 404);
        }

        // Only requester can submit CSM for their job
        if ($jobOrder->requested_by !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $validated = $request->validate([
            'client_type' => ['required', 'string'],
            'client_category' => ['required', 'string'],
            'name' => ['nullable', 'string'],
            'sex' => ['required', 'string'],
            'age' => ['required', 'integer'],
            'date_time_visited' => ['required', 'date'],
            'services_availed' => ['required', 'string'],
            'service_provider_name' => ['nullable', 'string'],
            'who_to_evaluate' => ['required', 'string'],
            'office_or_faculty_unit_transacted' => ['nullable', 'string'],

            'cc1' => ['required', 'integer'],
            // cc2/cc3 are required only if cc1 indicates awareness (values 1-3)
            'cc2' => ['required_if:cc1,1,2,3', 'integer'],
            'cc3' => ['required_if:cc1,1,2,3', 'integer'],

            'sqd0' => ['required', 'integer'],
            'sqd1' => ['required', 'integer'],
            'sqd2' => ['required', 'integer'],
            'sqd3' => ['required', 'integer'],
            'sqd4' => ['required', 'integer'],
            'sqd5' => ['required', 'integer'],
            'sqd6' => ['required', 'integer'],
            'sqd7' => ['required', 'integer'],
            'sqd8' => ['required', 'integer'],

            'suggestions' => ['nullable', 'string'],
            'email_address' => ['nullable', 'email'],
            'client_category_other' => ['nullable', 'string'],
            'who_to_evaluate_other' => ['nullable', 'string'],
        ]);

        $csm = ClientSatisfactionMeasurement::create(array_merge($validated, [
            'job_order_id' => $jobOrder->id,
        ]));

        // mark action report csm_completed
        $actionReport->update(['csm_completed' => true]);

        return response()->json([
            'message' => 'CSM saved',
            'data' => $csm,
        ], 201);
    }

    /**
     * Get all service statuses for the action_taken dropdown
     */
    public function serviceStatuses()
    {
        return response()->json(
            ServiceStatus::orderBy('name')->get(['id', 'name'])
        );
    }
}