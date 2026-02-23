<?php

namespace App\Http\Controllers;

use App\Models\JobOrder;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use setasign\Fpdi\Tcpdf\Fpdi;

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
            'action_taken'  => ['nullable', 'string'],
            'serviced_by'   => ['nullable', 'exists:users,id'],
            'date_started'  => ['nullable', 'date'],
            'remarks'       => ['nullable', 'string'],
        ]);

        // Validate technician
        if (!empty($validated['serviced_by'])) {
            $technician = User::where('id', $validated['serviced_by'])
                ->where('role', 'technician')
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
            'action_taken'  => ['nullable', 'string'],
            'serviced_by'   => ['nullable', 'exists:users,id'],
            'date_started'  => ['nullable', 'date'],
            'date_finished' => ['nullable', 'date'],
            'remarks'       => ['nullable', 'string'],
        ]);

        // Validate technician
        if (!empty($validated['serviced_by'])) {
            $technician = User::where('id', $validated['serviced_by'])
                ->where('role', 'technician')
                ->first();

            if (!$technician) {
                return response()->json([
                    'message' => 'Selected user is not a technician.'
                ], 422);
            }
        }

        // 🔥 IMPORTANT:
        // Status ALWAYS stays Ongoing until requester confirms
        $validated['status'] = 'Ongoing';

        $actionReport->update($validated);

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

        DB::transaction(function () use ($actionReport, $jobOrder) {

            // ✅ Update action report
            $actionReport->update([
                'conformed'     => true,
                'status'        => 'Completed',
                'confirmed_at'  => now(),  // Automatically set the confirmation date and time
                'confirmed_by'  => Auth::id(),
                'date_finished' => now(),  // Set the date finished to the confirmation time
            ]);

            // ✅ Update job order
            $jobOrder->update([
                'status' => 'Completed'
            ]);
        });

        // Generate final PDF AFTER transaction
        $this->generateFinalPdf($jobOrder);

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
    | GENERATE FINAL PDF
    |--------------------------------------------------------------------------
    */
    private function generateFinalPdf(JobOrder $jobOrder)
    {
        $pdf = new Fpdi();
        $pdf->SetCreator('ITSO Job Order System');
        $pdf->SetAuthor('ITSO');
        $pdf->SetTitle('Final Action Report');
        $pdf->AddPage();
        $pdf->SetFont('helvetica', '', 12);

        $pdf->Write(0, "Job Order #: {$jobOrder->jo_number}");
        $pdf->Ln();
        $pdf->Write(0, "Diagnosis: {$jobOrder->actionReport->diagnosis}");
        $pdf->Ln();
        $pdf->Write(0, "Action Taken: {$jobOrder->actionReport->action_taken}");
        $pdf->Ln(10);

        $files = Storage::disk('public')->files("job_orders/{$jobOrder->id}");

        foreach ($files as $file) {

            if (str_contains($file, 'final_report.pdf')) {
                continue;
            }

            $fullPath = storage_path("app/public/{$file}");
            $extension = strtolower(pathinfo($fullPath, PATHINFO_EXTENSION));

            if (in_array($extension, ['jpg', 'jpeg', 'png'])) {
                $pdf->AddPage();
                $pdf->Image($fullPath, 15, 40, 180);
            }

            if ($extension === 'pdf') {
                $pageCount = $pdf->setSourceFile($fullPath);

                for ($i = 1; $i <= $pageCount; $i++) {
                    $tpl = $pdf->importPage($i);
                    $pdf->AddPage();
                    $pdf->useTemplate($tpl);
                }
            }
        }

        $fileName = "job_orders/{$jobOrder->id}/final_report.pdf";

        $pdf->Output(storage_path("app/public/{$fileName}"), 'F');

        $jobOrder->update([
            'final_report_path' => $fileName
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | DOWNLOAD FINAL REPORT
    |--------------------------------------------------------------------------
    */
    public function downloadReport(JobOrder $jobOrder)
    {
        if (!$jobOrder->final_report_path) {
            abort(404, 'Final report not generated yet.');
        }

        return response()->download(
            storage_path("app/public/{$jobOrder->final_report_path}")
        );
    }

    public function updateUnserviceable(Request $request, JobOrder $jobOrder)
    {
        $validated = $request->validate([
            'item' => ['required', 'string'],
            'findings' => ['required', 'string'],
            'noted_by_its' => ['required', 'string'],
            'noted_by_pc' => ['required', 'string'],
            'date' => ['required', 'date'],
        ]);

        $actionReport = $jobOrder->actionReport;

        if (!$actionReport) {
            return response()->json([
                'message' => 'Action Report not found.'
            ], 404);
        }

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
}
