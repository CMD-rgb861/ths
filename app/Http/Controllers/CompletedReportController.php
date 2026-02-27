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

        // Date & Department
        $pdf->SetXY($coords['date_dept']['x'], $coords['date_dept']['y']);
        $pdf->SetFont($arialNB, '', 10);
        $pdf->Cell($coords['date_dept']['w'], 6, 'Date: ____________________________________', 0, 1, 'L');
        $pdf->SetX($coords['date_dept']['x']);
        $pdf->Cell($coords['date_dept']['w'], 6, 'Department: ______________________________', 0, 1, 'L');

        // overlay date and department values while keeping the underscores
        if (!empty($jobOrder)) {
            // overlay date (left-aligned inside the same cell area)
            $dateText = $jobOrder->date ? Carbon::parse($jobOrder->date)->format('m/d/Y') : '';
            if ($dateText) {
                $pdf->SetXY($coords['date_dept']['x'] + 10, $coords['date_dept']['y']); // Shift left by 10 units
                $pdf->Cell($coords['date_dept']['w'], 6, $dateText, 0, 1, 'L'); // Align text to the left
            }

            // overlay department
            $dept = $jobOrder->department->name ?? '';
            if ($dept) {
                $pdf->SetX($coords['date_dept']['x'] + 20); // Shift left by 10 units
                // department is placed on the next line
                $pdf->Cell($coords['date_dept']['w'], 6, $dept, 0, 1, 'L'); // Align text to the left
            }
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
        $pdf->SetXY($coords['request']['x'], $coords['request']['y'] - 13);
        $pdf->SetFont($arialNB, '', 10);
        // Keep the underline fields intact, then overlay the actual request description
        $pdf->MultiCell(
            $coords['request']['w'],
            6,
            "Request:\n___________________________________________________\n___________________________________________________\n___________________________________________________",
            0
        );

        if (!empty($jobOrder->request_description)) {
            // overlay request description on top of the underscores area
            $pdf->SetXY($coords['request']['x'] + 2, $coords['request']['y'] - 9);
            $pdf->SetFont($arialN, '', 10);
            // wrap within same width
            $pdf->MultiCell($coords['request']['w'] - 4, 6, $jobOrder->request_description, 0);
        }

        $pdf->Ln(5);

        /* =========================
           REQUESTER BLOCK
        ========================== */

        $pdf->SetXY($coords['requester']['x'], $coords['requester']['y'] - 13);
        $totalWidth = $coords['requester']['w'];
        $labelWidth = $pdf->GetStringWidth('Requested by:') + 2;
        $lineWidth  = $totalWidth - $labelWidth;

        $pdf->SetFont($arialNB, '', 10); // bold label
        $pdf->Cell($labelWidth, 6, 'Requested by:', 0, 0, 'L');
        $pdf->SetFont($arialNB, '', 10);
        $pdf->Cell($lineWidth, 6, '_____________________________', 0, 1, 'L');

        // Overlay requester name while keeping underline
        if (!empty($jobOrder->requester->name ?? null)) {
            $pdf->SetXY($coords['requester']['x'] + $labelWidth + 10, $coords['requester']['y'] - 13);
            $pdf->SetFont($arialN, '', 10);
            $pdf->Cell($lineWidth, 6, $jobOrder->requester->name, 0, 1, 'L');
        }

        $pdf->Ln(6);
        $pdf->SetFont($arialNB, '', 10);
        $pdf->Cell($labelWidth, 6, 'Contact No.:', 0, 0, 'L');
        $pdf->Cell($lineWidth, 6, '_____________________________', 0, 1, 'L');

        // Overlay contact number
        if (!empty($jobOrder->contact_no ?? null)) {
            $pdf->SetXY($coords['requester']['x'] + $labelWidth, $coords['requester']['y'] - 2);
            $pdf->SetFont($arialN, '', 10);
            $pdf->Cell($lineWidth, 6, $jobOrder->contact_no, 0, 1, 'L');
        }

        $pdf->Ln(3);
        $pdf->SetFont($arialNB, '', 10);
        $pdf->Cell($labelWidth, 6, 'Approved by:', 0, 0, 'L');
        $pdf->Cell($lineWidth, 6, '_____________________________', 0, 1, 'L');

        // Overlay approved by name
        if (!empty($jobOrder->approver->name ?? null)) {
            $pdf->SetXY($coords['requester']['x'] + $labelWidth, $coords['requester']['y'] + 6);
            $pdf->SetFont($arialN, '', 10);
            $pdf->Cell($lineWidth, 6, $jobOrder->approver->name, 0, 1, 'L');
        }

        // Signature labels
        $pdf->SetFont($arialN, '', 10);
        $pdf->SetXY($coords['requester']['x'] + $labelWidth - 8, $coords['requester']['y'] - 8);
        $pdf->Cell($lineWidth, 5, 'Signature Over Printed Name', 0, 0, 'C');

        $pdf->SetXY($coords['requester']['x'] + $labelWidth - 8, $coords['requester']['y'] + 14);
        $pdf->Cell($lineWidth, 5, 'ITS Director', 0, 1, 'C');

        // Small document code below the ITS Director label at the bottom of left column
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
        $pdf->MultiCell($rightCol['width'], 6,
            "*Diagnosis:\n______________________________________________\n______________________________________________\n______________________________________________\n______________________________________________", 0);

        // overlay diagnosis text (if available) while keeping underscores
        if (!empty($jobOrder->actionReport->diagnosis ?? null)) {
            $pdf->SetXY($rightCol['x'] + 4, $diagStartY + 5);
            $pdf->SetFont($arialN, '', 9);
            $pdf->MultiCell($rightCol['width'] - 6, 5, $jobOrder->actionReport->diagnosis, 0);
        }

        $pdf->SetFont($arialNB, '', 10);
        $pdf->Ln(17);

        $pdf->SetX($rightCol['x'] + 2);
        $actionStartY = $pdf->GetY();
        $pdf->MultiCell($rightCol['width'], 6,
            "*Action Taken:\n______________________________________________\n______________________________________________\n______________________________________________\n______________________________________________", 0);

        // overlay action taken text while keeping underscores
        if (!empty($jobOrder->actionReport->action_taken ?? null)) {
            $pdf->SetXY($rightCol['x'] + 4, $actionStartY + 5);
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
