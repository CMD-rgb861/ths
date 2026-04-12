<?php

namespace App\Http\Controllers;

use App\Models\JobOrder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response;

class JobOrderExportController extends Controller
{
    public function exportCsv(Request $request, $status = null)
    {
        $query = JobOrder::with([
            'department',
            'requester',
            'actionReport.servicedBy',
            'actionReport.acceptedBy',
            'actionReport.cancelledBy'
        ]);

        // Filter by status if provided and not 'all'
        if ($status && $status !== 'all') {
            $query->whereHas('actionReport', function ($q) use ($status) {
                $q->where('status', ucfirst($status));
            });
        }

        $orders = $query->orderBy('created_at', 'desc')->get();

        // Create CSV content
        $headers = [
            'Job Order No',
            'Department',
            'Requester',
            'Signatory',
            'Status',
            'Accepted By',
            'Serviced By',
            'Cancelled By',
            'Created At',
            'Updated At'
        ];

        $csvData = [];
        $csvData[] = $headers;

        foreach ($orders as $order) {
            $status = $order->actionReport->status ?? 'Pending';
            $requestedBy = $order->requester->name ?? '';
            $acceptedBy = $order->actionReport->acceptedBy->name ?? '';
            $servicedBy = $order->actionReport->servicedBy->name ?? $order->actionReport->serviced_by ?? '';
            $cancelledBy = $order->actionReport->cancelledBy->name ?? '';
            
            $csvData[] = [
                $order->job_order_no,
                $order->department->name ?? '',
                $requestedBy,
                $order->signature_name ?? '',
                $status,
                $acceptedBy,
                $servicedBy,
                $cancelledBy,
                $order->created_at->format('Y-m-d H:i:s'),
                $order->updated_at->format('Y-m-d H:i:s')
            ];
        }

        // Generate CSV file
        $filename = 'job_orders_' . ($status ?? 'all') . '_' . date('Y-m-d_His') . '.csv';
        
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
