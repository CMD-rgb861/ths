<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\JobOrder;
use Carbon\Carbon;

class SerialNumberController extends Controller
{
    /**
     * Search job orders by serial number with advanced filters.
     * Returns total count and paginated list of job orders.
     */
    public function search(Request $request)
    {
        $serial = trim((string) $request->input('serial_number', ''));
        $category = $request->input('category');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');
        $perPage = min(max((int) $request->input('per_page', 10), 1), 50);
        $page = max((int) $request->input('page', 1), 1);

        $query = JobOrder::whereHas('actionReport', function ($q) {
                $q->whereNotNull('serial_number')
                  ->where('serial_number', '!=', '');
            })
            ->with([
                'department:id,name',
                'requester:id,name',
                'categories:id,name',
                'actionReport:id,job_order_id,diagnosis,action_taken,status,serviced_by,date_started,date_finished,remarks,serial_number,brand_name,brand_model,software_name,accepted_at,confirmed_at,cancelled_at,cancelled_by',
            ])
            ->orderByDesc('created_at');

        // Filter by serial number (partial match)
        if (!empty($serial) && strlen($serial) >= 3) {
            $query->whereHas('actionReport', function ($q) use ($serial) {
                $q->where('serial_number', 'like', "%{$serial}%");
            });
        }

        // Filter by category
        if (!empty($category)) {
            $query->whereHas('categories', function ($q) use ($category) {
                $q->where('name', $category);
            });
        }

        // Filter by date range (created_at)
        if (!empty($dateFrom)) {
            $query->whereDate('created_at', '>=', Carbon::parse($dateFrom)->startOfDay());
        }

        if (!empty($dateTo)) {
            $query->whereDate('created_at', '<=', Carbon::parse($dateTo)->endOfDay());
        }

        // Get total count for pagination
        $totalCount = (clone $query)->count();

        // Get paginated results
        $jobs = $query
            ->paginate($perPage, ['*'], 'page', $page);

        // Transform data to match frontend expectations
        $transformedJobs = $jobs->getCollection()->map(function ($job) {
            return [
                'id' => $job->id,
                'job_order_no' => $job->job_order_no,
                'department' => $job->department ? [
                    'id' => $job->department->id,
                    'name' => $job->department->name,
                ] : null,
                'requester' => $job->requester ? [
                    'id' => $job->requester->id,
                    'name' => $job->requester->name,
                ] : null,
                'categories' => $job->categories->map(function ($category) {
                    return [
                        'id' => $category->id,
                        'name' => $category->name,
                    ];
                }),
                'action_report' => $job->actionReport ? [
                    'id' => $job->actionReport->id,
                    'job_order_id' => $job->actionReport->job_order_id,
                    'diagnosis' => $job->actionReport->diagnosis,
                    'action_taken' => $job->actionReport->action_taken,
                    'status' => $job->actionReport->status,
                    'serviced_by' => $job->actionReport->serviced_by,
                    'date_started' => $job->actionReport->date_started,
                    'date_finished' => $job->actionReport->date_finished,
                    'remarks' => $job->actionReport->remarks,
                    'serial_number' => $job->actionReport->serial_number,
                    'brand_name' => $job->actionReport->brand_name,
                    'brand_model' => $job->actionReport->brand_model,
                    'software_name' => $job->actionReport->software_name,
                    'accepted_at' => $job->actionReport->accepted_at,
                    'confirmed_at' => $job->actionReport->confirmed_at,
                    'cancelled_at' => $job->actionReport->cancelled_at,
                    'cancelled_by' => $job->actionReport->cancelled_by,
                ] : null,
                'created_at' => $job->created_at,
                'updated_at' => $job->updated_at,
            ];
        });

        return response()->json([
            'data' => $transformedJobs,
            'current_page' => $jobs->currentPage(),
            'last_page' => $jobs->lastPage(),
            'per_page' => $jobs->perPage(),
            'total' => $jobs->total(),
            'from' => $jobs->firstItem(),
            'to' => $jobs->lastItem(),
        ]);
    }

    /**
     * Get serial number history with filters (alias for search).
     */
    public function history(Request $request)
    {
        return $this->search($request);
    }

    /**
     * Get unique serial numbers for autocomplete.
     */
    public function autocomplete(Request $request)
    {
        $search = trim((string) $request->input('search', ''));
        
        if (empty($search) || strlen($search) < 2) {
            return response()->json([]);
        }

        $serialNumbers = JobOrder::whereHas('actionReport', function ($q) use ($search) {
                $q->where('serial_number', 'like', "%{$search}%")
                  ->whereNotNull('serial_number')
                  ->where('serial_number', '!=', '');
            })
            ->limit(10)
            ->get()
            ->pluck('actionReport.serial_number')
            ->unique()
            ->values()
            ->toArray();

        return response()->json($serialNumbers);
    }
    /**
     * Export serial number history to CSV.
     */
    public function export(Request $request)
    {
        $serial = trim((string) $request->input('serial_number', ''));
        $category = $request->input('category');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');

        $query = JobOrder::whereHas('actionReport', function ($q) {
                $q->whereNotNull('serial_number')
                  ->where('serial_number', '!=', '');
            })
            ->with([
                'department:id,name',
                'requester:id,name',
                'categories:id,name',
                'actionReport:id,job_order_id,diagnosis,action_taken,status,serviced_by,date_started,date_finished,remarks,serial_number,brand_name,brand_model,software_name,accepted_at,confirmed_at,cancelled_at,cancelled_by',
            ])
            ->orderByDesc('created_at');

        // Filter by serial number (partial match)
        if (!empty($serial) && strlen($serial) >= 3) {
            $query->whereHas('actionReport', function ($q) use ($serial) {
                $q->where('serial_number', 'like', "%{$serial}%");
            });
        }

        // Filter by category
        if (!empty($category)) {
            $query->whereHas('categories', function ($q) use ($category) {
                $q->where('name', $category);
            });
        }

        // Filter by date range (created_at)
        if (!empty($dateFrom)) {
            $query->whereDate('created_at', '>=', Carbon::parse($dateFrom)->startOfDay());
        }

        if (!empty($dateTo)) {
            $query->whereDate('created_at', '<=', Carbon::parse($dateTo)->endOfDay());
        }

        // Get all results (no pagination for export)
        $jobs = $query->get();

        // Create CSV content
        $filename = 'serial_number_history_' . date('Y-m-d_His') . '.csv';
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"$filename\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $callback = function () use ($jobs) {
            $handle = fopen('php://output', 'w');

            // Add headers
            fputcsv($handle, [
                'Job Order No',
                'Device Type',
                'Serial Number',
                'Brand',
                'Model',
                'Requester',
                'Department',
                'Date Created',
                'Status'
            ]);

            // Add data rows
            foreach ($jobs as $job) {
                $ar = $job->actionReport;
                $categories = $job->categories->pluck('name')->implode(', ');
                
                // Get status
                $status = $ar->status ?? '—';
                if ($status === 'Cancelled' && $ar->cancelled_by && $job->requester) {
                    $cancelledById = is_object($ar->cancelled_by) ? $ar->cancelled_by->id : $ar->cancelled_by;
                    if ($cancelledById === $job->requester->id) {
                        $status = 'Cancelled by User';
                    }
                }

                fputcsv($handle, [
                    $job->job_order_no,
                    $categories ?: '—',
                    $ar->serial_number ?? '—',
                    $ar->brand_name ?? '—',
                    $ar->brand_model ?? '—',
                    $job->requester->name ?? '—',
                    $job->department->name ?? '—',
                    $job->created_at ? $job->created_at->format('Y-m-d H:i') : '—',
                    $status,
                ]);
            }

            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }
        /**
     * Get count of records to export (for validation)
     */
    public function exportCount(Request $request)
    {
        try {
            $serial = trim((string) $request->input('serial_number', ''));
            $category = $request->input('category');
            $dateFrom = $request->input('date_from');
            $dateTo = $request->input('date_to');

            $query = JobOrder::whereHas('actionReport', function ($q) {
                    $q->whereNotNull('serial_number')
                      ->where('serial_number', '!=', '');
                })
                ->with([
                    'department:id,name',
                    'requester:id,name',
                    'categories:id,name',
                    'actionReport:id,job_order_id,diagnosis,action_taken,status,serviced_by,date_started,date_finished,remarks,serial_number,brand_name,brand_model,software_name,accepted_at,confirmed_at,cancelled_at,cancelled_by',
                ]);

            // Filter by serial number (partial match)
            if (!empty($serial) && strlen($serial) >= 3) {
                $query->whereHas('actionReport', function ($q) use ($serial) {
                    $q->where('serial_number', 'like', "%{$serial}%");
                });
            }

            // Filter by category
            if (!empty($category)) {
                $query->whereHas('categories', function ($q) use ($category) {
                    $q->where('name', $category);
                });
            }

            // Filter by date range (created_at)
            if (!empty($dateFrom)) {
                $query->whereDate('created_at', '>=', Carbon::parse($dateFrom)->startOfDay());
            }

            if (!empty($dateTo)) {
                $query->whereDate('created_at', '<=', Carbon::parse($dateTo)->endOfDay());
            }

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
            \Log::error('Serial number export count failed: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to count records for export.',
            ], 500);
        }
    }
}