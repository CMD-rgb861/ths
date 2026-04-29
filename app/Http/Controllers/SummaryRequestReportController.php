<?php

namespace App\Http\Controllers;

use TCPDF;
use Carbon\Carbon;
use App\Models\JobOrder;
use Illuminate\Http\Request;
use TCPDF_FONTS;

class SummaryRequestReportController extends Controller
{
    /**
        * Generate daily report PDF
     */
    public function daily(Request $request)
    {
        $request->validate([
            'date' => 'required|date_format:Y-m-d',
        ]);

        $date = Carbon::createFromFormat('Y-m-d', $request->date);
        
        // Fetch completed job orders for the specific date
        $jobOrders = $this->getCompletedJobOrdersForDate($date);

        if ($jobOrders->isEmpty()) {
            return response()->json(['message' => 'No completed job orders found for this date'], 404);
        }

        return $this->generateBulkPDFs($jobOrders, "Daily_Report_{$date->format('Y-m-d')}");
    }

    /**
    * Generate weekly report PDF
     */
    public function weekly(Request $request)
    {
        $request->validate([
            'start_date' => 'required|date_format:Y-m-d',
            'end_date' => 'required|date_format:Y-m-d|after_or_equal:start_date',
        ]);

        $startDate = Carbon::createFromFormat('Y-m-d', $request->start_date);
        $endDate = Carbon::createFromFormat('Y-m-d', $request->end_date);

        // Fetch completed job orders for the week
        $jobOrders = $this->getCompletedJobOrdersForDateRange($startDate, $endDate);

        if ($jobOrders->isEmpty()) {
            return response()->json(['message' => 'No completed job orders found for this week'], 404);
        }

        $fileName = "Weekly_Report_{$startDate->format('Y-m-d')}_to_{$endDate->format('Y-m-d')}";
        return $this->generateBulkPDFs($jobOrders, $fileName);
    }

    /**
    * Generate monthly report PDF
     */
    public function monthly(Request $request)
    {
        $request->validate([
            'year' => 'required|integer|min:2000|max:' . date('Y'),
            'month' => 'required|integer|min:1|max:12',
        ]);

        $startDate = Carbon::create($request->year, $request->month, 1);
        $endDate = $startDate->copy()->endOfMonth();

        // Fetch completed job orders for the month
        $jobOrders = $this->getCompletedJobOrdersForDateRange($startDate, $endDate);

        if ($jobOrders->isEmpty()) {
            return response()->json(['message' => 'No completed job orders found for this month'], 404);
        }

        $fileName = "Monthly_Report_{$startDate->format('Y-m')}";
        return $this->generateBulkPDFs($jobOrders, $fileName);
    }

    /**
     * Get completed job orders for a specific date
     * Filters by: request_status = 'Completed' AND service_status (action_taken) = 'Unserviceable' OR 'Closed'
     * AND date column matches the given date
     */
    private function getCompletedJobOrdersForDate(Carbon $date)
    {
        return JobOrder::whereHas('requestStatus', function($q) {
            $q->where('name', 'Completed');
        })
        ->whereHas('actionReport', function($q) {
            // Filter for Unserviceable or Closed service status
            $q->where(function($subQuery) {
                $subQuery->where('action_taken', 'Unserviceable')
                        ->orWhere('action_taken', 'Closed');
            });
        })
        // Filter by date column in job_orders table
        ->whereDate('date', $date)
        ->with([
            'department',
            'categories',
            'requester',
            'approver',
            'conformer',
            'actionReport.servicedBy',
            'actionReport',
            'csm',
        ])
        ->orderBy('job_order_no', 'asc')
        ->get();
    }

    /**
     * Get completed job orders for a date range
     * Filters by: request_status = 'Completed' AND service_status (action_taken) = 'Unserviceable' OR 'Closed'
     * AND date column is between startDate and endDate
     */
    private function getCompletedJobOrdersForDateRange(Carbon $startDate, Carbon $endDate)
    {
        return JobOrder::whereHas('requestStatus', function($q) {
            $q->where('name', 'Completed');
        })
        ->whereHas('actionReport', function($q) {
            // Filter for Unserviceable or Closed service status
            $q->where(function($subQuery) {
                $subQuery->where('action_taken', 'Unserviceable')
                        ->orWhere('action_taken', 'Closed');
            });
        })
        // Filter by date column in job_orders table (between range)
        ->whereBetween('date', [$startDate->startOfDay(), $endDate->endOfDay()])
        ->with([
            'department',
            'categories',
            'requester',
            'approver',
            'conformer',
            'actionReport.servicedBy',
            'actionReport',
            'csm',
        ])
        ->orderBy('job_order_no', 'asc')
        ->get();
    }

    /**
     * Generate bulk PDF output.
     * Single job orders return one report; multiple job orders are combined
     * into one TCPDF document with a request/report page pair per job order.
     */
    private function generateBulkPDFs($jobOrders, $reportName)
    {
        $count = $jobOrders->count();

        if ($count === 1) {
            return $this->generateSinglePDF($jobOrders->first());
        }

        return $this->generateCombinedPDF($jobOrders, $reportName);
    }

    /**
     * Generate single PDF using existing CompletedReportController logic
     */
    private function generateSinglePDF($jobOrder)
    {
        try {
            $pdf = $this->createPdfDocument();
            $this->renderJobOrder($pdf, $jobOrder);

            return response($pdf->Output('', 'S'), 200)
                ->header('Content-Type', 'application/pdf')
                ->header('Content-Disposition', "inline; filename=\"Job_Order_{$jobOrder->job_order_no}.pdf\"");

        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to generate PDF: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Generate a single combined PDF with multiple job orders.
     */
    private function generateCombinedPDF($jobOrders, $reportName)
    {
        try {
            $pdf = $this->createPdfDocument();

            foreach ($jobOrders as $jobOrder) {
                $this->renderJobOrder($pdf, $jobOrder);
            }

            return response($pdf->Output('', 'S'), 200)
                ->header('Content-Type', 'application/pdf')
                ->header('Content-Disposition', "inline; filename=\"{$reportName}.pdf\"");

        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to generate PDF: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Create a configured TCPDF document.
     */
    private function createPdfDocument()
    {
        $pdf = new TCPDF();
        $pdf->SetTitle('Job Order for Technical Request');
        $pdf->SetMargins(10, 10, 10);
        $pdf->SetAutoPageBreak(true, 10);
        return $pdf;
    }

    /**
     * Render one job order into the PDF, including the CSM page.
     */
    private function renderJobOrder(TCPDF $pdf, $jobOrder)
    {
        $pdf->AddPage();

        // Register fonts per render so each job order can be built independently.
        $arialN   = $this->registerFont('ARIALN.ttf');
        $arialNB  = $this->registerFont('ARIALNB.ttf');
        $arialNI  = $this->registerFont('ARIALNI.ttf');
        $arialNBI = $this->registerFont('ARIALNBI.ttf');

        $this->buildPDFContent($pdf, $jobOrder, $arialN, $arialNB, $arialNI, $arialNBI);
    }

    /**
     * Register a TTF font
     */
    private function registerFont($fontFile)
    {
        $fontPath = public_path("fonts/{$fontFile}");
        if (!file_exists($fontPath)) {
            throw new \Exception("Font file not found: {$fontFile}");
        }
        return \TCPDF_FONTS::addTTFfont($fontPath, 'TrueTypeUnicode', '', 96);
    }

    /**
     * Build PDF content (extracted from CompletedReportController)
     * This method contains all the PDF generation logic
     */
    private function buildPDFContent($pdf, $jobOrder, $arialN, $arialNB, $arialNI, $arialNBI)
    {
        // Set default font
        $pdf->SetFont($arialN, '', 9);

        // Page dimensions
        $pageWidth = $pdf->getPageWidth();
        $pageHeight = $pdf->getPageHeight();

        // Set left and right column widths
        $leftWidth = ($pageWidth / 2) - 15;
        $rightWidth = ($pageWidth / 2) - 15;

        // Overall layout controller
        $layout = [
            'x' => 9,
            'y' => 20,
            'logo_y' => 13,
            'header_y' => 12,
            'title_offset' => 7.5,
            'line_height' => 6,
            'hpad' => 4,
        ];

        $startY = $layout['y'];
        $leftX = $layout['x'];

        // RIGHT COLUMN CONTROLLER
        $rightCol = [
            'x' => $leftWidth + 15,
            'y' => $startY - 9,
            'width' => $rightWidth,
            'line_height' => 6,
        ];

        // Coordinate controllers
        $coords = [
            'jo' => ['x' => $leftX, 'y' => $startY + 16, 'w' => $leftWidth - 6],
            'date_dept' => ['x' => $leftX, 'y' => $startY + 29, 'w' => $leftWidth - 6],
            'category' => ['x' => $leftX, 'y' => $startY + 37, 'w' => $leftWidth - 6],
            'request' => ['x' => $leftX, 'y' => $startY + 79, 'w' => $leftWidth],
            'requester' => ['x' => $leftX, 'y' => $startY + 105, 'w' => $leftWidth],
        ];

        /* LEFT COLUMN */
        $logoPath = public_path('images/lnu_logo.jpg');
        if (file_exists($logoPath)) {
            $pdf->Image($logoPath, $leftX + 7, $layout['logo_y'], 13, 0, '', '', 'T', false, 300, '', false, false, 0, false, false, false);
        }

        // Header text
        $pdf->SetFont($arialN, '', 9);
        $pdf->SetXY($leftX, $layout['header_y']);
        $pdf->Cell($leftWidth, 5, 'LEYTE NORMAL UNIVERSITY', 0, 1, 'C');
        $pdf->SetFont($arialNB, '', 9);
        $pdf->Cell($leftWidth, 5, 'Information Technology Support Office', 0, 1, 'C');
        $pdf->SetFont($arialN, '', 9);
        $pdf->Cell($leftWidth, 5, 'Tacloban City', 0, 1, 'C');

        $pdf->SetFont($arialNB, '', 9);
        $pdf->SetXY($leftX, $startY + $layout['title_offset']);
        $pdf->Cell($leftWidth, 10, 'JOB ORDER FOR TECHNICAL REQUEST', 0, 1, 'C');

        // J.O. Number
        $pdf->SetFont($arialNB, '', 9);
        $pdf->SetXY($coords['jo']['x'], $coords['jo']['y']);
        $pdf->Cell($coords['jo']['w'], 6, 'J.O. No. ___________', 0, 1, 'R');
        if (!empty($jobOrder->job_order_no ?? null)) {
            $pdf->SetXY($coords['jo']['x'], $coords['jo']['y']);
            $pdf->Cell($coords['jo']['w'], 6, $jobOrder->job_order_no, 0, 1, 'R');
        }

        // Date & Department (same as original)
        $this->drawDateDepartmentBlock($pdf, $coords, $leftX, $leftWidth, $arialNB, $arialN, $jobOrder);

        // Category checkboxes (same as original)
        $this->drawCategoryBlock($pdf, $coords, $arialNB, $arialN, $jobOrder);

        // Request block
        $this->drawRequestBlock($pdf, $coords, $arialNB, $arialN, $jobOrder);

        // Requester block
        $requestEndY = $pdf->GetY();
        $this->drawRequesterBlock($pdf, $coords, $arialNB, $arialN, $jobOrder, $requestEndY);

        /* RIGHT COLUMN */
        $pdf->SetXY($rightCol['x'], $rightCol['y']);
        $pdf->SetFont($arialNB, '', 9);
        $pdf->Cell($rightCol['width'], 6, 'ACTION REPORT', 0, 1, 'C');
        $pdf->SetFont($arialNB, '', 9);
        $pdf->SetXY($rightCol['x'], $rightCol['y'] + 4.5);
        $pdf->Cell($rightCol['width'], 6, '*(to be filled-out by the ITS Technician)', 0, 1, 'C');

        // Diagnosis block
        $this->drawDiagnosisBlock($pdf, $rightCol, $arialNB, $arialN, $jobOrder);

        // Action taken block
        $this->drawActionTakenBlock($pdf, $rightCol, $arialNB, $arialN, $jobOrder);

        // Final fields
        $this->drawFinalFields($pdf, $rightCol, $arialNB, $arialN, $jobOrder);

        // Note to requester
        $this->drawNoteToRequester($pdf, $rightCol, $arialN);

        // Page 2 - CSM
        \App\PDF\CSMPageBuilder::build($pdf, $jobOrder);
    }

    /**
     * Draw date and department block
     */
    private function drawDateDepartmentBlock($pdf, $coords, $leftX, $leftWidth, $arialNB, $arialN, $jobOrder)
    {
        $leftColLabelX = $coords['date_dept']['x'];
        $leftColFullWidth = $coords['date_dept']['w'];
        $leftFixedUnderlineWidth = 70;

        $dateLabelY = $coords['date_dept']['y'] - 8;
        $deptLabelY = $coords['date_dept']['y'] - 4;
        $colInnerRightX = $leftColLabelX + $leftColFullWidth;

        // Date line
        $pdf->SetFont($arialNB, '', 9);
        $dateLabelW = $pdf->GetStringWidth('Date:');
        $pdf->SetXY($leftColLabelX, $dateLabelY);
        $pdf->Cell($dateLabelW + 2, 6, 'Date:', 0, 0, 'L');

        $dateMinStartX = $leftColLabelX + $dateLabelW + 4;
        $dateRightAlignedStart = $colInnerRightX - $leftFixedUnderlineWidth;
        $dateLineStartX = max($dateMinStartX, $dateRightAlignedStart);
        $dateLineW = $colInnerRightX - $dateLineStartX;
        $dateLineY = $dateLabelY + 4;
        $pdf->SetLineWidth(0.3);
        if ($dateLineW > 0) $pdf->Line($dateLineStartX, $dateLineY, $dateLineStartX + $dateLineW, $dateLineY);

        if (!empty($jobOrder->date)) {
            $pdf->SetFont($arialN, '', 9);
            $pdf->SetXY($dateLineStartX, $dateLabelY - 0.5);
            $pdf->Cell($dateLineW, 6, Carbon::parse($jobOrder->date)->format('m/d/Y'), 0, 0, 'L');
        }

        // Department line
        $pdf->SetFont($arialNB, '', 9);
        $deptLabelW = $pdf->GetStringWidth('Department:');
        $pdf->SetXY($leftColLabelX, $deptLabelY);
        $pdf->Cell($deptLabelW + 2, 6, 'Department:', 0, 0, 'L');

        $deptMinStartX = $leftColLabelX + $deptLabelW + 4;
        $deptRightAlignedStart = $colInnerRightX - $leftFixedUnderlineWidth;
        $deptLineStartX = max($deptMinStartX, $deptRightAlignedStart);
        $deptLineW = $colInnerRightX - $deptLineStartX;
        $deptLineY = $deptLabelY + 4;
        if ($deptLineW > 0) $pdf->Line($deptLineStartX, $deptLineY, $deptLineStartX + $deptLineW, $deptLineY);

        if (!empty($jobOrder->department->name ?? null)) {
            $pdf->SetFont($arialN, '', 9);
            $pdf->SetXY($deptLineStartX, $deptLabelY - 0.5);
            $pdf->Cell($deptLineW, 6, $jobOrder->department->name, 0, 0, 'L');
        }
    }

    /**
     * Draw category block with checkboxes
     */
    private function drawCategoryBlock($pdf, $coords, $arialNB, $arialN, $jobOrder)
    {
        $pdf->SetXY($coords['category']['x'], $coords['category']['y'] - 8);
        $pdf->SetFont($arialNB, '', 9);
        $pdf->Cell($coords['category']['w'], 6, 'Category:', 0, 1, 'L');

        $checkboxBaseX = $coords['category']['x'] + 7;
        $checkboxBaseY = $coords['category']['y'] - 2;
        $colWidth = ($coords['category']['w'] / 2) - 4;
        $rightX = $checkboxBaseX + ($coords['category']['w'] / 2);
        $boxWidth = 5;
        $boxHeight = 3;
        $gap = 2;

        $leftCats = [
            'Computer Desktop',
            'Information System',
            'Internet Connection',
            'Laptop',
            'IP/VOIP Phone',
        ];
        $rightCats = [
            'Local Area Network',
            'Printer',
            'Software',
            'Institutional Email Request',
            'Others: _________',
        ];

        $max = max(count($leftCats), count($rightCats));
        for ($i = 0; $i < $max; $i++) {
            $currentY = $checkboxBaseY + ($i * 4.5);
            if (isset($leftCats[$i])) {
                $pdf->Rect($checkboxBaseX, $currentY, $boxWidth, $boxHeight);
                $pdf->SetXY($checkboxBaseX + $boxWidth + $gap, $currentY - 1);
                $pdf->SetFont($arialN, '', 9);
                $pdf->Cell($colWidth - $boxWidth - $gap, 6, $leftCats[$i], 0, 0, 'L');
            }
            if (isset($rightCats[$i])) {
                $pdf->Rect($rightX, $currentY, $boxWidth, $boxHeight);
                $pdf->SetXY($rightX + $boxWidth + $gap, $currentY - 1);
                $pdf->SetFont($arialN, '', 9);
                $pdf->Cell($colWidth - $boxWidth - $gap, 6, $rightCats[$i], 0, 1, 'L');
            }
        }

        // Overlay checkmarks
        $pdf->SetFont('dejavusans', '', 10);
        if (!empty($jobOrder) && $jobOrder->categories) {
            $catNames = $jobOrder->categories->pluck('name')->map(fn($n) => trim((string)$n))->all();
            for ($i = 0; $i < $max; $i++) {
                $currentY = $checkboxBaseY + ($i * 4.5);
                if (isset($leftCats[$i]) && in_array($leftCats[$i], $catNames)) {
                    $pdf->SetXY($checkboxBaseX, $currentY - 0.5);
                    $pdf->Cell($boxWidth, $boxHeight, '✔', 0, 0, 'C');
                }
                if (isset($rightCats[$i]) && in_array($rightCats[$i], $catNames)) {
                    $pdf->SetXY($rightX, $currentY - 0.5);
                    $pdf->Cell($boxWidth, $boxHeight, '✔', 0, 0, 'C');
                }
            }
        }
    }

    /**
     * Draw request block
     */
    private function drawRequestBlock($pdf, $coords, $arialNB, $arialN, $jobOrder)
    {
        $pdf->SetXY($coords['request']['x'], $coords['request']['y'] - 23);
        $pdf->SetFont($arialNB, '', 9);
        $pdf->Cell(0, 6, 'Request:', 0, 1, 'L');

        $pdf->SetFont($arialN, '', 9);
        $reqText = $jobOrder->request_description ?? '';
        $reqWidth = $coords['request']['w'] - 4;
        $lineHeight = 4;
        $minLines = 4;

        $startY = $pdf->GetY();
        $pdf->SetXY($coords['request']['x'] + 2, $startY - 1);
        $pdf->MultiCell($reqWidth, $lineHeight, $reqText, 0, 'L');

        $usedLines = ceil($pdf->getNumLines($reqText, $reqWidth));
        $usedLines = max(1, $usedLines);
        $totalLines = max($minLines, $usedLines);

        for ($i = 0; $i < $totalLines; $i++) {
            $lineY = $startY + ($i * $lineHeight) + ($lineHeight - 1);
            $pdf->SetLineWidth(0.3);
            $pdf->Line($coords['request']['x'] + 2, $lineY, $coords['request']['x'] + $reqWidth, $lineY);
        }

        $pdf->SetY($startY + ($totalLines * $lineHeight));
    }

    /**
     * Draw requester block
     */
    private function drawRequesterBlock($pdf, $coords, $arialNB, $arialN, $jobOrder, $requestEndY)
    {
        $reqrX = $coords['requester']['x'];
        $reqrW = $coords['requester']['w'];
        $lineH = 6;
        $fixedUnderline = 50;
        $dynamicStartY = $requestEndY + 3;

        $this->drawLabelBlock($pdf, 'Requested by:', $jobOrder->requester->name ?? '', $reqrX, $dynamicStartY, $arialNB, $arialN, $fixedUnderline, 'Signature Over Printed Name');
        $this->drawLabelBlock($pdf, 'Contact No.:', $jobOrder->contact_no ?? '', $reqrX, $dynamicStartY + 9, $arialNB, $arialN, $fixedUnderline);
        $this->drawLabelBlock($pdf, 'Approved by:', $jobOrder->approver->name ?? '', $reqrX, $dynamicStartY + 14.5, $arialNB, $arialN, $fixedUnderline, 'ITS Director');

        $pdf->SetFont($arialNB, '', 10);
        $pdf->SetXY($reqrX - 3, $dynamicStartY + 21);
        $pdf->Cell($reqrW - 40, 5, 'EF-ITS-001 (02-02-26)', 0, 1, 'L');
    }

    /**
     * Draw diagnosis block
     */
    private function drawDiagnosisBlock($pdf, $rightCol, $arialNB, $arialN, $jobOrder)
    {
        $pdf->SetX($rightCol['x'] + 2);
        $pdf->SetFont($arialNB, '', 10);
        $pdf->Cell(0, 6, '*Diagnosis:', 0, 1, 'L');

        $diagText = $jobOrder->actionReport->diagnosis ?? '';
        $diagWidth = $rightCol['width'] - 8;
        $lineHeight = 4;
        $minLines = 4;

        $startY = $pdf->GetY();
        $pdf->SetXY($rightCol['x'] + 4, $startY - 1);
        $pdf->SetFont($arialN, '', 9);
        $pdf->MultiCell($diagWidth, $lineHeight, $diagText, 0, 'L');

        $usedLines = ceil($pdf->getNumLines($diagText, $diagWidth));
        $usedLines = max(1, $usedLines);
        $totalLines = max($minLines, $usedLines);

        for ($i = 0; $i < $totalLines; $i++) {
            $lineY = $startY + ($i * $lineHeight) + ($lineHeight - 1);
            $pdf->SetLineWidth(0.3);
            $pdf->Line($rightCol['x'] + 4, $lineY, $rightCol['x'] + 6 + $diagWidth, $lineY);
        }

        $pdf->SetY($startY + ($totalLines * $lineHeight));
    }

    /**
     * Draw action taken block
     */
    private function drawActionTakenBlock($pdf, $rightCol, $arialNB, $arialN, $jobOrder)
    {
        $pdf->SetX($rightCol['x'] + 2);
        $pdf->SetFont($arialNB, '', 10);
        $pdf->Cell(0, 6, '*Action Taken:', 0, 1, 'L');

        $actText = $jobOrder->actionReport->action_taken ?? '';
        $remarks = $jobOrder->actionReport->remarks ?? '';
        if ($remarks) {
            $actText .= ' - ' . $remarks;
        }

        $actWidth = $rightCol['width'] - 8;
        $lineHeight = 4;
        $minLines = 4;

        $startY = $pdf->GetY();
        $pdf->SetXY($rightCol['x'] + 4, $startY - 1);
        $pdf->SetFont($arialN, '', 9);
        $pdf->MultiCell($actWidth, $lineHeight, $actText, 0, 'L');

        $usedLines = ceil($pdf->getNumLines($actText, $actWidth));
        $usedLines = max(1, $usedLines);
        $totalLines = max($minLines, $usedLines);

        for ($i = 0; $i < $totalLines; $i++) {
            $lineY = $startY + ($i * $lineHeight) + ($lineHeight - 1);
            $pdf->SetLineWidth(0.3);
            $pdf->Line($rightCol['x'] + 4, $lineY, $rightCol['x'] + 6 + $actWidth, $lineY);
        }

        $pdf->SetY($startY + ($totalLines * $lineHeight));
    }

    /**
     * Draw final fields (Status, Serviced by, etc.)
     */
    private function drawFinalFields($pdf, $rightCol, $arialNB, $arialN, $jobOrder)
    {
        $fields = [
            '*Status:',
            '*Serviced by:',
            '*Date Start:',
            '*Date/Time Started:',
            '*Date/Time Finished:',
            '*CONFORME (Requestor):'
        ];

        $labelX = $rightCol['x'] + 2;
        $lineHeight = 8;
        $fullLineWidth = $rightCol['width'] - 4;
        $fixedUnderlineWidth = 60;
        $colInnerRightX = $labelX + $fullLineWidth;
        $fieldsWithLeftExtra = ['*Status:', '*Serviced by:', '*Date Start:'];
        $leftExtra = 30;

        foreach ($fields as $field) {
            $currentY = $pdf->GetY();
            $pdf->SetFont($arialNB, '', 9);
            $labelWidth = $pdf->GetStringWidth($field);
            $pdf->SetXY($labelX, $currentY);
            $pdf->Cell($labelWidth + 2, $lineHeight, $field, 0, 0, 'L');

            $minStartX = $labelX + $labelWidth + 3;
            $totalDesiredWidth = $fixedUnderlineWidth + (in_array($field, $fieldsWithLeftExtra) ? $leftExtra : 0);
            $rightAlignedStart = $colInnerRightX - $totalDesiredWidth;

            if ($rightAlignedStart >= $minStartX) {
                $lineStartX = $rightAlignedStart;
                $underlineWidth = $totalDesiredWidth;
            } else {
                $lineStartX = $minStartX;
                $underlineWidth = max(0, $colInnerRightX - $minStartX);
            }

            $lineY = $currentY + $lineHeight - 2;
            $pdf->SetLineWidth(0.3);
            if ($underlineWidth > 0) $pdf->Line($lineStartX, $lineY, $lineStartX + $underlineWidth, $lineY);

            // Overlay value
            if (!empty($jobOrder->actionReport ?? null)) {
                $value = '';
                switch ($field) {
                    case '*Status:':
                        $value = $jobOrder->actionReport->status ?? '';
                        break;
                    case '*Serviced by:':
                        $value = $jobOrder->actionReport->servicedBy->name ?? ($jobOrder->actionReport->serviced_by ?? '');
                        break;
                    case '*Date Start:':
                        $value = $jobOrder->actionReport->date_started ? Carbon::parse($jobOrder->actionReport->date_started)->format('m/d/Y') : '';
                        break;
                    case '*Date/Time Started:':
                        $value = $jobOrder->actionReport->date_started ? Carbon::parse($jobOrder->actionReport->date_started)->format('m/d/Y h:i A') : '';
                        break;
                    case '*Date/Time Finished:':
                        $value = $jobOrder->actionReport->date_finished ? Carbon::parse($jobOrder->actionReport->date_finished)->format('m/d/Y h:i A') : '';
                        break;
                    case '*CONFORME (Requestor):':
                        $value = $jobOrder->requester->name ?? ($jobOrder->conformed_by ?? '');
                        break;
                }
                if (!empty($value)) {
                    $pdf->SetFont($arialN, '', 9);
                    $pdf->SetXY($lineStartX, $currentY - 0.5);
                    $pdf->Cell($underlineWidth, $lineHeight, $value, 0, 0, 'L');
                }
            }

            $pdf->SetXY($labelX, $currentY + $lineHeight - 2);
        }
    }

    /**
     * Draw note to requester
     */
    private function drawNoteToRequester($pdf, $rightCol, $arialN)
    {
        $pdf->Ln(1);
        $noteTitle = 'Note to Requester:';
        $noteBody = "Upon return of your computer unit or laptop, please check the existence of your computer files. The ITS Office does not store back-up copies thus the technicians are not liable for the loss/damage of files after endorsement.";

        $labelX = $rightCol['x'] + 2;
        $fullLineWidth = $rightCol['width'] - 4;

        $pdf->SetFont($arialN, '', 8);
        $pdf->SetX($labelX);
        $pdf->Cell($fullLineWidth, 6, $noteTitle, 0, 1, 'L');

        $pdf->Ln(1);
        $pdf->SetFont($arialN, '', 8);
        $pdf->SetX($labelX);
        $pdf->MultiCell($fullLineWidth, 5, $noteBody, 0, 'L', false);
    }

    /**
     * Draw label block helper
     */
    private function drawLabelBlock($pdf, $label, $value, $x, $startY, $arialNB, $arialN, $fixedUnderline = 50, $smallLabel = '')
    {
        $lineH = 6;

        $pdf->SetFont($arialNB, '', 9);
        $labelWidth = $pdf->GetStringWidth($label);
        $pdf->SetXY($x, $startY);
        $pdf->Cell($labelWidth + 2, $lineH, $label, 0, 0, 'L');

        $lineStartX = $x + $labelWidth + 4;
        $lineWidth = $fixedUnderline;
        $lineY = $startY + 4;
        $pdf->SetLineWidth(0.3);
        $pdf->Line($lineStartX, $lineY, $lineStartX + $lineWidth, $lineY);

        $pdf->SetFont($arialN, '', 9);
        $valueWidth = !empty($value) ? $pdf->GetStringWidth($value) : 0;
        $valueStartX = $lineStartX + ($lineWidth / 2) - ($valueWidth / 2);
        $pdf->SetXY($valueStartX, $startY - 1);
        $pdf->Cell($valueWidth, $lineH, $value ?? '', 0, 0, 'C');

        if (!empty($smallLabel)) {
            $smallLabelWidth = $pdf->GetStringWidth($smallLabel);
            $smallLabelX = $lineStartX + ($lineWidth / 2) - ($smallLabelWidth / 2);
            $pdf->SetFont($arialN, '', 9);
            $pdf->SetXY($smallLabelX, $startY + 4);
            $pdf->Cell($smallLabelWidth, 5, $smallLabel, 0, 0, 'C');
        }
    }
}