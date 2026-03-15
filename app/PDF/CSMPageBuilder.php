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
        // ADD FONTS
        // --------------------------------------------------------------------------
        $arialFont        = public_path('fonts/ARIAL.TTF');
        $arialBoldFont    = public_path('fonts/ARIALBD.TTF');
        $arialItalicFont  = public_path('fonts/ARIALI.TTF');
        $arialBlackFont   = public_path('fonts/ARIBLK.TTF');
        $arialNarrowFont  = public_path('fonts/ARIALN.TTF');
        $arialNarrowBoldFont = public_path('fonts/ARIALNB.TTF');
        $timesFont        = public_path('fonts/times_new_roman_fonts/TIMES.TTF');
        $timesBoldFont    = public_path('fonts/times_new_roman_fonts/TIMESBD.TTF');
        $timesBoldItalicFont = public_path('fonts/times_new_roman_fonts/TIMESBI.TTF');

                // Table header text (without emojis in text)
        $headerTexts = [
            ' ',
            "Strongly Agree",
            "Agree",
            "Neither Agree\nnor Disagree",
            "Disagree",
            "Strongly Disagree",
            "N/A\nNot\nApplicable"
        ];

        // Emoji image paths
        $emojiImages = [
            '',
            public_path('images/emojis/Strongly Agree.png'),
            public_path('images/emojis/Agree.png'),
            public_path('images/emojis/Neutral.png'),
            public_path('images/emojis/Disagree.png'),
            public_path('images/emojis/Strongly Disagree.png'),
            ''
        ];

        // Add fonts to TCPDF and store font names
        $arialRegular     = TCPDF_FONTS::addTTFfont($arialFont,           'TrueTypeUnicode', '', 96);
        $arialBold        = TCPDF_FONTS::addTTFfont($arialBoldFont,       'TrueTypeUnicode', '', 96);
        $arialItalic      = TCPDF_FONTS::addTTFfont($arialItalicFont,     'TrueTypeUnicode', '', 96);
        $arialBlack       = TCPDF_FONTS::addTTFfont($arialBlackFont,      'TrueTypeUnicode', '', 96);
        $arialNarrow      = TCPDF_FONTS::addTTFfont($arialNarrowFont,     'TrueTypeUnicode', '', 96);
        $arialNarrowBold  = TCPDF_FONTS::addTTFfont($arialNarrowBoldFont, 'TrueTypeUnicode', '', 96);
        $timesRegular     = TCPDF_FONTS::addTTFfont($timesFont,           'TrueTypeUnicode', '', 96);
        $timesBold        = TCPDF_FONTS::addTTFfont($timesBoldFont,       'TrueTypeUnicode', '', 96);
        $timesBoldItalic = TCPDF_FONTS::addTTFfont($timesBoldItalicFont,      'TrueTypeUnicode', '', 96);

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

        // "LEYTE NORMAL UNIVERSITY" → Times New Roman Bold
        $pdf->SetFont($timesBold, 'U', 10);
        $pdf->Cell(0, 5, 'LEYTE NORMAL UNIVERSITY', 0, 1, 'C');

        // Motto → Arial Regular
        $pdf->SetFont($timesRegular, '', 8.5);
        $pdf->Cell(0, 5, 'INTEGRITY·EXCELLENCE·SERVICE', 0, 1, 'C');

        // CSM Title → Arial Bold
        $pdf->SetFont($arialBold, '', 8.5);
        $pdf->Cell(0, 5, 'CLIENT SATISFACTION MEASUREMENT (CSM)', 0, 1, 'C');
        $pdf->Ln(3);

        // Intro paragraph → Arial Regular
        $pdf->SetFont($arialBold, '', 8.5);
        $pdf->MultiCell(
            0,
            6,
            "HELP US SERVE YOU BETTER! This Client Satisfaction Measurement (CSM) tracks the customer experiences of government offices. Your feedback on your recently concluded transaction will help this office provide a better service.",
            0,  
            'C'
        );
        $pdf->Ln(1.5);

        /*
        |--------------------------------------------------------------------------
        | SERVICE DETAILS TABLE
        |--------------------------------------------------------------------------
        */
        $fontHeight = 6;

        // Section headers → Arial Narrow Bold
        $pdf->SetFont($arialBold, '', 8);
        
        // Table dimensions - 2 columns layout for rows 1, 2, 4, 5 and 4 columns for row 3
        $tableWidth = $pageWidth - 24; // total width (page minus margins)
        
        // Calculate width needed for first column labels
        $labels = [
            'TRANSACTION DETAILS',
            'OFFICE/UNIT TRANSACTED WITH:',
            'SERVICE/S AVAILED:',
            'DATE VISITED:',
            'NAME OF SERVICE PROVIDER\n(OPTIONAL):'
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
        // Section header → Arial Narrow Bold
        $pdf->SetFont($arialNarrowBold, '', 8.5);
        $pdf->Cell($col1Width, $rowHeight, 'TRANSACTION DETAILS', 1, 0, 'L');
        $pdf->Cell($col2Width, $rowHeight, '', 0, 1, 'L');
        
        // Row 1: OFFICE/UNIT TRANSACTED WITH | (empty column) - GRAY FILL
        // Field label → Arial Narrow Bold
        $pdf->SetFillColor(220, 220, 220); // Gray color
        $pdf->Cell($col1Width, $rowHeight, 'OFFICE/UNIT TRANSACTED WITH:', 1, 0, 'L', true);
        $pdf->Cell($col2Width, $rowHeight, '', 1, 1, 'L', true);
        
        // Row 2: SERVICE/S AVAILED | (empty column)
        $pdf->SetFillColor(255, 255, 255); // Reset to white
        $pdf->Cell($col1Width, $rowHeight, 'SERVICE/S AVAILED:', 1, 0, 'L');
        $pdf->Cell($col2Width, $rowHeight, '', 1, 1, 'L');
        
        // Row 3: DATE VISITED | (empty) | TIME VISITED | (empty) - 4 columns
        $pdf->SetFillColor(220, 220, 220); // Gray color
        $pdf->Cell($col1Width, $rowHeight, 'DATE VISITED:', 1, 0, 'L', true);
        $pdf->Cell($row3ColWidth, $rowHeight, '', 1, 0, 'L', true);
        $pdf->Cell($row3ColWidth, $rowHeight, 'TIME VISITED:', 1, 0, 'L', true);
        $pdf->Cell($row3ColWidth, $rowHeight, '', 1, 1, 'L', true);
        
        $providerLabel = "NAME OF SERVICE PROVIDER\n(OPTIONAL):";

        $rowHeight = max(8, $pdf->getStringHeight($col1Width - 2, $providerLabel) + 2);

        $rowX = $pdf->GetX();
        $rowY = $pdf->GetY();

        $pdf->Rect($rowX, $rowY, $col1Width, $rowHeight);
        $pdf->Rect($rowX + $col1Width, $rowY, $col2Width, $rowHeight);

        $pdf->SetXY($rowX + 1, $rowY + 1);
        $pdf->MultiCell($col1Width - 2, 4, $providerLabel, 0, 'L');

        $pdf->SetXY($rowX, $rowY + $rowHeight);
        
        // Reset fill color to white for subsequent content
        $pdf->SetFillColor(255, 255, 255);

        $pdf->Ln(4);

        /*
        |--------------------------------------------------------------------------
        | PERSONAL INFORMATION TABLE
        |--------------------------------------------------------------------------
        */
        $pdf->SetFont($arialNarrowBold, '', 7);

        $piTableWidth = ($pageWidth - 24) * 0.42;
        $piCol1Width  = $piTableWidth / 2;
        $piCol2Width  = $piTableWidth / 2;

        $piTableStartY = $pdf->GetY();
        $titleHeight = 6;

        $checkboxSize = 2;
        $lineHeight   = 3;
        $paddingTop   = 4;
        $labelGap     = 1;
        $textGap      = 1;
        $leftInset   = 6;  // push checkbox/text away from left border
        $checkboxGap = 0.9;  // space between checkbox and label
        $rightInset  = 2;  // padding before column border

        // Row 0: PERSONAL INFORMATION header
        $pdf->Cell($piTableWidth, $titleHeight, 'PERSONAL INFORMATION', 1, 1, 'L');

        // Row 0.5: Data Privacy Notice
        $pdf->SetFont($arialNarrow, '', 7.5);
        $privacyNotice = 'Data Privacy Notice: All information collected through this feedback form will be treated with strict confidentiality and will be used solely for service improvement purposes, in compliance with the Data Privacy Act of 2012 (RA 10173)';
        $privacyNoticeHeight = max(10, $pdf->getStringHeight($piTableWidth - 4, $privacyNotice) + 3);

        $pdf->MultiCell(
            $piTableWidth,
            $privacyNoticeHeight,
            $privacyNotice,
            1,
            'L',
            false,
            1,
            '',
            '',
            true,
            0,
            false,
            true,
            $privacyNoticeHeight,
            'M'
        );

        // Shared helper widths
        $optionTextWidthLeft  = $piCol1Width - $leftInset - $rightInset - $checkboxSize - $checkboxGap;
        $optionTextWidthRight = $piCol2Width - $leftInset - $rightInset - $checkboxSize - $checkboxGap;

        // --------------------------------------------------------------------------
        // Row 1: CLIENT TYPE | SEX
        // --------------------------------------------------------------------------
        $clientTypes = [
            'Citizen',
            'Business',
            'Government (Employee or another agency)'
        ];
        $sexOptions = [
            'Male',
            'Female',
            'Prefer not to say'
        ];

        $row1X = $pdf->GetX();
        $row1Y = $pdf->GetY();

        // Measure left overlay content first
        $pdf->SetXY($row1X + 1, $row1Y + 1);
        $pdf->SetFont($arialBold, '', 7);
        $pdf->Cell(0, 3, 'CLIENT TYPE:', 0, 1, 'L');

        $pdf->SetFont($arialNarrow, '', 8);
        foreach ($clientTypes as $type) {
            $pdf->SetX($row1X + $leftInset);
            $currentY   = $pdf->GetY();
            $textHeight = max($lineHeight, $pdf->getStringHeight($optionTextWidthLeft, $type));

            $pdf->Rect($pdf->GetX(), $currentY + 0.5, $checkboxSize, $checkboxSize);
            $pdf->SetXY($pdf->GetX() + $checkboxSize + $checkboxGap, $currentY);
            $pdf->MultiCell($optionTextWidthLeft, $textHeight, $type, 0, 'L', false, 1);
        }
        $row1LeftEndY = $pdf->GetY();

        // Measure right overlay content
        $pdf->SetXY($row1X + $piCol1Width + 1, $row1Y + 1);
        $pdf->SetFont($arialBold, '', 7);
        $pdf->Cell(0, 3, 'SEX:', 0, 1, 'L');

        $pdf->SetFont($arialNarrow, '', 8);
        foreach ($sexOptions as $option) {
            $pdf->SetX($row1X + $piCol1Width + $leftInset - 5);
            $currentY   = $pdf->GetY();
            $textHeight = max($lineHeight, $pdf->getStringHeight($optionTextWidthRight, $option));

            $pdf->Rect($pdf->GetX(), $currentY + 0.5, $checkboxSize, $checkboxSize);
            $pdf->SetXY($pdf->GetX() + $checkboxSize + $checkboxGap, $currentY);
            $pdf->MultiCell($optionTextWidthRight, $textHeight, $option, 0, 'L', false, 1);
        }
        $row1RightEndY = $pdf->GetY();

        // Final row height based on overlays
        $row1Height = max($row1LeftEndY, $row1RightEndY) - $row1Y + 1;

        // Draw row borders after measuring
        $pdf->Rect($row1X, $row1Y, $piCol1Width, $row1Height);
        $pdf->Rect($row1X + $piCol1Width, $row1Y, $piCol2Width, $row1Height);

        // Move to next row
        $pdf->SetXY($row1X, $row1Y + $row1Height);

        // --------------------------------------------------------------------------
        // Row 2: CLIENT CATEGORY | AGE
        // --------------------------------------------------------------------------
        $clientCategories = ['Student', 'Visitor', 'Faculty', 'Admin/Personnel', 'Others'];
        $ageOptions = ['Below 18 y/o', '18-24 y/o', '25-34 y/o', '35-44 y/o', '45-54 y/o', '55-64 y/o', '65 y/o & above'];

        $row2Col1Width = $piTableWidth * 0.40; // narrower Client Category
        $row2Col2Width = $piTableWidth - $row2Col1Width; // wider Age

        $row2OptionTextWidthLeft  = $row2Col1Width - $leftInset - $rightInset - $checkboxSize - $checkboxGap;
        $row2OptionTextWidthRight = $row2Col2Width - $leftInset - $rightInset - $checkboxSize - $checkboxGap;

        $row2X = $pdf->GetX();
        $row2Y = $pdf->GetY();

        // Measure left overlay content first
        $pdf->SetXY($row2X + 1, $row2Y + 1);
        $pdf->SetFont($arialBold, '', 7);
        $pdf->Cell(0, 3, 'CLIENT CATEGORY:', 0, 1, 'L');

        $pdf->SetFont($arialNarrow, '', 8);
        foreach ($clientCategories as $category) {
            $pdf->SetX($row2X + $leftInset);
            $currentY = $pdf->GetY();

            $pdf->Rect($pdf->GetX(), $currentY + 0.5, $checkboxSize, $checkboxSize);

            $textX = $pdf->GetX() + $checkboxSize + $checkboxGap;

            if ($category === 'Others') {
                // Line 1: label
                $pdf->SetXY($textX, $currentY);
                $pdf->Cell($row2OptionTextWidthLeft, $lineHeight, 'Others:', 0, 1, 'L');

                // Line 2: underline below label
                $underlineY = $pdf->GetY() + 2.5;
                $underlineStartX = $textX + 1;
                $underlineEndX = $textX + ($row2OptionTextWidthLeft * 1);

                $pdf->Line($underlineStartX, $underlineY, $underlineEndX, $underlineY);

                // Move cursor below underline for next option
                $pdf->SetY($underlineY + 2);
            } else {
                $textHeight = max($lineHeight, $pdf->getStringHeight($row2OptionTextWidthLeft, $category));
                $pdf->SetXY($textX, $currentY);
                $pdf->MultiCell($row2OptionTextWidthLeft, $textHeight, $category, 0, 'L', false, 1);
            }
        }
        $row2LeftEndY = $pdf->GetY();

        // Measure right overlay content
        $pdf->SetXY($row2X + $row2Col1Width + 1, $row2Y + 1);
        $pdf->SetFont($arialBold, '', 7);
        $pdf->Cell(0, 3, 'AGE:', 0, 1, 'L');

        $pdf->SetFont($arialNarrow, '', 8);
        foreach ($ageOptions as $ageOption) {
            $pdf->SetX($row2X + $row2Col1Width + $leftInset);
            $currentY   = $pdf->GetY();
            $textHeight = max($lineHeight, $pdf->getStringHeight($row2OptionTextWidthRight, $ageOption));

            $pdf->Rect($pdf->GetX(), $currentY + 0.5, $checkboxSize, $checkboxSize);
            $pdf->SetXY($pdf->GetX() + $checkboxSize + $checkboxGap, $currentY);
            $pdf->MultiCell($row2OptionTextWidthRight, $textHeight, $ageOption, 0, 'L', false, 1);
        }
        $row2RightEndY = $pdf->GetY();

        // Final row height based on overlays
        $row2Height = max($row2LeftEndY, $row2RightEndY) - $row2Y + 1;

        // Draw row borders after measuring
        $pdf->Rect($row2X, $row2Y, $row2Col1Width, $row2Height);
        $pdf->Rect($row2X + $row2Col1Width, $row2Y, $row2Col2Width, $row2Height);

        // Move to next row
        $pdf->SetXY($row2X, $row2Y + $row2Height);

        // --------------------------------------------------------------------------
        // Row 3: WHICH OF THE FOLLOWING ARE YOU GOING TO EVALUATE?
        // --------------------------------------------------------------------------

        $evaluateInset = 6; // padding from the left border
        $evaluateTitle = 'WHICH OF THE FOLLOWING ARE YOU GOING TO EVALUATE?';

        $evaluateX = $pdf->GetX();
        $evaluateY = $pdf->GetY();

        // Measure overlay content first
        $pdf->SetXY($evaluateX + 1, $evaluateY + 1);
        $pdf->SetFont($arialNarrow, '', 8.5);
        $pdf->MultiCell($piTableWidth - 2, 0, $evaluateTitle, 0, 'L', false, 1);

        // First line options
        $pdf->SetFont($arialNarrow, '', 7);
        $line1Y   = $pdf->GetY();
        $currentX = $evaluateX + $evaluateInset;

        $line1Options = ['Student', 'Faculty', 'Admin/Personnel'];

        foreach ($line1Options as $option) {
            $pdf->SetXY($currentX, $line1Y);
            $pdf->Rect($currentX, $line1Y + 0.5, $checkboxSize, $checkboxSize);

            $currentX += $checkboxSize + 1;
            $labelWidth = $pdf->GetStringWidth($option);

            $pdf->SetXY($currentX, $line1Y);
            $pdf->Cell($labelWidth, $lineHeight, $option, 0, 0, 'L');

            $currentX += $labelWidth + 6;
        }

        // Second line: Others
        $line2Y = $line1Y + $lineHeight + 1;

        $pdf->SetXY($evaluateX + $evaluateInset, $line2Y);
        $pdf->Rect($evaluateX + $evaluateInset, $line2Y + 0.5, $checkboxSize, $checkboxSize);

        $textX = $evaluateX + $evaluateInset + $checkboxSize + 1;

        $pdf->SetXY($textX, $line2Y);
        $pdf->Cell(0, $lineHeight, 'Others:', 0, 0, 'L');

        $gapAfterLabel = 3;       // move line to the right
        $underlineLength = 35;    // control length

        $lineStartX = $textX + $pdf->GetStringWidth('Others:') + $gapAfterLabel;
        $lineEndX   = $lineStartX + $underlineLength;
        $lineY      = $line2Y + $lineHeight - 0.5;

        $pdf->Line($lineStartX, $lineY, $lineEndX, $lineY);

        $pdf->Ln();

        // Final row height based on overlay
        $evaluateEndY   = $pdf->GetY();
        $evaluateHeight = $evaluateEndY - $evaluateY + 1;

        // Draw border after measuring
        $pdf->Rect($evaluateX, $evaluateY, $piTableWidth, $evaluateHeight);

        // Move to next row
        $pdf->SetXY($evaluateX, $evaluateY + $evaluateHeight);

        // --------------------------------------------------------------------------
        // Row 4: NAME (Optional)
        // --------------------------------------------------------------------------
        $pdf->SetFont($arialRegular, '', 7);

        $nameLabel = 'NAME (Optional):';
        $nameUnderline = '________________________________________';
        $nameText = $nameLabel . $nameUnderline;

        $nameRowHeight = 8;

        $nameX = $pdf->GetX();
        $nameY = $pdf->GetY();

        // Draw border
        $pdf->Rect($nameX, $nameY, $piTableWidth, $nameRowHeight);

        // Vertically center text
        $textHeight = 3;
        $textY = $nameY + (($nameRowHeight - $textHeight) / 2);

        // Draw text
        $pdf->SetXY($nameX + 1, $textY);
        $pdf->Cell($piTableWidth - 2, $textHeight, $nameText, 0, 1, 'L');

        // Move to true end of row
        $pdf->SetXY($nameX, $nameY + $nameRowHeight);

        // --------------------------------------------------------------------------
        // Row 5: EMAIL ADDRESS (Optional)
        // --------------------------------------------------------------------------
        $emailLabel = 'EMAIL ADDRESS (Optional):';
        $emailUnderline = '_______________________________';
        $emailText = $emailLabel . $emailUnderline;

        $emailRowHeight = 8;

        $emailX = $pdf->GetX();
        $emailY = $pdf->GetY();

        // Draw border
        $pdf->Rect($emailX, $emailY, $piTableWidth, $emailRowHeight);

        // Vertically center text
        $textHeight = 3;
        $textY = $emailY + (($emailRowHeight - $textHeight) / 2);

        // Draw text
        $pdf->SetXY($emailX + 1, $textY);
        $pdf->Cell($piTableWidth - 2, $textHeight, $emailText, 0, 1, 'L');

        // Move to true end of row
        $pdf->SetXY($emailX, $emailY + $emailRowHeight);

        // Final Personal Information table measurements
        $piTableEndY = $emailY + $emailRowHeight;
        $piTableHeight = $piTableEndY - $piTableStartY;

        // --------------------------------------------------------------------------
        // CITIZEN'S CHARTER (CC) TABLE - POSITIONED BESIDE PERSONAL INFO TABLE
        // --------------------------------------------------------------------------

        // Section header font
        $pdf->SetFont($arialNarrowBold, '', 7);

        // CC table dimensions - keep same position logic
        $ccTableWidth = ($pageWidth - 24) - $piTableWidth - 2;
        $ccTableX = 12 + $piTableWidth + 2;

        // CC table starts aligned with PI table
        $pdf->SetXY($ccTableX, $piTableStartY);

        // --------------------------------------------------------------------------
        // SHARED CC SPACING / PADDING SETTINGS
        // --------------------------------------------------------------------------
        $ccCellPadX     = 0.5;
        $ccCellPadY     = 1.0;
        $ccCheckboxSize = 1.5;
        $ccCheckboxGap  = 0.1;
        $ccRightInset   = 0.5;
        $ccOptionShift = 1.0; // adjust this value

        // --------------------------------------------------------------------------
        // SMALL AUTO-FIT HELPERS
        // --------------------------------------------------------------------------
        $fitFontToBox = function ($pdf, $fontName, $fontStyle, $startSize, $minSize, $width, $text, $maxHeight, $extraPad = 0) {
            $size = $startSize;

            while ($size >= $minSize) {
                $pdf->SetFont($fontName, $fontStyle, $size);
                $h = $pdf->getStringHeight($width, $text);

                if (($h + $extraPad) <= $maxHeight) {
                    return $size;
                }

                $size -= 0.2;
            }

            return $minSize;
        };

        $fitFontToWidth = function ($pdf, $fontName, $fontStyle, $startSize, $minSize, $text, $maxWidth) {
            $size = $startSize;

            while ($size >= $minSize) {
                $pdf->SetFont($fontName, $fontStyle, $size);

                if ($pdf->GetStringWidth($text) <= $maxWidth) {
                    return $size;
                }

                $size -= 0.2;
            }

            return $minSize;
        };

        // --------------------------------------------------------------------------
        // TITLE ROW
        // --------------------------------------------------------------------------
        $ccTitle = 'CITIZEN\'S CHARTER';
        $titleHeight = 6;

        $ccTitleFont = $fitFontToWidth(
            $pdf,
            $arialNarrowBold,
            '',
            6,
            4.5,
            $ccTitle,
            ($ccTableWidth * 0.5) - 2
        );

        $pdf->SetFont($arialNarrowBold, '', $ccTitleFont);
        $pdf->Cell($ccTableWidth * 0.5, $titleHeight, $ccTitle, 1, 1, 'L');

        // --------------------------------------------------------------------------
        // INSTRUCTIONS ROW
        // --------------------------------------------------------------------------
        $pdf->SetXY($ccTableX, $piTableStartY + $titleHeight);

        $ccInstructions = 'INSTRUCTIONS: Check mark (✔) your answer to the Citizen\'s Charter (CC) questions. The Citizen\'s Charter is an official document that reflects the services of a government agency/office including its requirements, fees, and processing times among others.';
        $instructionsHeight = 18;

        $ccInstructionFont = $fitFontToBox(
            $pdf,
            $arialNarrow,
            '',
            9,
            4.5,
            $ccTableWidth - ($ccCellPadX * 2),
            $ccInstructions,
            $instructionsHeight - ($ccCellPadY * 2),
            0.5
        );

        $pdf->SetFont($arialNarrow, '', $ccInstructionFont);
        $pdf->SetFillColor(220, 220, 220);
        $pdf->MultiCell(
            $ccTableWidth,
            $instructionsHeight,
            $ccInstructions,
            1,
            'L',
            true,
            1,
            '',
            '',
            true,
            0,
            false,
            true,
            $instructionsHeight,
            'M'
        );

        // --------------------------------------------------------------------------
        // COLUMN WIDTHS
        // Must total 100% of CC table width
        // --------------------------------------------------------------------------
        $ccCol1Width = $ccTableWidth * 0.10;
        $ccCol2Width = $ccTableWidth * 0.28;
        $ccCol3Width = $ccTableWidth - $ccCol1Width - $ccCol2Width; // 0.56 remainder

        // --------------------------------------------------------------------------
        // DATA
        // --------------------------------------------------------------------------
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

        // --------------------------------------------------------------------------
        // CALCULATE AVAILABLE HEIGHT
        // --------------------------------------------------------------------------
        $ccRowsStartY = $pdf->GetY();
        $ccRowsAvailableHeight = $piTableHeight - ($ccRowsStartY - $piTableStartY);

        // --------------------------------------------------------------------------
        // MEASURE NATURAL CONTENT HEIGHTS PER ROW
        // --------------------------------------------------------------------------
        $rowHeights = [];
        $totalContentHeight = 0;

        foreach ($ccRows as $row) {
            $questionTextWidth = $ccCol2Width - $ccCellPadX;

            $questionFont = $fitFontToBox(
                $pdf,
                $arialNarrowBold,
                '',
                5,
                3.8,
                $questionTextWidth,
                $row['question'],
                20
            );

            $pdf->SetFont($arialNarrowBold, '', $questionFont);
            $questionHeight = $pdf->getStringHeight($questionTextWidth, $row['question']);

            // -------------------------
            // Measure options height
            // -------------------------
            if ($row['label'] === 'CC2') {
                $leftOptions = [
                    '1. Easy to see',
                    '2. Somewhat easy to see',
                    '3. Difficult to see',
                ];

                $rightOptions = [
                    '4. Not visible at all',
                    '5. N/A',
                ];

                $middleGap = 6;
                $innerW = $ccCol3Width - ($ccCellPadX * 2) - $ccRightInset;
                $halfW = ($innerW - $middleGap) / 2;

                $leftTextWidth  = $halfW - $ccCheckboxSize - $ccCheckboxGap;
                $rightTextWidth = $halfW - $ccCheckboxSize - $ccCheckboxGap;

                $leftHeight = 0;
                foreach ($leftOptions as $opt) {
                    $optionFontThis = $fitFontToBox(
                        $pdf,
                        $arialNarrow,
                        '',
                        7.5,
                        5,
                        $leftTextWidth,
                        $opt,
                        8
                    );

                    $pdf->SetFont($arialNarrow, '', $optionFontThis);
                    $optHeight = max(3.0, $pdf->getStringHeight($leftTextWidth, $opt));
                    $leftHeight += $optHeight + 0.5;
                }

                $rightHeight = 0;
                foreach ($rightOptions as $opt) {
                    $optionFontThis = $fitFontToBox(
                        $pdf,
                        $arialNarrow,
                        '',
                        7.5,
                        5,
                        $rightTextWidth,
                        $opt,
                        8
                    );

                    $pdf->SetFont($arialNarrow, '', $optionFontThis);
                    $optHeight = max(3.0, $pdf->getStringHeight($rightTextWidth, $opt));
                    $rightHeight += $optHeight + 0.5;
                }

                $optionBlockHeight = max($leftHeight, $rightHeight);
            } else {
                $optionTextWidth = $ccCol3Width - ($ccCellPadX * 2) - $ccCheckboxSize - $ccCheckboxGap - $ccRightInset;
                $optionBlockHeight = 0;

                foreach ($row['options'] as $opt) {
                    $optionFontThis = $fitFontToBox(
                        $pdf,
                        $arialNarrow,
                        '',
                        7.5,
                        5,
                        $optionTextWidth,
                        $opt,
                        8
                    );

                    $pdf->SetFont($arialNarrow, '', $optionFontThis);
                    $optHeight = max(3.0, $pdf->getStringHeight($optionTextWidth, $opt));
                    $optionBlockHeight += $optHeight + 0.5;
                }
            }

            $naturalHeight = max(
                $questionHeight + ($ccCellPadY * 2),
                $optionBlockHeight + ($ccCellPadY * 2),
                12
            );

            $rowHeights[] = $naturalHeight;
            $totalContentHeight += $naturalHeight;
        }

        // --------------------------------------------------------------------------
        // SCALE ROW HEIGHTS TO EXACTLY FIT PI TABLE HEIGHT
        // --------------------------------------------------------------------------
        $scaledRowHeights = [];
        foreach ($rowHeights as $h) {
            $scaledRowHeights[] = $ccRowsAvailableHeight * ($h / $totalContentHeight);
        }
        $rowHeights = $scaledRowHeights;
        $totalTableHeight = array_sum($rowHeights);

        // --------------------------------------------------------------------------
        // DRAW TABLE FRAME ONCE
        // --------------------------------------------------------------------------
        $startY = $pdf->GetY();
        $pdf->SetXY($ccTableX, $startY);

        $pdf->Cell($ccCol1Width, $totalTableHeight, '', 1, 0);
        $pdf->Cell($ccCol2Width, $totalTableHeight, '', 1, 0);
        $pdf->Cell($ccCol3Width, $totalTableHeight, '', 1, 1);

        // Row dividers
        $currentY = $startY;
        foreach ($rowHeights as $h) {
            $currentY += $h;
            if ($currentY < $startY + $totalTableHeight) {
                $pdf->Line($ccTableX, $currentY, $ccTableX + $ccTableWidth, $currentY);
            }
        }

        // --------------------------------------------------------------------------
        // INSERT CONTENT
        // --------------------------------------------------------------------------
        foreach ($ccRows as $i => $row) {
            $rowY = $startY + array_sum(array_slice($rowHeights, 0, $i));
            $rowH = $rowHeights[$i];

            // Shade CC2 row
            if ($row['label'] === 'CC2') {
                $pdf->SetFillColor(220, 220, 220);

                $pdf->Rect($ccTableX, $rowY, $ccCol1Width, $rowH, 'F');
                $pdf->Rect($ccTableX + $ccCol1Width, $rowY, $ccCol2Width, $rowH, 'F');
                $pdf->Rect($ccTableX + $ccCol1Width + $ccCol2Width, $rowY, $ccCol3Width, $rowH, 'F');

                // redraw borders
                $pdf->Rect($ccTableX, $rowY, $ccCol1Width, $rowH, 'D');
                $pdf->Rect($ccTableX + $ccCol1Width, $rowY, $ccCol2Width, $rowH, 'D');
                $pdf->Rect($ccTableX + $ccCol1Width + $ccCol2Width, $rowY, $ccCol3Width, $rowH, 'D');
            }

            // -------------------------
            // Column 1: Label (top-left anchored)
            // -------------------------
            $labelFont = $fitFontToBox(
                $pdf,
                $arialNarrowBold,
                '',
                8,
                6,
                $ccCol1Width - ($ccCellPadX * 2),
                $row['label'],
                $rowH - ($ccCellPadY * 2)
            );

            $pdf->SetFont($arialNarrowBold, '', $labelFont);
            $pdf->SetXY($ccTableX + $ccCellPadX, $rowY + $ccCellPadY);
            $pdf->Cell(
                $ccCol1Width - ($ccCellPadX * 2),
                3,
                $row['label'],
                0,
                0,
                'L'
            );

            // -------------------------
            // Column 2: Question (top-left anchored)
            // Reduced right padding
            // -------------------------
            $questionTextWidth = $ccCol2Width - $ccCellPadX;

            $questionFont = $fitFontToBox(
                $pdf,
                $arialNarrowBold,
                '',
                8,
                6,
                $questionTextWidth,
                $row['question'],
                $rowH - ($ccCellPadY * 2),
                0.5
            );

            $pdf->SetFont($arialNarrowBold, '', $questionFont);
            $pdf->SetXY(
                $ccTableX + $ccCol1Width + $ccCellPadX,
                $rowY + $ccCellPadY
            );
            $pdf->MultiCell(
                $questionTextWidth,
                0,
                $row['question'],
                0,
                'L',
                false,
                1,
                '',
                '',
                true,
                0,
                false,
                true,
                0,
                'T'
            );

            // -------------------------
            // Column 3: Options
            // -------------------------
            $col3X = $ccTableX + $ccCol1Width + $ccCol2Width;
            $innerX = $col3X + $ccCellPadX + $ccOptionShift;
            $innerY = $rowY + $ccCellPadY;
            $innerW = $ccCol3Width - ($ccCellPadX * 2) - $ccRightInset;

            // special layout for CC2
            if ($row['label'] === 'CC2') {
                $leftOptions  = [
                    '1. Easy to see',
                    '2. Somewhat easy to see',
                    '3. Difficult to see',
                ];

                $rightOptions = [
                    '4. Not visible at all',
                    '5. N/A',
                ];

                // gap between left and right groups
                $middleGap = 2;

                // split available width into 2 columns
                $halfW = ($innerW - $middleGap) / 2;

                // width available for text after checkbox
                $leftTextWidth  = $halfW - $ccCheckboxSize - $ccCheckboxGap;
                $rightTextWidth = $halfW - $ccCheckboxSize - $ccCheckboxGap;

                // -----------------
                // Measure LEFT COLUMN
                // -----------------
                $leftFonts = [];
                $leftHeights = [];
                $leftBlockHeight = 0;

                foreach ($leftOptions as $opt) {
                    $optFont = $fitFontToBox(
                        $pdf,
                        $arialNarrow,
                        '',
                        8.2,
                        5,
                        $leftTextWidth,
                        $opt,
                        8
                    );

                    $pdf->SetFont($arialNarrow, '', $optFont);
                    $optHeight = max(3.0, $pdf->getStringHeight($leftTextWidth, $opt));

                    $leftFonts[] = $optFont;
                    $leftHeights[] = $optHeight;
                    $leftBlockHeight += $optHeight + 0.5;
                }

                // -----------------
                // Measure RIGHT COLUMN
                // -----------------
                $rightFonts = [];
                $rightHeights = [];
                $rightBlockHeight = 0;

                foreach ($rightOptions as $opt) {
                    $optFont = $fitFontToBox(
                        $pdf,
                        $arialNarrow,
                        '',
                        8,
                        5,
                        $rightTextWidth,
                        $opt,
                        8
                    );

                    $pdf->SetFont($arialNarrow, '', $optFont);
                    $optHeight = max(3.0, $pdf->getStringHeight($rightTextWidth, $opt));

                    $rightFonts[] = $optFont;
                    $rightHeights[] = $optHeight;
                    $rightBlockHeight += $optHeight + 0.5;
                }

                // Center the options block vertically so bottom spacing is more balanced
                $blockHeight = max($leftBlockHeight, $rightBlockHeight);
                $startOptionsY = $rowY + max($ccCellPadY, ($rowH - $blockHeight) / 2);

                // -----------------
                // DRAW LEFT COLUMN
                // -----------------
                $leftY = $startOptionsY;

                foreach ($leftOptions as $j => $opt) {
                    $optFont = $leftFonts[$j];
                    $optHeight = $leftHeights[$j];

                    $checkboxX = $innerX;
                    $textX = $checkboxX + $ccCheckboxSize + $ccCheckboxGap;
                    $textY = $leftY;
                    $checkboxY = $textY + 1;

                    $pdf->Rect($checkboxX, $checkboxY, $ccCheckboxSize, $ccCheckboxSize);

                    $pdf->SetFont($arialNarrow, '', $optFont);
                    $pdf->SetXY($textX, $textY);
                    $pdf->MultiCell(
                        $leftTextWidth,
                        $optHeight,
                        $opt,
                        0,
                        'L',
                        false,
                        1,
                        '',
                        '',
                        true,
                        0,
                        false,
                        true,
                        0,
                        'T'
                    );

                    $leftY = $pdf->GetY() + 0.5;
                }

                // -----------------
                // DRAW RIGHT COLUMN
                // -----------------
                $rightXBase = $innerX + $halfW + $middleGap;
                $rightY = $startOptionsY;

                foreach ($rightOptions as $j => $opt) {
                    $optFont = $rightFonts[$j];
                    $optHeight = $rightHeights[$j];

                    $checkboxX = $rightXBase;
                    $textX = $checkboxX + $ccCheckboxSize + $ccCheckboxGap;
                    $textY = $rightY;
                    $checkboxY = $textY + 1;

                    $pdf->Rect($checkboxX, $checkboxY, $ccCheckboxSize, $ccCheckboxSize);

                    $pdf->SetFont($arialNarrow, '', $optFont);
                    $pdf->SetXY($textX, $textY);
                    $pdf->MultiCell(
                        $rightTextWidth,
                        $optHeight,
                        $opt,
                        0,
                        'L',
                        false,
                        1,
                        '',
                        '',
                        true,
                        0,
                        false,
                        true,
                        0,
                        'T'
                    );

                    $rightY = $pdf->GetY() + 0.5;
                }
            } else {
                // default layout for CC1 and CC3
                $optionTextWidth = $ccCol3Width - ($ccCellPadX * 2) - $ccCheckboxSize - $ccCheckboxGap - $ccRightInset;

                $optionHeights = [];
                $optionFonts = [];

                foreach ($row['options'] as $opt) {
                    $optFont = $fitFontToBox(
                        $pdf,
                        $arialNarrow,
                        '',
                        8.3,
                        5,
                        $optionTextWidth,
                        $opt,
                        8
                    );

                    $pdf->SetFont($arialNarrow, '', $optFont);
                    $optHeight = max(3.0, $pdf->getStringHeight($optionTextWidth, $opt));

                    $optionFonts[] = $optFont;
                    $optionHeights[] = $optHeight;
                }

                $runningY = $rowY + $ccCellPadY;

                foreach ($row['options'] as $j => $option) {
                    $optFont = $optionFonts[$j];
                    $optHeight = $optionHeights[$j];

                    $checkboxX = $col3X + $ccCellPadX + $ccOptionShift;
                    $textX = $checkboxX + $ccCheckboxSize + $ccCheckboxGap;
                    $textY = $runningY;
                    $checkboxY = $textY + 1;

                    $pdf->Rect($checkboxX, $checkboxY, $ccCheckboxSize, $ccCheckboxSize);

                    $boldPart = "(Answer 'N/A' on CC2 and CC3)";

                    $pdf->SetXY($textX, $textY);

                    if (strpos($option, $boldPart) !== false) {
                        $mainText = str_replace($boldPart, '', $option);

                        $html =
                            htmlspecialchars($mainText, ENT_QUOTES, 'UTF-8') .
                            ' <b>' . htmlspecialchars($boldPart, ENT_QUOTES, 'UTF-8') . '</b>';

                        $pdf->SetFont($arialNarrow, '', $optFont);
                        $pdf->writeHTMLCell(
                            $optionTextWidth,
                            $optHeight,
                            $textX,
                            $textY,
                            $html,
                            0,
                            1,
                            false,
                            true,
                            'L',
                            true
                        );
                    } else {
                        $pdf->SetFont($arialNarrow, '', $optFont);
                        $pdf->MultiCell(
                            $optionTextWidth,
                            $optHeight,
                            $option,
                            0,
                            'L',
                            false,
                            1,
                            '',
                            '',
                            true,
                            0,
                            false,
                            true,
                            0,
                            'T'
                        );
                    }

                    $runningY = $pdf->GetY() + 0.5;
                }
            }
        }
        // Move Y back to end of PI table so next content stays aligned
        $pdf->SetY($piTableEndY);


        $pdf->Ln(1);
        // --------------------------------------------------------------------------
        // SQD TABLE (10 rows x 7 columns)
        // --------------------------------------------------------------------------

        $rows = 10;
        $cols = 8; // 1 extra column for leftmost (number/blank)

        // Calculate available width for table (page width minus margins)
        $margins = $pdf->getMargins();
        $availableWidth = $pageWidth - $margins['left'] - $margins['right'];

        // Reduce the width of the SQD table by 20mm (adjust as needed)
        $availableWidth -= 40;

        $colWidths = [];

        $pdf->SetFont($arialNarrow, '', 8.5);

        // --------------------------------------------------------------------------
        // SQD ROW LABELS AND ROWS (all in one table)
        // --------------------------------------------------------------------------

        $sqdRows = [
            'I am satisfied with the service that I availed.',
            'I spent a reasonable amount of time for my transaction.',
            'The office followed the transaction\'s requirements and steps based on the information provided.',
            'The steps (including payment) I needed to do for my transaction were easy and simple.',
            'I easily found information about my transaction from the office or its website.',
            'I paid a reasonable amount of fees for my transaction.',
            'I feel the office was fair to everyone, or "walang palakasan", during my transaction.',
            'I was treated courteously by the staff, and (if asked for help) the staff was helpful.',
            'I got what I needed from the government office, or (if denied) denial of request was sufficiently explained to me.',
        ];

        // Table header
        $headers = [
            '', // new leftmost column (blank)
            ' ',           // first column for questions
            "Strongly Agree",
            "Agree",
            "Neither Agree\nnor Disagree",
            "Disagree",
            "Strongly Disagree",
            "N/A\nNot\nApplicable"
        ];

        $naturalWidths = [];

        // SQD label column
        $naturalWidths[0] = $pdf->GetStringWidth('SQD8') + 6;

        // Question column (based on longest question)
        $maxQuestionWidth = 0;
        foreach ($sqdRows as $row) {
            $w = $pdf->GetStringWidth($row);
            if ($w > $maxQuestionWidth) {
                $maxQuestionWidth = $w;
            }
        }
        $naturalWidths[1] = min($maxQuestionWidth + 20, $availableWidth * 0.45);

        // Rating columns
        for ($i = 2; $i < $cols; $i++) {

            $lines = explode("\n", $headers[$i]);
            $maxWidth = 0;

            foreach ($lines as $line) {
                $lineWidth = $pdf->GetStringWidth($line);
                if ($lineWidth > $maxWidth) {
                    $maxWidth = $lineWidth;
                }
            }

            $naturalWidths[$i] = min($maxWidth + 8, 22);
        }

        // Scale columns so total width matches table width
        $totalNatural = array_sum($naturalWidths);
        $scale = $availableWidth / $totalNatural;

        foreach ($naturalWidths as $i => $w) {
            $colWidths[$i] = $w * $scale;
        }

        // Insert a new row with just one column as the new header above the SQD table
        // Section header → Arial Narrow Bold
        $pdf->SetFont($arialNarrowBold, '', 7);
        $titleText = 'LEVEL OF SATISFACTION';

        // fixed anchor point for the whole SQD header block
        $headerStartX = $pdf->GetX();
        $headerBaseY  = $pdf->GetY();

        // move ONLY the title cell
        $titleOffsetY  = 6.7;
        $headerOffsetY = 0;

        // Width aligned to INSTRUCTIONS cell (first 2 columns)
        $titleWidth = $colWidths[0] + $colWidths[1] - 5;
        $titleHeight = $pdf->getStringHeight($titleWidth, $titleText);

        // draw title lower WITHOUT affecting the rest of the table
        $pdf->SetXY($headerStartX, $headerBaseY + $titleOffsetY);
        $pdf->MultiCell(
            $titleWidth,
            $titleHeight,
            $titleText,
            1,
            'C',
            false,
            1
        );

        // keep the header row position based on the original base Y
        $titleY = $headerBaseY;

        // Rating labels in header → Arial Narrow Regular
        $pdf->SetFont($arialNarrow, '', 8.5);

        // --------------------------------------------------------------------------
        // DRAW HEADER ROW WITH EMOJI IMAGES
        // --------------------------------------------------------------------------
        $emojiSize = 6;

        // fixed header row position
        $headerRowX = $headerStartX;
        $headerRowY = $titleY + $titleHeight + $headerOffsetY;

        // --- Auto-adjust header font size ---
        $headerFontMin = 5.5;
        $headerFontMax = 8.5;
        $headerFontSizes = [];

        for ($i = 2; $i < count($headers); $i++) {
            $cellWidth = $colWidths[$i];
            $lines = explode("\n", $headers[$i]);
            $maxFont = $headerFontMax;

            foreach ($lines as $line) {
                $font = $headerFontMax;
                while ($font > $headerFontMin) {
                    // Rating labels → Arial Narrow Regular
                    $pdf->SetFont($arialNarrow, '', $font);
                    if ($pdf->GetStringWidth($line) <= $cellWidth - 1) {
                        break;
                    }
                    $font -= 0.2;
                }
                if ($font < $maxFont) {
                    $maxFont = $font;
                }
            }

            $headerFontSizes[$i] = $maxFont;
        }

        $autoHeaderFontSize = min($headerFontSizes);

        // calculate common header height
        $headerRowHeight = 14;
        $maxHeaderHeight = $headerRowHeight;

        for ($i = 2; $i < count($headers); $i++) {
            // Rating labels → Arial Narrow Regular
            $pdf->SetFont($arialNarrow, '', $autoHeaderFontSize);

            $textHeight = $pdf->getStringHeight(
                $colWidths[$i],
                $headers[$i]
            );

            if ($textHeight + 7 > $maxHeaderHeight) {
                $maxHeaderHeight = $textHeight + 7; // text + emoji space
            }
        }

        $headerRowHeight = $maxHeaderHeight;

        // --- Auto-adjust font size for INSTRUCTIONS cell ---
        $instructionsCellText = "INSTRUCTIONS: For SQD 0-8, please put a check mark on the column that corresponds to your answer.";
        $instructionsCellWidth = $colWidths[0] + $colWidths[1];
        $instructionsFont = $headerFontMax;

        while ($instructionsFont > $headerFontMin) {
            // Instructions → Arial Narrow Regular
            $pdf->SetFont($arialNarrow, '', $instructionsFont);
            $strHeight = $pdf->getStringHeight($instructionsCellWidth, $instructionsCellText);

            if (
                $strHeight <= $headerRowHeight
            ) {
                break;
            }

            $instructionsFont -= 0.2;
        }

        // 1. Instructions merged cell at fixed coordinates

        $reduceTop = 7; // how much height to remove from the top
        $instructionsHeight = $headerRowHeight - $reduceTop;
        $instructionsY = $headerRowY + $reduceTop;

        // auto-fit font inside the reduced box
        $instructionsFontMax = $headerFontMax;
        $instructionsFontMin = 4.5;
        $instructionsAutoFont = $instructionsFontMax;

        $innerWidth = $instructionsCellWidth - 2;   // small inner padding
        $innerHeight = $instructionsHeight - 2;

        while ($instructionsAutoFont > $instructionsFontMin) {
            // Instructions → Arial Narrow Regular
            $pdf->SetFont($arialNarrow, '', $instructionsAutoFont);

            $textHeight = $pdf->getStringHeight($innerWidth, $instructionsCellText);

            if ($textHeight <= $innerHeight) {
                break;
            }

            $instructionsAutoFont -= 0.2;
        }

        // draw the reduced border manually
        $pdf->Rect(
            $headerRowX,
            $instructionsY,
            $instructionsCellWidth,
            $instructionsHeight
        );

        // draw the text inside the reduced box
        // Instructions → Arial Narrow Regular
        $pdf->SetFont($arialNarrow, '', $instructionsAutoFont);
        $pdf->SetXY($headerRowX + 1, $instructionsY + 1);
        $pdf->MultiCell(
            $innerWidth,
            0,
            $instructionsCellText,
            0,
            'L',
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

        // 2. Remaining header cells at fixed coordinates
        $currentX = $headerRowX + $colWidths[0] + $colWidths[1];

        for ($i = 2; $i < count($headers); $i++) {
            $pdf->SetXY($currentX, $headerRowY);
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

            $currentX += $colWidths[$i];
        }

        // 3. Overlay emoji images and header text
        $currentX = $headerRowX + $colWidths[0] + $colWidths[1];

        for ($i = 2; $i < count($headers); $i++) {

            $emojiIdx  = $i - 1;
            $numberIdx = $i - 2;
            $emojiPath = isset($emojiImages[$emojiIdx]) ? $emojiImages[$emojiIdx] : '';

            // get cell dimensions
            $cellWidth  = $colWidths[$i];
            $cellHeight = $headerRowHeight;

            // ----------------------------
            // AUTO FONT SIZE FOR TOP TEXT (Rating labels → Arial Narrow Regular)
            // ----------------------------
            $topText = $headers[$i];
            $topFont = 8.5;
            $topFontMin = 4.5;

            while ($topFont > $topFontMin) {

                $pdf->SetFont($arialNarrow, '', $topFont);

                $textHeight = $pdf->getStringHeight($cellWidth - 1, $topText);

                if ($textHeight <= ($cellHeight * 0.28)) {
                    break;
                }

                $topFont -= 0.2;
            }

            // ----------------------------
            // AUTO EMOJI SIZE
            // ----------------------------
            $emojiSize = min(
                $cellWidth * 0.45,
                $cellHeight * 0.22
            );

            $emojiSize = max(3, min(7, $emojiSize));

            // ----------------------------
            // AUTO FONT SIZE FOR BOTTOM TEXT (Rating numbers → Arial Bold)
            // ----------------------------
            $bottomNumbers = ['5','4','3','2','1',''];
            $numberIdx = $i - 2;

            $bottomText = isset($bottomNumbers[$numberIdx]) ? $bottomNumbers[$numberIdx] : '';
            $bottomFont = 8;
            $bottomFontMin = 4;

            while ($bottomFont > $bottomFontMin) {

                // Rating numbers → Arial Bold
                $pdf->SetFont($arialBold, '', $bottomFont);

                $textHeight = $pdf->getStringHeight($cellWidth - 1, $bottomText);

                if ($textHeight <= ($cellHeight * 0.28)) {
                    break;
                }

                $bottomFont -= 0.2;
            }

            // ----------------------------
            // VERTICAL POSITIONS
            // ----------------------------
            $topTextY    = $headerRowY + 0.5;
            $emojiY      = $headerRowY + ($cellHeight * 0.38);
            $bottomTextY = $headerRowY + $cellHeight - 4;

            // ----------------------------
            // TOP TEXT (Rating labels → Arial Narrow Regular)
            // ----------------------------
            $pdf->SetXY($currentX, $topTextY);
            $pdf->SetFont($arialNarrow, '', $topFont);

            $pdf->MultiCell(
                $cellWidth,
                0,
                $topText,
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

            // ----------------------------
            // EMOJI
            // ----------------------------
            if (!empty($emojiPath) && file_exists($emojiPath)) {

                $emojiX = $currentX + ($cellWidth - $emojiSize) / 2;

                $pdf->Image(
                    $emojiPath,
                    $emojiX,
                    $emojiY,
                    $emojiSize,
                    $emojiSize
                );
            }

            // ----------------------------
            // BOTTOM TEXT (Rating numbers → Arial Bold)
            // ----------------------------
            // do not print bottom text for N/A column
        if ($i != count($headers) - 1) {

            $pdf->SetXY($currentX, $bottomTextY);
            // Rating numbers → Arial Bold
            $pdf->SetFont($arialBold, '', $bottomFont);

            $pdf->MultiCell(
                $cellWidth,
                0,
                $bottomText,
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
        }

            $currentX += $cellWidth;
        }

        $pdf->SetY($headerRowY + $headerRowHeight);

        // --- Dynamically calculate row height and font size for SQD table ---
        $numRows = count($sqdRows);
        $tableTopY = $pdf->GetY();
        $margins = $pdf->getMargins();
        $pageHeight = $pdf->getPageHeight();
        $bottomMargin = $margins['bottom'];
        $availableHeight = $pageHeight - $tableTopY - $bottomMargin - 35; // 35 is a buffer for content after table

        // Minimum and maximum font sizes
        $maxFontSize = 8.5;
        $minFontSize = 6.5;

        // Minimum and maximum row heights
        $maxRowHeight = 10;
        $minRowHeight = 6;

        // Calculate row height and font size
        $rowHeight = max($minRowHeight, min($maxRowHeight, $availableHeight / max(1, $numRows)));
        // Font size is proportional to row height
        $fontSize = max($minFontSize, min($maxFontSize, $rowHeight * 1.1));

        // SQD questions → Arial Narrow Regular
        foreach ($sqdRows as $rowIdx => $rowText) {
        $rowStartX = $headerStartX;
        $rowStartY = $pdf->GetY();
        $pdf->SetXY($rowStartX, $rowStartY);

        // SQD label column → Arial Narrow Bold
        $pdf->SetFont($arialNarrowBold, '', $fontSize);
        $label = 'SQD' . $rowIdx;
        $pdf->Cell($colWidths[0], $rowHeight, $label, 1, 0, 'C');

        // Question column → Arial Narrow Bold
        $pdf->SetFont($arialNarrowBold, '', $fontSize);
        $pdf->MultiCell(
            $colWidths[1],
            $rowHeight,
            $rowText,
            1,
            'L',
                false,
                0,
                '',
                '',
                true,
                0,
                false,
                true,
                $rowHeight,
                'M'
            );

            // Rating columns
            for ($c = 2; $c < $cols; $c++) {
                $pdf->Cell($colWidths[$c], $rowHeight, '', 1, 0, 'C');
            }

            $pdf->Ln();
        }

    $pdf->Ln(5);
        // --------------------------------------------------------------------------
        // SUGGESTIONS (1x1 table responsive)
        // --------------------------------------------------------------------------
        // Options / body text → Arial Narrow Regular
        $pdf->SetFont($arialNarrowBold, '', 8.5);

        // move slightly upward like your original code
        $pdf->SetY($headerRowY);

        $sqdWidth = array_sum($colWidths);
        $gap = 4; // space between tables

        $boxLeft = $margins['left'] + $sqdWidth + $gap;
        $pdf->SetX($boxLeft);

        // calculate responsive width
        $boxWidth = $pageWidth - $boxLeft - $margins['right'] - 5;

        // adjustable height
        $boxHeight = 22;

        // draw the outer table cell
        $pdf->Rect($boxLeft, $pdf->GetY(), $boxWidth, $boxHeight);

        // store top position
        $boxTopY = $pdf->GetY();

        // padding inside the box
        $padding = 1.5;

        // text area width
        $textWidth = $boxWidth - ($padding * 2);

        // label text
        $labelText = 'Suggestions on how we can further improve our services (optional):';

        // --------------------------------------------------------------------------
        // AUTO FONT FIT
        // --------------------------------------------------------------------------
        $maxFont = 8.5;
        $minFont = 5;

        $fontSize = $maxFont;

        while ($fontSize > $minFont) {

            // Options / body text → Arial Narrow Regular
            $pdf->SetFont($arialNarrowBold, '', $fontSize);

            $textHeight = $pdf->getStringHeight($textWidth, $labelText);

            if ($textHeight < ($boxHeight * 0.35)) {
                break;
            }

            $fontSize -= 0.2;
        }

        $pdf->SetFont($arialNarrowBold, '', $fontSize);

        // place label
        $pdf->SetXY($boxLeft + $padding, $boxTopY + $padding);

        $pdf->MultiCell(
            $textWidth,
            0,
            $labelText,
            0,
            'L'
        );

        // --------------------------------------------------------------------------
        // DRAW UNDERLINES (always inside box)
        // --------------------------------------------------------------------------

        $lineSpacing = ($boxHeight - 8) / 3; // dynamic spacing

        $line1Y = $boxTopY + ($boxHeight * 0.55);
        $line2Y = $line1Y + $lineSpacing;

        // line 1
        $pdf->Line(
            $boxLeft + $padding,
            $line1Y,
            $boxLeft + $boxWidth - $padding,
            $line1Y
        );

        // line 2
        $pdf->Line(
            $boxLeft + $padding,
            $line2Y,
            $boxLeft + $boxWidth - $padding,
            $line2Y
        );

        // move cursor to bottom of box
        $pdf->SetY($boxTopY + $boxHeight);

$pdf->Ln(1);

        // --------------------------------------------------------------------------
        // THANK YOU MESSAGE (under Suggestions table)
        // --------------------------------------------------------------------------

        // spacing below suggestions box
        $thankYouY = 2;

        // place directly under the suggestions box
        $thankYouTextX = $boxLeft;
        $thankYouTextY = $boxTopY + $boxHeight + $thankYouY;

        // Disable auto page break
        $pdf->SetAutoPageBreak(false, 0);

        // Add text centered under the suggestions box only
        $pdf->SetXY($thankYouTextX, $thankYouTextY);
        // THANK YOU → Arial Bold
        $pdf->SetFont('times', 'BI', 9);
        $pdf->Cell($boxWidth, 6, 'THANK YOU!', 0, 1, 'C');

        // Re-enable auto page break
        $pdf->SetAutoPageBreak(true, 10);

        $pdf->Ln(60);

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
        $pdf->SetFont($arialNarrow, '', 8.5);
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
        $pdf->SetFont($arialNarrow, '', 8.5);
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
        // Arial Narrow Bold for the label lines
        $pdf->SetFont($arialNarrowBold, '', 4.5);
        
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
        
        // Arial Narrow Bold for second box text
        $pdf->SetFont($arialNarrowBold, '', 5);
        
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