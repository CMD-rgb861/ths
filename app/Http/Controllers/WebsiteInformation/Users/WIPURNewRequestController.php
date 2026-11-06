<?php

namespace App\Http\Controllers\WebsiteInformation\Users;

use App\Http\Controllers\Controller;
use App\Models\RequestStatus;
use App\Models\WipurAttachment;
use App\Models\WipurRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class WIPURNewRequestController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user, 401, 'Unauthenticated.');

        // Resolve the user's primary department deterministically.
        // Mirrors frontend: lowest id wins. Relationship is many-to-many
        // via `user_departments`, so `value()` on the joined query is safe.
        $departmentId = $user->departments()
            ->orderBy('departments.id')
            ->value('departments.id');

        if (! $departmentId) {
            return response()->json([
                'message' => 'No department is assigned to the current user.',
                'errors' => ['department_id' => ['No department is assigned to your account. Please contact an administrator.']],
            ], 422);
        }

        $data = $request->validate([
            'request_desc' => ['required', 'string', 'max:4000'],
            'signature' => ['nullable', 'string', 'max:255'],
            'attachments' => ['nullable', 'array'],
            'attachments.*' => ['file', 'max:10240'],
        ]);

        $requestDesc = trim((string) $data['request_desc']);

        if ($requestDesc === '') {
            return response()->json([
                'message' => 'Please describe the request.',
                'errors' => ['request_desc' => ['This field is required.']],
            ], 422);
        }

        $pendingStatus = RequestStatus::where('name', 'Pending')->first()
            ?? RequestStatus::orderBy('id')->first();

        if (! $pendingStatus) {
            return response()->json([
                'message' => 'Default status "Pending" is not configured in request_statuses.',
            ], 500);
        }

        try {
            $record = DB::transaction(function () use ($request, $user, $departmentId, $requestDesc, $pendingStatus) {
                $wipurRequest = WipurRequest::create([
                    'control_number' => WipurRequest::generateControlNumber(),
                    'user_id' => $user->id,
                    'department_id' => $departmentId,
                    'requested_by' => $user->name,
                    'request_desc' => $requestDesc,
                    'status_id' => $pendingStatus->id,
                    'sub_status' => null,
                    'is_cancelled' => false,
                    'is_conformed' => false,
                    'notified' => false,
                    'date_requested' => now(),
                    'signature' => $request->input('signature') ?: null,
                ]);

                foreach ($request->file('attachments', []) as $file) {
                    $original = $file->getClientOriginalName();
                    $extension = $file->getClientOriginalExtension() ?: $file->extension() ?: 'bin';
                    $basename = Str::slug(pathinfo($original, PATHINFO_FILENAME)) ?: 'file';
                    $basename = Str::limit($basename, 100, '');
                    $filename = sprintf('%s_%s.%s', $basename, Str::random(8), $extension);

                    $path = $file->storeAs(
                        "wipur/attachments/{$wipurRequest->id}",
                        $filename,
                        'public'
                    );

                    WipurAttachment::create([
                        'wipur_request_id' => $wipurRequest->id,
                        'original_name' => $original,
                        'file_path' => $path,
                        'type' => $file->getClientMimeType(),
                    ]);
                }

                return $wipurRequest;
            });
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'message' => 'Failed to save the request. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }

        $record->load(['status', 'department', 'attachments']);

        return response()->json([
            'message' => 'Request submitted successfully.',
            'control_number' => $record->control_number,
            'data' => $record,
        ], 201);
    }
}