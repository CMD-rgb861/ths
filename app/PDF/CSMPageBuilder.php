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

        $pdf->SetFont($arialBold, '', 8.5);
        $pdf->MultiCell(
            0,
            6,
            "HELP US SERVE YOU BETTER! This Client Satisfaction Measurement (CSM) tracks the customer experiences of government offices. Your feedback on your recently concluded transaction will help this office provide a better service. Personal information shared will be kept confidential and you always have the option to not answer this form.",
            0,  
            'L'
        );
        $pdf->Ln(2);

        /*
        |--------------------------------------------------------------------------
        | SERVICE DETAILS TABLE
        |--------------------------------------------------------------------------
        */
        $fontHeight = 6;
        $pdf->SetFont($arialBold, '', 8.5);
        
        // Table dimensions - 2 columns layout for rows 1, 2, 4, 5 and 4 columns for row 3
        $tableWidth = $pageWidth - 24; // total width (page minus margins)
        
        // Calculate width needed for first column labels
        $labels = [
            'TRANSACTION DETAILS',
            'OFFICE/UNIT TRANSACTED WITH:',
            'SERVICE/S AVAILED:',
            'DATE VISITED:',
            'NAME OF SERVICE PROVIDER (OPTIONAL):'
        ];
        
        $maxLabelWidth = 0;
        foreach ($labels as $label) {
            $labelWidth = $pdf->GetStringWidth($label);
            if ($labelWidth > $maxLabelWidth) {
                $maxLabelWidth = $labelWidth;
            }
        }
        
        // Add padding to the max label width
        $col1Width = $maxLabelWidth + 4; // +4 for padding
        
        // Second column gets remaining width for 2-column rows
        $col2Width = $tableWidth - $col1Width;
        
        // For row 4 (4 columns): divide remaining space into 3 equal parts
        $row3RemainingWidth = $tableWidth - $col1Width;
        $row3ColWidth = $row3RemainingWidth / 3; // Each of the 3 remaining columns
        
        $rowHeight = 6; // Reduced from 8 to 6
        
        $startX = $pdf->GetX();
        $startY = $pdf->GetY();
        
        // Row 0: TRANSACTION DETAILS (header row - only in first column)
        $pdf->SetFont($arialBold, '', 8.5);
        $pdf->Cell($col1Width, $rowHeight, 'TRANSACTION DETAILS', 1, 0, 'L');
        $pdf->Cell($col2Width, $rowHeight, '', 0, 1, 'L');
        
        // Row 1: OFFICE/UNIT TRANSACTED WITH | (empty column) - GRAY FILL
        $pdf->SetFillColor(220, 220, 220); // Gray color
        $pdf->Cell($col1Width, $rowHeight, 'OFFICE/UNIT TRANSACTED WITH:', 1, 0, 'L', true);
        $pdf->Cell($col2Width, $rowHeight, '', 1, 1, 'L', true);
        
        // Row 2: SERVICE/S AVAILED | (empty column)
        $pdf->SetFillColor(255, 255, 255); // Reset to white
        $pdf->Cell($col1Width, $rowHeight, 'SERVICE/S AVAILED:', 1, 0, 'L');
        $pdf->Cell($col2Width, $rowHeight, '', 1, 1, 'L');
        
        // Row 3: DATE VISITED | (empty) | TIME VISITED | (empty) - 4 columns
        $pdf->Cell($col1Width, $rowHeight, 'DATE VISITED:', 1, 0, 'L');
        $pdf->Cell($row3ColWidth, $rowHeight, '', 1, 0, 'L');
        $pdf->Cell($row3ColWidth, $rowHeight, 'TIME VISITED:', 1, 0, 'L');
        $pdf->Cell($row3ColWidth, $rowHeight, '', 1, 1, 'L');
        
        // Row 4: NAME OF SERVICE PROVIDER (OPTIONAL) | (empty column) - GRAY FILL
        $pdf->SetFillColor(220, 220, 220); // Gray color
        $pdf->Cell($col1Width, $rowHeight, 'NAME OF SERVICE PROVIDER (OPTIONAL):', 1, 0, 'L', true);
        $pdf->Cell($col2Width, $rowHeight, '', 1, 1, 'L', true);
        
        // Reset fill color to white for subsequent content
        $pdf->SetFillColor(255, 255, 255);

        $pdf->Ln(4);

        /*
        |--------------------------------------------------------------------------
        | PERSONAL INFORMATION TABLE
        |--------------------------------------------------------------------------
        */
        $pdf->SetFont($arialBold, '', 7);

        // Personal Info Table dimensions - reduce width by 20%
        $piTableWidth = ($pageWidth - 24) * 0.37; // 80% of original width
        $piCol1Width = $piTableWidth / 2;
        $piCol2Width = $piTableWidth / 2;

        // Save starting Y for alignment
        $piTableStartY = $pdf->GetY();

        // Row 0: PERSONAL INFORMATION header - only in first column
        $titleHeight = 6; // Match the CC table title cell height
        $pdf->Cell($piCol1Width, $titleHeight, 'PERSONAL INFORMATION', 1, 1, 'L');

        // Row 0.5: Data Privacy Notice - spans full width
        $pdf->SetFont($arialRegular, '', 5.5);
        $privacyNotice = 'Data Privacy Notice: All information collected through this feedback form will be treated with strict confidentiality and will be used solely for service improvement purposes, in compliance with the Data Privacy Act of 2012 (RA 10173)';
        $privacyNoticeHeight = 8;
        $pdf->MultiCell($piTableWidth, $privacyNoticeHeight, $privacyNotice, 1, 'L', false, 1, '', '', true, 0, false, true, $privacyNoticeHeight, 'M');

        // Reset font for next sections
        $pdf->SetFont($arialBold, '', 7);

        // Row 1: CLIENT TYPE (left) | SEX (right)
        $clientTypes = ['Citizen', 'Business', 'Government'];
        $sexOptions = ['Male', 'Female', 'Prefer not to say'];
        $lineHeight = 3;
        $paddingTop = 4;
        $clientTypeHeight = $paddingTop + (count($clientTypes) * $lineHeight);
        $sexHeight = $paddingTop + (count($sexOptions) * $lineHeight);
        $row1Height = max($clientTypeHeight, $sexHeight);
        $clientTypeY = $pdf->GetY();
        $clientTypeX = $pdf->GetX();
        $pdf->Cell($piCol1Width, $row1Height, '', 1, 0, 'L');
        $sexCellX = $pdf->GetX();
        $pdf->Cell($piCol2Width, $row1Height, '', 1, 1, 'L');
        $pdf->SetXY($clientTypeX + 1, $clientTypeY + 1);
        $pdf->SetFont($arialBold, '', 7);
        $pdf->Cell(0, 3, 'CLIENT TYPE:', 0, 1, 'L');
        $pdf->SetFont($arialRegular, '', 6);
        $checkboxSize = 2;
        foreach ($clientTypes as $index => $type) {
            $pdf->SetX($clientTypeX + 2);
            $currentY = $pdf->GetY();
            $pdf->Rect($pdf->GetX(), $currentY + 0.5, $checkboxSize, $checkboxSize);
            $pdf->SetX($pdf->GetX() + $checkboxSize + 1);
            $pdf->Cell(0, $lineHeight, $type, 0, 1, 'L');
        }
        $pdf->SetXY($sexCellX + 1, $clientTypeY + 1);
        $pdf->SetFont($arialBold, '', 7);
        $pdf->Cell(0, 3, 'SEX:', 0, 1, 'L');
        $pdf->SetFont($arialRegular, '', 6);
        foreach ($sexOptions as $index => $option) {
            $pdf->SetX($sexCellX + 2);
            $currentY = $pdf->GetY();
            $pdf->Rect($pdf->GetX(), $currentY + 0.5, $checkboxSize, $checkboxSize);
            $pdf->SetX($pdf->GetX() + $checkboxSize + 1);
            $pdf->Cell(0, $lineHeight, $option, 0, 1, 'L');
        }

        // Row 2: CLIENT CATEGORY (left) | AGE (right)
        $clientCategories = ['Student', 'Visitor', 'Faculty', 'Admin/Personnel', 'Others'];
        $ageOptions = ['Below 18 y/o', '18-24 y/o', '25-34 y/o', '35-44 y/o', '45-54 y/o', '55-64 y/o', '65 y/o & above'];
        $categoriesHeight = $paddingTop + (count($clientCategories) * $lineHeight);
        $ageHeight = $paddingTop + (count($ageOptions) * $lineHeight);
        $row2Height = max($categoriesHeight, $ageHeight);
        $categoryY = $pdf->GetY();
        $categoryX = $pdf->GetX();
        $pdf->Cell($piCol1Width, $row2Height, '', 1, 0, 'L');
        $ageCellX = $pdf->GetX();
        $pdf->Cell($piCol2Width, $row2Height, '', 1, 1, 'L');
        $pdf->SetXY($categoryX + 1, $categoryY + 1);
        $pdf->SetFont($arialBold, '', 7);
        $pdf->Cell(0, 3, 'CLIENT CATEGORY:', 0, 1, 'L');
        $pdf->SetFont($arialRegular, '', 6);
        foreach ($clientCategories as $index => $category) {
            $pdf->SetX($categoryX + 2);
            $currentY = $pdf->GetY();
            $pdf->Rect($pdf->GetX(), $currentY + 0.5, $checkboxSize, $checkboxSize);
            $pdf->SetX($pdf->GetX() + $checkboxSize + 1);
            if ($category === 'Others') {
                $pdf->Cell(0, $lineHeight, $category . ': __________', 0, 1, 'L');
            } else {
                $pdf->Cell(0, $lineHeight, $category, 0, 1, 'L');
            }
        }
        $pdf->SetXY($ageCellX + 1, $categoryY + 1);
        $pdf->SetFont($arialBold, '', 7);
        $pdf->Cell(0, 3, 'AGE:', 0, 1, 'L');
        $pdf->SetFont($arialRegular, '', 6);
        foreach ($ageOptions as $index => $ageOption) {
            $pdf->SetX($ageCellX + 2);
            $currentY = $pdf->GetY();
            $pdf->Rect($pdf->GetX(), $currentY + 0.5, $checkboxSize, $checkboxSize);
            $pdf->SetX($pdf->GetX() + $checkboxSize + 1);
            $pdf->Cell(0, $lineHeight, $ageOption, 0, 1, 'L');
        }

        // Row 3: WHICH OF THE FOLLOWING ARE YOU GOING TO EVALUATE? - spans full width
        // Calculate height needed for EVALUATE cell
        $evaluateOptions = ['Student', 'Faculty', 'Admin/Personnel', 'Others'];
        // Height calculation: title line + inline options line + Others line
        $evaluateHeight = $paddingTop + ($lineHeight * 2); // Title + 1 inline row + Others row
        
        // Save the Y position before drawing the cell
        $evaluateY = $pdf->GetY();
        $evaluateX = $pdf->GetX();
        
        // Draw the cell border first with calculated height
        $pdf->Cell($piTableWidth, $evaluateHeight, '', 1, 1, 'L');
        
        // Now add content inside EVALUATE cell
        $pdf->SetXY($evaluateX + 1, $evaluateY + 1);
        $pdf->SetFont($arialBold, '', 5); // Reduced from 7 to 5 to fit narrower table
        $pdf->Cell(0, 3, 'WHICH OF THE FOLLOWING ARE YOU GOING TO EVALUATE?', 0, 1, 'L');
        
        // Add checkboxes and labels for EVALUATE options (inline except Others)
        $pdf->SetFont($arialRegular, '', 5); // Reduced from 6 to 5
        
        // Set starting position for inline options
        $pdf->SetX($evaluateX + 2);
        $startY = $pdf->GetY();
        
        foreach ($evaluateOptions as $index => $option) {
            if ($option === 'Others') {
                // Move to new line for Others
                $pdf->SetXY($evaluateX + 2, $startY + $lineHeight);
                
                // Draw checkbox
                $currentY = $pdf->GetY();
                $pdf->Rect($pdf->GetX(), $currentY + 0.5, $checkboxSize, $checkboxSize);
                
                // Add label with underline
                $pdf->SetX($pdf->GetX() + $checkboxSize + 1);
                $pdf->Cell(0, $lineHeight, $option . ': __________', 0, 1, 'L');
            } else {
                // Inline options
                // Draw checkbox
                $currentY = $pdf->GetY();
                $pdf->Rect($pdf->GetX(), $currentY + 0.5, $checkboxSize, $checkboxSize);
                
                // Add label
                $pdf->Cell($checkboxSize, $lineHeight, '', 0, 0, 'L');
                $pdf->Cell(1, $lineHeight, '', 0, 0, 'L'); // spacing
                $labelWidth = $pdf->GetStringWidth($option);
                $pdf->Cell($labelWidth, $lineHeight, $option, 0, 0, 'L');
                $pdf->Cell(3, $lineHeight, '', 0, 0, 'L'); // gap between options
            }
        }
        
        // Row 4: NAME (Optional) - spans full width
        $nameRowHeight = 8; // Fixed height for name field
        $pdf->Cell($piTableWidth, $nameRowHeight, 'NAME (Optional):', 1, 1, 'L');
        
        // Row 5: EMAIL ADDRESS (Optional) - spans full width
        $emailRowHeight = 8; // Fixed height for email field
        $pdf->Cell($piTableWidth, $emailRowHeight, 'EMAIL ADDRESS (Optional):', 1, 1, 'L');

        // Save the ending Y for alignment
        $piTableEndY = $pdf->GetY();
        $piTableHeight = $piTableEndY - $piTableStartY;

        // --------------------------------------------------------------------------
        // CITIZEN'S CHARTER (CC) TABLE - POSITIONED BESIDE PERSONAL INFO TABLE
        // --------------------------------------------------------------------------

        $pdf->SetFont($arialBold, '', 7);

        // CC Table dimensions - positioned to the right of Personal Info table
        $ccTableWidth = ($pageWidth - 24) - $piTableWidth - 2;
        $ccTableX = 12 + $piTableWidth + 2;

        // CC table should start at the same Y as PI table
        $pdf->SetXY($ccTableX, $piTableStartY);

        // --------------------
        // CC TABLE TITLE ROW (full width)
        // --------------------
        $pdf->SetFont($arialBold, '', 6);

        $ccTitle = 'CITIZEN\'S CHARTER';
        $titleHeight = 6;

        // Draw title cell
        $pdf->Cell($ccTableWidth * 0.5, $titleHeight, $ccTitle, 1, 1, 'C');

        // Move to next row for instructions
        $pdf->SetXY($ccTableX, $piTableStartY + $titleHeight);

        // Instructions row - spans full width
        $pdf->SetFont($arialRegular, '', 5);
        $ccInstructions = 'INSTRUCTIONS: Check mark (✔) your answer to the Citizen\'s Charter (CC) questions. The Citizen\'s Charter is an official document that reflects the services of a government agency/office including its requirements, fees, and processing times among others.';
        $instructionsHeight = 12;
        $pdf->MultiCell($ccTableWidth, $instructionsHeight, $ccInstructions, 1, 'L', false, 1, '', '', true, 0, false, true, $instructionsHeight, 'M');

        // Define column widths for CC table (3 columns)
        $ccCol1Width = $ccTableWidth * 0.10;
        $ccCol2Width = $ccTableWidth * 0.50;
        $ccCol3Width = $ccTableWidth * 0.40;

        // Prepare CC rows data
        $ccRows = [
            [
                'label' => 'CC1',
                'question' => 'Which of the following best describes your awareness of a CC?',
                'options' => [
                    '1. I know what a CC is and I saw this office\'s CC',
                    '2. I know what a CC is but I did NOT see this office\'s CC',
                    '3. I learned of the CC only when I saw this office\'s CC',
                    '4. I do not know what a CC is and I did not see one in this office. (Answer \'N/A\' on CC2 and CC3)'
                ]
            ],
            [
                'label' => 'CC2',
                'question' => 'If aware of CC (answered 1-3 in CC1), would you say that the CC of this office was ...?',
                'options' => [
                    '1. Easy to see',
                    '2. Somewhat easy to see',
                    '3. Difficult to see',
                    '4. Not visible at all',
                    '5. N/A'
                ]
            ],
            [
                'label' => 'CC3',
                'question' => 'If aware of CC (answered codes 1-3 in CC1), how much did the CC help you in your transaction?',
                'options' => [
                    '1. Helped very much',
                    '2. Somewhat helped',
                    '3. Did not help',
                    '4. N/A'
                ]
            ]
        ];

        // Calculate available height for CC rows (PI table height minus title and instructions)
        $ccRowsStartY = $pdf->GetY();
        $ccRowsAvailableHeight = $piTableHeight - ($ccRowsStartY - $piTableStartY);

        // Calculate row heights for each CC row (proportional to their content, but total = $ccRowsAvailableHeight)
        $rowHeights = [];
        $totalContent = 0;
        foreach ($ccRows as $row) {
            $questionHeight = $pdf->getStringHeight($ccCol2Width - 2, $row['question']);
            $optionsHeight = count($row['options']) * 3.5;
            $rowContent = max($questionHeight + 2, $optionsHeight + 4);
            $rowHeights[] = $rowContent;
            $totalContent += $rowContent;
        }
        // Scale row heights to fit exactly in available height
        $scaledRowHeights = [];
        foreach ($rowHeights as $h) {
            $scaledRowHeights[] = $ccRowsAvailableHeight * ($h / $totalContent);
        }
        $rowHeights = $scaledRowHeights;

        $totalTableHeight = array_sum($rowHeights);

        $startY = $pdf->GetY();

        // DRAW TABLE ONCE
        $pdf->SetXY($ccTableX, $startY);
        $pdf->Cell($ccCol1Width, $totalTableHeight, '', 1, 0);
        $pdf->Cell($ccCol2Width, $totalTableHeight, '', 1, 0);
        $pdf->Cell($ccCol3Width, $totalTableHeight, '', 1, 1);

        // ROW DIVIDERS
        $currentY = $startY;
        foreach ($rowHeights as $h) {
            $currentY += $h;
            if ($currentY < $startY + $totalTableHeight) {
                $pdf->Line(
                    $ccTableX,
                    $currentY,
                    $ccTableX + $ccTableWidth,
                    $currentY
                );
            }
        }

        // INSERT CONTENT
        foreach ($ccRows as $i => $row) {
            $rowY = $startY + array_sum(array_slice($rowHeights, 0, $i));
            // Label
            $pdf->SetXY($ccTableX + 1, $rowY + 1);
            $pdf->SetFont($arialBold, '', 5);
            $pdf->Cell($ccCol1Width - 2, 3, $row['label'], 0, 0, 'L');
            // Question
            $pdf->SetXY($ccTableX + $ccCol1Width + 1, $rowY + 1);
            $pdf->MultiCell($ccCol2Width - 2, 3, $row['question'], 0, 'L');
            // Options (checkboxes and labels inside 3rd column)
            $pdf->SetFont($arialRegular, '', 4);
            $checkboxSize = 1.5;
            $col3X = $ccTableX + $ccCol1Width + $ccCol2Width;
            $col3Y = $rowY + 1;
            $optionsCount = count($row['options']);
            $optionHeight = 3.5;
            $totalOptionsHeight = $optionsCount * $optionHeight;
            $col3CellHeight = $rowHeights[$i] - 2;
            $optionsStartY = $col3Y + max(0, ($col3CellHeight - $totalOptionsHeight) / 2);
            for ($j = 0; $j < $optionsCount; $j++) {
                $option = $row['options'][$j];
                $y = $optionsStartY + $j * $optionHeight;
                $pdf->SetXY($col3X + 1, $y);
                $pdf->Rect($col3X + 1, $y, $checkboxSize, $checkboxSize);
                $pdf->SetXY($col3X + 1 + $checkboxSize + 1, $y - 0.2);
                $pdf->MultiCell(
                    $ccCol3Width - ($checkboxSize + 3),
                    $optionHeight - 0.5,
                    $option,
                    0,
                    'L'
                );
            }
        }

        // Move Y to the end of the PI table to keep next content aligned
        $pdf->SetY($piTableEndY);

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