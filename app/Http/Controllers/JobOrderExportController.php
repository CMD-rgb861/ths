<?php

namespace App\Http\Controllers;

use App\Models\JobOrder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response;

class JobOrderExportController extends Controller
{
    public function exportCsv(Request $request, $status = null)
    {
        $exportType = strtolower((string) $request->query('type', 'all'));

        $query = JobOrder::with([
            'department',
            'requester',
            'requestStatus',
            'actionReport',
            'actionReport.servicedBy',
            'actionReport.acceptedBy',
            'actionReport.cancelledBy',
            'categories',
        ]);

        if ($exportType === 'serial-history') {
            $query->whereHas('actionReport', function ($q) {
                $q->whereNotNull('serial_number')->where('serial_number', '<>', '');
            })->whereHas('categories', function ($q) {
                $q->whereIn('name', ['Computer Desktop', 'Laptop', 'Printer']);
            });
        } elseif ($exportType === 'software-history') {
            $query->whereHas('actionReport', function ($q) {
                $q->whereNotNull('software_name')->where('software_name', '<>', '');
            })->whereHas('categories', function ($q) {
                $q->where('name', 'Software');
            });
        }

        // Filter by status if provided and not 'all'
        if ($status && $status !== 'all') {
            $query->whereHas('actionReport', function ($q) use ($status) {
                $q->where('status', ucfirst($status));
            });
        }

        $orders = $query->orderBy('created_at', 'desc')->get();

        // Normalise status key for conditional column logic
        $statusKey = $status ? strtolower($status) : 'all';

        // Decide which "people" columns to include depending on the
        // selected status filter. This keeps CSVs concise when certain
        // data is impossible/irrelevant for that status.
        $includeAcceptedBy  = !in_array($statusKey, ['pending']);
        $includeServicedBy  = !in_array($statusKey, ['pending']);
        $includeCancelledBy = in_array($statusKey, ['all', 'cancelled', 'completed', 'unserviceable']);

        $isSerialHistory = $exportType === 'serial-history';
        $isSoftwareHistory = $exportType === 'software-history';

        if ($isSerialHistory) {
            $headers = [
                'Job Order No',
                'Department',
                'Requester',
                'Categories',
                'Serial Number',
                'Brand Name',
                'Brand Model',
                'Request Status',
                'Service Status',
                'Created At',
                'Updated At',
            ];
        } elseif ($isSoftwareHistory) {
            $headers = [
                'Job Order No',
                'Department',
                'Requester',
                'Categories',
                'Software Name',
                'Request Status',
                'Service Status',
                'Created At',
                'Updated At',
            ];
        } else {
            // Create CSV content
            // Export both request status (Pending/Ongoing/Cancelled/etc.) and
            // service status (action taken: Unserviceable, Closed, etc.),
            // plus a derived "Outcome Type" column to distinguish serviced vs
            // administratively closed/declined jobs.
            $headers = [
                'Job Order No',
                'Department',
                'Requester',
                'Signatory',
                'Request Status',
                'Service Status',
                'Outcome Type',
            ];

            if ($includeAcceptedBy) {
                $headers[] = 'Accepted By';
            }
            if ($includeServicedBy) {
                $headers[] = 'Serviced By';
            }
            if ($includeCancelledBy) {
                $headers[] = 'Cancelled / Closed By';
            }

            $headers[] = 'Created At';
            $headers[] = 'Updated At';
        }

        $csvData = [];
        $csvData[] = $headers;

        foreach ($orders as $order) {
            $actionReport = $order->actionReport;

            // --- Request Status (matches UI logic, including "Cancelled by User") ---
            if (
                (($order->requestStatus?->name === 'Cancelled') || ($actionReport?->status === 'Cancelled')) &&
                $actionReport?->cancelled_by &&
                $order->requester &&
                (
                    // cancelled_by can be an object or an id
                    (is_object($actionReport->cancelled_by)
                        ? $actionReport->cancelled_by->id
                        : $actionReport->cancelled_by) === $order->requester->id
                )
            ) {
                $requestStatus = 'Cancelled by User';
            } elseif ($order->requestStatus?->name) {
                $requestStatus = $order->requestStatus->name;
            } elseif (is_string($order->status)) {
                $requestStatus = $order->status;
            } elseif ($actionReport?->status) {
                $requestStatus = $actionReport->status;
            } else {
                $requestStatus = 'Pending';
            }

            // --- Service Status comes from action_taken (Unserviceable, Closed, etc.) ---
            $serviceStatus = $actionReport?->action_taken ?? '';
            // Normalised key for robust comparisons (handles case/whitespace)
            $serviceStatusKey = strtolower(trim((string) $serviceStatus));

            $requestedBy = $order->requester->name ?? '';
            $acceptedBy = $actionReport?->acceptedBy?->name ?? '';
            $servicedBy = $actionReport?->servicedBy?->name
                ?? ($actionReport?->serviced_by ?? '');
            $cancelledBy = $actionReport?->cancelledBy?->name ?? '';
            $categories = $order->categories?->pluck('name')->filter()->implode(', ') ?? '';

            // Derive a high-level outcome type to make "Completed but Closed"
            // vs "Completed and Serviced" easy to distinguish in spreadsheets.
            $outcomeType = 'Serviced';

            // Treat as "Closed (Declined)" when:
            // - service status is "Closed" (any case/whitespace)
            // - there is no technician (no Serviced By)
            // This covers cases like Completed+Closed with remarks only,
            // and any other administratively closed job without technician work.
            if (
                $serviceStatusKey === 'closed' &&
                (trim((string) $servicedBy) === '')
            ) {
                $outcomeType = 'Closed (Declined)';

                // For declined/administratively closed jobs, we don't want
                // to show an "Accepted By" value in the CSV, even if the
                // job was temporarily marked Ongoing earlier. This keeps
                // the export aligned with the final outcome.
                $acceptedBy = '';
            }

            if ($isSerialHistory) {
                $row = [
                    $order->job_order_no,
                    $order->department->name ?? '',
                    $requestedBy,
                    $categories,
                    $actionReport?->serial_number ?? '',
                    $actionReport?->brand_name ?? '',
                    $actionReport?->brand_model ?? '',
                    $requestStatus,
                    $serviceStatus,
                ];
            } elseif ($isSoftwareHistory) {
                $row = [
                    $order->job_order_no,
                    $order->department->name ?? '',
                    $requestedBy,
                    $categories,
                    $actionReport?->software_name ?? '',
                    $requestStatus,
                    $serviceStatus,
                ];
            } else {
                // Build row respecting the same conditional columns as headers
                $row = [
                    $order->job_order_no,
                    $order->department->name ?? '',
                    $requestedBy,
                    $order->signature_name ?? '',
                    $requestStatus,
                    $serviceStatus,
                    $outcomeType,
                ];

                if ($includeAcceptedBy) {
                    $row[] = $acceptedBy;
                }
                if ($includeServicedBy) {
                    $row[] = $servicedBy;
                }
                if ($includeCancelledBy) {
                    $row[] = $cancelledBy;
                }
            }

            $row[] = $order->created_at->format('Y-m-d H:i:s');
            $row[] = $order->updated_at->format('Y-m-d H:i:s');

            $csvData[] = $row;
        }

        // Generate CSV file
        $filename = 'job_orders_' . ($statusKey ?? 'all') . '_' . date('Y-m-d_His') . '.csv';
        
        $handle = fopen('php://temp', 'r+');
        foreach ($csvData as $row) {
            fputcsv($handle, $row);
        }
        rewind($handle);
        $csv = stream_get_contents($handle);
        fclose($handle);

        return Response::make($csv, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }
}
