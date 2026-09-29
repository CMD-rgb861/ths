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
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;



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
            'creator',
            'categories',
            'attachments',
            'actionReport.servicedBy',
            'actionReport.acceptedBy',
            'actionReport.cancelledBy',
            'clientSatisfactionMeasurements',
            'requestStatus',
        ]);

        $statusFilter = $request->input('status');
        $isActionReportStatusFilter = false;
        $statusName = null;
        if ($statusFilter) {
            $statusName = DB::table('request_statuses')->where('id', $statusFilter)->value('name');
            $isActionReportStatusFilter = in_array($statusName, ['Completed', 'Ongoing', 'Cancelled', 'Unserviceable']);
        }

        $sortBy = $request->input('sort', 'newest');

        switch ($sortBy) {
            case 'oldest':
                if ($isActionReportStatusFilter) {
                    $query->leftJoin('action_reports', 'job_orders.id', '=', 'action_reports.job_order_id')
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
                    $query->leftJoin('action_reports', 'job_orders.id', '=', 'action_reports.job_order_id')
                        ->orderBy('action_reports.updated_at', 'desc')
                        ->select('job_orders.*');
                } else {
                    $query->orderBy('job_orders.created_at', 'desc');
                }
                break;
        }

        if ($request->has('created_after')) {
            $query->where('job_orders.created_at', '>', $request->input('created_after'));
        }

        if (!$request->user()->isAdmin() && !$request->user()->isTechnician()) {
            $query->where('job_orders.requested_by', $request->user()->id);
        }

        if ($request->boolean('history')) {
            $statusNames = ['Completed', 'Cancelled', 'Unserviceable', 'Cancelled by User'];
            $statusIds = DB::table('request_statuses')->whereIn('name', $statusNames)->pluck('id')->toArray();
            $query->whereIn('job_orders.status', $statusIds);
        }

        if ($request->filled('search')) {
            $search = trim((string) $request->search);
            $searchTokens = array_values(array_filter(
                preg_split('/[^[:alnum:]]+/', mb_strtolower($search)) ?: []
            ));

            $query->where(function ($outerQuery) use ($searchTokens) {
                foreach ($searchTokens as $token) {
                    $outerQuery->where(function ($q) use ($token) {
                        $like = '%' . $token . '%';

                        $q->whereRaw('CAST(job_orders.id AS CHAR) LIKE ?', [$like])
                            ->orWhereRaw('LOWER(job_orders.job_order_no) LIKE ?', [$like])
                            ->orWhereHas('department', function ($d) use ($like) {
                                $d->whereRaw('LOWER(name) LIKE ?', [$like]);
                            });
                    });
                }
            });
        }

        if ($request->filled('category_id')) {
            $query->whereHas('categories', function ($categoryQuery) use ($request) {
                $categoryQuery->where('categories.id', (int) $request->input('category_id'));
            });
        }

        if ($request->filled('status')) {
            $query->where('job_orders.status', $request->status);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('job_orders.date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('job_orders.date', '<=', $request->date_to);
        }

        $totalsQuery = clone $query;

        $allStatuses = DB::table('request_statuses')->pluck('name', 'id')->toArray();

        $allJobsQuery = JobOrder::query();
        if (!$request->user()->isAdmin() && !$request->user()->isTechnician()) {
            $allJobsQuery->where('requested_by', $request->user()->id);
        }

        $totals = [];
        foreach ($allStatuses as $id => $name) {
            $totals[$name] = (clone $allJobsQuery)->where('status', $id)->count();
        }

        $conformFilter = $request->input('conform_filter', 'all');
        $statusFilterType = $request->input('status_filter');
        $hasExplicitStatus = $request->filled('status');

        if ($statusFilterType !== 'all_status_page' && !$request->boolean('history')) {
            if ($conformFilter === 'all') {
                if (!$hasExplicitStatus) {
                    $query->whereHas('actionReport', function ($q) {
                        $q->whereIn('action_reports.status', ['Pending', 'Ongoing']);
                    });
                }
            } elseif ($conformFilter === 'conformed') {
                $query->whereHas('actionReport', function ($q) use ($hasExplicitStatus) {
                    $q->where(function ($sub) {
                        $sub->where('action_reports.conformed', true)
                            ->orWhere('action_reports.conformed', 1);
                    });

                    if (!$hasExplicitStatus) {
                        $q->where('action_reports.status', 'Ongoing');
                    }
                });
            } elseif ($conformFilter === 'awaiting') {
                $query->whereHas('actionReport', function ($q) use ($hasExplicitStatus) {
                    $q->where(function ($c) {
                        $c->where('action_reports.conformed', false)
                        ->orWhere('action_reports.conformed', 0)
                        ->orWhereNull('action_reports.conformed');
                    })
                    ->whereNotNull('action_reports.diagnosis')
                    ->whereNotNull('action_reports.action_taken');

                    if (!$hasExplicitStatus) {
                        $q->where('action_reports.status', 'Ongoing');
                    }
                });
            }
        }

        if ($statusFilterType === 'all_status_page') {
            // Do not apply any status or conform filter
        }

        $perPage = $request->input('per_page', 10);
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
            'requestStatus',
        ]);

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

        // ── Submission window gate ───────────────────────────────
        // Admins, technicians, and admin+technicians bypass this entirely.
        // Only regular users are gated to Mon–Fri, 8:30 AM – 4:00 PM (Asia/Manila).
        $isStaff = $request->user()->isAdmin() || $request->user()->isTechnician();

        if (!$isStaff && !$this->withinSubmissionWindow()) {
            return response()->json([
                'message' => 'Job order submissions are only accepted on weekdays (Mon–Fri) between 8:30 AM and 4:00 PM (Asia/Manila).',
            ], 422);
        }
        // ─────────────────────────────────────────────────────────

        $departmentId = $request->user()
            ->departments()
            ->orderBy('departments.id')
            ->value('departments.id');

        if (!$departmentId) {
            abort(422, 'No department is assigned to the current user.');
        }

        return DB::transaction(function () use ($validated, $request, $departmentId) {
            $signatureName = $validated['signature_name'] ?? $request->user()->name;
            $last = JobOrder::lockForUpdate()->latest('id')->first();
            $nextNumber = str_pad(($last?->id ?? 0) + 1, 6, '0', STR_PAD_LEFT);
            $jobOrderNo = now()->year . '-' . $nextNumber;

            $jobOrder = JobOrder::create([
                'job_order_no' => $jobOrderNo,
                'date' => $validated['date'],
                'department_id' => $departmentId,
                'requested_by' => $request->user()->id,
                'created_by' => $request->user()->id,
                'request_description' => $validated['request_description'],
                'contact_no' => $validated['contact_no'],
                'signature_name' => $signatureName,
                'status' => $validated['status'] ?? 1,
                'notified' => false,
            ]);

            foreach ($validated['categories'] as $category) {
                $jobOrder->categories()->attach(
                    $category['id'],
                    ['other_description' => $category['other_description'] ?? null]
                );
            }

            ActionReport::create([
                'job_order_id' => $jobOrder->id,
                'status' => 'Pending',
            ]);

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

            if (!empty($request->input('diagnosis'))) {
                $requestedByUser = User::find($jobOrder->requested_by);
                if ($requestedByUser) {
                    $requestedByUser->notify(new DiagnosisPopulatedNotification($jobOrder));
                }
            }

            if ($jobOrder->status === 'Pending' && !$jobOrder->notified) {
                $admins = User::whereHas('roles', function ($q) {
                    $q->where('name', 'admin');
                })->get();
                foreach ($admins as $admin) {
                    $admin->notify(new JobOrderPendingNotification($jobOrder));
                }

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

            $statusName = RequestStatus::find($validated['status'])?->name;

            if (
                ($request->user()->isAdmin() || $request->user()->isTechnician()) &&
                (
                    $statusName === 'Cancelled' ||
                    $statusName === 'Cancelled by User' ||
                    (isset($validated['action_taken']) && strtolower($validated['action_taken']) === 'closed')
                )
            ) {
                $completedStatusId = RequestStatus::where('name', 'Completed')->value('id');

                $keepUnserviceableActionTaken =
                    $actionReport->action_taken === 'Unserviceable';

                $newActionTaken = $keepUnserviceableActionTaken
                    ? $actionReport->action_taken
                    : 'Closed';

                $jobOrder->update(['status' => $completedStatusId]);
                $actionReport->update([
                    'status' => 'Completed',
                    'action_taken' => $newActionTaken,
                    'cancelled_by' => $request->user()->id,
                    'cancelled_at' => now(),
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
        $validated = $request->validate([
            'jobs' => ['required', 'array'],
            'jobs.*' => ['exists:job_orders,id']
        ]);

        $jobOrders = JobOrder::whereIn('id', $validated['jobs'])->update(['notified' => true]);

        return response()->json([
            'message' => 'Pending jobs have been marked as notified.',
            'updated' => $jobOrders
        ], 200);
    }

    public function markNotificationsRead(Request $request, JobOrder $jobOrder)
    {
        $user = $request->user();

        $user->unreadNotifications()
            ->whereJsonContains('data->job_order_id', $jobOrder->id)
            ->update(['read_at' => now()]);

        return response()->json([
            'message' => 'Notifications marked as read.'
        ], 200);
    }

    public function approve(Request $request, JobOrder $jobOrder)
    {
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

    public function serviceStatus(Request $request)
    {
        $serviceStatus = $request->input('service_status');
        $search = $request->input('search');
        $sort = $request->input('sort', 'newest');

        $statusMap = [
            'unserviceable' => 'Unserviceable',
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

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('job_orders.job_order_no', 'like', "%{$search}%")
                  ->orWhereHas('department', function ($d) use ($search) {
                      $d->where('name', 'like', "%{$search}%");
                  });
            });
        }

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

        if (!$request->user()->isAdmin() && !$request->user()->isTechnician()) {
            $query->where('job_orders.requested_by', $request->user()->id);
        }

        $jobs = $query->get();

        return response()->json([
            'data' => $this->transformJobs($jobs),
            'count' => $jobs->count(),
        ]);
    }

    private function transformJobs($jobs)
    {
        return collect($jobs)->map(function ($job) {
            foreach (['requester', 'creator', 'approver', 'conformer'] as $relation) {
                if ($job->$relation && $job->$relation->relationLoaded('role')) {
                    $job->$relation->role = $job->$relation->role ? $job->$relation->role->name : null;
                }
            }
            return $job;
        });
    }

    private function buildExportQuery(Request $request)
    {
        $query = JobOrder::with([
            'department',
            'requester',
            'categories',
            'actionReport.servicedBy',
            'actionReport.acceptedBy',
            'actionReport.cancelledBy',
            'requestStatus',
        ]);

        if ($request->filled('status')) {
            $statusName = $request->status;
            $statusId = DB::table('request_statuses')->where('name', $statusName)->value('id');

            if ($statusId) {
                $query->where('job_orders.status', $statusId);
            } else {
                if (is_numeric($statusName)) {
                    $query->where('job_orders.status', (int) $statusName);
                }
            }
        }

        if ($request->filled('service_status')) {
            $query->whereHas('actionReport', function ($q) use ($request) {
                $q->where('action_taken', $request->service_status);
            });
        }

        if ($request->filled('department_id')) {
            $query->where('department_id', $request->department_id);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('job_orders.created_at', '>=', Carbon::parse($request->date_from)->startOfDay());
        }

        if ($request->filled('date_to')) {
            $query->whereDate('job_orders.created_at', '<=', Carbon::parse($request->date_to)->endOfDay());
        }

        if ($request->filled('search')) {
            $search = trim((string) $request->search);
            $query->where(function ($q) use ($search) {
                $q->where('job_order_no', 'like', "%{$search}%")
                ->orWhereHas('department', function ($d) use ($search) {
                    $d->where('name', 'like', "%{$search}%");
                })
                ->orWhereHas('requester', function ($r) use ($search) {
                    $r->where('name', 'like', "%{$search}%");
                });
            });
        }

        if (!$request->user()->isAdmin() && !$request->user()->isTechnician()) {
            $query->where('job_orders.requested_by', $request->user()->id);
        }

        return $query;
    }

    public function exportCount(Request $request): JsonResponse
    {
        try {
            $query = $this->buildExportQuery($request);
            $count = $query->count();

            return response()->json([
                'success' => true,
                'count' => $count,
                'has_data' => $count > 0,
                'message' => $count > 0
                    ? "Found {$count} record(s) to export"
                    : 'No records found to export. Please refine your filters.',
            ]);

        } catch (\Exception $e) {
            \Log::error('Export count failed: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to count records for export.',
            ], 500);
        }
    }

    public function export(Request $request): StreamedResponse|JsonResponse
    {
        try {
            $request->validate([
                'status' => 'nullable|string|max:50',
                'service_status' => 'nullable|string|max:50',
                'department_id' => 'nullable|integer|exists:departments,id',
                'date_from' => 'nullable|date',
                'date_to' => 'nullable|date|after_or_equal:date_from',
                'search' => 'nullable|string|max:255',
            ]);

            $query = $this->buildExportQuery($request);

            $count = $query->count();

            if ($count === 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'No records found to export. Please refine your filters.',
                    'code' => 'NO_DATA',
                ], 422);
            }

            $maxExportRows = 10000;

            if ($count > $maxExportRows) {
                return response()->json([
                    'success' => false,
                    'message' => "Export limit exceeded. Maximum {$maxExportRows} rows allowed. Found {$count} records.",
                    'code' => 'EXPORT_LIMIT_EXCEEDED',
                    'count' => $count,
                    'max_limit' => $maxExportRows,
                ], 422);
            }

            $rateLimitKey = 'export_job_orders_' . auth()->id();
            $maxExportsPerHour = 10;

            if (cache()->has($rateLimitKey) && cache()->get($rateLimitKey) >= $maxExportsPerHour) {
                return response()->json([
                    'success' => false,
                    'message' => 'Too many export requests. Please wait before trying again.',
                    'code' => 'RATE_LIMIT_EXCEEDED',
                ], 429);
            }

            \Log::info('Job order export', [
                'user_id' => auth()->id(),
                'user_name' => auth()->user()->name,
                'count' => $count,
                'filters' => $request->only(['status', 'service_status', 'department_id', 'date_from', 'date_to', 'search']),
                'ip' => $request->ip(),
            ]);

            $itDirector = Signatory::where('role', 'it_director')->first();

            $filename = 'job_orders_' . date('Y-m-d_His') . '.csv';

            $headers = [
                'Content-Type' => 'text/csv',
                'Content-Disposition' => "attachment; filename=\"$filename\"",
                'Pragma' => 'no-cache',
                'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
                'Expires' => '0',
                'X-Record-Count' => (string) $count,
            ];

            $chunkSize = 500;

            $callback = function () use ($query, $itDirector, $chunkSize) {
                $handle = fopen('php://output', 'w');

                fprintf($handle, "\xEF\xBB\xBF");

                fputcsv($handle, [
                    'Job Order No',
                    'Department',
                    'Request Status',
                    'Service Status',
                    'Requested By',
                    'Signatory',
                    'Accepted By',
                    'Serviced By',
                    'Cancelled By',
                    'Date Created',
                ]);

                $query->chunk($chunkSize, function ($orders) use ($handle, $itDirector) {
                    foreach ($orders as $order) {
                        $requestStatus = $order->requestStatus?->name ?? '—';
                        $serviceStatus = $order->actionReport?->action_taken ?? '';

                        $servicedByRaw = $order->actionReport?->serviced_by?->name
                            ?? $order->actionReport?->serviced_by
                            ?? '';

                        $acceptedBy = $order->actionReport?->accepted_by_user?->name
                            ?? $itDirector?->user?->name
                            ?? $itDirector?->name
                            ?? '';

                        if (strtolower($serviceStatus) === 'closed' && trim((string)$servicedByRaw) === '') {
                            $acceptedBy = '';
                        }

                        $cancelledBy = $order->actionReport?->cancelled_by?->name
                            ?? $itDirector?->user?->name
                            ?? $itDirector?->name
                            ?? '';

                        fputcsv($handle, [
                            $order->job_order_no ?? '',
                            $order->department?->name ?? '',
                            $requestStatus,
                            $serviceStatus,
                            $order->requester?->name ?? '',
                            $order->signature_name ?? '',
                            $acceptedBy,
                            $servicedByRaw,
                            $cancelledBy,
                            $order->created_at?->format('Y-m-d H:i:s') ?? '',
                        ]);
                    }
                });

                fclose($handle);
            };

            if (cache()->has($rateLimitKey)) {
                cache()->increment($rateLimitKey);
            } else {
                cache()->put($rateLimitKey, 1, 3600);
                cache()->put($rateLimitKey . '_timestamp', time(), 3600);
            }

            return response()->stream($callback, 200, $headers);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid input parameters',
                'errors' => $e->errors(),
                'code' => 'VALIDATION_ERROR',
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Job order export failed: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'user_id' => auth()->id(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Export failed. Please try again or contact support.',
                'code' => 'EXPORT_ERROR',
            ], 500);
        }
    }

    public function pendingCount(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->isAdmin() && !$user->isTechnician()) {
            return response()->json(['count' => 0]);
        }

        $count = JobOrder::query()
            ->where('notified', false)
            ->whereHas('actionReport', function ($q) {
                $q->where('status', 'Pending');
            })
            ->count();

        return response()->json(['count' => $count]);
    }

    public function pendingList(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->isAdmin() && !$user->isTechnician()) {
            return response()->json([
                'data' => [],
                'meta' => [
                    'current_page' => 1,
                    'last_page' => 1,
                    'per_page' => 5,
                    'total' => 0,
                ],
            ]);
        }

        $perPage = min(max((int) $request->input('per_page', 5), 1), 50);
        $page = max((int) $request->input('page', 1), 1);

        $query = JobOrder::query()
            ->with([
                'department:id,name',
                'requester:id,name',
                'categories:id,name',
                'actionReport',
            ])
            ->where('notified', false)
            ->whereHas('actionReport', function ($q) {
                $q->where('status', 'Pending');
            })
            ->orderByDesc('created_at');

        if ($request->filled('search')) {
            $search = '%' . trim((string) $request->input('search')) . '%';
            $query->where(function ($q) use ($search) {
                $q->where('job_order_no', 'like', $search)
                ->orWhereHas('requester', fn($r) => $r->where('name', 'like', $search))
                ->orWhereHas('department', fn($d) => $d->where('name', 'like', $search));
            });
        }

        if ($request->filled('department_id')) {
            $query->where('department_id', (int) $request->input('department_id'));
        }

        $paginated = $query->paginate($perPage, ['*'], 'page', $page);

        return response()->json([
            'data' => $this->transformJobs($paginated->items()),
            'count' => $paginated->total(),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page'    => $paginated->lastPage(),
                'per_page'     => $paginated->perPage(),
                'total'        => $paginated->total(),
                'from'         => $paginated->firstItem(),
                'to'           => $paginated->lastItem(),
            ],
        ]);
    }

    // =================================================================
    // SUBMISSION WINDOW HELPER
    // =================================================================

    /**
     * Check whether the current moment is within the submission window.
     * Mon–Fri, 8:30 AM to 4:00 PM (Asia/Manila).
     */
    private function withinSubmissionWindow(): bool
    {
        $now = Carbon::now('Asia/Manila');

        // Weekdays only (Carbon's isWeekend() covers Sat & Sun)
        if ($now->isWeekend()) {
            return false;
        }

        $minutesNow   = $now->hour * 60 + $now->minute;
        $openMinutes  = 8 * 60 + 30;   // 8:30 AM
        $closeMinutes = 16 * 60 + 0;   // 4:00 PM

        return $minutesNow >= $openMinutes && $minutesNow < $closeMinutes;
    }
}