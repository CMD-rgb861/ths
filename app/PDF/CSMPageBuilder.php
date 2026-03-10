<?php

namespace App\PDF;

use TCPDF;
use TCPDF_FONTS;
use App\Models\JobOrder;

class CSMPageBuilder
{
    public static function build(TCPDF $pdf, JobOrder $jobOrder)
    {
        // --------------------------------------------------------------------------
        // ADD ARIAL FONT
        // --------------------------------------------------------------------------
        $arialFont = public_path('fonts/ARIAL.TTF');
        $arialBoldFont = public_path('fonts/ARIALBD.TTF');
        $arialItalicFont = public_path('fonts/ARIALI.TTF');
        $arialBlackFont = public_path('fonts/ARIBLK.TTF');
                // Table header text (without emojis in text)
        $headerTexts = [
            ' ',
            "Strongly\nDisagree",
            "Disagree",
            "Neither Agree\nnor Disagree",
            "Agree",
            "Strongly\nAgree",
            "N/A\nNot\nApplicable"
        ];

        // Emoji image paths
        $emojiImages = [
            '',
            public_path('images/emojis/Strongly Disagree.png'),
            public_path('images/emojis/Disagree.png'),
            public_path('images/emojis/Neutral.png'),
            public_path('images/emojis/Agree.png'),
            public_path('images/emojis/Strongly Agree.png'),
            ''
        ];// Add Arial fonts to TCPDF and store font names
        $arialRegular = TCPDF_FONTS::addTTFfont($arialFont, 'TrueTypeUnicode', '', 96);
        $arialBold = TCPDF_FONTS::addTTFfont($arialBoldFont, 'TrueTypeUnicode', '', 96);
        $arialItalic = TCPDF_FONTS::addTTFfont($arialItalicFont, 'TrueTypeUnicode', '', 96);
        $arialBlack = TCPDF_FONTS::addTTFfont($arialBlackFont, 'TrueTypeUnicode', '', 96);

        $pdf->AddPage();
        // --------------------------------------------------------------------------
        // START SCALING TRANSFORMATION
        // --------------------------------------------------------------------------
        $pdf->StartTransform();
        $pdf->Scale(100, 100); // 90% size, adjust to 0.8 for smaller, 1 for normal

        

        // --------------------------------------------------------------------------
        // OUTER FORM BORDER (BOX MARGIN)
        // --------------------------------------------------------------------------
        $pageWidth  = $pdf->getPageWidth();
        $pageHeight = $pdf->getPageHeight();

        $left   = 10;
        $top    = 10;
        $right  = 10;
        $bottom = 10;

        $boxWidth  = $pageWidth - ($left + $right);
        $boxHeight = $pageHeight - ($top + $bottom);

        $pdf->SetLineWidth(0.4);
        $pdf->Rect($left, $top, $boxWidth, $boxHeight);
        $pdf->SetLineWidth(0.2);

        // Set margins - shifted to center within border
        $pdf->SetMargins(12, 15, 12);

        // --------------------------------------------------------------------------
        // GLOBAL FONT SIZES
        // --------------------------------------------------------------------------
        $fontHeight = 7;

        // --------------------------------------------------------------------------
        // HEADER
        // --------------------------------------------------------------------------
        $pdf->Ln(4);
        $logoPath = public_path('images/lnu_logo.jpg');
        if (file_exists($logoPath)) {
            $pdf->Image($logoPath, 53, 14, 15);
        }

        $pdf->SetFont($arialRegular, '', 9); 
        $pdf->Cell(0, 5, 'Republic of the Philippines', 0, 1, 'C');
        $pdf->SetFont($arialBold, '', 9);
        $pdf->Cell(0, 5, 'Leyte Normal University', 0, 1, 'C');
        $pdf->Cell(0, 5, 'CLIENT SATISFACTION MEASUREMENT (CSM)', 0, 1, 'C');
        $pdf->Ln(1);

        $pdf->SetFont($arialBold, 'I', 8.8);
        $pdf->Cell(0, 8, 'HELP US SERVE YOU BETTER!', 0, 1, 'C');
        $pdf->Ln(0.5);

        $pdf->SetFont('arial', 'I', 8.5);
        $pdf->MultiCell(
            0,
            6,
            "This Client Satisfaction Measurement (CSM) tracks the customer experiences of government offices. Your feedback on your recently\nconcluded transactionwill help this office provide a better service. Personal information shared will be kept confidential and you always\nhave the option to not answer this form.",
            0,  
            'L'
        );
        $pdf->Ln(1);

        /*
        |--------------------------------------------------------------------------
        | STANDARD SIZES
        |--------------------------------------------------------------------------
        */

        $labelWidth = 50;
        $boxWidth = 4;
        $boxHeight = 4;
        $labelSpacing = 3;
        $optionSpacing = 25;

       /*
        |--------------------------------------------------------------------------
        | SHARED SPACING CONFIG
        |--------------------------------------------------------------------------
        */

        $pdf->SetFont('arial', '', 8.5);

        $labelWidth   = 20;
        $boxWidth     = 2;
        $boxHeight    = 2;

        $labelSpacing = 0.5;  // space between checkbox and label
        $groupGap     = 3;    // space between option groups

        $fontHeight   = 6;    // approximate height of font 7
        $boxOffsetY   = ($fontHeight - $boxHeight) / 2;  // center checkbox vertically


        /*
        |--------------------------------------------------------------------------
        | CLIENT TYPE
        |--------------------------------------------------------------------------
        */

        $pdf->SetFont($arialBold, '', 8.5);
        $pdf->Cell($labelWidth, $fontHeight, 'Client Type:', 0, 0);
        
        $pdf->SetX(31);
        
        $pdf->SetFont($arialRegular, '', 8.5);

        $clientTypes = [
            'Citizen',
            'Business',
            'Government(Employee or another agency)'
        ];

        foreach ($clientTypes as $type) {

            // Draw checkbox vertically centered with text
            $pdf->Rect($pdf->GetX(), $pdf->GetY() + $boxOffsetY, $boxWidth, $boxHeight);

            // Check mark
            $pdf->Cell(
                $boxWidth,
                $fontHeight,
                ($jobOrder->client_type == $type ? '✔' : ''),
                0,
                0,
                'C'
            );

            // Space after checkbox
            $pdf->Cell($labelSpacing, $fontHeight, '', 0, 0);

            // Get exact width of label text
            $textWidth = $pdf->GetStringWidth($type);

            // Print label using exact width
            $pdf->Cell($textWidth, $fontHeight, $type, 0, 0);

            // Automatic gap between groups
            $pdf->Cell($groupGap, $fontHeight, '', 0, 0);
        }

        $pdf->Ln(5);


        /*
        |--------------------------------------------------------------------------
        | CLIENT CATEGORY
        |--------------------------------------------------------------------------
        */

        $pdf->SetFont($arialBold, '', 8.5);
        $pdf->Cell($labelWidth, $fontHeight, 'Client Category:', 0, 0);
        
        $pdf->SetX(37);
        
        $pdf->SetFont($arialRegular, '', 8.5);

        $categories = [
            'Student',
            'Visitor',
            'Faculty',
            'Admin/Personnel',
            'Others:'
        ];

        foreach ($categories as $category) {

            // Draw checkbox vertically centered with text
            $pdf->Rect($pdf->GetX(), $pdf->GetY() + $boxOffsetY, $boxWidth, $boxHeight);

            // Check mark
            $pdf->Cell(
                $boxWidth,
                $fontHeight,
                (!empty($jobOrder->client_category) &&
                is_array($jobOrder->client_category) &&
                in_array($category, $jobOrder->client_category)
                    ? '✔'
                    : ''),
                0,
                0,
                'C'
            );

            // Space after checkbox
            $pdf->Cell($labelSpacing, $fontHeight, '', 0, 0);

            // Get exact label width
            $textWidth = $pdf->GetStringWidth($category);

            // Print label with exact width
            $pdf->Cell($textWidth, $fontHeight, $category, 0, 0);

            if ($category === 'Others:') {
                $pdf->Cell(30, $fontHeight, '________________', 0, 0);
            }

            // Automatic gap between groups
            $pdf->Cell($groupGap, $fontHeight, '', 0, 0);
        }

        $pdf->Ln(5);

        /*
        |--------------------------------------------------------------------------
        | NAME + SEX + AGE INLINE
        |--------------------------------------------------------------------------
        */

        $fontHeight     = 6;
        $boxOffsetY     = ($fontHeight - $boxHeight) / 2;

        // NAME field
        $labelWidth     = 19.5;
        $nameFieldWidth = 43;   // slightly shorter underline
        $pdf->SetFont($arialBold, '', 8.5);
        $pdf->Cell($labelWidth, $fontHeight, 'Name (Optional):', 0, 0);
        $pdf->SetFont($arialRegular, '', 8.5);
        $pdf->SetX($pdf->GetX() + 5); // move underline right
        $pdf->Cell($nameFieldWidth, $fontHeight, '____________________________________________________', 0, 0);

        // Move X to right after name underline for Sex label
        $pdf->SetX($labelWidth + $nameFieldWidth + 65); // 2mm gap
        $sexLabelWidth  = 7;
        $pdf->SetFont($arialBold, '', 8.5);
        $pdf->Cell($sexLabelWidth, $fontHeight, 'Sex:', 0, 0);
        
        $pdf->SetX($pdf->GetX() + 2); // move checkboxes right
        
        $pdf->SetFont($arialRegular, '', 8.5);

        $sexOptions = ['Male', 'Female'];
        foreach ($sexOptions as $sex) {
            $pdf->Rect($pdf->GetX(), $pdf->GetY() + $boxOffsetY, $boxWidth, $boxHeight);
            $pdf->Cell($boxWidth, $fontHeight, ($jobOrder->sex == $sex ? '✔' : ''), 0, 0, 'C');
            $pdf->Cell($labelSpacing, $fontHeight, '', 0, 0);

            $textWidth = $pdf->GetStringWidth($sex);
            $pdf->Cell($textWidth, $fontHeight, $sex, 0, 0);

            $pdf->Cell($groupGap, $fontHeight, '', 0, 0);
        }

        // AGE field (inline, after SEX options)
        $ageLabelWidth  = 7;
        $ageFieldWidth  = 20;
        $pdf->SetFont($arialBold, '', 8.5);
        $pdf->Cell($ageLabelWidth, $fontHeight, 'Age:', 0, 0);
        $pdf->SetFont($arialRegular, '', 8.5);
        $pdf->SetX($pdf->GetX()); // move underline right
        $pdf->Cell($ageFieldWidth, $fontHeight, '__________', 0, 1); // move to next line after age

        /*
        |--------------------------------------------------------------------------
        | DATE & REGION INLINE
        |--------------------------------------------------------------------------
        */

        $fontHeight       = -1;   // same height for all labels and underlines
        $rowSpacing       = 4;   // vertical spacing after each row

        $dateLabelWidth   = 25;  // width for "Date and Time Visited:"
        $dateFieldWidth   = 50;  // underline width
        $regionLabelWidth = 25;  // width for "Region of Residence:"
        $regionFieldWidth = 50;  // underline width

        $pdf->SetFont($arialBold, '', 8.5);
        $pdf->Cell($dateLabelWidth, $fontHeight, 'Date and Time Visited:', 0, 0);
        $pdf->SetFont($arialRegular, '', 8.5);
        $pdf->SetX($pdf->GetX() + 7); // move underline right
        $pdf->Cell($dateFieldWidth + 15, $fontHeight, '_________________________________', 0, 0);
        $pdf->SetFont($arialBold, '', 8.5);
        $pdf->Cell($regionLabelWidth, $fontHeight, 'Region of Residence:', 0, 0);
        $pdf->SetFont($arialRegular, '', 8.5);
        $pdf->SetX($pdf->GetX() + 6); // move underline right
        $pdf->Cell($regionFieldWidth, $fontHeight, '____________________________', 0, 1);
        $pdf->Ln($rowSpacing); // consistent spacing after row


        /*
        |--------------------------------------------------------------------------
        | SERVICE DETAILS INLINE UNDERLINE ADJUSTED
        |--------------------------------------------------------------------------
        */

        $serviceLabelWidth  = 20;  // width for "Service/s Availed:"
        $serviceFieldWidth  = 50;  // underline width
        $providerLabelWidth = 45;  // width for "Name of Service Provider:"
        $providerFieldWidth = 50;  // underline width

        // Current Y position
        $currentY = $pdf->GetY();
        $currentX = $pdf->GetX();

        // Amount to move the row up (except the separate underline)
        $shiftUp = 2; // adjust as needed
        

        // Move the Y coordinate up for the row (except the last underline)
        $pdf->SetY($currentY - $shiftUp);
        

        // Service/s Availed - inline
        $pdf->SetFont($arialBold, '', 8.5);
        $pdf->Cell($serviceLabelWidth, $fontHeight, 'Service/s Availed:', 0, 0);
        $pdf->SetFont($arialRegular, '', 8.5);
        $pdf->SetX($pdf->GetX() + 6); // move underline right
        $pdf->Cell($serviceFieldWidth, $fontHeight, '_____________________________________', 0, 0);

        // Move to exact start position of second label
        $pdf->SetX($serviceLabelWidth + $serviceFieldWidth + 39);

        // Name of Service Provider label
        $pdf->SetFont($arialBold, '', 8.5);
        $pdf->Cell($providerLabelWidth, $fontHeight, 'Name of Person who provided service (optional):', 0, 1);
        $pdf->SetFont($arialRegular, '', 8.5);

        // Move underline slightly closer
        $underlineShiftUp = -0.5;
        $pdf->SetY($pdf->GetY() - $underlineShiftUp);

        // Align underline with label
        $pdf->SetX($serviceLabelWidth + $serviceFieldWidth + 39);
        $pdf->Cell($providerFieldWidth, $fontHeight, '________________________________________________', 0, 1);

        $pdf->Ln($rowSpacing); // consistent spacing after row
       
       
        /*
        |--------------------------------------------------------------------------
        | EVALUATION OPTIONS
        |--------------------------------------------------------------------------
        */
        $labelWidth   = 57;   // Left label column
        $fontHeight   = 6;    // consistent font height
        $boxOffsetY   = ($fontHeight - $boxHeight) / 2;  // center checkbox vertically
        $labelSpacing = 0.2;  // smaller gap between checkbox and label
        $groupGap     = 3;    // gap between option groups

        // Current Y position
        $currentY = $pdf->GetY();

        // Amount to move up (in mm)
        $shiftUp = 3; // adjust this value as needed (smaller = less, larger = higher)

        // Move the Y coordinate up
        $pdf->SetY($currentY - $shiftUp);

        // Then draw the content as usual
        $pdf->SetFont($arialBold, '', 8.5);
        $pdf->Cell($labelWidth, $fontHeight, 'Which of the following are you going to evaluate?', 0, 0);
        
        $pdf->SetX($pdf->GetX() + 16); // move checkboxes and labels right
        
        $pdf->SetFont($arialRegular, '', 8.5);

        $evalOptions = ['Student', 'Faculty', 'Admin/Personnel', 'Others:'];

        foreach ($evalOptions as $index => $option) {

            $pdf->Rect($pdf->GetX(), $pdf->GetY() + $boxOffsetY, $boxWidth, $boxHeight);

            $field = "evaluate_option_{$index}";

            $pdf->Cell(
                $boxWidth,
                $fontHeight,
                (!empty($jobOrder->$field) && $jobOrder->$field == 'Yes' ? '✔' : ''),
                0,
                0,
                'C'
            );

            $pdf->Cell($labelSpacing, $fontHeight, '', 0, 0);

            $textWidth = $pdf->GetStringWidth($option);
            $pdf->Cell($textWidth, $fontHeight, $option, 0, 0);

            if ($option === 'Others:') {
                $pdf->Cell(25, $fontHeight, '____________________', 0, 0);
            }

            $pdf->Cell($groupGap, $fontHeight, '', 0, 0);
        }

        $pdf->Ln(5);

        /*
        |--------------------------------------------------------------------------
        | FINAL FIELDS
        |--------------------------------------------------------------------------
        */
        $fontHeight = 6;  // consistent font size

        // Office/Faculty Unit
        $labelText = 'Office/Faculty Unit transacted with (for Faculty and Personnel Ratee):';
        $underlineWidth = 60; // width of the line
        $pdf->SetFont($arialBold, '', 8.5);
        $pdf->Cell($pdf->GetStringWidth($labelText), $fontHeight, $labelText, 0, 0);
        $pdf->SetFont($arialRegular, '', 8.5);
        $pdf->SetX($pdf->GetX() + 1); 
        $pdf->Cell($underlineWidth, $fontHeight, '___________________________________', 0, 1);

        // Move Y **up slightly** before Student's Program
        $pdf->SetY($pdf->GetY() - 1); // move up 2mm, adjust as needed

        // Student's Program
        $labelText = "Student's Program (for Student Ratee):";
        $pdf->SetFont($arialBold, '', 8.5);
        $pdf->Cell($pdf->GetStringWidth($labelText), $fontHeight, $labelText, 0, 0);
        $pdf->SetFont($arialRegular, '', 8.5);
        $pdf->SetX($pdf->GetX() + 1);
        $pdf->Cell($underlineWidth, $fontHeight, '______________', 0, 1);

        $pdf->Ln(2);

        // --------------------------------------------------------------------------
        // CITIZEN'S CHARTER (CC) INSTRUCTIONS + QUESTION
        // --------------------------------------------------------------------------

        $fontHeight    = 6;
        $boxWidth      = 2;
        $boxHeight     = 2;
        $labelSpacing  = 0.5;  // gap between checkbox and label
        $groupGap      = 3;    // gap between option groups
        $boxOffsetY    = ($fontHeight - $boxHeight) / 2;  // center checkbox vertically

        $pdf->Ln(2); // small space after previous fields

        // Instructions with Arial font and DejaVu Sans only for checkmark
        $pdf->SetFont($arialRegular, '', 8.5);
        
        // Build instructions with inline font changes - using Arial Bold for "Check mark"
        $instructions = 'INSTRUCTIONS: <span style="font-family: ' . $arialBold . '; font-weight: bold;">Check mark (<span style="font-family: dejavusans;">✔</span>)</span> your answer to the Citizen\'s Charter (CC) questions. The Citizen\'s Charter is an official document<br>that reflects the services of a government agency/office including its requirements, fees, and processing times among others.';

        $pdf->writeHTMLCell(
            0, 0, '', '', $instructions,
            0, 1, 0, true, 'L', true
        );
        $pdf->Ln(2); // spacing after instructions

        $pdf->SetY($pdf->GetY() - 1); // move up slightly before CC questions

        // CC1 prefix and question
        $ccPrefix   = "CC1";
        $ccQuestion = "Which of the following best describes your awareness of a CC?";

        // Draw CC1 prefix in bold
        $pdf->SetFont($arialBold, '', 8.5);
        $pdf->Cell($pdf->GetStringWidth($ccPrefix) + 2, $fontHeight, $ccPrefix, 0, 0);

        // Add spacing before question
        $pdf->Cell(7, $fontHeight, '', 0, 0); // 3mm spacing

        // Draw question text in bold
        $pdf->SetFont($arialBold, '', 8.5);
        $pdf->Cell(0, $fontHeight, $ccQuestion, 0, 1, 'L'); // next line

        // CC1 choices
        $ccOptions = [
            "I have never heard of it",
            "I have heard of it but don't know what it contains",
            "I have read it and understood it",
            "I have read it and partially understood it"
        ];

        // Indent for checkboxes
        $leftMargin    = $pdf->getMargins()['left'];
        $ccPrefixWidth = $pdf->GetStringWidth($ccPrefix . ' ');
        $extraIndent   = 10; // Increased from 2 to 5 to move options right
        $indent        = $leftMargin + $ccPrefixWidth + $extraIndent;

        $pdf->SetFont($arialRegular, '', 8.5); // same font size for choices
        $choiceHeight = 4; // smaller row height for compact spacing

        foreach ($ccOptions as $option) {
            $pdf->SetX($indent);

            // Move checkbox slightly higher
            $checkboxShiftUp = 1;
            $pdf->Rect($pdf->GetX(), $pdf->GetY() + $boxOffsetY - $checkboxShiftUp, $boxWidth, $boxHeight);

            // Checkbox placeholder
            $pdf->Cell($boxWidth, $choiceHeight, '', 0, 0, 'C');

            // Space between checkbox and label
            $pdf->Cell($labelSpacing, $choiceHeight, '', 0, 0);

            // Option text
            $pdf->Cell(0, $choiceHeight, $option, 0, 1, 'L');

            $pdf->Ln(-0.5); // optional tighter spacing
        }

        // Small spacing after CC1
        $pdf->Ln(1);
        // --------------------------------------------------------------------------
        // CC2 QUESTION
        // --------------------------------------------------------------------------

        $ccPrefix   = "CC2";
        $ccQuestion = "If aware of CC (answered 1-3 in CC1), would you say that the CC of this office was ...?";

        // Draw CC2 prefix in bold
        $pdf->SetFont($arialBold, '', 8.5);
        $pdf->Cell($pdf->GetStringWidth($ccPrefix) + 2, $fontHeight, $ccPrefix, 0, 0);

        // Add spacing before question
        $pdf->Cell(7, $fontHeight, '', 0, 0); // 3mm spacing

        // Draw question in bold
        $pdf->SetFont($arialBold, '', 8.5);
        $pdf->Cell(0, $fontHeight, $ccQuestion, 0, 1, 'L');

        $pdf->Ln(-2);

        // CC2 options (inline)
        $cc2Options = [
            "1. Easy to see",
            "2. Somewhat easy to see",
            "3. Difficult to see",
            "4. Not visible at all",
            "5. N/A"
        ];

        $pdf->SetFont($arialRegular, '', 8.5);

        // Align options under the question
        $pdf->SetX($indent);

        foreach ($cc2Options as $option) {

            // Draw checkbox
            $pdf->Rect($pdf->GetX(), $pdf->GetY() + $boxOffsetY, $boxWidth, $boxHeight);

            // Space after checkbox
            $pdf->Cell($boxWidth, $fontHeight, '', 0, 0);
            $pdf->Cell($labelSpacing, $fontHeight, '', 0, 0);

            // Option text
            $textWidth = $pdf->GetStringWidth($option);
            $pdf->Cell($textWidth + 4, $fontHeight, $option, 0, 0); // +4 spacing between options
        }

        $pdf->Ln(5);


        // --------------------------------------------------------------------------
        // CC3 QUESTION
        // --------------------------------------------------------------------------

        $ccPrefix   = "CC3";
        $ccQuestion = "If aware of CC (answered codes 1-3 in CC1), how much did the CC help you in your transaction?";

        // Draw CC3 prefix in bold
        $pdf->SetFont($arialBold, '', 8.5);
        $pdf->Cell($pdf->GetStringWidth($ccPrefix) + 4, $fontHeight, $ccPrefix, 0, 0);

        // Add spacing before question
        $pdf->Cell(5, $fontHeight, '', 0, 0); // 3mm spacing

        // Draw question in bold
        $pdf->SetFont($arialBold, '', 8.5);
        $pdf->Cell(0, $fontHeight, $ccQuestion, 0, 1, 'L');

        $pdf->Ln(-2 );

        // CC3 options (inline)
        $cc3Options = [
            "1. Helped very much",
            "2. Somewhat helped",
            "3. Did not help",
            "4. N/A"
        ];

        $pdf->SetFont($arialRegular, '', 8.5);

        // Align options under the question
        $pdf->SetX($indent);

        foreach ($cc3Options as $option) {

            // Draw checkbox
            $pdf->Rect($pdf->GetX(), $pdf->GetY() + $boxOffsetY, $boxWidth, $boxHeight);

            // Space after checkbox
            $pdf->Cell($boxWidth, $fontHeight, '', 0, 0);
            $pdf->Cell($labelSpacing, $fontHeight, '', 0, 0);

            // Option text
            $textWidth = $pdf->GetStringWidth($option);
            $pdf->Cell($textWidth + 4, $fontHeight, $option, 0, 0);
        }

        $pdf->Ln(7);

        // --------------------------------------------------------------------------
        // SQD INSTRUCTIONS
        // --------------------------------------------------------------------------

        $pdf->Ln(1);

        // INSTRUCTIONS label
        $pdf->SetFont($arialBold, '', 8.5);
        $pdf->Cell(0, $fontHeight, 'INSTRUCTIONS:', 0, 1);
        
        // Use Arial font for text and DejaVu Sans only for checkmark, Arial Bold for "check mark"
        $pdf->SetFont($arialRegular, '', 8.5);
        $sqdinstruction = 'For SQD 0-8, please put a <span style="font-family: ' . $arialBold . '; font-weight: bold;">check mark (<span style="font-family: dejavusans;">✔</span>)</span> on the column that best corresponds to your answer.';

        // Instruction text
        $pdf->writeHTMLCell(
            0,       // width (0 = full width)
            0,       // height (0 = auto)
            '',      // x
            '',      // y
            $sqdinstruction, // text with HTML
            0,       // border
            1,       // ln: move to next line
            0,       // fill
            true,    // reset height
            'L',     // align left
            true     // auto padding
        );

        // --------------------------------------------------------------------------
        // SQD TABLE (10 rows x 7 columns)
        // --------------------------------------------------------------------------

        $rows = 10;
        $cols = 7;

        // Table header
        $headers = [
            ' ',           // first column for questions
            "☹\nStrongly\nDisagree",      // Using ☹ (U+2639)
            "☹\nDisagree",                 // Using ☹ (U+2639) 
            "�\nNeither Agree\nnor Disagree",  // Using face without mouth (U+1F636)
            "☺\nAgree",                    // Using ☺ (U+263A)
            "☺\nStrongly\nAgree",          // Using ☺ (U+263A)
            "N/A\nNot\nApplicable"
        ];

        // Calculate available width for table (page width minus margins)
        $margins = $pdf->getMargins();
        $availableWidth = $pageWidth - $margins['left'] - $margins['right'];

        $colWidths = [];

        // Calculate minimum width needed for rating columns
        $pdf->SetFont('arial', '', 8.5);
        
        $totalRatingWidth = 0;
        for ($i = 1; $i < count($headerTexts); $i++) {
            $lines = explode("\n", $headerTexts[$i]);
            $maxWidth = 0;

            foreach ($lines as $line) {
                $lineWidth = $pdf->GetStringWidth($line);
                if ($lineWidth > $maxWidth) {
                    $maxWidth = $lineWidth;
                }
            }

            $colWidths[$i] = $maxWidth + 8;
            $totalRatingWidth += $colWidths[$i];
        }

        // First column gets remaining width
        $colWidths[0] = $availableWidth - $totalRatingWidth;
        
        // Ensure first column has minimum width
        if ($colWidths[0] < 40) {
            $colWidths[0] = 40;
            $scale = ($availableWidth - 40) / $totalRatingWidth;
            for ($i = 1; $i < count($headerTexts); $i++) {
                $colWidths[$i] = $colWidths[$i] * $scale;
            }
        }

        // --------------------------------------------------------------------------
        // DRAW HEADER ROW WITH EMOJI IMAGES
        // --------------------------------------------------------------------------

        $headerRowHeight = 14;
        $emojiSize = 6;

        $startX = $pdf->GetX();
        $startY = $pdf->GetY();

        // Draw empty bordered cells first
        foreach ($headerTexts as $i => $headerText) {
            $pdf->MultiCell(
                $colWidths[$i],
                $headerRowHeight,
                '',
                1,
                'C',
                false,
                0,
                '',
                '',
                true,
                0,
                false,
                true
            );
        }

        // Overlay emoji images at the top and text directly below
        $currentX = $startX;
        foreach ($emojiImages as $i => $emojiPath) {
            // Draw emoji image at top
            if (!empty($emojiPath) && file_exists($emojiPath)) {
                $emojiX = $currentX + ($colWidths[$i] - $emojiSize) / 2;
                $emojiY = $startY + 0.5;
                $pdf->Image($emojiPath, $emojiX, $emojiY, $emojiSize, $emojiSize);
                
                // Draw text directly below the image
                $textY = $emojiY + $emojiSize;
                $pdf->SetXY($currentX, $textY);
                $pdf->MultiCell(
                    $colWidths[$i],
                    0,
                    $headerTexts[$i],
                    0,
                    'C',
                    false,
                    0,
                    '',
                    '',
                    true,
                    0,
                    false,
                    true,
                    0,
                    'T'
                );
            } else {
                // For cells without emoji (first and last column), just draw text centered
                $pdf->SetXY($currentX, $startY);
                $pdf->MultiCell(
                    $colWidths[$i],
                    $headerRowHeight,
                    $headerTexts[$i],
                    0,
                    'C',
                    false,
                    0,
                    '',
                    '',
                    true,
                    0,
                    false,
                    true
                );
            }
            $currentX += $colWidths[$i];
        }

        $pdf->Ln();


        // --------------------------------------------------------------------------
        // SQD ROW LABELS
        // --------------------------------------------------------------------------

        $sqdRows = [
            'SQD0. I am satisfied with the service that I availed.',
            'SQD1. I spent a reasonable amount of time for my transaction.',
            'SQD2. The office followed the transaction\'s requirements and steps based on the information provided.',
            'SQD3. The steps (including payment) I needed to do for my transaction were easy and simple.',
            'SQD4. I easily found information about my transaction from the office or its website.',
            'SQD5. I paid a reasonable amount of fees for my transaction.',
            'SQD6. I feel the office was fair to everyone, or "walang palakasan", during my transaction.',
            'SQD7. I was treated courteously by the staff, and (if asked for help) the staff was helpful.',
            'SQD8. I got what I needed from the government office, or (if denied) denial of request was sufficiently explained to me.',
        ];


        // --------------------------------------------------------------------------
        // DRAW TABLE ROWS
        // --------------------------------------------------------------------------

        $rowHeight = 8; // Reduced row height for more compact table

        // Switch back to Arial font for table rows (better readability for text)
        $pdf->SetFont('arial', '', 8.5);

        foreach ($sqdRows as $rowText) {

            $startX = $pdf->GetX();
            $startY = $pdf->GetY();

            // First column (question text) - MultiCell with proper height calculation
            $pdf->MultiCell($colWidths[0], $rowHeight, $rowText, 1, 'L', false, 0, '', '', true, 0, false, true, $rowHeight, 'M');

            // Remaining columns (checkboxes) - drawn at same Y position
            for ($c = 1; $c < $cols; $c++) {

                $x = $pdf->GetX();
                $y = $startY; // Use starting Y to keep all cells aligned

                // Draw cell border
                $pdf->Cell($colWidths[$c], $rowHeight, '', 1, 0, 'C');

                // Draw checkbox centered vertically and horizontally
                $checkboxSize = 2; // Smaller checkbox for reduced height
                $pdf->Rect(
                    $x + ($colWidths[$c] / 2) - ($checkboxSize / 2),
                    $y + ($rowHeight / 2) - ($checkboxSize / 2),
                    $checkboxSize,
                    $checkboxSize
                );
            }

            $pdf->Ln();
        }

        $pdf->Ln(5);

        // --------------------------------------------------------------------------
        // SUGGESTIONS + EMAIL (inside your scaled box)
        // --------------------------------------------------------------------------
        $pdf->SetFont('arial', '', 8.5);

        // Starting Y after SQD table
        $currentY = $pdf->GetY();
        $pdf->SetY($currentY - 3);

        $boxLeft = 12; // align with margins
        $pdf->SetX($boxLeft);

        // Label
        $pdf->Cell(0, $fontHeight, 'Suggestions on how we can further improve our services (optional):', 0, 1);

        // Move up before drawing underlines
        $pdf->SetY($pdf->GetY() - 2); // Move underlines higher

        // Two underline rows
        $pdf->SetX($boxLeft);
        $pdf->Cell(0, $fontHeight, '_______________________________________________________________________________________________________________', 0, 1);
        
        // Move second line slightly higher
        $pdf->SetY($pdf->GetY() - 1);
        
        $pdf->SetX($boxLeft);
        $pdf->Cell(0, $fontHeight, '_______________________________________________________________________________________________________________', 0, 1);

        // Email
        $pdf->SetX($boxLeft);
        $emailLabel = 'Email address (optional):';
        $underlineWidth = 70;
        $pdf->Cell($pdf->GetStringWidth($emailLabel), $fontHeight, $emailLabel, 0, 0);
        $pdf->Cell(2, $fontHeight, '', 0, 0);
        $pdf->Cell($underlineWidth, $fontHeight, '________________________________', 0, 1);

        $pdf->Ln(1);

        // --------------------------------------------------------------------------
        // THANK YOU MESSAGE (standalone text, no border)
        // --------------------------------------------------------------------------
        $boxLeft = 12; // align with margins
        
        // Position adjustments for THANK YOU
        $thankYouX = -5;  // Center position (adjust as needed)
        $thankYouY = 0;   // Move up (-) or down (+) from current position
        
        // Text content
        $thankYouText = 'THANK YOU!';
        
        // Calculate position
        $thankYouTextX = $boxLeft + $thankYouX;
        $thankYouTextY = $pdf->GetY() + $thankYouY;
        
        // Disable auto page break
        $pdf->SetAutoPageBreak(false, 0);   
        
        // Add text
        $pdf->SetXY($thankYouTextX, $thankYouTextY);
        $pdf->SetFont($arialBold, '', 9);
        $pdf->Cell(0, 6, $thankYouText, 0, 1, 'C');
        
        // Re-enable auto page break
        $pdf->SetAutoPageBreak(true, 10);

        $pdf->Ln(1);

        // --------------------------------------------------------------------------
        // STANDALONE TEXT BOX (like Word/Google Docs textbox)
        // --------------------------------------------------------------------------
        $margins = $pdf->getMargins();

        // Position adjustments - CHANGE THESE TO MOVE THE BOX
        $x = - 2;   // Move left (-) or right (+) from current position
        $y = 0;   // Move up (-) or down (+) from current position

        // Text content for first box
        $textBox1Content = 'F-QMS-025 rev. 1 (04-19-24)';
        
        // Calculate auto-size based on text
        $textBoxPadding = 2; // internal padding
        $pdf->SetFont('arial', '', 8.5);
        $textBox1ContentWidth = $pdf->GetStringWidth($textBox1Content);
        
        // Auto-calculate width and height
        $textBoxWidth = $textBox1ContentWidth + ($textBoxPadding * 2) + 2; // +2 for extra space
        $textBoxHeight = 8; // fixed height for single line
        
        // Define textbox properties
        $textBoxX = $boxLeft + $x;
        $textBoxY = $pdf->GetY() + $y;

        // Draw the border of the text box
        $pdf->SetLineWidth(0.3);
        $pdf->Rect($textBoxX, $textBoxY, $textBoxWidth, $textBoxHeight);
        $pdf->SetLineWidth(0.2);

        // Disable auto page break to keep text in box
        $pdf->SetAutoPageBreak(false, 0);

        // Add text inside the box with padding
        $pdf->SetXY($textBoxX + $textBoxPadding, $textBoxY + $textBoxPadding);
        
        // Label text - use Cell instead of MultiCell to prevent page break
        $pdf->SetFont('arial', '', 8.5);
        $pdf->Cell($textBoxWidth - ($textBoxPadding * 2), $textBoxHeight - ($textBoxPadding * 2), $textBox1Content, 0, 0, 'L', false);

        // Re-enable auto page break
        $pdf->SetAutoPageBreak(true, 10);

        // --------------------------------------------------------------------------
        // SECOND STANDALONE TEXT BOX (Right side)
        // --------------------------------------------------------------------------
        
        // Position adjustments for second box - CHANGE THESE TO MOVE THE BOX
        $x2 = 144.5;   // Move left (-) or right (+) from left margin
        $y2 = - 4.2;    // Move up (-) or down (+) from current position

        // Text content for second box
        $textBox2Lines = [
            'ANTI-RED TAPE AUTHORITY',
            'CLIENT SATISFACTION MEASUREMENT FORM',
            'PSA Approval No.: ARTA-2242-3'
        ];
        
        // Calculate auto-size based on text
        $textBox2Padding = 1;
        $pdf->SetFont('arial', 'B', 4.5);
        
        // Find the longest line to determine width
        $maxLineWidth = 0;
        foreach ($textBox2Lines as $line) {
            $lineWidth = $pdf->GetStringWidth($line);
            if ($lineWidth > $maxLineWidth) {
                $maxLineWidth = $lineWidth;
            }
        }
        
        // Calculate dimensions
        $textBox2Width = $maxLineWidth + ($textBox2Padding * 2) + 6; // +4 for extra space
        $lineHeight = 1.5; // height per line
        $textBox2Height = (count($textBox2Lines) * $lineHeight) + ($textBox2Padding * 2) + 4; // +2 for spacing
        
        // Define second textbox properties
        $textBox2X = $boxLeft + $x2;
        $textBox2Y = $pdf->GetY() + $y2;

        // Draw the border of the second text box
        $pdf->SetLineWidth(0.3);
        $pdf->Rect($textBox2X, $textBox2Y, $textBox2Width, $textBox2Height);
        $pdf->SetLineWidth(0.2);

        // Disable auto page break
        $pdf->SetAutoPageBreak(false, 0);

        // Add text inside the second box with padding
        $pdf->SetXY($textBox2X + $textBox2Padding, $textBox2Y + $textBox2Padding + 1);
        
        // Text for second box - left aligned
        $pdf->SetFont('arial', 'B', 5);
        
        // Draw each line left aligned
        foreach ($textBox2Lines as $index => $line) {
            $pdf->SetX($textBox2X + $textBox2Padding);
            
            // Last line doesn't need line break
            if ($index < count($textBox2Lines) - 1) {
                $pdf->Cell($textBox2Width - ($textBox2Padding * 2), $lineHeight, $line, 0, 1, 'L', false);
            } else {
                $pdf->Cell($textBox2Width - ($textBox2Padding * 2), $lineHeight, $line, 0, 0, 'L', false);
            }
        }

        // Re-enable auto page break
        $pdf->SetAutoPageBreak(true, 10);

        // Move to after the text boxes (use whichever is taller)
        $maxHeight = max($textBoxHeight, $textBox2Height);
        $pdf->SetY(max($textBoxY, $textBox2Y) + $maxHeight + 2);

        // --------------------------------------------------------------------------
        // STOP SCALING AFTER SQD TABLE
        // --------------------------------------------------------------------------
        $pdf->StopTransform(); // stop scaling here so coordinates match border
    }
}