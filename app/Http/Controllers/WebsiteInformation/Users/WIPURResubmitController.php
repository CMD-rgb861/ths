<?php

namespace App\Http\Controllers\WebsiteInformation\Users;

use App\Http\Controllers\Controller;
use App\Models\WipurAttachment;
use App\Models\WipurRequest;
use App\Models\WipurRequestEvent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Throwable;

class WIPURResubmitController extends Controller
{
    public function store(Request $request, WipurRequest $wipurRequest): JsonResponse
    {
        $user = $request->user();
        abort_unless($user, 401, 'Unauthenticated.');
        abort_unless((int) $wipurRequest->user_id === (int) $user->id, 403, 'Forbidden.');

        $data = $request->validate([
            'request_desc' => ['required', 'string', 'max:4000'],
            'remove_attachment_ids' => ['nullable', 'array'],
            'remove_attachment_ids.*' => ['integer', 'distinct'],
            'attachments' => ['nullable', 'array'],
            'attachments.*' => ['file', 'max:10240'],
        ]);

        $requestDesc = trim((string) $data['request_desc']);
        if ($requestDesc === '') {
            throw ValidationException::withMessages([
                'request_desc' => ['Please describe the website changes requested.'],
            ]);
        }

        $removeIds = array_map('intval', $data['remove_attachment_ids'] ?? []);
        $newFiles = $request->file('attachments', []);
        $storedPaths = [];
        $pathsToDelete = [];

        try {
            $result = DB::transaction(function () use (
                $wipurRequest,
                $user,
                $requestDesc,
                $removeIds,
                $newFiles,
                &$storedPaths,
                &$pathsToDelete
            ) {
                $lockedRequest = WipurRequest::query()
                    ->whereKey($wipurRequest->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                if ($lockedRequest->is_cancelled) {
                    abort(422, 'Cancelled requests cannot be resubmitted.');
                }

                $supervisorStep = $lockedRequest->steps()
                    ->where('step', 'supervisor')
                    ->lockForUpdate()
                    ->first();

                if (
                    ! $supervisorStep
                    || $supervisorStep->status !== 'returned'
                    || $supervisorStep->is_declined
                ) {
                    abort(422, 'Only requests returned by the supervisor can be resubmitted.');
                }

                $attachmentsToRemove = collect();
                if ($removeIds !== []) {
                    $attachmentsToRemove = $lockedRequest->attachments()
                        ->whereIn('id', $removeIds)
                        ->get();

                    if ($attachmentsToRemove->count() !== count(array_unique($removeIds))) {
                        throw ValidationException::withMessages([
                            'remove_attachment_ids' => ['One or more selected attachments do not belong to this request.'],
                        ]);
                    }

                    $pathsToDelete = $attachmentsToRemove->pluck('file_path')->all();
                    $attachmentsToRemove->each->delete();
                }

                $addedFiles = [];
                foreach ($newFiles as $file) {
                    $originalName = $file->getClientOriginalName();
                    $extension = preg_replace(
                        '/[^a-z0-9]/',
                        '',
                        Str::lower($file->extension() ?: 'bin')
                    ) ?: 'bin';
                    $basename = Str::limit(
                        Str::slug(pathinfo($originalName, PATHINFO_FILENAME)) ?: 'file',
                        100,
                        ''
                    );
                    $filename = sprintf('%s_%s.%s', $basename, Str::random(8), $extension);
                    $path = $file->storeAs(
                        "wipur/attachments/{$lockedRequest->id}",
                        $filename,
                        'public'
                    );

                    if (! $path) {
                        throw new \RuntimeException('Failed to store a resubmitted WIPUR attachment.');
                    }

                    $storedPaths[] = $path;
                    $addedFiles[] = $originalName;
                    $lockedRequest->attachments()->create([
                        'original_name' => $originalName,
                        'file_path' => $path,
                        'type' => $file->getMimeType(),
                    ]);
                }

                $oldStatus = $supervisorStep->status;
                $supervisorStep->update([
                    'status' => 'waiting_for_supervisor_approval',
                    'is_declined' => false,
                    'approved_by' => null,
                    'approved_at' => null,
                    'declined_by' => null,
                    'declined_at' => null,
                    'decline_reason' => null,
                    'remarks' => $requestDesc,
                ]);

                $lockedRequest->update([
                    'request_desc' => $requestDesc,
                    'date_requested' => now(),
                ]);

                WipurRequestEvent::record([
                    'wipur_request_id' => $lockedRequest->id,
                    'actor_user_id' => $user->id,
                    'event_type' => 'resubmitted',
                    'from_status' => $oldStatus,
                    'to_status' => 'waiting_for_supervisor_approval',
                    'request_desc' => $requestDesc,
                    'remarks' => 'Request revised and resubmitted to the supervisor.',
                    'metadata' => [
                        'removed_attachments' => $attachmentsToRemove
                            ->map(fn ($attachment) => [
                                'id' => $attachment->id,
                                'original_name' => $attachment->original_name,
                            ])
                            ->values()
                            ->all(),
                        'added_attachments' => $addedFiles,
                    ],
                ]);

                return $lockedRequest;
            });
        } catch (Throwable $exception) {
            $this->deleteStoredFiles($storedPaths);
            throw $exception;
        }

        $this->deleteStoredFiles($pathsToDelete);

        return response()->json([
            'message' => 'Request revised and resubmitted to the supervisor.',
            'data' => $result->load(['status', 'attachments', 'latestStep']),
        ]);
    }

    private function deleteStoredFiles(array $paths): void
    {
        foreach ($paths as $path) {
            if (! Storage::disk('public')->delete($path)) {
                report(new \RuntimeException("Failed to remove WIPUR attachment file: {$path}"));
            }
        }
    }
}