<?php
//app\Http\Controllers\CompletedReportController.php
namespace App\Http\Controllers;

use TCPDF;
use TCPDF_FONTS;
use Carbon\Carbon;
use App\Models\JobOrder;
use App\PDF\CSMPageBuilder;

class CompletedReportController extends Controller
{
    public function generate($id)
    {
        // Fetch the job order by ID, must be completed
        $jobOrder = JobOrder::where('id', $id)
            // Change this line:
            // ->where('status', 'completed')
            // To this:
            ->whereHas('requestStatus', function($q) {
                $q->where('name', 'Completed');
            })
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
            ->firstOrFail();

        // Create a new PDF instance
        $pdf = new TCPDF();
        $pdf->SetTitle('Job Order for Technical Request');
        $pdf->SetMargins(10, 10, 10);
        $pdf->AddPage();

        /*
        =================================================
        REGISTER ARIAL NARROW FONTS
        =================================================
        */
        $arialN   = TCPDF_FONTS::addTTFfont(public_path('fonts/ARIALN.ttf'), 'TrueTypeUnicode', '', 96);
        $arialNB  = TCPDF_FONTS::addTTFfont(public_path('fonts/ARIALNB.ttf'), 'TrueTypeUnicode', '', 96);
        $arialNI  = TCPDF_FONTS::addTTFfont(public_path('fonts/ARIALNI.ttf'), 'TrueTypeUnicode', '', 96);
        $arialNBI = TCPDF_FONTS::addTTFfont(public_path('fonts/ARIALNBI.ttf'), 'TrueTypeUnicode', '', 96);

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

        // -------------------------------
        // RIGHT COLUMN CONTROLLER (UNIFIED)
        // -------------------------------
        $rightCol = [
            'x' => $leftWidth + 15,
            'y' => $startY - 9, // Adjusted to align with the header
            'width' => $rightWidth,
            'line_height' => 6,
        ];

        // Coordinate controllers
        $coords = [
            'jo' => ['x' => $leftX, 'y' => $startY + 16, 'w' => $leftWidth - 6],
            'date_dept' => ['x' => $leftX, 'y' => $startY + 29, 'w' => $leftWidth - 6],
            'category' => ['x' => $leftX, 'y' => $startY + 37   , 'w' => $leftWidth - 6],
            'request' => ['x' => $leftX, 'y' => $startY + 79, 'w' => $leftWidth],
            'requester' => ['x' => $leftX, 'y' => $startY + 105, 'w' => $leftWidth],
        ];

        /* =========================
           LEFT COLUMN
        ========================== */

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

        $pdf->SetFont($arialN, '', 19);

        // J.O.
        $pdf->SetFont($arialNB, '', 9);
        $pdf->SetXY($coords['jo']['x'], $coords['jo']['y']);
        $pdf->Cell($coords['jo']['w'], 6, 'J.O. No. ___________', 0, 1, 'R');
        if (!empty($jobOrder->job_order_no ?? null)) {
            $pdf->SetXY($coords['jo']['x'], $coords['jo']['y']);
            $pdf->Cell($coords['jo']['w'], 6, $jobOrder->job_order_no, 0, 1, 'R');
        }

        // Date & Department
        $leftColLabelX = $coords['date_dept']['x'];
        $leftColFullWidth = $coords['date_dept']['w'];
        $leftFixedUnderlineWidth = 70;

        $dateLabelX = $leftColLabelX;
        $deptLabelX = $leftColLabelX;
        $dateLabelY = $coords['date_dept']['y'] - 8;
        $deptLabelY = $coords['date_dept']['y'] - 4;

        $colInnerRightX = $leftColLabelX + $leftColFullWidth;

        // --- Date line ---
        $pdf->SetFont($arialNB, '', 9);
        $dateLabelW = $pdf->GetStringWidth('Date:');
        $pdf->SetXY($dateLabelX, $dateLabelY);
        $pdf->Cell($dateLabelW + 2, 6, 'Date:', 0, 0, 'L');

        $dateMinStartX = $dateLabelX + $dateLabelW + 4;
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

        // --- Department line ---
        $pdf->SetFont($arialNB, '', 9);
        $deptLabelW = $pdf->GetStringWidth('Department:');
        $pdf->SetXY($deptLabelX, $deptLabelY);
        $pdf->Cell($deptLabelW + 2, 6, 'Department:', 0, 0, 'L');

        $deptMinStartX = $deptLabelX + $deptLabelW + 4;
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

        // Category (checkboxes)
        $pdf->SetXY($coords['category']['x'], $coords['category']['y'] - 8);
        $pdf->SetFont($arialNB, '', 9);
        $pdf->Cell($coords['category']['w'], 6, 'Category:', 0, 1, 'L');

        $checkboxBaseX = $coords['category']['x'] + 7;
        $checkboxBaseY = $coords['category']['y'] - 2;
        $colWidth = ($coords['category']['w'] / 2) - 4;
        $rightX = $checkboxBaseX + ($coords['category']['w'] / 2);
        $boxWidth = 5; $boxHeight = 3; $gap = 2;

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

        // Overlay checkmarks and handle 'Others' description
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

                if (isset($rightCats[$i]) && strpos($rightCats[$i], 'Others') !== false) {
                    $otherDesc = '';
                    foreach ($jobOrder->categories as $c) {
                        if (stripos($c->name, 'other') !== false && !empty($c->pivot->other_description)) {
                            $otherDesc = $c->pivot->other_description;
                            break;
                        }
                    }
                    if ($otherDesc) {
                        $pdf->SetFont($arialN, '', 9);
                        $pdf->SetXY($rightX + $boxWidth + $gap + 2, $currentY - 1);
                        $pdf->Cell($colWidth - ($boxWidth + $gap), 6, $otherDesc, 0, 0, 'L');
                    }
                }
            }
        }

        
        // =========================
        // REQUEST BLOCK
        // =========================

        // Label "Request:"
        $pdf->SetFont($arialNB, '', 9);
        $pdf->SetXY($coords['request']['x'], $coords['request']['y'] - 23);
        $pdf->Cell(0, 6, 'Request:', 0, 1, 'L');

        // Set text font (underlined)
        $pdf->SetFont($arialN, '', 9);
        $reqText = $jobOrder->request_description ?? ''; // text from DB

        $reqWidth = $coords['request']['w'] - 4;  // text block width
        $lineHeight = 4;                           // height per line
        $minLines = 4;                              // minimum lines to show

        // 1️⃣ Print the text
        $startY = $pdf->GetY();
        $pdf->SetXY($coords['request']['x'] + 2, $startY -1);
        $pdf->MultiCell($reqWidth, $lineHeight, $reqText, 0, 'L');

        // 2️⃣ Count how many lines the text actually used
        $usedLines = ceil($pdf->getNumLines($reqText, $reqWidth));
        $usedLines = max(1, $usedLines);

        // 3️⃣ Draw underlines for all lines (use the greater of minLines or usedLines)
        $totalLines = max($minLines, $usedLines);
        for ($i = 0; $i < $totalLines; $i++) {
            $lineY = $startY + ($i * $lineHeight) + ($lineHeight - 1); // adjust for underline
            $pdf->SetLineWidth(0.3);
            $pdf->Line($coords['request']['x'] + 2, $lineY, $coords['request']['x'] + $reqWidth, $lineY);
        }

        // 4️⃣ Move cursor below the block for next field
        $requestEndY = $startY + ($totalLines * $lineHeight);
        $pdf->SetY($requestEndY + 2);

        // --------------------------
        // REQUESTER BLOCK
        // --------------------------
        // Keep same as your original code but use dynamic Y = $requestEndY + offset
        $reqrX = $coords['requester']['x'];
        $reqrW = $coords['requester']['w'];
        $labelList = ['Requested by:', 'Contact No.:', 'Approved by:'];
        $lineH = 6;
        $fixedUnderline = 50;

        $requestedByLabelY = $requestEndY + 2;
        $contactLabelY = $requestedByLabelY + 9;
        $approvedLabelY = $contactLabelY + 5;

        // ===========================
        // REQUESTER BLOCK (Requested by / Contact No. / Approved by)
        // ===========================
        $reqrX = $coords['requester']['x'];
        $reqrW = $coords['requester']['w'];
        $lineH = 6;
        $fixedUnderline = 50;

        // Dynamically position below the Request block
        $dynamicStartY = $requestEndY + 3; // small padding after request

        // Build a function to draw a labeled line block with optional small label below
        function drawLabelBlock($pdf, $label, $value, $x, $startY, $arialNB, $arialN, $fixedUnderline = 50, $smallLabel = '') {
            $lineH = 6;

            // 1) Label
            $pdf->SetFont($arialNB, '', 9);
            $labelWidth = $pdf->GetStringWidth($label);
            $pdf->SetXY($x, $startY);
            $pdf->Cell($labelWidth + 2, $lineH, $label, 0, 0, 'L');

            // 2) Underline
            $lineStartX = $x + $labelWidth + 4; // start right after label
            $lineWidth = $fixedUnderline;
            $lineY = $startY + 4;
            $pdf->SetLineWidth(0.3);
            $pdf->Line($lineStartX, $lineY, $lineStartX + $lineWidth, $lineY);

            // 3) Value (centered over underline)
            $pdf->SetFont($arialN, '', 9);
            $valueWidth = !empty($value) ? $pdf->GetStringWidth($value) : 0;
            $valueStartX = $lineStartX + ($lineWidth / 2) - ($valueWidth / 2); // center value
            $pdf->SetXY($valueStartX, $startY - 1);
            $pdf->Cell($valueWidth, $lineH, $value ?? '', 0, 0, 'C');

            // 4) Small label below the value (centered over underline)
            if (!empty($smallLabel)) {
                $smallLabelWidth = $pdf->GetStringWidth($smallLabel);
                $smallLabelX = $lineStartX + ($lineWidth / 2) - ($smallLabelWidth / 2);
                $pdf->SetFont($arialN, '', 9);
                $pdf->SetXY($smallLabelX, $startY + 4);
                $pdf->Cell($smallLabelWidth, 5, $smallLabel, 0, 0, 'C');
            }
        }

        // -------------------------
        // Draw the blocks
        // -------------------------
        drawLabelBlock(
            $pdf,
            'Requested by:',
            $jobOrder->requester->name ?? '',
            $reqrX,
            $dynamicStartY,
            $arialNB,
            $arialN,
            $fixedUnderline,
            'Signature Over Printed Name'
        );

        drawLabelBlock(
            $pdf,
            'Contact No.:',
            $jobOrder->contact_no ?? '',
            $reqrX,
            $dynamicStartY + 9,
            $arialNB,
            $arialN,
            $fixedUnderline,
            ''
        );

        drawLabelBlock(
            $pdf,
            'Approved by:',
            $jobOrder->approver->name ?? '',
            $reqrX,
            $dynamicStartY + 14.5,
            $arialNB,
            $arialN,
            $fixedUnderline,
            'ITS Director'
        );

        // Document code under Approved by block
        $pdf->SetFont($arialNB, '', 10);
        $pdf->SetXY($reqrX - 3, $dynamicStartY + 21);
        $pdf->Cell($reqrW - 40, 5, 'EF-ITS-001 (02-02-26)', 0, 1, 'L');


        // --------------------------
        // VERTICAL DIVIDER
        // --------------------------
        // $pdf->SetLineWidth(0.5);
        // $pdf->Line($leftWidth + 10, $startY, $leftWidth + 10, $pageHeight - 10);

        /* =========================
           RIGHT COLUMN
        ========================== */
        $pdf->SetXY($rightCol['x'], $rightCol['y']);
        $pdf->SetFont($arialNB, '', 9);
        $pdf->Cell($rightCol['width'], 6, 'ACTION REPORT', 0, 1, 'C');
        $pdf->SetFont($arialNB, '', 9);
        $pdf->SetXY($rightCol['x'], $rightCol['y'] + 4.5);
        $pdf->Cell($rightCol['width'], 6, '*(to be filled-out by the ITS Technician)', 0, 1, 'C');

        // --------------------------
        // DIAGNOSIS
        // --------------------------
        $pdf->SetX($rightCol['x'] + 2);
        $pdf->SetFont($arialNB, '', 10);
        $pdf->Cell(0, 6, '*Diagnosis:', 0, 1, 'L');

        $diagText = $jobOrder->actionReport->diagnosis ?? '';
        $diagWidth = $rightCol['width'] - 8;
        $lineHeight = 4;
        $minLines = 4; // minimum lines to show

        $startY = $pdf->GetY();
        $pdf->SetXY($rightCol['x'] + 4, $startY - 1);
        $pdf->SetFont($arialN, '', 9);
        $pdf->MultiCell($diagWidth, $lineHeight, $diagText, 0, 'L');

        $usedLines = ceil($pdf->getNumLines($diagText, $diagWidth));
        $usedLines = max(1, $usedLines);

        // Draw underlines for all lines (use the greater of minLines or usedLines)
        $totalLines = max($minLines, $usedLines);
        for ($i = 0; $i < $totalLines; $i++) {
            $lineY = $startY + ($i * $lineHeight) + ($lineHeight - 1);
            $pdf->SetLineWidth(0.3);
            $pdf->Line($rightCol['x'] + 4, $lineY, $rightCol['x'] + 6 + $diagWidth, $lineY);
        }

        // Move cursor below the block
        $diagEndY = $startY + ($totalLines * $lineHeight);
        $pdf->SetY($diagEndY + 2);

        // --------------------------
        // ACTION TAKEN
        // --------------------------
        $pdf->SetX($rightCol['x'] + 2);
        $pdf->SetFont($arialNB, '', 10);
        $pdf->Cell(0, 6, '*Action Taken:', 0, 1, 'L');

        // Combine action_taken and remarks for display
        $actText = $jobOrder->actionReport->action_taken ?? '';
        $remarks = $jobOrder->actionReport->remarks ?? '';
        if ($remarks) {
            $actText .= ' - ' . $remarks;
        }
        $actWidth = $rightCol['width'] - 8;
        $lineHeight = 4;
        $minLines = 4; // minimum lines to show

        $startY = $pdf->GetY();
        $pdf->SetXY($rightCol['x'] + 4, $startY - 1);
        $pdf->SetFont($arialN, '', 9);
        $pdf->MultiCell($actWidth, $lineHeight, $actText, 0, 'L');

        $usedLines = ceil($pdf->getNumLines($actText, $actWidth));
        $usedLines = max(1, $usedLines);

        // Draw underlines for all lines (use the greater of minLines or usedLines)
        $totalLines = max($minLines, $usedLines);
        for ($i = 0; $i < $totalLines; $i++) {
            $lineY = $startY + ($i * $lineHeight) + ($lineHeight - 1);
            $pdf->SetLineWidth(0.3);
            $pdf->Line($rightCol['x'] + 4, $lineY, $rightCol['x'] + 6 + $actWidth, $lineY);
        }

        // Move cursor below the block
        $actEndY = $startY + ($totalLines * $lineHeight);
        $pdf->SetY($actEndY + 2);
        // --------------------------
        // FINAL FIELDS (STATUS / SERVICED BY / DATES / CONFORME)
        // --------------------------
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
                        $value = (!empty($jobOrder->actionReport) && $jobOrder->actionReport->conformed)
                            ? ($jobOrder->requester->name ?? ($jobOrder->conformer->name ?? $jobOrder->conformed_by ?? ''))
                            : '';
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

        // --------------------------
        // NOTE TO REQUESTER
        // --------------------------
        $pdf->Ln(1);
        $noteTitle = 'Note to Requester:';
        $noteBody = "Upon return of your computer unit or laptop, please check the existence of your computer files. The ITS Office does not store back-up copies thus the technicians are not liable for the loss/damage of files after endorsement.";

        $pdf->SetFont($arialN, '', 8);
        $pdf->SetX($labelX);
        $pdf->Cell($fullLineWidth, 6, $noteTitle, 0, 1, 'L');

        $pdf->Ln(1);
        $pdf->SetFont($arialN, '', 8);
        $pdf->SetX($labelX);
        $pdf->MultiCell($fullLineWidth, 5, $noteBody, 0, 'L', false);

        // PAGE 2 content (Client Satisfaction Measurement)
        CSMPageBuilder::build($pdf, $jobOrder);

        return $pdf->Output('Job_Order_Report.pdf', 'I');
        /**
         * Print a text block with at least $minLines lines.
         */
        function printTextBlock($pdf, $x, $y, $width, $text, $lineHeight = 6, $arialFont, $minLines = 4) {
            $pdf->SetXY($x, $y);
            if (!empty($text)) {
                $pdf->SetFont($arialFont, 'U', 9);
                $pdf->MultiCell($width, $lineHeight, $text, 0, 'L');
                $usedHeight = $pdf->GetY() - $y;
                $usedLines = ceil($usedHeight / $lineHeight);
            } else {
                $usedLines = 0;
            }
            
            // Add empty lines if less than $minLines
            $remainingLines = max(0, $minLines - $usedLines);
            for ($i = 0; $i < $remainingLines; $i++) {
                $lineY = $pdf->GetY() + ($i * $lineHeight);
                $pdf->Line($x, $lineY, $x + $width, $lineY);
            }

            // Move the cursor to the end of the block
            $pdf->SetY($y + max($minLines, $usedLines) * $lineHeight);
        }
    }
}