<?php

namespace App\Http\Controllers;

use App\Models\JobOrder;
use App\Models\ActionReport;
use App\Models\User;
use App\Models\Signatory;
use App\Notifications\DiagnosisPopulatedNotification; 
use App\Notifications\DiagnosisConfirmedNotification;
use App\Notifications\JobOrderPendingNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use setasign\Fpdi\Tcpdf\Fpdi;
use Illuminate\Support\Facades\Storage;



class JobOrderController extends Controller
{
    /*
    |-------------------------------------------------------------------------- 
    | INDEX 
    |--------------------------------------------------------------------------     
    */
   public function index(Request $request)
    {
        $query = JobOrder::with([
            'department',
            'requester',
            'categories',
            'attachments',
            'actionReport.servicedBy',
            'clientSatisfactionMeasurements',
        ]);

        // Check if filtering by Completed status
        $isCompletedFilter = $request->filled('status') && $request->status === 'Completed';

        // Default sort
        $sortBy = $request->input('sort', 'newest');

        // Apply sorting
        switch ($sortBy) {
            case 'oldest':
                if ($isCompletedFilter) {
                    $query->join('action_reports', 'job_orders.id', '=', 'action_reports.job_order_id')
                          ->orderBy('action_reports.confirmed_at', 'asc')
                          ->select('job_orders.*');
                } else {
                    $query->orderBy('job_orders.created_at', 'asc');
                }
                break;
            case 'department_asc':
                $query->join('departments', 'job_orders.department_id', '=', 'departments.id')
                      ->orderBy('departments.name', 'asc')
                      ->select('job_orders.*');
                break;
            case 'department_desc':
                $query->join('departments', 'job_orders.department_id', '=', 'departments.id')
                      ->orderBy('departments.name', 'desc')
                      ->select('job_orders.*');
                break;
            case 'job_order_asc':
                $query->orderBy('job_orders.job_order_no', 'asc');
                break;
            case 'job_order_desc':
                $query->orderBy('job_orders.job_order_no', 'desc');
                break;
            case 'newest':
            default:
                if ($isCompletedFilter) {
                    $query->join('action_reports', 'job_orders.id', '=', 'action_reports.job_order_id')
                          ->orderBy('action_reports.confirmed_at', 'desc')
                          ->select('job_orders.*');
                } else {
                    $query->orderBy('job_orders.created_at', 'desc');
                }
                break;
        }

        // If the request is from an admin and the 'created_after' parameter is present
        if ($request->has('created_after')) {
            $query->where('job_orders.created_at', '>', $request->input('created_after'));
        }

        if (!$request->user()->isAdmin()) {
            $query->where('job_orders.requested_by', $request->user()->id);
        }

        // 🔥 HISTORY FILTER (NEW)
        if ($request->boolean('history')) {
            $query->whereIn('job_orders.status', [
                'Completed',
                'Cancelled',
                'Unserviceable'
            ]);
        }

        if ($request->filled('search')) {
            $search = $request->search;

            $query->where(function ($q) use ($search) {
                $q->where('job_orders.job_order_no', 'like', "%{$search}%")
                ->orWhereHas('department', function ($d) use ($search) {
                    $d->where('name', 'like', "%{$search}%");
                });
            });
        }

        // 🔥 STATUS FILTER
        if ($request->filled('status')) {
            $query->where('job_orders.status', $request->status);
        }

        // 🔥 DATE RANGE FILTER
        if ($request->filled('date_from')) {
            $query->whereDate('job_orders.date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('job_orders.date', '<=', $request->date_to);
        }

        // Clone query to compute totals without affecting pagination
        $totalsQuery = clone $query;

        // Compute totals for each status
        $totals = [
            'Pending' => (clone $totalsQuery)->where('job_orders.status', 'Pending')->count(),
            'Ongoing' => (clone $totalsQuery)->where('job_orders.status', 'Ongoing')->count(),
            'Completed' => (clone $totalsQuery)->where('job_orders.status', 'Completed')->count(),
            'Cancelled' => (clone $totalsQuery)->where('job_orders.status', 'Cancelled')->count(),
            'Unserviceable' => (clone $totalsQuery)->where('job_orders.status', 'Unserviceable')->count(),
        ];

        // Paginated data
        $jobs = $query->paginate(10);

        return response()->json([
            'data' => $jobs->items(),
            'meta' => [
                'current_page' => $jobs->currentPage(),
                'last_page' => $jobs->lastPage(),
                'per_page' => $jobs->perPage(),
                'total' => $jobs->total(),
            ],
            'totals' => $totals, // ✅ Added totals for frontend cards
        ]);
    }
    /*
    |-------------------------------------------------------------------------- 
    | SHOW 
    |-------------------------------------------------------------------------- 
    */
    public function show(JobOrder $jobOrder)
    {
        return $jobOrder->load([
            'department',
            'requester',
            'creator',
            'approver',
            'conformer',
            'categories',
            'attachments', // 🔥 include attachments
            'actionReport.servicedBy',
            'actionReport.acceptedBy',
            'actionReport.cancelledBy',
            'clientSatisfactionMeasurements',
        ]);
    }

    /*
    |-------------------------------------------------------------------------- 
    | STORE 
    |-------------------------------------------------------------------------- 
    */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'date' => ['required', 'date'],
            'department_id' => ['required', 'exists:departments,id'],
            'request_description' => ['required', 'string'],
            'contact_no' => ['required', 'string'],
            'signature_name' => ['nullable', 'string'],
            'categories' => ['required', 'array', 'min:1'],
            'categories.*.id' => ['required', 'exists:categories,id'],
            'files' => ['nullable', 'array', 'max:3'],
            'files.*' => ['file', 'mimes:jpg,jpeg,png,pdf', 'max:10240'],
            'diagnosis' => ['nullable', 'string'],
        ]);

        return DB::transaction(function () use ($validated, $request) {
            // Generate Job Order Number
            $signatureName = $validated['signature_name'] ?? $request->user()->name;
            $last = JobOrder::lockForUpdate()->latest('id')->first();
            $nextNumber = str_pad(($last?->id ?? 0) + 1, 6, '0', STR_PAD_LEFT);
            $jobOrderNo = now()->year . '-' . $nextNumber;

            // Create the Job Order
            $jobOrder = JobOrder::create([
                'job_order_no' => $jobOrderNo,
                'date' => $validated['date'],
                'department_id' => $validated['department_id'],
                'requested_by' => $request->user()->id,
                'created_by' => $request->user()->id,
                'request_description' => $validated['request_description'],
                'contact_no' => $validated['contact_no'],
                'signature_name' => $signatureName,
                'status' => 'Pending',
                'notified' => false,  // New field to mark if the job has been notified
            ]);

            // Attach Categories
            foreach ($validated['categories'] as $category) {
                $jobOrder->categories()->attach(
                    $category['id'],
                    ['other_description' => $category['other_description'] ?? null]
                );
            }

            // Create Action Report
            ActionReport::create([
                'job_order_id' => $jobOrder->id,
                'status' => 'Pending',
            ]);

            // Handle File Uploads
            if ($request->hasFile('files')) {
                $mergedPdf = new Fpdi();
                $mergedPdf->SetAutoPageBreak(false);
                Storage::disk('public')->makeDirectory('job_orders/' . $jobOrder->id);

                foreach ($request->file('files') as $file) {
                    $extension = strtolower($file->getClientOriginalExtension());
                    $path = $file->store('job_orders/' . $jobOrder->id, 'public');

                    $jobOrder->attachments()->create([
                        'original_name' => $file->getClientOriginalName(),
                        'file_path' => $path,
                        'type' => $extension === 'pdf' ? 'pdf' : 'image',
                    ]);
                }
            }

            // If diagnosis is populated, send notification
            if (!empty($request->input('diagnosis'))) {
                $requestedByUser = User::find($jobOrder->requested_by);
                if ($requestedByUser) {
                    $requestedByUser->notify(new DiagnosisPopulatedNotification($jobOrder)); // Send notification
                }
            }

            // Only send notification if the job order is "Pending" and has not been notified yet
            if ($jobOrder->status === 'Pending' && !$jobOrder->notified) {
                // Send notification to all admin users about the new pending job order
                $admins = User::where('role', 'admin')->get(); // Get all admins
                foreach ($admins as $admin) {
                    $admin->notify(new JobOrderPendingNotification($jobOrder)); // Send the notification
                }

                // Mark the job as notified
                $jobOrder->update(['notified' => true]);
            }

            return $jobOrder->load([
                'department',
                'requester',
                'categories',
                'attachments',
                'actionReport',
                'clientSatisfactionMeasurements',
            ]);
        });
    }

    /*
    |-------------------------------------------------------------------------- 
    | UPDATE STATUS 
    |-------------------------------------------------------------------------- 
    */
    public function update(Request $request, JobOrder $jobOrder)
    {
        $validated = $request->validate([
            'status' => ['required', 'in:Pending,Ongoing,Cancelled,Unserviceable'],
            'diagnosis' => ['nullable', 'string'],
            'action_taken' => ['nullable', 'string'],
            'remarks' => ['nullable', 'string'],
        ]);

        return DB::transaction(function () use ($validated, $jobOrder, $request) {

            $actionReport = $jobOrder->actionReport;

            if (!$actionReport) {
                return response()->json([
                    'message' => 'Action report not found.'
                ], 404);
            }

            /*
            |--------------------------------------------------------------------------
            | Update Diagnosis & Action Taken
            |--------------------------------------------------------------------------
            */

            $actionReport->update([
                'diagnosis' => $validated['diagnosis'] ?? $actionReport->diagnosis,
                'action_taken' => $validated['action_taken'] ?? $actionReport->action_taken,
                'remarks' => $validated['remarks'] ?? $actionReport->remarks,
            ]);

            /*
            |--------------------------------------------------------------------------
            | Move to Pending Confirmation ONLY if BOTH filled
            |--------------------------------------------------------------------------
            */

            $diagnosisFilled = !empty(trim($actionReport->diagnosis));
            $actionTakenFilled = !empty(trim($actionReport->action_taken));

            if ($diagnosisFilled && $actionTakenFilled && !$actionReport->conformed) {

                $jobOrder->update(['status' => 'Ongoing']);

                $actionReport->update([
                    'status' => 'Ongoing'
                ]);

                // Notify requester
                $requestedByUser = User::find($jobOrder->requested_by);

                if ($requestedByUser) {
                    $requestedByUser->notify(
                        new DiagnosisPopulatedNotification($jobOrder)
                    );
                }
            }

            /*
            |--------------------------------------------------------------------------
            | Normal Status Handling
            |--------------------------------------------------------------------------
            */

            if ($validated['status'] === 'Ongoing') {

                $jobOrder->update(['status' => 'Ongoing']);

                $actionReport->update([
                    'status' => 'Ongoing',
                    'accepted_by' => $request->user()->id,
                    'accepted_at' => now(),
                ]);
            }

            if ($validated['status'] === 'Cancelled') {

                $jobOrder->update(['status' => 'Cancelled']);

                $actionReport->update([
                    'status' => 'Cancelled',
                    'cancelled_by' => $request->user()->id,
                    'cancelled_at' => now(),
                ]);
            }

            if ($validated['status'] === 'Unserviceable') {

                $jobOrder->update(['status' => 'Unserviceable']);

                $actionReport->update([
                    'status' => 'Unserviceable',
                    // You can handle additional logic here for Unserviceable, if required.
                ]);
            }

            // If an admin changed the status to Ongoing or Cancelled, apply the configured IT Director signatory
            if ($request->user()->isAdmin() && in_array($validated['status'], ['Ongoing', 'Cancelled'])) {
                $signatory = Signatory::where('role', 'it_director')->first();
                if ($signatory) {
                    $jobOrder->update([
                        'approved_by' => $signatory->id,
                        'approval_date' => now(),
                    ]);
                }
            }


            // ✅ RETURN RESPONSE (FIX)
            return response()->json(
                $jobOrder->load([
                    'department',
                    'requester',
                    'categories',
                    'attachments',
                        'actionReport.servicedBy',
                        'clientSatisfactionMeasurements',
                    'actionReport.acceptedBy',
                    'actionReport.cancelledBy',
                ]),
                200
            );
        });
    }

    public function markPendingNotified(Request $request)
    {
        // Check that the jobs data is provided in the request
        $validated = $request->validate([
            'jobs' => ['required', 'array'],
            'jobs.*' => ['exists:job_orders,id'] // Ensure each job ID exists in the job_orders table
        ]);

        // Mark the jobs as notified
        $jobOrders = JobOrder::whereIn('id', $validated['jobs'])->update(['notified' => true]);

        return response()->json([
            'message' => 'Pending jobs have been marked as notified.',
            'updated' => $jobOrders
        ], 200);
    }

    /**
     * Mark all unread notifications for a specific job order as read
     */
    public function markNotificationsRead(Request $request, JobOrder $jobOrder)
    {
        $user = $request->user();
        
        // Mark all unread notifications related to this job order as read
        $user->unreadNotifications()
            ->whereJsonContains('data->job_order_id', $jobOrder->id)
            ->update(['read_at' => now()]);

        return response()->json([
            'message' => 'Notifications marked as read.'
        ], 200);
    }

    /**
     * Approve a job order by setting approved_by and approval_date.
     * Expects: approved_by (signatory id) and optional approval_date (date string). If approval_date is omitted, now() is used.
     */
    public function approve(Request $request, JobOrder $jobOrder)
    {
        // Only admins can perform approval via this endpoint
        if (!$request->user()->isAdmin()) {
            abort(403, 'Unauthorized.');
        }
        $validated = $request->validate([
            'approved_by' => ['required', 'exists:signatories,id'],
            'approval_date' => ['nullable', 'date'],
        ]);

        $approvedBy = $validated['approved_by'];
        $approvalDate = $validated['approval_date'] ?? now();

        $jobOrder->update([
            'approved_by' => $approvedBy,
            'approval_date' => $approvalDate,
        ]);

        return response()->json(
            $jobOrder->fresh()->load([
                'department',
                'requester',
                'creator',
                'approver',
                'conformer',
                'categories',
                'attachments',
                'actionReport.servicedBy',
            ]),
            200
        );
    }

}