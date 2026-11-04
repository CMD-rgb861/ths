<?php
// /C:\laragon\www\ths\app\Http\Controllers\GeneralJobOrderControllers\Users\NewRequestController.php
namespace App\Http\Controllers\GeneralJobOrderControllers\Users;

use App\Http\Controllers\Controller;
use App\Models\GjorAttachment;
use App\Models\GjorJobOrder;
use App\Models\GjorJobOrderRequestFor;
use App\Models\GjorRequestFor;
use App\Models\RequestStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class NewRequestController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user, 401, 'Unauthenticated.');

        // ── Department: resolved from auth user, never from client ─
        $departmentId = $user->departments()
            ->orderBy('departments.id')
            ->value('departments.id');

        if (!$departmentId) {
            return response()->json([
                'message' => 'No department is assigned to the current user.',
                'errors'  => ['department_id' => ['No department is assigned to your account.']],
            ], 422);
        }

        // ── Validate ───────────────────────────────────────────────
        $data = $request->validate([
            'purpose'                   => ['required', 'string', 'max:2000'],
            'location'                  => ['required', 'string', 'max:1000'],
            'contact_no'                => ['nullable', 'string', 'max:50'],
            'others_desc'               => ['nullable', 'string', 'max:1000'],

            // Pivot payload
            'items'                     => ['required', 'array', 'min:1'],
            'items.*.request_for_id'    => ['required', 'integer', 'exists:gjor_request_for,id'],
            'items.*.quantity'          => ['required', 'integer', 'min:0', 'max:999'],

            'attachments'               => ['nullable', 'array'],
            'attachments.*'             => ['file', 'max:10240'],
        ]);

        // Drop rows where the user left quantity at 0
        $items = collect($data['items'])
            ->filter(fn ($row) => (int) $row['quantity'] > 0)
            ->values();

        if ($items->isEmpty()) {
            return response()->json([
                'message' => 'Please request at least one personnel.',
                'errors'  => ['items' => ['Select a quantity for at least one request-for option.']],
            ], 422);
        }

        // ── Detect "Others" (by request_for_id being the Others row) ─
        $othersRow = GjorRequestFor::where('name', 'Others')->first();
        $hasOthers = $othersRow
            && $items->contains(fn ($row) => (int) $row['request_for_id'] === $othersRow->id);

        if ($hasOthers && blank($data['others_desc'] ?? null)) {
            return response()->json([
                'message' => 'Please describe the "Others" request.',
                'errors'  => ['others_desc' => ['This field is required when requesting Others.']],
            ], 422);
        }

        // ── Resolve Pending status ─────────────────────────────────
        $pendingStatus = RequestStatus::where('name', 'Pending')->first()
            ?? RequestStatus::orderBy('id')->first();

        if (!$pendingStatus) {
            return response()->json([
                'message' => 'Default status "Pending" is not configured in request_statuses.',
            ], 500);
        }

        // ── Persist ────────────────────────────────────────────────
        try {
            $jobOrder = DB::transaction(function () use (
                $request, $user, $departmentId, $data, $items, $pendingStatus, $hasOthers
            ) {
                $location = trim((string) ($data['location'] ?? ''));
                $purpose = $data['purpose'];

                $jobOrderData = [
                    'request_no'     => GjorJobOrder::generateRequestNo(),
                    'request_for_id' => $items->first()['request_for_id'], // legacy column — see note
                    'user_id'        => $user->id,
                    'department_id'  => $departmentId,
                    'requested_by'   => $user->name,
                    'contact_no'     => $data['contact_no'] ?? null,
                    'purpose'        => $purpose,
                    'location'       => $location ?: null,
                    'others_desc'    => $hasOthers ? $data['others_desc'] : null,
                    'status_id'      => $pendingStatus->id,
                    'is_cancelled'   => false,
                    'is_conformed'   => false,
                    'notified'       => false,
                ];

                if (Schema::hasColumn('gjor_job_orders', 'location')) {
                    $jobOrder = GjorJobOrder::create($jobOrderData);
                } else {
                    $jobOrder = GjorJobOrder::create([
                        ...$jobOrderData,
                        'purpose' => $location ? "Location: {$location}\n\n{$purpose}" : $purpose,
                        'location' => null,
                    ]);
                }

                // ── Pivot rows ─────────────────────────────────────
                $now = now();
                GjorJobOrderRequestFor::insert(
                    $items->map(fn ($row) => [
                        'gjor_job_order_id' => $jobOrder->id,
                        'request_for_id'    => (int) $row['request_for_id'],
                        'quantity'          => (int) $row['quantity'],
                        'created_at'        => $now,
                        'updated_at'        => $now,
                    ])->all()
                );

                // ── Attachments ────────────────────────────────────
                foreach ($request->file('attachments', []) as $file) {
                    $original  = $file->getClientOriginalName();
                    $extension = $file->getClientOriginalExtension() ?: $file->extension();
                    $basename  = Str::slug(pathinfo($original, PATHINFO_FILENAME)) ?: 'file';
                    $filename  = sprintf('%s_%s.%s', $basename, Str::random(8), $extension);

                    $path = $file->storeAs(
                        "gjor/attachments/{$jobOrder->id}",
                        $filename,
                        'public'
                    );

                    GjorAttachment::create([
                        'gjor_job_order_id' => $jobOrder->id,
                        'original_name'     => $original,
                        'file_path'         => $path,
                        'type'              => $file->getClientMimeType(),
                    ]);
                }

                return $jobOrder;
            });
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'message' => 'Failed to save the request. Please try again.',
                'error'   => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }

        // ── Reload & respond ───────────────────────────────────────
        $jobOrder->load([
            'requestFor',
            'status',
            'attachments',
            'department',
            'requestForItems.requestFor',
        ]);

        return response()->json([
            'message'    => 'Request submitted successfully.',
            'request_no' => $jobOrder->request_no,
            'summary'    => $jobOrder->request_for_summary, // "2 × Janitor(s), 3 × Plumber(s)"
            'data'       => $jobOrder,
        ], 201);
    }
}