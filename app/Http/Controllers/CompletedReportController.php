<?php

namespace App\Http\Controllers;

use TCPDF;
use TCPDF_FONTS;
use Carbon\Carbon;
use App\Models\JobOrder;

class CompletedReportController extends Controller
{
    public function generate()
    {
    // Fetch the most recent completed job order and eager load relations
    $jobOrder = JobOrder::where('status', 'completed')
        ->with(['department', 'categories', 'requester', 'approver', 'conformer', 'actionReport.servicedBy', 'actionReport'])
        ->latest('id')
        ->first();

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
        $pdf->SetFont($arialN, '', 10);

        // Page dimensions
        $pageWidth = $pdf->getPageWidth();
        $pageHeight = $pdf->getPageHeight();

        // Set left and right column widths
        $leftWidth = ($pageWidth / 2) - 15;
        $rightWidth = ($pageWidth / 2) - 15;

        // Overall layout controller
        $layout = [
            'x' => 10,
            'y' => 23,
            'logo_y' => 13,
            'header_y' => 14,
            'title_offset' => 10,
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
            'jo' => ['x' => $leftX, 'y' => $startY + 23, 'w' => $leftWidth - 6],
            'date_dept' => ['x' => $leftX, 'y' => $startY + 33, 'w' => $leftWidth - 6],
            'category' => ['x' => $leftX, 'y' => $startY + 43, 'w' => $leftWidth - 6],
            'request' => ['x' => $leftX, 'y' => $startY + 87, 'w' => $leftWidth],
            'requester' => ['x' => $leftX, 'y' => $startY + 107, 'w' => $leftWidth],
        ];

        /* =========================
           LEFT COLUMN
        ========================== */

        $logoPath = public_path('images/lnu_logo.jpg');
        if (file_exists($logoPath)) {
            $pdf->Image($logoPath, $leftX + 1, $layout['logo_y'], 15, 0, '', '', 'T', false, 300, '', false, false, 0, false, false, false);
        }

        // Header text
        $pdf->SetFont($arialN, '', 10);
        $pdf->SetXY($leftX, $layout['header_y']);
        $pdf->Cell($leftWidth, 5, 'LEYTE NORMAL UNIVERSITY', 0, 1, 'C');
        $pdf->SetFont($arialNB, '', 10);
        $pdf->Cell($leftWidth, 5, 'Information Technology Support Office', 0, 1, 'C');
        $pdf->SetFont($arialN, '', 10);
        $pdf->Cell($leftWidth, 5, 'Tacloban City', 0, 1, 'C');

        $pdf->SetFont($arialNB, '', 10);
        $pdf->SetXY($leftX, $startY + $layout['title_offset']);
        $pdf->Cell($leftWidth, 10, 'JOB ORDER FOR TECHNICAL REQUEST', 0, 1, 'C');

        $pdf->SetFont($arialN, '', 10);

        // J.O.
        $pdf->SetFont($arialNB, '', 10);
        $pdf->SetXY($coords['jo']['x'], $coords['jo']['y']);
        // keep the underline in place, then overlay the actual J.O. No. if available
        $pdf->Cell($coords['jo']['w'], 6, 'J.O. No. ___________', 0, 1, 'R');
        if (!empty($jobOrder->job_order_no ?? null)) {
            // overlay job order number on top of the underline (right aligned)
            $pdf->SetXY($coords['jo']['x'], $coords['jo']['y']);
            $pdf->Cell($coords['jo']['w'], 6, $jobOrder->job_order_no, 0, 1, 'R');
        }

        // Date & Department - use labelled underlines similar to the ACTION REPORT fields
        $leftColLabelX = $coords['date_dept']['x'];
        $leftColFullWidth = $coords['date_dept']['w'];
        $leftFixedUnderlineWidth = 70;
        $leftFieldsWithExtra = ['Date:', 'Department:'];
        $leftExtra = 0; // no extra by default; can increase if needed

        $leftFields = [
            'Date:',
            'Department:',
        ];

        // -------------------------
        // Date & Department underlines
        // - Variables below (X/Y/width) control placement and can be adjusted
        // - $dateLabelX / $deptLabelX: where the label starts
        // - $dateLineStartX / $deptLineStartX: where the underline starts
        // - $dateLineY / $deptLineY: vertical positions of the lines
        // -------------------------
        $dateLabelX = $leftColLabelX;
        $deptLabelX = $leftColLabelX;
        $dateLabelY = $coords['date_dept']['y'];
        $deptLabelY = $coords['date_dept']['y'] + 7;

        // desired underline lengths and right boundary
        $dateDesiredWidth = $leftFixedUnderlineWidth; // adjustable
        $deptDesiredWidth = $leftFixedUnderlineWidth; // adjustable
        $colInnerRightX = $leftColLabelX + $leftColFullWidth;

        // --- Date line ---
        $pdf->SetFont($arialNB, '', 10);
        $dateLabelW = $pdf->GetStringWidth('Date:');
        $pdf->SetXY($dateLabelX, $dateLabelY);
        $pdf->Cell($dateLabelW + 2, 6, 'Date:', 0, 0, 'L');

        $dateMinStartX = $dateLabelX + $dateLabelW + 4;
        $dateRightAlignedStart = $colInnerRightX - $dateDesiredWidth;
        if ($dateRightAlignedStart >= $dateMinStartX) {
            $dateLineStartX = $dateRightAlignedStart;
            $dateLineW = $dateDesiredWidth;
        } else {
            $dateLineStartX = $dateMinStartX;
            $dateLineW = max(0, $colInnerRightX - $dateMinStartX);
        }
        $dateLineY = $dateLabelY + 4; // adjustable vertical offset
        $pdf->SetLineWidth(0.3);
        if ($dateLineW > 0) {
            $pdf->Line($dateLineStartX, $dateLineY, $dateLineStartX + $dateLineW, $dateLineY);
        }

        // overlay date value
        if (!empty($jobOrder->date)) {
            $pdf->SetFont($arialN, '', 9);
            $pdf->SetXY($dateLineStartX, $dateLabelY - 0.5);
            $pdf->Cell($dateLineW, 6, Carbon::parse($jobOrder->date)->format('m/d/Y'), 0, 0, 'L');
        }

        // --- Department line ---
        $pdf->SetFont($arialNB, '', 10);
        $deptLabelW = $pdf->GetStringWidth('Department:');
        $pdf->SetXY($deptLabelX, $deptLabelY);
        $pdf->Cell($deptLabelW + 2, 6, 'Department:', 0, 0, 'L');

        $deptMinStartX = $deptLabelX + $deptLabelW + 4;
        $deptRightAlignedStart = $colInnerRightX - $deptDesiredWidth;
        if ($deptRightAlignedStart >= $deptMinStartX) {
            $deptLineStartX = $deptRightAlignedStart;
            $deptLineW = $deptDesiredWidth;
        } else {
            $deptLineStartX = $deptMinStartX;
            $deptLineW = max(0, $colInnerRightX - $deptMinStartX);
        }
        $deptLineY = $deptLabelY + 4; // adjustable vertical offset
        if ($deptLineW > 0) {
            $pdf->Line($deptLineStartX, $deptLineY, $deptLineStartX + $deptLineW, $deptLineY);
        }

        // overlay department value
        if (!empty($jobOrder->department->name ?? null)) {
            $pdf->SetFont($arialN, '', 9);
            $pdf->SetXY($deptLineStartX, $deptLabelY - 0.5);
            $pdf->Cell($deptLineW, 6, $jobOrder->department->name, 0, 0, 'L');
        }

        // Category
        $pdf->SetXY($coords['category']['x'], $coords['category']['y'] + 1);
        $pdf->SetFont($arialNB, '', 10);
        $pdf->Cell($coords['category']['w'], 6, 'Category:', 0, 1, 'L');

        // --------------------------
        // UNIFIED CONTROLLER FOR ALL CHECKBOXES
        // --------------------------
        $checkboxBaseX = $coords['category']['x'] + 7;
        $checkboxBaseY = $coords['category']['y'] + 8;
        $colWidth = ($coords['category']['w'] / 2) - 4;
        $rightX = $checkboxBaseX + ($coords['category']['w'] / 2);
        $boxWidth = 5;   // wider
        $boxHeight = 3;  // flatter
        $gap = 2;

        $leftCats = [
            'Computer Hardware',
            'Information System',
            'Internet Connection',
            'Laptop',
            'IP/VOIP Phone',
        ];

        $rightCats = [
            'Local Area Network',
            'Printer',
            'Software',
            'Others: _________',
        ];

        $max = max(count($leftCats), count($rightCats));
        for ($i = 0; $i < $max; $i++) {
            $currentY = $checkboxBaseY + ($i * 4.5); // smaller vertical step for minimal gap

            // Left
            if (isset($leftCats[$i])) {
                $pdf->Rect($checkboxBaseX, $currentY, $boxWidth, $boxHeight); // flatter rectangle
                $pdf->SetXY($checkboxBaseX + $boxWidth + $gap, $currentY - 1);
                $pdf->SetFont($arialN, '', 10);
                $pdf->Cell($colWidth - $boxWidth - $gap, 6, $leftCats[$i], 0, 0, 'L');
            }

            // Right
            if (isset($rightCats[$i])) {
                $pdf->Rect($rightX, $currentY, $boxWidth, $boxHeight); // flatter rectangle
                $pdf->SetXY($rightX + $boxWidth + $gap, $currentY - 1);
                $pdf->SetFont($arialN, '', 10);
                $pdf->Cell($colWidth - $boxWidth - $gap, 6, $rightCats[$i], 0, 1, 'L');
            }
        }

                $pdf->SetFont('dejavusans', '', 10);
                // Mark checked categories (overlay a '✔' in matching boxes)
                if (!empty($jobOrder) && $jobOrder->categories) {
                    $catNames = $jobOrder->categories->pluck('name')->map(function ($n) {
                        return trim((string) $n);
                    })->all();

                    for ($i = 0; $i < $max; $i++) {
                        $currentY = $checkboxBaseY + ($i * 4.5);

                        // Left side
                        if (isset($leftCats[$i]) && in_array($leftCats[$i], $catNames)) {
                            // Set the font to DejaVu Sans to ensure the checkmark symbol renders properly
                            $pdf->SetXY($checkboxBaseX, $currentY - 0.5);
                            $pdf->Cell($boxWidth, $boxHeight, '✔', 0, 0, 'C'); // Use checkmark symbol
                        }

                        // Right side
                        if (isset($rightCats[$i]) && in_array($rightCats[$i], $catNames)) {
                            $pdf->SetXY($rightX, $currentY - 0.5);
                            $pdf->Cell($boxWidth, $boxHeight, '✔', 0, 0, 'C'); // Use checkmark symbol
                        }

                // Handle 'Others: _________' special case: overlay the other description if present
                if (isset($rightCats[$i]) && strpos($rightCats[$i], 'Others') !== false) {
                    // find pivot other_description
                    $otherDesc = '';
                    foreach ($jobOrder->categories as $c) {
                        if (stripos($c->name, 'other') !== false && !empty($c->pivot->other_description)) {
                            $otherDesc = $c->pivot->other_description;
                            break;
                        }
                    }
                    if ($otherDesc) {
                        // overlay the other description a bit to the right of the label
                        $pdf->SetFont($arialN, '', 9);
                        $pdf->SetXY($rightX + $boxWidth + $gap + 2, $currentY - 1);
                        $pdf->Cell($colWidth - ($boxWidth + $gap), 6, $otherDesc, 0, 0, 'L');
                    }
                }
            }
        }

        // --------------------------
        // REQUEST BLOCK
        // --------------------------
        // REQUEST BLOCK - label + multiple underlines (so it visually matches the other fields)
        $reqX = $coords['request']['x'];
        $reqW = $coords['request']['w'];

        // define a single Y offset (adjust to move the whole block)
        $yOffset = 1; // increase to move block lower, decrease to move up

        $pdf->SetFont($arialNB, '', 10);
        $pdf->SetXY($reqX, $coords['request']['y'] - 15 + $yOffset);
        $pdf->Cell(0, 6, 'Request:', 0, 1, 'L');

        // -------------------------
        // Request description underlines
        // - Adjustable variables:
        //   $requestLabelX / $requestLabelY: label position
        //   $requestUnderlineStartX / $requestUnderlineEndX: horizontal extents
        //   $requestLineY1..3: individual Y positions for each underline
        // -------------------------
        $requestLabelX = $reqX;
        $requestLabelY = $coords['request']['y'] - 14 + $yOffset;
        $requestUnderlineStartX = $reqX + 2; // left padding
        $requestUnderlineEndX = $reqX + $reqW - 2; // right padding

        $yOffset = 3.5; // increase to move block downward

        $requestLineY1 = $coords['request']['y'] - 7 + $yOffset;
        $requestLineY2 = $coords['request']['y'] - 1 + $yOffset;
        $requestLineY3 = $coords['request']['y'] + 5 + $yOffset;

        $pdf->SetXY($reqX + 2, $requestLineY1 - 4.5 + $yOffset); // moves the MultiCell text down

        $pdf->SetLineWidth(0.3);
        $pdf->Line($requestUnderlineStartX, $requestLineY1, $requestUnderlineEndX, $requestLineY1);
        $pdf->Line($requestUnderlineStartX, $requestLineY2, $requestUnderlineEndX, $requestLineY2);
        $pdf->Line($requestUnderlineStartX, $requestLineY3, $requestUnderlineEndX, $requestLineY3);

        // overlay request description
        if (!empty($jobOrder->request_description)) {
            $pdf->SetXY($reqX + 2, $requestLineY1 - 4.5);
            $pdf->SetFont($arialN, '', 10);
            $pdf->MultiCell($reqW - 4, 6, $jobOrder->request_description, 0);
        }

        $pdf->Ln(5);

       /* =========================
            REQUESTER BLOCK
            ========================== */

            // REQUESTER BLOCK - Requested by / Contact No. / Approved by as labelled underlines
            $reqrX = $coords['requester']['x'];
            $reqrW = $coords['requester']['w'];
            $labelList = ['Requested by:', 'Contact No.:', 'Approved by:'];
            $lineH = 6;
            $fixedUnderline = 50; // wide underline for names/contact

            // -------------------------
            // Requester block offset
            // - Adjust this variable to move the entire requester block up/down
            //   Positive value moves down, negative moves up
            // -------------------------
            $yOffset = 2;

            // -------------------------
            // Requester block underlines (Requested by / Contact No. / Approved by)
            // - Original Y coordinates with $yOffset applied
            // -------------------------
            $requestedByLabelX = $reqrX;
            $requestedByLabelY = $coords['requester']['y'] - 10 + $yOffset;

            //Overall Contact No. label position (adjust Y as needed)
            $contactLabelX = $reqrX;
            $contactLabelY = $coords['requester']['y'] + $yOffset;

            $approvedLabelX = $reqrX;
            $approvedLabelY = $coords['requester']['y'] + 6 + $yOffset;

            // compute line extents (start X/end X will be computed so that the underline is as wide as possible but does not overlap the label)
            $colInnerRightX_req = $reqrX + $reqrW;

            // -------------------------
            // Requested by
            $pdf->SetFont($arialNB, '', 10);
            $reqLblW = $pdf->GetStringWidth('Requested by:');
            $pdf->SetXY($requestedByLabelX, $requestedByLabelY);
            $pdf->Cell($reqLblW + 2, $lineH, 'Requested by:', 0, 0, 'L');

            $reqMinStartX = $requestedByLabelX + $reqLblW + 4;
            $reqRightAlignedStart = $colInnerRightX_req - $fixedUnderline;
            if ($reqRightAlignedStart >= $reqMinStartX) {
                $requestedByLineStartX = $reqRightAlignedStart;
                $requestedByLineW = $fixedUnderline;
            } else {
                $requestedByLineStartX = $reqMinStartX;
                $requestedByLineW = max(0, $colInnerRightX_req - $reqMinStartX);
            }
            $requestedByLineY = $requestedByLabelY + 4;
            if ($requestedByLineW > 0) {
                $pdf->Line($requestedByLineStartX, $requestedByLineY, $requestedByLineStartX + $requestedByLineW, $requestedByLineY);
            }

            // overlay requested by value
            if (!empty($jobOrder->requester->name ?? null)) {
                $pdf->SetFont($arialN, '', 10);
                $pdf->SetXY($requestedByLineStartX, $requestedByLabelY - 1);
                $pdf->Cell($requestedByLineW, $lineH, $jobOrder->requester->name, 0, 0, 'L');
            }
            
            // -------------------------
            // Contact No.
            $pdf->SetFont($arialNB, '', 10);
            $contactLblW = $pdf->GetStringWidth('Contact No.:');
            $pdf->SetXY($contactLabelX, $contactLabelY);
            $pdf->Cell($contactLblW + 2, $lineH, 'Contact No.:', 0, 0, 'L');

            $contactMinStartX = $contactLabelX + $contactLblW + 4;
            $contactRightAlignedStart = $colInnerRightX_req - $fixedUnderline;
            if ($contactRightAlignedStart >= $contactMinStartX) {
                $contactLineStartX = $contactRightAlignedStart;
                $contactLineW = $fixedUnderline;
            } else {
                $contactLineStartX = $contactMinStartX;
                $contactLineW = max(0, $colInnerRightX_req - $contactMinStartX);
            }
            $contactLineY = $contactLabelY + 4;
            if ($contactLineW > 0) {
                $pdf->Line($contactLineStartX, $contactLineY, $contactLineStartX + $contactLineW, $contactLineY);
            }

            // overlay contact value
            if (!empty($jobOrder->contact_no ?? null)) {
                $pdf->SetFont($arialN, '', 10);
                $pdf->SetXY($contactLineStartX, $contactLabelY - 1);
                $pdf->Cell($contactLineW, $lineH, $jobOrder->contact_no, 0, 0, 'L');
            }

            // -------------------------
            // Approved by
            $pdf->SetFont($arialNB, '', 10);
            $approvedLblW = $pdf->GetStringWidth('Approved by:');
            $pdf->SetXY($approvedLabelX, $approvedLabelY);
            $pdf->Cell($approvedLblW + 2, $lineH, 'Approved by:', 0, 0, 'L');

            $approvedMinStartX = $approvedLabelX + $approvedLblW + 4;
            $approvedRightAlignedStart = $colInnerRightX_req - $fixedUnderline;
            if ($approvedRightAlignedStart >= $approvedMinStartX) {
                $approvedLineStartX = $approvedRightAlignedStart;
                $approvedLineW = $fixedUnderline;
            } else {
                $approvedLineStartX = $approvedMinStartX;
                $approvedLineW = max(0, $colInnerRightX_req - $approvedMinStartX);
            }
            $approvedLineY = $approvedLabelY + 4;
            if ($approvedLineW > 0) {
                $pdf->Line($approvedLineStartX, $approvedLineY, $approvedLineStartX + $approvedLineW, $approvedLineY);
            }

            // overlay approved by value
            if (!empty($jobOrder->approver->name ?? null)) {
                $pdf->SetFont($arialN, '', 10);
                $pdf->SetXY($approvedLineStartX, $approvedLabelY - 1);
                $pdf->Cell($approvedLineW, $lineH, $jobOrder->approver->name, 0, 0, 'L');
            }

        // Signature labels (keep near the same position as before)
        $pdf->SetFont($arialN, '', 10);
        $pdf->SetXY($coords['requester']['x'] + 20, $coords['requester']['y'] - 4  );
        $pdf->Cell($reqrW - 40, 5, 'Signature Over Printed Name', 0, 0, 'C');

        $pdf->SetXY($coords['requester']['x'] + 20, $coords['requester']['y'] + 13);
        $pdf->Cell($reqrW - 40, 5, 'ITS Director', 0, 1, 'C');

    // Small document code below the ITS Director label at the bottom of left column
    // compute $lineWidth to match the requester area (was removed during refactor)
    $pdf->SetFont($arialNB, '', 10);
    $labelW = $pdf->GetStringWidth('Requested by:') + 2;
    $lineWidth = ($reqrW ?? $coords['requester']['w']) - $labelW;

    $pdf->SetFont($arialNB, '', 11);
    $pdf->SetXY($coords['requester']['x'] - 4.5, $coords['requester']['y'] + 18);
    $pdf->Cell($lineWidth, 5, 'F-ITS-001 Rev.01(01-23-2021)', 0, 1, 'L');

        $pdf->SetFont($arialN, '', 10);

        /* =========================
           VERTICAL DIVIDER
        ========================== */
        $pdf->SetLineWidth(0.5);
        $pdf->Line($leftWidth + 10, $startY, $leftWidth + 10, $pageHeight - 10);

        /* =========================
           RIGHT COLUMN
        ========================== */
        $pdf->SetXY($rightCol['x'], $rightCol['y']);

        $pdf->SetFont($arialNB, '', 10);
        $pdf->Cell($rightCol['width'], 6, 'ACTION REPORT', 0, 1, 'C');
        $pdf->SetFont($arialNB, '', 10);
        $pdf->SetXY($rightCol['x'], $rightCol['y'] + 6);
        $pdf->Cell($rightCol['width'], 6, '*(to be filled-out by the ITS Technician)', 0, 1, 'C');

        $pdf->SetFont($arialNB, '', 10);
        $pdf->Ln(6);

        $pdf->SetX($rightCol['x'] + 2);
        $diagStartY = $pdf->GetY();

        // Diagnosis - draw label then a set of horizontal lines to act as underlines
        $pdf->SetFont($arialNB, '', 10);
        $pdf->Cell(0, 6, '*Diagnosis:', 0, 1, 'L');

        // -------------------------
        // Diagnosis underlines
        // - Adjustable variables:
        //   $diagLabelX/Y, $diagLineStartX, $diagLineY1..4
        // -------------------------
        $diagLabelX = $rightCol['x'] + 2;
        $diagLabelY = $diagStartY;
        $diagLineStartX = $rightCol['x'] + 4;
        $diagLineEndX = $rightCol['x'] + $rightCol['width'] - 4;
        $diagLineY1 = $diagStartY + 5;
        $diagLineY2 = $diagStartY + 11;
        $diagLineY3 = $diagStartY + 17;
        $diagLineY4 = $diagStartY + 23;
        $pdf->SetLineWidth(0.3);
        $pdf->Line($diagLineStartX, $diagLineY1, $diagLineEndX, $diagLineY1);
        $pdf->Line($diagLineStartX, $diagLineY2, $diagLineEndX, $diagLineY2);
        $pdf->Line($diagLineStartX, $diagLineY3, $diagLineEndX, $diagLineY3);
        $pdf->Line($diagLineStartX, $diagLineY4, $diagLineEndX, $diagLineY4);

        // overlay diagnosis text (if available)
        if (!empty($jobOrder->actionReport->diagnosis ?? null)) {
            $pdf->SetXY($diagLineStartX, $diagLineY1 - 0.5);
            $pdf->SetFont($arialN, '', 9);
            $pdf->MultiCell($rightCol['width'] - 6, 5, $jobOrder->actionReport->diagnosis, 0);
        }

        $pdf->SetFont($arialNB, '', 10);
        $pdf->Ln(17);

        $pdf->SetX($rightCol['x'] + 2);
        $actionStartY = $pdf->GetY();

        // Action Taken - label + horizontal underlines
        $pdf->SetFont($arialNB, '', 10);
        $pdf->Cell(0, 6, '*Action Taken:', 0, 1, 'L');

        // -------------------------
        // Action Taken underlines
        // - Adjustable variables:
        //   $actionLabelX/Y, $actionLineStartX, $actionLineY1..4
        // -------------------------
        $actionLabelX = $rightCol['x'] + 2;
        $actionLabelY = $actionStartY;
        $actionLineStartX = $rightCol['x'] + 4;
        $actionLineEndX = $rightCol['x'] + $rightCol['width'] - 4;
        $actionLineY1 = $actionStartY + 5;
        $actionLineY2 = $actionStartY + 11;
        $actionLineY3 = $actionStartY + 17;
        $actionLineY4 = $actionStartY + 23;
        $pdf->SetLineWidth(0.3);
        $pdf->Line($actionLineStartX, $actionLineY1, $actionLineEndX, $actionLineY1);
        $pdf->Line($actionLineStartX, $actionLineY2, $actionLineEndX, $actionLineY2);
        $pdf->Line($actionLineStartX, $actionLineY3, $actionLineEndX, $actionLineY3);
        $pdf->Line($actionLineStartX, $actionLineY4, $actionLineEndX, $actionLineY4);

        // overlay action taken text while keeping underlines
        if (!empty($jobOrder->actionReport->action_taken ?? null)) {
            $pdf->SetXY($actionLineStartX, $actionLineY1 - 0.5);
            $pdf->SetFont($arialN, '', 9);
            $pdf->MultiCell($rightCol['width'] - 6, 5, $jobOrder->actionReport->action_taken, 0);
        }

        $pdf->Ln(15);

        $fields = [
            '*Status:',
            '*Serviced by:',
            '*Date Start:',
            '*Date/Time Started:',
            '*Date/Time Finished:',
            '*CONFORME (Requestor):'
        ];

        $labelX = $rightCol['x'] + 2;       // left margin of right column
        $lineHeight = 8;
        $fullLineWidth = $rightCol['width'] - 4; // total usable width for label + line

        // Fixed underline width (in user units, typically mm). Adjust as desired.
        $fixedUnderlineWidth = 60;

        // Compute the rightmost inner X of the column (where underlines should end)
        $colInnerRightX = $labelX + $fullLineWidth;

        // Fields that should get extra underline length to the left
        $fieldsWithLeftExtra = [
            '*Status:',
            '*Serviced by:',
            '*Date Start:',
        ];

        // Extra left-side underline length to add for the above fields (in mm/user units)
        $leftExtra = 30;

        foreach ($fields as $field) {
        // remember current Y so we can draw the line at the proper vertical position
        $currentY = $pdf->GetY();

        // 1) measure label width
        $pdf->SetFont($arialNB, '', 10);
        $labelWidth = $pdf->GetStringWidth($field);

        // 2) print the label
        $pdf->SetXY($labelX, $currentY);
        $pdf->Cell($labelWidth + 2, $lineHeight, $field, 0, 0, 'L');

        // 3) right-align a fixed-length underline so all underlines visually match.
        //    If a label is so long it would overlap the right-aligned underline,
        //    shrink the underline to start after the label instead.
        $minStartX = $labelX + $labelWidth + 3; // ensure gap after label

        // compute desired total underline width (fixed + optional extra on left)
        $totalDesiredWidth = $fixedUnderlineWidth;
        if (in_array($field, $fieldsWithLeftExtra)) {
            $totalDesiredWidth += $leftExtra;
        }

        $rightAlignedStart = $colInnerRightX - $totalDesiredWidth;

        if ($rightAlignedStart >= $minStartX) {
            // enough room to place the full desired-width underline, right-aligned
            $lineStartX = $rightAlignedStart;
            $underlineWidth = $totalDesiredWidth;
        } else {
            // not enough room for the desired width; start after label and shrink to fit
            $lineStartX = $minStartX;
            $underlineWidth = max(0, $colInnerRightX - $minStartX);
        }

        // 4) draw the underline
        $lineY = $currentY + $lineHeight - 2; // position the line near the baseline
        $pdf->SetLineWidth(0.3);
        if ($underlineWidth > 0) {
            $pdf->Line($lineStartX, $lineY, $lineStartX + $underlineWidth, $lineY);
        }

        // Overlay the actual value (if available) on top of the underline
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
                    $value =  $jobOrder->requester->name ?? ($jobOrder->conformed_by ?? '');
                    break;
            }

            if (!empty($value)) {
                // print the value starting at the line start so it appears on top of the underline
                $pdf->SetFont($arialN, '', 9);
                // Slightly raise the text to sit on top of the underline
                $pdf->SetXY($lineStartX, $currentY - 0.5);  // Adjust the Y coordinate to avoid overlap
                $pdf->Cell($underlineWidth, $lineHeight, $value, 0, 0, 'L');
            }
        }

        // 5) advance to next row
        $pdf->SetXY($labelX, $currentY + $lineHeight + 1);
    }

        // Small gap before the final note
        $pdf->Ln(1);

        // NOTE TO REQUESTER block (below the CONFORME line)
        $noteTitle = 'Note to Requester:';
        $noteBody = "Upon return of your computer unit or laptop, please check the existence of your computer files. The ITS Office does not store back-up copies thus the technicians are not liable for the loss/damage of files after endorsement.";

        // Print title in bold
        $pdf->SetFont($arialN, '', 8);
        $pdf->SetX($labelX);
        $pdf->Cell($fullLineWidth, 6, $noteTitle, 0, 1, 'L');

        $pdf->Ln(1);

        // Print body in regular font with slightly smaller size and wrap within the right column
        $pdf->SetFont($arialN, '', 8);
        $pdf->SetX($labelX);
        $pdf->MultiCell($fullLineWidth, 5, $noteBody, 0, 'L', false);

        return $pdf->Output('Job_Order_Report.pdf', 'I');
    }
}
