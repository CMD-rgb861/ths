<?php

namespace App\PDF;

use TCPDF;
use App\Models\JobOrder;

class CSMPageBuilder
{
    public static function build(TCPDF $pdf, JobOrder $jobOrder)
    {
        // Add a new page for CSM
        $pdf->AddPage();

        // Layout controller (keeping it consistent with the controller)
        $layout = [
            'x' => 9,
            'y' => 20,
            'logo_y' => 13,
            'header_y' => 12,
            'title_offset' => 7.5,
            'line_height' => 6,
            'hpad' => 4,
        ];
        
        $leftX = $layout['x'];
        $startY = $layout['y'];

        // -------------------------------
        // Header (Republic of the Philippines, LNU)
        // -------------------------------
        $logoPath = public_path('images/lnu_logo.jpg');
        if (file_exists($logoPath)) {
            $pdf->Image($logoPath, $leftX + 45, $layout['logo_y'], 13, 0, '', '', 'T', false, 300, '', false, false, 0, false, false, false);
        }

        // Header text (same as in your controller)
        $pdf->SetFont('helvetica', '', 9);
        $pdf->SetXY($leftX, $layout['header_y']);
        $pdf->Cell(0, 5, 'Republic of the Philippines', 0, 1, 'C');
        $pdf->Cell(0, 5, 'Leyte Normal University', 0, 1, 'C');
        $pdf->Cell(0, 5, 'CLIENT SATISFACTION MEASUREMENT (CSM)', 0, 1, 'C');
        $pdf->Ln(5);

        // -------------------------------
        // Subtitle
        // -------------------------------
        $pdf->SetFont('helvetica', 'I', 12);
        $pdf->Cell(0, 10, 'HELP US SERVE YOU BETTER!', 0, 1, 'C');
        $pdf->Ln(10);

        // -------------------------------
        // Description
        // -------------------------------
        $pdf->SetFont('helvetica', '', 9);
        $pdf->MultiCell(0, 6, "This Client Satisfaction Measurement (CSM) tracks the customer experiences of government offices. Your feedback will help this office provide a better service. Personal information shared will be kept confidential and you always have the option to not answer this form.", 0, 'L');
        $pdf->Ln(5);

        // -------------------------------
        // Client Type (Checkboxes)
        // -------------------------------
        $pdf->SetFont('helvetica', '', 10);
        $pdf->Cell(50, 6, 'Client Type:', 0, 0);
        $checkboxBaseX = $leftX + 50;
        $checkboxBaseY = $startY + 60;
        $boxWidth = 4;
        $boxHeight = 4;
        $gap = 10; // Adjusted gap to align checkboxes and labels

        // Draw checkboxes for Client Type (aligned in a row beside the label)
        for ($i = 1; $i <= 3; $i++) {
            $currentX = $checkboxBaseX + ($i - 1) * ($boxWidth + $gap); // Adjust X for each checkbox
            $pdf->Rect($currentX, $checkboxBaseY, $boxWidth, $boxHeight); // Draw checkbox

            // If option is checked (assuming we have this data in jobOrder)
            if ($jobOrder->client_type == "Option {$i}") {
                $pdf->SetXY($currentX, $checkboxBaseY);
                $pdf->Cell($boxWidth, $boxHeight, '✔', 0, 0, 'C'); // Draw checkmark
            }

            // Option label next to checkbox
            $pdf->SetXY($currentX + $boxWidth + $gap, $checkboxBaseY - 1);
            $pdf->SetFont('helvetica', '', 9);
            $pdf->Cell(40, 6, "Option {$i}", 0, 1, 'L');
        }


        // -------------------------------
        // Client Category (Checkboxes with Others)
        // -------------------------------
        $pdf->Cell(50, 6, 'Client Category:', 0, 0);
        $checkboxBaseY += 20; // Adjust Y for Client Category section
        $leftCats = ['Option A', 'Option B', 'Option C'];
        $rightCats = ['Others:'];

        // Draw checkboxes for Client Category (aligned in a row)
        for ($i = 0; $i < count($leftCats); $i++) {
            $currentX = $checkboxBaseX + ($i * ($boxWidth + $gap)); // Adjust X for each checkbox
            $pdf->Rect($currentX, $checkboxBaseY, $boxWidth, $boxHeight); // Left column checkbox

            // Check if $jobOrder->client_category is not null and then perform the in_array check
            if (!empty($jobOrder->client_category) && in_array($leftCats[$i], $jobOrder->client_category)) {
                $pdf->SetXY($currentX, $checkboxBaseY);
                $pdf->Cell($boxWidth, $boxHeight, '✔', 0, 0, 'C'); // Draw checkmark
            }

            // Option label next to checkbox
            $pdf->SetXY($currentX + $boxWidth + $gap, $checkboxBaseY - 1);
            $pdf->SetFont('helvetica', '', 9);
            $pdf->Cell(40, 6, $leftCats[$i], 0, 1, 'L');
        }

        // Right column "Others" checkbox (aligned in a row with others)
        $currentX = $checkboxBaseX + (count($leftCats) * ($boxWidth + $gap));
        $pdf->Rect($currentX, $checkboxBaseY, $boxWidth, $boxHeight); // Right column checkbox

        // Check if "Others" is selected in client_category
        if (!empty($jobOrder->client_category) && in_array('Others', $jobOrder->client_category)) {
            $pdf->SetXY($currentX, $checkboxBaseY);
            $pdf->Cell($boxWidth, $boxHeight, '✔', 0, 0, 'C');
        }

        $pdf->SetXY($currentX + $boxWidth + $gap, $checkboxBaseY - 1);
        $pdf->SetFont('helvetica', '', 9);
        $pdf->Cell(40, 6, 'Others:', 0, 1, 'L');
        $pdf->Cell(0, 6, 'Other: ____________', 0, 1); // "Other" description field

        // -------------------------------
        // Name and Sex (Underlined fields)
        // -------------------------------
        $pdf->Cell(50, 6, 'Name (Optional):', 0, 0);
        $pdf->Cell(0, 6, '____________________', 0, 1);
        
        $pdf->Cell(50, 6, 'Sex:', 0, 0);
        $pdf->Rect($checkboxBaseX + 50, $checkboxBaseY + 40, $boxWidth, $boxHeight); // Male checkbox
        $pdf->Rect($checkboxBaseX + 60, $checkboxBaseY + 40, $boxWidth, $boxHeight); // Female checkbox
        
        // Draw checkmarks if Male/Female is selected
        if ($jobOrder->sex == 'Male') {
            $pdf->SetXY($checkboxBaseX + 50, $checkboxBaseY + 40);
            $pdf->Cell($boxWidth, $boxHeight, '✔', 0, 0, 'C');
        } elseif ($jobOrder->sex == 'Female') {
            $pdf->SetXY($checkboxBaseX + 60, $checkboxBaseY + 40);
            $pdf->Cell($boxWidth, $boxHeight, '✔', 0, 0, 'C');
        }

        // Label for Male/Female
        $pdf->SetXY($checkboxBaseX + 50 + $boxWidth + $gap, $checkboxBaseY + 40);
        $pdf->SetFont('helvetica', '', 9);
        $pdf->Cell(20, 6, 'Male', 0, 1, 'L');
        $pdf->SetXY($checkboxBaseX + 60 + $boxWidth + $gap, $checkboxBaseY + 40);
        $pdf->Cell(20, 6, 'Female', 0, 1, 'L');
        
        $pdf->Cell(50, 6, 'Age:', 0, 0);
        $pdf->Cell(0, 6, '____', 0, 1);
        $pdf->Ln(4);

        // -------------------------------
        // Date and Region of Residence (Underlines)
        // -------------------------------
        $pdf->Cell(50, 6, 'Date and Time Visited:', 0, 0);
        $pdf->Cell(0, 6, '____________________', 0, 1);
        
        $pdf->Cell(50, 6, 'Region of Residence:', 0, 0);
        $pdf->Cell(0, 6, '____________________', 0, 1);
        $pdf->Ln(4);

        // -------------------------------
        // Service Availed and Service Provider (Underlines)
        // -------------------------------
        $pdf->Cell(50, 6, 'Service/s Availed:', 0, 0);
        $pdf->Cell(0, 6, '____________________', 0, 1);
        
        $pdf->Cell(50, 6, 'Name of Service Provider (Optional):', 0, 0);
        $pdf->Cell(0, 6, '____________________', 0, 1);
        $pdf->Ln(4);

        // -------------------------------
        // Evaluation Question (Checkboxes)
        // -------------------------------
        $pdf->SetFont('helvetica', '', 10);
        $pdf->Cell(50, 6, 'Which of the following are you going to evaluate?', 0, 0);

        // Checkboxes for options
        $checkboxBaseX = $leftX + 50;
        $checkboxBaseY = $startY + 100; // Adjust the starting Y position for these checkboxes
        $boxWidth = 4;
        $boxHeight = 4;
        $gap = 5;

        $options = ['Option 1', 'Option 2', 'Option 3', 'Option 4'];

        // Draw checkboxes for each option
        for ($i = 0; $i < count($options); $i++) {
            $currentX = $checkboxBaseX + ($i * ($boxWidth + $gap)); // Adjust X for each checkbox
            $pdf->Rect($currentX, $checkboxBaseY, $boxWidth, $boxHeight); // Draw checkbox

            // If option is checked (assuming we have this data in jobOrder)
            $optionField = "evaluate_option_{$i}"; // Assuming jobOrder has data for this field (you can adjust field names as needed)
            if (!empty($jobOrder->$optionField) && $jobOrder->$optionField == 'Yes') {
                $pdf->SetXY($currentX, $checkboxBaseY);
                $pdf->Cell($boxWidth, $boxHeight, '✔', 0, 0, 'C'); // Draw checkmark
            }

            // Option label next to checkbox
            $pdf->SetXY($currentX + $boxWidth + $gap, $checkboxBaseY - 1);
            $pdf->SetFont('helvetica', '', 9);
            $pdf->Cell(40, 6, $options[$i], 0, 1, 'L');
        }

        $pdf->Ln(4);

        // -------------------------------
        // Office/Faculty Unit and Student's Program (Underlines)
        // -------------------------------
        $pdf->Cell(50, 6, 'Office/Faculty Unit Transacted With:', 0, 0);
        $pdf->Cell(0, 6, '____________________', 0, 1);
        
        $pdf->Cell(50, 6, 'Student\'s Program (for Student Ratee):', 0, 0);
        $pdf->Cell(0, 6, '____________________', 0, 1);
    }
}