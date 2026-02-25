<?php
namespace App\Http\Controllers;

use App\Models\JobOrder;
use TCPDF;
use TCPDF_FONTS;
use Carbon\Carbon;

class CompletedReportController extends Controller
{
    public function generate(JobOrder $job)
    {
        $data = $job->actionReport;

        if (!$data) {
            abort(404, 'Action report not found.');
        }

        $pdf = new TCPDF();
        $pdf->SetTitle('Job Order for Technical Request');
        $pdf->SetMargins(15, 15, 15);
        $pdf->AddPage();

        // Load fonts
        $arialN = TCPDF_FONTS::addTTFfont(public_path('fonts/ARIALN.ttf'), 'TrueTypeUnicode', '', 96);
        $pdf->SetFont($arialN, '', 12);

        // ===== HEADER =====
        $x = 15;
        $y = 20;
        $rowHeight = 8;
        $pageWidth = $pdf->getPageWidth();
        $textBlockWidth = 130;
        $textX = ($pageWidth - $textBlockWidth) / 2;

        // Title: JOB ORDER FOR TECHNICAL REQUEST
        $pdf->SetXY($textX, $y);
        $pdf->Cell($textBlockWidth, 6, 'JOB ORDER FOR TECHNICAL REQUEST', 0, 1, 'C');

        // ===== J.O. No. with Line =====
        $y += 10;
        $pdf->SetXY($x, $y);
        $pdf->Cell(40, 6, 'J.O. No. :', 0, 0);
        $pdf->SetXY($x + 40, $y);
        $pdf->Cell(130, 6, '____________________', 0, 0); // Line for J.O. No.

        // ===== Date with Line =====
        $y += 10;
        $pdf->SetXY($x, $y);
        $pdf->Cell(40, 6, 'Date :', 0, 0);
        $pdf->SetXY($x + 40, $y);
        $pdf->Cell(130, 6, '____________________', 0, 0); // Line for Date

        // ===== Department with Line =====
        $y += 10;
        $pdf->SetXY($x, $y);
        $pdf->Cell(40, 6, 'Department :', 0, 0);
        $pdf->SetXY($x + 40, $y);
        $pdf->Cell(130, 6, '____________________', 0, 0); // Line for Department

        // ===== Category (Checkbox) =====
        $y += 10;
        $pdf->SetXY($x, $y);
        $pdf->Cell(40, 6, 'Category :', 0, 0);
        $pdf->SetXY($x + 40, $y);
        $pdf->Cell(10, 6, '[ ]', 0, 0); // Checkbox

        // ===== Request Description (Underlined) =====
        $y += 10;
        $pdf->SetXY($x, $y);
        $pdf->Cell(40, 6, 'Request Description :', 0, 0);
        $pdf->SetXY($x + 40, $y);
        $pdf->Cell(130, 6, '____________________', 0, 0); // Underline for Request Description

        // ===== Requested By Signatory =====
        $y += 15;
        $pdf->SetXY($x, $y);
        $pdf->Cell(40, 6, 'Requested By :', 0, 0);
        $pdf->SetXY($x + 40, $y);
        $pdf->Cell(130, 6, '____________________', 0, 0); // Line for Requested By

        // ===== Contact Number (Underlined) =====
        $y += 10;
        $pdf->SetXY($x, $y);
        $pdf->Cell(40, 6, 'Contact No. :', 0, 0);
        $pdf->SetXY($x + 40, $y);
        $pdf->Cell(130, 6, '____________________', 0, 0); // Line for Contact No.

        // ===== Approved By Signatory =====
        $y += 15;
        $pdf->SetXY($x, $y);
        $pdf->Cell(40, 6, 'Approved By :', 0, 0);
        $pdf->SetXY($x + 40, $y);
        $pdf->Cell(130, 6, '____________________', 0, 0); // Line for Approved By

        // ===== ACTION REPORT SECTION =====
        $y += 20;
        $pdf->SetXY($x + 80, $y);
        $pdf->Cell(60, 6, 'ACTION REPORT', 0, 1, 'C');

        // Diagnosis (Underlined)
        $y += 10;
        $pdf->SetXY($x + 80, $y);
        $pdf->Cell(60, 6, 'Diagnosis :', 0, 0);
        $pdf->SetXY($x + 140, $y);
        $pdf->Cell(60, 6, '____________________', 0, 0); // Line for Diagnosis

        // Action Taken (Underlined)
        $y += 10;
        $pdf->SetXY($x + 80, $y);
        $pdf->Cell(60, 6, 'Action Taken :', 0, 0);
        $pdf->SetXY($x + 140, $y);
        $pdf->Cell(60, 6, '____________________', 0, 0); // Line for Action Taken

        // Status (Underlined)
        $y += 10;
        $pdf->SetXY($x + 80, $y);
        $pdf->Cell(60, 6, 'Status :', 0, 0);
        $pdf->SetXY($x + 140, $y);
        $pdf->Cell(60, 6, '____________________', 0, 0); // Line for Status

        // Serviced By (Underlined)
        $y += 10;
        $pdf->SetXY($x + 80, $y);
        $pdf->Cell(60, 6, 'Serviced By :', 0, 0);
        $pdf->SetXY($x + 140, $y);
        $pdf->Cell(60, 6, '____________________', 0, 0); // Line for Serviced By

        // Date Started (Underlined)
        $y += 10;
        $pdf->SetXY($x + 80, $y);
        $pdf->Cell(60, 6, 'Date Start :', 0, 0);
        $pdf->SetXY($x + 140, $y);
        $pdf->Cell(60, 6, '____________________', 0, 0); // Line for Date Start

        // Date/Time Started (Underlined)
        $y += 10;
        $pdf->SetXY($x + 80, $y);
        $pdf->Cell(60, 6, 'Date/Time Started :', 0, 0);
        $pdf->SetXY($x + 140, $y);
        $pdf->Cell(60, 6, '____________________', 0, 0); // Line for Date/Time Started

        // Date/Time Finished (Underlined)
        $y += 10;
        $pdf->SetXY($x + 80, $y);
        $pdf->Cell(60, 6, 'Date/Time Finished :', 0, 0);
        $pdf->SetXY($x + 140, $y);
        $pdf->Cell(60, 6, '____________________', 0, 0); // Line for Date/Time Finished

        // Conforme (Underlined)
        $y += 10;
        $pdf->SetXY($x + 80, $y);
        $pdf->Cell(60, 6, 'Conforme (Requestor) :', 0, 0);
        $pdf->SetXY($x + 140, $y);
        $pdf->Cell(60, 6, '____________________', 0, 0); // Line for Conforme

        return $pdf->Output(
            'Job_Order_Report_' . $job->job_order_no . '.pdf',
            'I'
        );
    }

    // Optional view endpoint for API usage
    public function view(JobOrder $job)
    {
        $data = $job->actionReport;
        if (!$data) return response()->json(null, 404);

        return response()->json([
            'job' => $job,
            'action_report' => $data,
        ]);
    }
}
