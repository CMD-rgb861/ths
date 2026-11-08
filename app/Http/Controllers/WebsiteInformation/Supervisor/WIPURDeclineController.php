<?php

namespace App\Http\Controllers\WebsiteInformation\Supervisor;

use App\Http\Controllers\Controller;
use App\Models\WipurRequest;
use App\Models\WipurRequestEvent;
use App\Models\WipurRoleUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WIPURDeclineController extends Controller
{
    public function store(Request $request, WipurRequest $wipurRequest): JsonResponse
    {
        $user = $request->user();
        abort_unless($user, 401, 'Unauthenticated.');

        $isSupervisor = $user->isWipurSupervisor();
        abort_unless($isSupervisor, 403, 'Forbidden: WIPUR supervisor access only.');

        $departmentIds = WipurRoleUser::query()
            ->where('user_id', $user->id)
            ->whereNotNull('department_id')
            ->pluck('department_id')
            ->filter()
            ->unique()
            ->values();

        abort_unless(
            $departmentIds->contains($wipurRequest->department_id),
            403,
            'Forbidden: This request is not assigned to your department.'
        );

        $reason = trim((string) $request->input('reason', ''));
        $remarks = trim((string) $request->input('remarks', ''));

        if ($reason === '') {
            return response()->json([
                'message' => 'A reason is required when declining a request.',
                'errors' => ['reason' => ['You must provide a reason for declining this request.']],
            ], 422);
        }

        $updatedRequest = DB::transaction(function () use (
            $wipurRequest,
            $departmentIds,
            $user,
            $reason,
            $remarks
        ) {
            $lockedRequest = WipurRequest::query()
                ->whereKey($wipurRequest->id)
                ->lockForUpdate()
                ->firstOrFail();
            abort_unless(
                $departmentIds->contains($lockedRequest->department_id),
                403,
                'Forbidden: This request is not assigned to your department.'
            );

            $step = $lockedRequest->steps()
                ->where('step', 'supervisor')
                ->lockForUpdate()
                ->first();
            abort_unless(
                $step && in_array($step->status, ['waiting_for_approval', 'waiting_for_supervisor_approval'], true),
                422,
                'Only requests awaiting supervisor review can be declined.'
            );
            $fromStatus = $step->status;

            $step->update([
                'step_order' => 1,
                'assigned_to_user_id' => $user->id,
                'status' => 'declined',
                'is_declined' => true,
                'declined_by' => $user->id,
                'declined_at' => now(),
                'decline_reason' => $reason,
                'remarks' => $remarks ?: null,
                'approved_by' => null,
                'approved_at' => null,
            ]);

            WipurRequestEvent::record([
                'wipur_request_id' => $lockedRequest->id,
                'actor_user_id' => $user->id,
                'event_type' => 'supervisor_declined',
                'from_status' => $fromStatus,
                'to_status' => 'declined',
                'request_desc' => $lockedRequest->request_desc,
                'remarks' => $reason,
                'metadata' => ['supervisor_remarks' => $remarks ?: null],
            ]);

            return $lockedRequest;
        });

        return response()->json([
            'message' => 'Request declined successfully.',
            'data' => $updatedRequest->fresh()->load('steps'),
        ]);
    }
}
