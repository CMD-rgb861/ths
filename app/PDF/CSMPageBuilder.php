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
            "Not\nApplicable"
        ];

        // Emoji image paths
        $emojiImages = [
            '',
            public_path('images/emojis/Strongly Agree.png'),
            public_path('images/emojis/Agree.png'),
            public_path('images/emojis/Neutral.png'),
            public_path('images/emojis/Disagree.png'),
            public_path('images/emojis/Strongly Disagree.png'),
            public_path('images/emojis/Not_Applicable.png')
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

        $csm = $jobOrder->csm;

        $drawCheck = function ($pdf, $x, $y, $w, $h, $fontSize = 6) {
            $oldX = $pdf->GetX();
            $oldY = $pdf->GetY();

            $pdf->SetFont('dejavusans', '', $fontSize);
            $pdf->SetXY($x, $y - 0.4);
            $pdf->Cell($w, $h, '✔', 0, 0, 'C');

            $pdf->SetXY($oldX, $oldY);
        };

        $isSame = function ($a, $b) {
            return strcasecmp(trim((string) $a), trim((string) $b)) === 0;
        };

        $ageLabel = '';
        if ($csm && !is_null($csm->age)) {
            $age = (int) $csm->age;

            if ($age < 18) {
                $ageLabel = 'Below 18 y/o';
            } elseif ($age <= 24) {
                $ageLabel = '18-24 y/o';
            } elseif ($age <= 34) {
                $ageLabel = '25-34 y/o';
            } elseif ($age <= 44) {
                $ageLabel = '35-44 y/o';
            } elseif ($age <= 54) {
                $ageLabel = '45-54 y/o';
            } elseif ($age <= 64) {
                $ageLabel = '55-64 y/o';
            } else {
                $ageLabel = '65 y/o & above';
            }
        }

        $ccAnswers = [
            'CC1' => (string) ($csm->cc1 ?? ''),
            'CC2' => (string) ($csm->cc2 ?? ''),
            'CC3' => (string) ($csm->cc3 ?? ''),
        ];

        $sqdAnswers = [
            0 => (int) ($csm->sqd0 ?? -1),
            1 => (int) ($csm->sqd1 ?? -1),
            2 => (int) ($csm->sqd2 ?? -1),
            3 => (int) ($csm->sqd3 ?? -1),
            4 => (int) ($csm->sqd4 ?? -1),
            5 => (int) ($csm->sqd5 ?? -1),
            6 => (int) ($csm->sqd6 ?? -1),
            7 => (int) ($csm->sqd7 ?? -1),
            8 => (int) ($csm->sqd8 ?? -1),
        ];

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


        //BORDERLINE OF THE PAGE
        // $pdf->SetLineWidth(0.4);
        // $pdf->Rect($left, $top, $boxWidth, $boxHeight);
        // $pdf->SetLineWidth(0.2);

        // Set margins - shifted to center within border
        $pdf->SetMargins(12, 15, 12);

        // --------------------------------------------------------------------------
        // GLOBAL FONT SIZES
        // --------------------------------------------------------------------------
        $fontHeight = 7;

        // --------------------------------------------------------------------------
        // HEADER
        // --------------------------------------------------------------------------
        // Left logo (LNU)
        $pdf->Ln(4);
        $logoPath = public_path('images/lnu_logo.jpg');
        if (file_exists($logoPath)) {
            $pdf->Image($logoPath, 53, 14, 15);
        }
        // Right logo (ISO)
        $isoLogoPath = public_path('images/iso_logo.png');
        if (file_exists($isoLogoPath)) {
            $pdf->Image($isoLogoPath, 140, 14, 30);
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
        $col1Width = $maxLabelWidth - 15; // +4 for padding
        
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
        // Black background with white text
        $pdf->SetFillColor(0, 0, 0);     // black background
        $pdf->SetTextColor(255, 255, 255); // white text

        $pdf->Cell($col1Width, $rowHeight, 'TRANSACTION DETAILS', 1, 0, 'L', true);

        // Reset colors for the rest of the document
        $pdf->SetFillColor(255, 255, 255);
        $pdf->SetTextColor(0, 0, 0);
        $pdf->Cell($col2Width, $rowHeight, '', 0, 1, 'L');
        
        // Row 1: OFFICE/UNIT TRANSACTED WITH | value
        $pdf->SetFillColor(220, 220, 220);

        $row1X = $pdf->GetX();
        $row1Y = $pdf->GetY();

        $pdf->Cell($col1Width, $rowHeight, 'OFFICE/UNIT TRANSACTED WITH:', 1, 0, 'L', true);
        $pdf->Cell($col2Width, $rowHeight, '', 1, 1, 'L', true);

        // overlay the value inside the 2nd cell
        if ($csm) {
            $pdf->SetFont($arialNarrow, '', 8);
            $pdf->SetXY($row1X + $col1Width + 1, $row1Y + 1);
            $pdf->Cell(
                $col2Width - 2,
                $rowHeight - 2,
                $csm->office_or_faculty_unit_transacted ?? '',
                0,
                0,
                'L'
            );
        }

        // VERY IMPORTANT: restore cursor to the next row start
        $pdf->SetXY($row1X, $row1Y + $rowHeight);
        
        // Row 2: SERVICE/S AVAILED | value
        $pdf->SetFont($arialNarrowBold, '', 8.5);
        $pdf->SetFillColor(255, 255, 255);

        $row2X = $pdf->GetX();
        $row2Y = $pdf->GetY();

        $pdf->Cell($col1Width, $rowHeight, 'SERVICE/S AVAILED:', 1, 0, 'L');
        $pdf->Cell($col2Width, $rowHeight, '', 1, 1, 'L');

        if ($csm) {
            $pdf->SetFont($arialNarrow, '', 9);
            $pdf->SetXY($row2X + $col1Width + 1, $row2Y + 1);
            $pdf->Cell(
                $col2Width - 2,
                $rowHeight - 2,
                $csm->services_availed ?? '',
                0,
                0,
                'L'
            );
        }

        // restore cursor to next row
        $pdf->SetXY($row2X, $row2Y + $rowHeight);
        
        // custom widths for DATE/TIME row
        // Row 3: DATE VISITED | value | TIME VISITED | value
        $pdf->SetFont($arialNarrowBold, '', 8.5);
        $pdf->SetFillColor(220, 220, 220);

        // make sure row starts at the left edge of the table
        $pdf->SetX($startX);

        // store row position first
        $row3X = $pdf->GetX();
        $row3Y = $pdf->GetY();

        // custom widths for this row
        $row3Col1Width = $col1Width;
        $row3Col2Width = $row3RemainingWidth * 0.45;
        $row3Col3Width = $row3RemainingWidth * 0.20;
        $row3Col4Width = $tableWidth - $row3Col1Width - $row3Col2Width - $row3Col3Width;

        $pdf->Cell($row3Col1Width, $rowHeight, 'DATE VISITED:', 1, 0, 'L', true);
        $pdf->Cell($row3Col2Width, $rowHeight, '', 1, 0, 'L', true);
        $pdf->Cell($row3Col3Width, $rowHeight, 'TIME VISITED:', 1, 0, 'C', true);
        $pdf->Cell($row3Col4Width, $rowHeight, '', 1, 1, 'L', true);

        if ($csm && $csm->date_time_visited) {
            $pdf->SetFont($arialNarrow, '', 9);

            $pdf->SetXY($row3X + $row3Col1Width + 1, $row3Y + 1);
            $pdf->Cell(
                $row3Col2Width - 2,
                $rowHeight - 2,
                $csm->date_time_visited->format('m/d/Y'),
                0,
                0,
                'L'
            );

            $pdf->SetXY($row3X + $row3Col1Width + $row3Col2Width + $row3Col3Width + 1, $row3Y + 1);
            $pdf->Cell(
                $row3Col4Width - 2,
                $rowHeight - 2,
                $csm->date_time_visited->format('h:i A'),
                0,
                0,
                'L'
            );
        }

        // restore cursor
        $pdf->SetXY($row3X, $row3Y + $rowHeight);
        
        $providerLabel = "NAME OF SERVICE PROVIDER\n(OPTIONAL):";

        $rowHeight = max(8, $pdf->getStringHeight($col1Width - 2, $providerLabel) + 1.5);

        $rowX = $pdf->GetX();
        $rowY = $pdf->GetY();

        // draw row borders
        $pdf->Rect($rowX, $rowY, $col1Width, $rowHeight);
        $pdf->Rect($rowX + $col1Width, $rowY, $col2Width, $rowHeight);

        // left cell label
        $pdf->SetFont($arialNarrowBold, '', 8);
        $pdf->SetXY($rowX, $rowY + 1);
        $pdf->MultiCell(
            $col1Width - 2,
            4,
            $providerLabel,
            0,
            'L',
            false,
            1
        );

        // right cell value
        if ($csm) {
            $pdf->SetFont($arialNarrow, '', 8.5);
            $pdf->SetXY($rowX + $col1Width + 1, $rowY + 2);
            $pdf->MultiCell(
                $col2Width - 2,
                4,
                $csm->service_provider_name ?? '',
                0,
                'L',
                false,
                1
            );
        }

        // restore cursor to next row
        $pdf->SetXY($rowX, $rowY + $rowHeight);

        // Reset fill color to white for subsequent content
        $pdf->SetFillColor(255, 255, 255);

        $pdf->Ln(2);

        /*
        |--------------------------------------------------------------------------
        | PERSONAL INFORMATION TABLE
        |--------------------------------------------------------------------------
        */
        $pdf->SetFont($arialBold, '', 7.5);

        $piTableWidth = ($pageWidth - 24) * 0.42;
        $piCol1Width  = $piTableWidth / 2;
        $piCol2Width  = $piTableWidth / 2;

        $piTableStartY = $pdf->GetY();
        $titleHeight = 6.5;

        $checkboxSize = 2;
        $lineHeight   = 3;
        $paddingTop   = 4;
        $labelGap     = 1;
        $textGap      = 1;
        $leftInset   = 6;  // push checkbox/text away from left border
        $checkboxGap = 0.9;  // space between checkbox and label
        $rightInset  = 2;  // padding before column border

        // Row 0: PERSONAL INFORMATION header
        $piHeaderWidth = $piTableWidth - 40;

        // black background + white text
        $pdf->SetFillColor(0, 0, 0);
        $pdf->SetTextColor(255, 255, 255);

        $pdf->Cell($piHeaderWidth, $titleHeight, 'PERSONAL INFORMATION', 1, 0, 'L', true);

        // reset colors for the rest of the document
        $pdf->SetTextColor(0, 0, 0);
        $pdf->SetFillColor(255, 255, 255);

        $pdf->Cell($piTableWidth - $piHeaderWidth, $titleHeight, '', 0, 1);

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

            $boxX = $pdf->GetX();
            $boxOffsetY = ($textHeight - $checkboxSize) / 2;
            $boxY = $currentY + $boxOffsetY;

            $pdf->Rect($boxX, $boxY, $checkboxSize, $checkboxSize);

            if ($csm && $isSame($csm->client_type ?? '', $type)) {
                $drawCheck($pdf, $boxX, $boxY, $checkboxSize, $checkboxSize);
            }

            $pdf->SetXY($boxX + $checkboxSize + $checkboxGap, $currentY + 0.2);
            $pdf->MultiCell($optionTextWidthLeft, $textHeight, $type, 0, 'L', false, 1);
        }
        $row1LeftEndY = $pdf->GetY();

        // Measure right overlay content
        $pdf->SetXY($row1X + $piCol1Width + 1, $row1Y + 1);
        $pdf->SetFont($arialBold, '', 7);
        $pdf->Cell(0, 3, 'SEX:', 0, 1, 'L');

        $pdf->SetFont($arialNarrow, '', 8);
        foreach ($sexOptions as $option) {
            $pdf->SetX($row1X + $piCol1Width + $leftInset - 3);
            $currentY   = $pdf->GetY();
            $textHeight = max($lineHeight, $pdf->getStringHeight($optionTextWidthRight, $option));

            $boxX = $pdf->GetX();
            $boxY = $currentY + (($textHeight - $checkboxSize) / 2);

            $pdf->Rect($boxX, $boxY, $checkboxSize, $checkboxSize);

            if ($csm && $isSame($csm->sex ?? '', $option)) {
                $drawCheck($pdf, $boxX, $boxY, $checkboxSize, $checkboxSize);
            }

            $pdf->SetXY($boxX + $checkboxSize + $checkboxGap, $currentY + 0.2);
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
        $clientCategories = ['Student', 'Faculty', 'Visitor', 'Admin/Personnel', 'Others'];
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

            $boxX = $pdf->GetX();   
            $boxY = $currentY + (($lineHeight - $checkboxSize) / 2);

            $pdf->Rect($boxX, $boxY, $checkboxSize, $checkboxSize);

            if ($csm && $category !== 'Others' && $isSame($csm->client_category ?? '', $category)) {
                $drawCheck($pdf, $boxX, $boxY, $checkboxSize, $checkboxSize);
            }

            if ($csm && $category === 'Others' && !empty($csm->client_category_other)) {
                $drawCheck($pdf, $boxX, $boxY, $checkboxSize, $checkboxSize);
            }

            $textX = $boxX + $checkboxSize + $checkboxGap;

            if ($category === 'Others') {
                // Line 1: label
                $pdf->SetFont($arialNarrow, '', 8);

                $pdf->SetXY($textX, $currentY + 0.2);
                $pdf->Cell($row2OptionTextWidthLeft, $lineHeight, 'Others:', 0, 1, 'L');

                // $underlineY = $pdf->GetY() + 2.5;
                // $underlineStartX = $textX + 1;
                // $underlineEndX = $textX + ($row2OptionTextWidthLeft);

                // $pdf->Line($underlineStartX, $underlineY, $underlineEndX, $underlineY);

                $underlineY = $pdf->GetY() + 3;
                $underlineStartX = $textX + 1;
                $underlineEndX = $textX + ($row2OptionTextWidthLeft * 1);

                $pdf->Line($underlineStartX, $underlineY, $underlineEndX, $underlineY);

                if ($csm && !empty($csm->client_category_other)) {
                    $pdf->SetFont($arialNarrow, '', 7.5);
                    $pdf->SetXY($underlineStartX + 1, $underlineY - 3.5);
                    $pdf->Cell($underlineEndX - $underlineStartX - 2, 3, $csm->client_category_other, 0, 0, 'L');
                }

                $pdf->SetY($underlineY + 2);
            } else {
                $textHeight = max($lineHeight, $pdf->getStringHeight($row2OptionTextWidthLeft, $category));
                $pdf->SetXY($textX, $currentY + 0.2);
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

            $boxX = $pdf->GetX();
            $boxY = $currentY + (($textHeight - $checkboxSize) / 2);

            $pdf->Rect($boxX, $boxY, $checkboxSize, $checkboxSize);

            if ($csm && $isSame($ageLabel, $ageOption)) {
                $drawCheck($pdf, $boxX, $boxY, $checkboxSize, $checkboxSize);
            }

            $pdf->SetXY($boxX + $checkboxSize + $checkboxGap, $currentY + 0.2);
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
            $boxX = $currentX;
            $boxY = $line1Y + 1;

            $pdf->Rect($boxX, $boxY, $checkboxSize, $checkboxSize);

            if ($csm && $isSame($csm->who_to_evaluate ?? '', $option)) {
                $drawCheck($pdf, $boxX, $boxY, $checkboxSize, $checkboxSize);
            }

            $currentX += $checkboxSize + 1;
            $labelWidth = $pdf->GetStringWidth($option);

            $pdf->SetXY($currentX, $line1Y + 0.2);
            $pdf->Cell($labelWidth, $lineHeight, $option, 0, 0, 'L');

            $currentX += $labelWidth + 6;
        }

        // Second line: Others
        $line2Y = $line1Y + $lineHeight + 1;

        $pdf->SetXY($evaluateX + $evaluateInset, $line2Y);
        $pdf->Rect($evaluateX + $evaluateInset, $line2Y + 0.5, $checkboxSize, $checkboxSize);

        $textX = $evaluateX + $evaluateInset + $checkboxSize + 1;

        $pdf->SetXY($textX, $line2Y + 0.2);
        $pdf->Cell(0, $lineHeight, 'Others:', 0, 0, 'L');

        $gapAfterLabel = 3;       // move line to the right
        $underlineLength = 35;    // control length

        $lineStartX = $textX + $pdf->GetStringWidth('Others:') + $gapAfterLabel;
        $lineEndX   = $lineStartX + $underlineLength;
        $lineY      = $line2Y + 0.5 + $lineHeight - 0.5;

        $pdf->Line($lineStartX, $lineY, $lineEndX, $lineY);

        if ($csm && !empty($csm->who_to_evaluate_other)) {
            $drawCheck($pdf, $evaluateX + $evaluateInset, $line2Y + 0.5, $checkboxSize, $checkboxSize);

            $pdf->SetFont($arialNarrow, '', 8.5);
            $pdf->SetXY($lineStartX + 1, $line2Y - 0.5);
            $pdf->Cell($underlineLength - 2, $lineHeight, $csm->who_to_evaluate_other, 0, 0, 'L');
        }

        // move cursor explicitly below this block
        $pdf->SetY($lineY + 2);

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

        // Draw text / underline
        $pdf->SetXY($nameX + 1, $textY);
        $pdf->Cell($piTableWidth - 2, $textHeight, $nameText, 0, 0, 'L');

        if ($csm && !empty($csm->name)) {
            $lineStartX = $nameX + 22; // adjust if needed
            $pdf->SetFont($arialRegular, '', 8);
            $pdf->SetXY($lineStartX, $textY - 0.5);
            $pdf->Cell(
                $piTableWidth - ($lineStartX - $nameX) - 2,
                $textHeight,
                $csm->name,
                0,
                0,
                'L'
            );
        }

        // Move to true end of row
        $pdf->SetXY($nameX, $nameY + $nameRowHeight);

        // Move to true end of row
        $pdf->SetXY($nameX, $nameY + $nameRowHeight);

        // --------------------------------------------------------------------------
        // Row 5: EMAIL ADDRESS (Optional)
        // --------------------------------------------------------------------------
        $pdf->SetFont($arialRegular, '', 7);
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

        // Draw label + underline
        $pdf->SetXY($emailX + 1, $textY);
        $pdf->Cell($piTableWidth - 2, $textHeight, $emailText, 0, 0, 'L');

        if ($csm && !empty($csm->email_address)) {

            $lineStartX = $emailX + 34; // position where email text begins
            $maxWidth = $piTableWidth - ($lineStartX - $emailX) - 2;

            // Start with default font size
            $fontSize = 8;
            $pdf->SetFont($arialRegular, '', $fontSize);

            // Shrink font until it fits
            while ($pdf->GetStringWidth($csm->email_address) > $maxWidth && $fontSize > 5) {
                $fontSize -= 0.5;
                $pdf->SetFont($arialRegular, '', $fontSize);
            }

            // Adjust vertical position slightly for bigger font
            $adjustedTextY = $textY - (($fontSize - 7) / 2);

            $pdf->SetXY($lineStartX, $adjustedTextY);
            $pdf->Cell(
                $maxWidth,
                $textHeight,
                $csm->email_address,
                0,
                0,
                'L'
            );
        }

        // Restore cursor to next row
        $pdf->SetXY($emailX, $emailY + $emailRowHeight);

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
        $titleHeight = 7;
        $ccHeaderWidth = $ccTableWidth - 80; // adjust this like PERSONAL INFORMATION

        $ccTitleFont = $fitFontToWidth(
            $pdf,
            $arialNarrowBold,
            '',
            8.5,
            4.5,
            $ccTitle,
            $ccHeaderWidth - 2
        );

        $pdf->SetFont($arialNarrowBold, '', $ccTitleFont);

        // black background + white text
        $pdf->SetFillColor(0, 0, 0);
        $pdf->SetTextColor(255, 255, 255);

        $pdf->Cell($ccHeaderWidth, $titleHeight, $ccTitle, 1, 0, 'L', true);

        // reset colors
        $pdf->SetTextColor(0, 0, 0);
        $pdf->SetFillColor(255, 255, 255);

        // remaining blank part
        $pdf->Cell($ccTableWidth - $ccHeaderWidth, $titleHeight, '', 0, 1);

        // --------------------------------------------------------------------------
        // INSTRUCTIONS ROW
        // --------------------------------------------------------------------------
        $pdf->SetXY($ccTableX, $piTableStartY + $titleHeight);

        $ccInstructions = 'INSTRUCTIONS: Check mark (<span style="font-family:dejavusans;">✔</span>) your answer to the Citizen\'s Charter (CC) questions. The Citizen\'s Charter is an official document that reflects the services of a government agency/office including its requirements, fees, and processing times among others.';
        $instructionsHeight = 18.5;

        $ccInstructionFont = $fitFontToBox(
            $pdf,
            $arialNarrow,
            '',
            11.5,
            6,
            $ccTableWidth - ($ccCellPadX * 2),
            $ccInstructions,
            $instructionsHeight - ($ccCellPadY * 2),
            0.5
        );

        $pdf->SetFont($arialNarrow, '', $ccInstructionFont);
        $pdf->SetFillColor(220, 220, 220);
        $pdf->writeHTMLCell(
            $ccTableWidth,
            $instructionsHeight,
            '',
            '',
            $ccInstructions,
            1,
            1,
            true,
            true,
            'L',
            true
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

                    preg_match('/^\s*(\d+)\./', $opt, $matches);
                    $optionCode = $matches[1] ?? null;

                    if ($optionCode !== null && (string)($ccAnswers['CC2'] ?? '') === (string)$optionCode) {
                        $drawCheck($pdf, $checkboxX + 0.6, $checkboxY - 1.3, $ccCheckboxSize, $ccCheckboxSize, 10);
                    }

                    $pdf->SetFont($arialNarrow, '', $optFont);

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

                    preg_match('/^\s*(\d+)\./', $opt, $matches);
                    $optionCode = $matches[1] ?? '';

                    if (($ccAnswers['CC2'] ?? '') === $optionCode) {
                        $drawCheck($pdf, $checkboxX + 0.6, $checkboxY - 1.3, $ccCheckboxSize, $ccCheckboxSize, 10);
                    }

                    $pdf->SetFont($arialNarrow, '', $optFont);

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

                    preg_match('/^\s*(\d+)\./', $option, $matches);
                    $optionCode = $matches[1] ?? '';

                    if (($ccAnswers[$row['label']] ?? '') === $optionCode) {
                        $drawCheck($pdf, $checkboxX + 0.6, $checkboxY - 1.3, $ccCheckboxSize, $ccCheckboxSize, 10);
                    }

                    $boldPart = "(Answer 'N/A' on CC2 and CC3)";

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

        $pdf->Ln(0.1);
        
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
            "Not\nApplicable"
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
        $titleOffsetY  = 9.8;
        $headerOffsetY = 0;

        // make it like the other headers
        $titleWidth = $colWidths[0] + $colWidths[1] - 5;
        $sqdHeaderWidth = $titleWidth - 25; // adjust this value if needed
        $titleHeight = 5;

        // draw title lower WITHOUT affecting the rest of the table
        $pdf->SetXY($headerStartX, $headerBaseY + $titleOffsetY);

        // black background + white text
        $pdf->SetFillColor(0, 0, 0);
        $pdf->SetTextColor(255, 255, 255);

        $titleX = $headerStartX;
        $titleY = $headerBaseY + $titleOffsetY;

        // draw rounded filled box
        $pdf->SetFillColor(0, 0, 0);
        $pdf->SetTextColor(255, 255, 255);

        $pdf->RoundedRect(
            $titleX,
            $titleY,
            $sqdHeaderWidth,
            $titleHeight,
            1,
            '1001', // top-left and top-right only
            'DF'
        );

        // draw title text on top
        $pdf->SetXY($titleX, $titleY);
        $pdf->Cell($sqdHeaderWidth, $titleHeight, $titleText, 0, 0, 'L', false);

        // reset colors
        $pdf->SetTextColor(0, 0, 0);
        $pdf->SetFillColor(255, 255, 255);

        // remaining blank part
        $pdf->Cell($titleWidth - $sqdHeaderWidth, $titleHeight, '', 0, 1);

        // keep the header row position based on the original base Y
        $titleY = $headerBaseY;

        // Rating labels in header → Arial Narrow Regular
        $pdf->SetFont($arialNarrow, '', 8.5);

        // --------------------------------------------------------------------------
        // DRAW HEADER ROW WITH EMOJI IMAGES
        // --------------------------------------------------------------------------
        $emojiSize = 7;

        // fixed header row position
        $headerRowX = $headerStartX;
        $headerRowY = $titleY + $titleHeight + $headerOffsetY;

        // --- Auto-adjust header font size ---
        $headerFontMin = 5.5;
        $headerFontMax = 10;
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

        $autoHeaderFontSize = 6.5;

        // calculate common header height
        $headerRowHeight = 17;
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
        $instructionsCellText = 'INSTRUCTIONS: For SQD 0-8, please put a check mark (<span style="font-family:dejavusans;">✔</span>) on the column that best corresponds to your answer.';
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

        $reduceTop = 10; // how much height to remove from the top
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
        $pdf->writeHTMLCell(
            $innerWidth,
            0,
            '',
            '',
            $instructionsCellText,
            0,
            0,
            false,
            true,
            'L',
            true
        );

        // 2. Remaining header cells at fixed coordinates
        $currentX = $headerRowX + $colWidths[0] + $colWidths[1];
        $ratingsStartX = $currentX;
        $ratingsWidth  = array_sum(array_slice($colWidths, 2));

        // draw ONE rounded outer border for the rating header only
        $pdf->RoundedRect(
            $ratingsStartX,
            $headerRowY,
            $ratingsWidth,
            $headerRowHeight,
            1,
            '1001', // top-left and top-right only
            'D'
        );

        // draw only INNER vertical lines
        $lineX = $ratingsStartX;
        for ($i = 2; $i < count($headers) - 1; $i++) {
            $lineX += $colWidths[$i];
            $pdf->Line($lineX, $headerRowY, $lineX, $headerRowY + $headerRowHeight);
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
            $topFontMin = 4.5;

            if ($topText === "Strongly Disagree") {
                $topFont = 6.2;
            } else {
                $topFont = $autoHeaderFontSize;
            }

            // ----------------------------
            // AUTO EMOJI SIZE
            // ----------------------------
            $emojiSize = min(
                $cellWidth * 0.45,
                $cellHeight * 0.22
            );

            $emojiSize = max(6, min(16, $emojiSize));

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
            $pdf->SetFont($arialNarrowBold, '', $topFont);

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
        $availableHeight = $pageHeight - $tableTopY - $bottomMargin - 85; // reserve more space for suggestions, thank you, footer

        // Minimum and maximum font sizes
        $maxFontSize = 8.5;
        $minFontSize = 6;

        // Minimum and maximum row heights
        $maxRowHeight = 8.5;
        $minRowHeight = 5.2;

        // Calculate row height and font size
        $rowHeight = max($minRowHeight, min($maxRowHeight, $availableHeight / max(1, $numRows)));
        // Font size is proportional to row height
        $fontSize = max($minFontSize, min($maxFontSize, $rowHeight * 1.3));

        // SQD questions → Arial Narrow Regular
        foreach ($sqdRows as $rowIdx => $rowText) {
        $rowStartX = $headerStartX;
        $rowStartY = $pdf->GetY();

        // calculate required height for question text
        $pdf->SetFont($arialNarrowBold, '', $fontSize);

        $questionHeight = $pdf->getStringHeight(
            $colWidths[1],
            $rowText
        );

        $currentRowHeight = max($rowHeight, $questionHeight + 2);

        $pdf->SetXY($rowStartX, $rowStartY);

        // grey fill for the whole row
        $pdf->SetFillColor(220, 220, 220);

        // SQD label column
        $pdf->SetFont($arialNarrowBold, '', $fontSize);
        $label = 'SQD' . $rowIdx;
        $pdf->Cell($colWidths[0], $currentRowHeight, $label, 1, 0, 'C', true);

        // Question column
        $pdf->SetFont($arialNarrowBold, '', $fontSize);
        $pdf->MultiCell(
            $colWidths[1],
            $currentRowHeight,
            $rowText,
            1,
            'L',
            true,
            0,
            '',
            '',
            true,
            0,
            false,
            true,
            $currentRowHeight,
            'M'
        );

        $columnValueMap = [
            2 => 5,
            3 => 4,
            4 => 3,
            5 => 2,
            6 => 1,
            7 => 6,
        ];

        for ($c = 2; $c < $cols; $c++) {
            $cellX = $pdf->GetX();
            $cellY = $rowStartY;

            $pdf->Cell($colWidths[$c], $currentRowHeight, '', 1, 0, 'C', true);

            $answer = (int)($sqdAnswers[$rowIdx] ?? -1);
            $expected = $columnValueMap[$c] ?? null;

            $checkH = 3;

            if ($expected !== null && $answer === (int)$expected) {
                $drawCheck(
                    $pdf,
                    $cellX,
                    $cellY + (($currentRowHeight - $checkH) / 2),
                    $colWidths[$c],
                    $checkH,
                    10
                );
            }
        }

        $pdf->SetXY($rowStartX, $rowStartY + $currentRowHeight);
    }

$pdf->Ln(3);
        
        // --------------------------------------------------------------------------
        // SUGGESTIONS (1x1 table responsive)
        // --------------------------------------------------------------------------

        // align top with SQD area header, but keep everything on the current page safely
        $pdf->SetY($headerRowY);

        $sqdWidth = array_sum($colWidths);
        $gap = 4;

        $boxLeft = $margins['left'] + $sqdWidth + $gap;

        // align right edge with CC table
        $boxRight = $ccTableX + $ccTableWidth - 1;
        $boxWidthSuggestions = $boxRight - $boxLeft;

        // inner padding
        $padding = 1.5;

        // label text
        $labelText = 'Suggestions on how we can further improve our services:';

        // usable text width
        $textWidth = $boxWidthSuggestions - ($padding * 2);

        // --------------------------------------------------------------------------
        // LABEL FONT SIZE
        // --------------------------------------------------------------------------
        $fontSize = 9;
        $minFontSize = 6;

        $pdf->SetFont($arialNarrowBold, '', $fontSize);
        $textHeight = $pdf->getStringHeight($textWidth, $labelText);

        while ($textHeight > 12 && $fontSize > $minFontSize) {
            $fontSize -= 0.2;
            $pdf->SetFont($arialNarrowBold, '', $fontSize);
            $textHeight = $pdf->getStringHeight($textWidth, $labelText);
        }

        $pdf->SetFont($arialNarrowBold, '', $fontSize);

        // top position
        $boxTopY = $pdf->GetY();
        $labelX = $boxLeft + $padding;
        $labelY = $boxTopY + $padding;

        // --------------------------------------------------------------------------
        // LINE SETTINGS
        // --------------------------------------------------------------------------
        $gapBelowText = 6;   // space between label and first line
        $lineGap      = 4.2;   // spacing between lines
        $totalLines   = 9;
        $bottomPad    = 2;

        // first line starts after the label
        $lineStartY = $labelY + $textHeight + $gapBelowText;

        // last line position
        $lastLineY = $lineStartY + (($totalLines - 1) * $lineGap);

        // final box height based on label + 9 lines
        $boxHeight = ($lastLineY - $boxTopY) + $bottomPad;

        // draw outer box AFTER computing final height
        $pdf->Rect($boxLeft, $boxTopY, $boxWidthSuggestions, $boxHeight);

        // --------------------------------------------------------------------------
        // DRAW LABEL
        // --------------------------------------------------------------------------
        $pdf->SetXY($labelX, $labelY);
        $pdf->MultiCell(
            $textWidth,
            0,
            $labelText,
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

        // --------------------------------------------------------------------------
        // OVERLAY SUGGESTIONS TEXT
        // --------------------------------------------------------------------------
        if ($csm && !empty($csm->suggestions)) {
            $oldX = $pdf->GetX();
            $oldY = $pdf->GetY();

            $pdf->SetFont($arialNarrow, '', 7.3);
            $pdf->SetXY($boxLeft + $padding, $lineStartY - 3.5);
            $pdf->MultiCell(
                $boxWidthSuggestions - ($padding * 2),
                4,
                $csm->suggestions,
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

            $pdf->SetXY($oldX, $oldY);
        }

        // --------------------------------------------------------------------------
        // DRAW 9 UNDERLINES
        // --------------------------------------------------------------------------
        for ($i = 0; $i < $totalLines; $i++) {
            $lineY = $lineStartY + ($i * $lineGap);

            $pdf->Line(
                $boxLeft + $padding,
                $lineY,
                $boxLeft + $boxWidthSuggestions - $padding,
                $lineY
            );
        }

        // move cursor to bottom of box
        $pdf->SetY($boxTopY + $boxHeight);


        $pdf->Ln(4);


        // --------------------------------------------------------------------------
        // THANK YOU MESSAGE (under Suggestions table)
        // --------------------------------------------------------------------------

        // spacing below suggestions box
        $thankYouY = 10;

        // place directly under the Suggestions box
        $thankYouTextX = $boxLeft;
        $thankYouTextY = $boxTopY + $boxHeight + $thankYouY;

        // disable auto page break
        $pdf->SetAutoPageBreak(false, 0);

        // center THANK YOU using the Suggestions box width
        $pdf->SetXY($thankYouTextX, $thankYouTextY);
        $pdf->SetFont('times', 'BI', 11);
        $pdf->Cell($boxWidthSuggestions, 6, 'Thank You!', 0, 1, 'C');

        // re-enable auto page break
        $pdf->SetAutoPageBreak(true, 10);

        $pdf->Ln(60);

        // --------------------------------------------------------------------------
        // STANDALONE TEXT BOX (lower-left under SQD table)
        // --------------------------------------------------------------------------

        // position adjustments
        $x = 0;   // move left (-) or right (+) from SQD left edge
        $y = 28;   // move down (+) from bottom of SQD table

        // text content
        $textBox1Content = 'F-QMS-025 Rev. 3 (02-02-26)';

        // calculate auto-size based on text
        $textBoxPadding = 1;
        $pdf->SetFont($arialNarrow, '', 8.5);
        $textBox1ContentWidth = $pdf->GetStringWidth($textBox1Content);

        // auto-calculate width and height
        $textBoxWidth = $textBox1ContentWidth + ($textBoxPadding * 2) + 2;
        $textBoxHeight = 6;

        // anchor to lower-left under SQD table
        $textBoxX = $headerStartX + $x;
        $textBoxY = $tableTopY + ($rowHeight * count($sqdRows)) + $y;

        // draw border
        $pdf->SetLineWidth(0.3);
        $pdf->Rect($textBoxX, $textBoxY, $textBoxWidth, $textBoxHeight);
        $pdf->SetLineWidth(0.2);

        // disable auto page break
        $pdf->SetAutoPageBreak(false, 0);

        // draw text
        $pdf->SetXY($textBoxX + $textBoxPadding, $textBoxY + $textBoxPadding);
        $pdf->SetFont($arialNarrow, '', 8.5);
        $pdf->Cell(
            $textBoxWidth - ($textBoxPadding * 2),
            $textBoxHeight - ($textBoxPadding * 2),
            $textBox1Content,
            0,
            0,
            'L',
            false
        );

        // re-enable auto page break
        $pdf->SetAutoPageBreak(true, 10);

        // --------------------------------------------------------------------------
        // STOP SCALING AFTER SQD TABLE
        // --------------------------------------------------------------------------
        $pdf->StopTransform(); // stop scaling here so coordinates match border
    }
}