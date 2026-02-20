<?php

namespace App\Http\Controllers;

use App\Models\JobOrder;
use App\Models\JobOrderAttachment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use setasign\Fpdi\Tcpdf\Fpdi;

class JobOrderAttachmentController extends Controller
{
    public function upload(Request $request, $jobOrderId)
    {
        $request->validate([
            'attachments.*' => 'required|file|mimes:jpg,jpeg,png,pdf|max:10240'
        ]);

        $jobOrder = JobOrder::findOrFail($jobOrderId);

        foreach ($request->file('attachments') as $file) {

            $path = $file->store('attachments', 'public');
            $extension = $file->getClientOriginalExtension();

            JobOrderAttachment::create([
                'job_order_id' => $jobOrder->id,
                'original_name' => $file->getClientOriginalName(),
                'file_path' => $path,
                'type' => in_array($extension, ['jpg','jpeg','png']) ? 'image' : 'pdf'
            ]);
        }

        return response()->json(['message' => 'Files uploaded successfully']);
    }

    // public function merge(JobOrder $jobOrder)
    // {
    //     $pdf = new Fpdi();

    //     foreach ($jobOrder->attachments as $attachment) {

    //         $fullPath = storage_path('app/public/' . $attachment->file_path);

    //         if ($attachment->type === 'image') {

    //             $pdf->AddPage();
    //             $pdf->Image($fullPath, 10, 10, 190);

    //         } else {

    //             $pageCount = $pdf->setSourceFile($fullPath);

    //             for ($pageNo = 1; $pageNo <= $pageCount; $pageNo++) {
    //                 $templateId = $pdf->importPage($pageNo);
    //                 $size = $pdf->getTemplateSize($templateId);

    //                 $pdf->AddPage($size['orientation'], [$size['width'], $size['height']]);
    //                 $pdf->useTemplate($templateId);
    //             }
    //         }
    //     }

    //     $mergedPath = 'merged/job_order_' . $jobOrder->id . '.pdf';

    //     Storage::disk('public')->makeDirectory('merged');

    //     $pdf->Output(storage_path('app/public/' . $mergedPath), 'F');

    //     $jobOrder->merged_pdf = $mergedPath;
    //     $jobOrder->save();

    //     return response()->json(['message' => 'Merged successfully']);
    // }
}

