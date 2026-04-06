<?php

namespace App\Http\Controllers;

use App\Models\JobOrder;
use App\Models\ActionReport;
use App\Models\User;
use App\Models\Signatory;
use App\Models\RequestStatus;
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
            'actionReport.acceptedBy',
            'actionReport.cancelledBy',
            'clientSatisfactionMeasurements',
            'requestStatus', // <-- eager load status relation
        ]);

        // Check if filtering by a status that depends on action_reports timestamps
        $statusFilter = $request->input('status');
        $isActionReportStatusFilter = in_array($statusFilter, ['Completed', 'Ongoing', 'Cancelled', 'Unserviceable']);

        // Default sort
        $sortBy = $request->input('sort', 'newest');

        // Apply sorting
        switch ($sortBy) {
            case 'oldest':
                if ($isActionReportStatusFilter) {
                    $query->join('action_reports', 'job_orders.id', '=', 'action_reports.job_order_id')
                        ->orderBy('action_reports.updated_at', 'asc')
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
                if ($isActionReportStatusFilter) {
                    $query->join('action_reports', 'job_orders.id', '=', 'action_reports.job_order_id')
                        ->orderBy('action_reports.updated_at', 'desc')
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

        if (!$request->user()->isAdmin() && !$request->user()->isTechnician()) {
            $query->where('job_orders.requested_by', $request->user()->id);
        }

        // 🔥 HISTORY FILTER (NEW)
        if ($request->boolean('history')) {
            // Fix: Use status IDs for Completed, Cancelled, Unserviceable, Cancelled by User
            $statusNames = ['Completed', 'Cancelled', 'Unserviceable', 'Cancelled by User'];
            $statusIds = DB::table('request_statuses')->whereIn('name', $statusNames)->pluck('id')->toArray();
            $query->whereIn('job_orders.status', $statusIds);
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
            $query->where('job_orders.status', $request->status); // status is now an id
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

        // Fetch all request statuses from the database
        $allStatuses = DB::table('request_statuses')->pluck('name', 'id')->toArray();

        // Compute totals for each status by id
        $allJobsQuery = JobOrder::query();
        if (!$request->user()->isAdmin() && !$request->user()->isTechnician()) {
            $allJobsQuery->where('requested_by', $request->user()->id);
        }

        $totals = [];
        foreach ($allStatuses as $id => $name) {
            $totals[$name] = (clone $allJobsQuery)->where('status', $id)->count();
        }

        // Check if per_page is provided and handle accordingly
        $perPage = $request->input('per_page', 10);
        
        // If per_page is set to a high number (e.g., 1000) or -1, get all results
        if ($perPage == -1 || $perPage >= 1000) {
            $jobs = $query->get();
            $jobs = $this->transformJobs($jobs);

            return response()->json([
                'data' => $jobs,
                'meta' => [
                    'current_page' => 1,
                    'last_page' => 1,
                    'per_page' => $jobs->count(),
                    'total' => $jobs->count(),
                ],
                'totals' => $totals,
            ]);
        }

        // Paginated data
        $jobs = $query->paginate($perPage);
        $jobsTransformed = $this->transformJobs($jobs->items());

        return response()->json([
            'data' => $jobsTransformed,
            'meta' => [
                'current_page' => $jobs->currentPage(),
                'last_page' => $jobs->lastPage(),
                'per_page' => $jobs->perPage(),
                'total' => $jobs->total(),
            ],
            'totals' => $totals,
        ]);
    }
    /*
    |-------------------------------------------------------------------------- 
    | SHOW 
    |-------------------------------------------------------------------------- 
    */
    public function show(JobOrder $jobOrder)
    {
        $jobOrder = $jobOrder->load([
            'department',
            'requester',
            'creator',
            'approver',
            'conformer',
            'categories',
            'attachments',
            'actionReport.servicedBy',
            'actionReport.acceptedBy',
            'actionReport.cancelledBy',
            'clientSatisfactionMeasurements',
            'requestStatus', // <-- add this
        ]);

        // Transform related users
        foreach (['requester', 'creator', 'approver', 'conformer'] as $relation) {
            if ($jobOrder->$relation && $jobOrder->$relation->relationLoaded('role')) {
                $jobOrder->$relation->role = $jobOrder->$relation->role ? $jobOrder->$relation->role->name : null;
            }
        }

        return $jobOrder;
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
            'status' => ['nullable', 'integer', 'exists:request_statuses,id'],
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
                'status' => $validated['status'] ?? 1, // 1 = Pending (id)
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
                $admins = User::whereHas('roles', function ($q) {
                    $q->where('name', 'admin');
                })->get();
                foreach ($admins as $admin) {
                    $admin->notify(new JobOrderPendingNotification($jobOrder)); // Send the notification
                }

                // Mark the job as notified
                $jobOrder->update(['notified' => true]);
            }

            $jobOrder = $jobOrder->load([
                'department',
                'requester',
                'categories',
                'attachments',
                'actionReport',
                'clientSatisfactionMeasurements',
            ]);

            // Transform related users
            foreach (['requester', 'creator', 'approver', 'conformer'] as $relation) {
                if ($jobOrder->$relation && $jobOrder->$relation->relationLoaded('role')) {
                    $jobOrder->$relation->role = $jobOrder->$relation->role ? $jobOrder->$relation->role->name : null;
                }
            }

            return $jobOrder;
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
            'status' => ['required', 'integer', 'exists:request_statuses,id'],
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

            // Get the status name from the id
            $statusName = RequestStatus::find($validated['status'])?->name;

            // --- FIX: If admin is denying, always set Completed/Closed regardless of incoming status ---
            if (
                $request->user()->isAdmin() &&
                (
                    $statusName === 'Cancelled' ||
                    $statusName === 'Cancelled by User' ||
                    (isset($validated['action_taken']) && strtolower($validated['action_taken']) === 'closed')
                )
            ) {
                $completedStatusId = RequestStatus::where('name', 'Completed')->value('id');
                $jobOrder->update(['status' => $completedStatusId]);
                $actionReport->update([
                    'status' => 'Completed',
                    'action_taken' => 'Closed',
                    'remarks' => $validated['remarks'] ?? $actionReport->remarks,
                ]);
                $jobOrder = $jobOrder->load([
                    'department',
                    'requester',
                    'categories',
                    'attachments',
                    'actionReport.servicedBy',
                    'clientSatisfactionMeasurements',
                    'actionReport.acceptedBy',
                    'actionReport.cancelledBy',
                ]);
                foreach (['requester', 'creator', 'approver', 'conformer'] as $relation) {
                    if ($jobOrder->$relation && $jobOrder->$relation->relationLoaded('role')) {
                        $jobOrder->$relation->role = $jobOrder->$relation->role ? $jobOrder->$relation->role->name : null;
                    }
                }
                return response()->json($jobOrder, 200);
            }

            // --- FIX: If user cancels, set service status to Closed as well ---
            if (
                !$request->user()->isAdmin() &&
                $statusName === 'Cancelled'
            ) {
                $actionReport->update([
                    'status' => 'Cancelled',
                    'action_taken' => 'Closed',
                    'cancelled_by' => $request->user()->id,
                    'cancelled_at' => now(),
                    'remarks' => $validated['remarks'] ?? $actionReport->remarks,
                ]);
                $jobOrder->update(['status' => $validated['status']]);
                $jobOrder = $jobOrder->load([
                    'department',
                    'requester',
                    'categories',
                    'attachments',
                    'actionReport.servicedBy',
                    'clientSatisfactionMeasurements',
                    'actionReport.acceptedBy',
                    'actionReport.cancelledBy',
                ]);
                foreach (['requester', 'creator', 'approver', 'conformer'] as $relation) {
                    if ($jobOrder->$relation && $jobOrder->$relation->relationLoaded('role')) {
                        $jobOrder->$relation->role = $jobOrder->$relation->role ? $jobOrder->$relation->role->name : null;
                    }
                }
                return response()->json($jobOrder, 200);
            }

            $actionReport->update([
                'diagnosis' => $validated['diagnosis'] ?? $actionReport->diagnosis,
                'action_taken' => $validated['action_taken'] ?? $actionReport->action_taken,
                'remarks' => $validated['remarks'] ?? $actionReport->remarks,
                'status' => $statusName !== 'Completed' ? $statusName : $actionReport->status,
            ]);

            if ($statusName !== 'Completed') {
                $jobOrder->update(['status' => $validated['status']]);
            }

            // Handle special transitions (Ongoing, Cancelled, Unserviceable, Cancelled by User)
            if ($statusName === 'Ongoing') {
                $actionReport->update([
                    'status' => 'Ongoing',
                    'accepted_by' => $request->user()->id,
                    'accepted_at' => now(),
                ]);
            }

            if ($statusName === 'Cancelled') {
                $actionReport->update([
                    'status' => 'Cancelled',
                    'cancelled_by' => $request->user()->id,
                    'cancelled_at' => now(),
                ]);
            }

            if ($statusName === 'Unserviceable') {
                $actionReport->update([
                    'status' => 'Unserviceable',
                ]);
            }

            if ($statusName === 'Cancelled by User') {
                $actionReport->update([
                    'status' => 'Cancelled by User',
                    'cancelled_by' => $request->user()->id,
                    'cancelled_at' => now(),
                ]);
            }

            if ($request->user()->isAdmin() && in_array($statusName, ['Ongoing', 'Cancelled'])) {
                $signatory = Signatory::where('role', 'it_director')->first();
                if ($signatory) {
                    $jobOrder->update([
                        'approved_by' => $signatory->id,
                        'approval_date' => now(),
                    ]);
                }
            }

            $jobOrder = $jobOrder->load([
                'department',
                'requester',
                'categories',
                'attachments',
                'actionReport.servicedBy',
                'clientSatisfactionMeasurements',
                'actionReport.acceptedBy',
                'actionReport.cancelledBy',
            ]);

            foreach (['requester', 'creator', 'approver', 'conformer'] as $relation) {
                if ($jobOrder->$relation && $jobOrder->$relation->relationLoaded('role')) {
                    $jobOrder->$relation->role = $jobOrder->$relation->role ? $jobOrder->$relation->role->name : null;
                }
            }

            return response()->json(
                $jobOrder,
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

    /**
     * Get job orders filtered by service status (for Service Status summary cards)
     * Accepts: ?service_status=unserviceable_with_form|unserviceable_without_form|closed
     */
    public function serviceStatus(Request $request)
    {
        $serviceStatus = $request->input('service_status');
        $search = $request->input('search');
        $sort = $request->input('sort', 'newest');

        // Map UI keys to action_report.action_taken values
        $statusMap = [
            'unserviceable_with_form' => 'Unserviceable with Form',
            'unserviceable_without_form' => 'Unserviceable without Form',
            'closed' => 'Closed',
        ];

        if (!isset($statusMap[$serviceStatus])) {
            return response()->json([
                'data' => [],
                'message' => 'Invalid service status.'
            ], 400);
        }

        $query = JobOrder::with([
            'department',
            'requester',
            'categories',
            'attachments',
            'actionReport.servicedBy',
            'actionReport.acceptedBy',
            'actionReport.cancelledBy',
            'clientSatisfactionMeasurements',
            'requestStatus',
        ])
        ->whereHas('actionReport', function ($q) use ($statusMap, $serviceStatus) {
            $q->whereNotNull('action_taken')
              ->whereRaw('BINARY action_taken = ?', [$statusMap[$serviceStatus]]);
        });

        // Search filter
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('job_orders.job_order_no', 'like', "%{$search}%")
                  ->orWhereHas('department', function ($d) use ($search) {
                      $d->where('name', 'like', "%{$search}%");
                  });
            });
        }

        // Sorting logic (match request status logic)
        switch ($sort) {
            case 'oldest':
                $query->join('action_reports', 'job_orders.id', '=', 'action_reports.job_order_id')
                    ->orderBy('action_reports.updated_at', 'asc')
                    ->select('job_orders.*');
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
                $query->join('action_reports', 'job_orders.id', '=', 'action_reports.job_order_id')
                    ->orderBy('action_reports.updated_at', 'desc')
                    ->select('job_orders.*');
                break;
        }

        // Optional: restrict to user's own jobs if not admin/technician
        if (!$request->user()->isAdmin() && !$request->user()->isTechnician()) {
            $query->where('job_orders.requested_by', $request->user()->id);
        }

        // No pagination for service status cards (to match frontend)
        $jobs = $query->get();

        return response()->json([
            'data' => $this->transformJobs($jobs),
            'count' => $jobs->count(),
        ]);
    }

    private function transformJobs($jobs)
    {
        return collect($jobs)->map(function ($job) {
            // Transform related users if loaded
            foreach (['requester', 'creator', 'approver', 'conformer'] as $relation) {
                if ($job->$relation && $job->$relation->relationLoaded('role')) {
                    $job->$relation->role = $job->$relation->role ? $job->$relation->role->name : null;
                }
            }
            return $job;
        });
    }
}