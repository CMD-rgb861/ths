<?php

namespace App\Http\Controllers;

use App\Models\JobOrder;
use TCPDF;
use TCPDF_FONTS;
use Carbon\Carbon;

class UnserviceableReportController extends Controller
{
    public function generate(JobOrder $job)
    {
        $data = $job->actionReport;

        if (!$data) {
            abort(404, 'Action report not found.');
        }

        $pdf = new \TCPDF();
        $pdf->SetTitle('Unserviceable Report');
        $pdf->SetMargins(15, 15, 15);
        $pdf->AddPage();

        /*
        =================================================
        REGISTER ARIAL NARROW FONTS
        =================================================
        */
        $arialN     = TCPDF_FONTS::addTTFfont(public_path('fonts/ARIALN.ttf'), 'TrueTypeUnicode', '', 96);
        $arialNB    = TCPDF_FONTS::addTTFfont(public_path('fonts/ARIALNB.ttf'), 'TrueTypeUnicode', '', 96);
        $arialNI    = TCPDF_FONTS::addTTFfont(public_path('fonts/ARIALNI.ttf'), 'TrueTypeUnicode', '', 96);
        $arialNBI   = TCPDF_FONTS::addTTFfont(public_path('fonts/ARIALNBI.ttf'), 'TrueTypeUnicode', '', 96);

        $pdf->SetFont($arialN, '', 11);

        // ===== DEFAULT POSITION CONTROLLERS =====
        $x = 15;
        $y = 20;
        $rowHeight = 8;

        // ===== GLOBAL LABEL CONTROLLERS =====
        $labelOffsetX = 2;
        $valueOffsetX = 35;

        /*
        =================================================
        HEADER
        =================================================
        */

        $startY = $y;
        $pageWidth = $pdf->getPageWidth();

        $textBlockWidth = 130;
        $textX = ($pageWidth - $textBlockWidth) / 2;

        $logoPath   = public_path('images/lnu_logo.jpg');
        $logoWidth  = 23;
        $logoHeight = 23;

        $spaceBetween = 25;

        $logoOffsetX = 55;
        $logoOffsetY = -2;

        $logoX = $textX - $spaceBetween - $logoWidth + $logoOffsetX;
        $logoY = $startY + $logoOffsetY;

        $pdf->Image($logoPath, $logoX, $logoY, $logoWidth, $logoHeight);

        /*
        -------------------------------------------------
        HEADER TEXT
        -------------------------------------------------
        */
        $pdf->SetFont($arialN, '', 13);
        $pdf->SetXY($textX, $startY);
        $pdf->Cell($textBlockWidth, 6, 'Leyte Normal University', 0, 1, 'C');

        $startY += 6;

        $pdf->SetFont($arialN, '', 13);
        $pdf->SetXY($textX, $startY);
        $pdf->Cell($textBlockWidth, 6, 'Information Technology Support Office', 0, 1, 'C');

        $startY += 6;

        $pdf->SetFont($arialN, '', 13);
        $pdf->SetXY($textX, $startY);
        $pdf->Cell($textBlockWidth, 6, 'Tacloban City', 0, 1, 'C');

        $y = $startY + 10;

        /*
        =================================================
        TITLE
        =================================================
        */

        $y += 3;
        $pdf->SetFont($arialNB, '', 16);
        $pdf->SetXY($x, $y);
        $pdf->Cell(180, 10, 'SERVICE REPORT', 0, 1, 'C');

        /*
        =================================================
        FORM TABLE
        =================================================
        */

        $pdf->SetFont($arialN, '', 11);
        $y += 12;

        $cellPaddingY = 3;
        $defaultRowHeight = 12;

        /*
        DATE
        */
        $pdf->SetXY($x, $y);
        $pdf->Cell(180, $defaultRowHeight, '', 1);

        $pdf->SetXY($x + $labelOffsetX, $y + $cellPaddingY);
        $pdf->SetFont($arialNB, '', 11);
        $pdf->Cell(30, 6, 'Date:', 0);

        $pdf->SetFont($arialN, '', 11);

        $pdf->SetXY($x + $valueOffsetX, $y + $cellPaddingY);
        $pdf->Cell(
            130,
            6,
            Carbon::parse($data->unserviceable_date)->format('F d, Y'),
            0
        );

        $y += $defaultRowHeight;

        /*
        ITEM
        */
        $pdf->SetXY($x, $y);
        $pdf->Cell(180, $defaultRowHeight, '', 1);

        $pdf->SetXY($x + $labelOffsetX, $y + $cellPaddingY);
        $pdf->SetFont($arialNB, '', 11);
        $pdf->Cell(30, 6, 'Item:', 0);

        $pdf->SetFont($arialN, '', 11);

        $pdf->SetXY($x + $valueOffsetX, $y + $cellPaddingY);
        $pdf->Cell(130, 6, $data->item, 0);

        $y += $defaultRowHeight;

        /*
        FINDINGS
        */
        $pdf->SetXY($x, $y);
        $pdf->Cell(180, $defaultRowHeight, '', 1);

        $pdf->SetXY($x + $labelOffsetX, $y + $cellPaddingY);
        $pdf->SetFont($arialNB, '', 11);
        $pdf->Cell(30, 6, 'Findings:', 0);

        $pdf->SetFont($arialN, '', 11);

        $pdf->SetXY($x + $valueOffsetX, $y + $cellPaddingY);
        $pdf->Cell(130, 6, $data->findings, 0);

        $y += $defaultRowHeight;

        /*
        STATUS
        */
        $pdf->SetXY($x, $y);
        $pdf->Cell(180, $defaultRowHeight, '', 1);

        $pdf->SetXY($x + $labelOffsetX, $y + $cellPaddingY);
        $pdf->SetFont($arialNB, '', 11);
        $pdf->Cell(30, 6, 'Status:', 0);

        $pdf->SetFont($arialN, '', 11);

        $pdf->SetXY($x + $valueOffsetX, $y + $cellPaddingY);
        $statusText = $data->action_taken ?: 'Unserviceable';
        $pdf->Cell(130, 6, $statusText, 0);

        $y += $defaultRowHeight;

        /*
        SERVICED BY
        */
        $sectionHeight = 27;
        $sectionX = $x;
        $sectionY = $y;

        $signatureOffsetX = -10;
        $signatureOffsetY = -8;

        $pdf->SetXY($sectionX, $sectionY);
        $pdf->Cell(180, $sectionHeight, '', 1);

        $pdf->SetXY($sectionX + $labelOffsetX, $sectionY + 3);
        $pdf->SetFont($arialNB, '', 11);
        $pdf->Cell(35, 6, 'Serviced by:', 0);

        $pdf->SetFont($arialN, '', 11);

        $pdf->SetXY($sectionX + $valueOffsetX + $signatureOffsetX, $sectionY + 16 + $signatureOffsetY);
        $pdf->Cell(130, 6, $data->servicedBy?->name ?? '', 0, 1, 'C');

        $pdf->SetXY($sectionX + $valueOffsetX + $signatureOffsetX, $sectionY + 18 + $signatureOffsetY);
        $pdf->Cell(130, 6, '_______________________________', 0, 1, 'C');

        $pdf->SetXY($sectionX + $valueOffsetX + $signatureOffsetX, $sectionY + 23 + $signatureOffsetY);
        $pdf->Cell(130, 6, 'Signature over Printed Name', 0, 1, 'C');

        $y += $sectionHeight;

        /*
        NOTED BY
        */
        $sectionHeight = 25;
        $sectionX = $x;
        $sectionY = $y;
        $signatureOffsetY = -5;

        $pdf->SetXY($sectionX, $sectionY);
        $pdf->Cell(180, $sectionHeight, '', 1);

        $pdf->SetXY($sectionX + $labelOffsetX, $sectionY + 3);
        $pdf->SetFont($arialNB, '', 11);
        $pdf->Cell(35, 6, 'Noted by:', 0);

        $pdf->SetFont($arialN, '', 11);

        $pdf->SetXY($sectionX + 10, $sectionY + 17 + $signatureOffsetY);
        $pdf->Cell(80, 6, '_______________________________', 0, 0, 'C');

        $pdf->SetXY($sectionX + 10, $sectionY + 15 + $signatureOffsetY);
        $pdf->Cell(80, 6, $data->noted_by_its, 0, 0, 'C');

        $pdf->SetXY($sectionX + 10, $sectionY + 22 + $signatureOffsetY);
        $pdf->Cell(80, 6, 'ITS Director', 0, 0, 'C');

        $pdf->SetXY($sectionX + 90, $sectionY + 17 + $signatureOffsetY);
        $pdf->Cell(80, 6, '_______________________________', 0, 0, 'C');

        $pdf->SetXY($sectionX + 90, $sectionY + 15 + $signatureOffsetY);
        $pdf->Cell(80, 6, $data->noted_by_pc, 0, 0, 'C');

        $pdf->SetXY($sectionX + 90, $sectionY + 22 + $signatureOffsetY);
        $pdf->Cell(80, 6, 'Property Custodian', 0, 0, 'C');

        $y += $sectionHeight;

        $y += 1;
        $x += 1;

        $pdf->SetFont($arialNB, '', 12);
        $pdf->SetXY($x, $y);
        $pdf->Cell(180, 6, 'F-ITS-009 (09-02-2019)', 0, 1, 'L');

        return $pdf->Output(
            'Unserviceable_Report_' . $job->job_order_no . '.pdf',
            'I'
        );
    }
}