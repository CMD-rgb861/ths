<?php

namespace App\Http\Controllers\WebsiteInformation\Supervisor;

use App\Http\Controllers\Controller;
use App\Models\WipurRequest;
use App\Models\WipurRequestEvent;
use App\Models\WipurStep;
use App\Models\WipurRoleUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WIPURApprovalController extends Controller
{
    /**
     * Handle the supervisor approving a request.
     * Moves the request from the Supervisor step to the Admin step.
     */
    public function store(Request $request, WipurRequest $wipurRequest): JsonResponse
    {
        $user = $request->user();
        abort_unless($user, 401, 'Unauthenticated.');
        
        // 1. Ensure the user is an authorized WIPUR supervisor
        $isSupervisor = $user->isWipurSupervisor();
        abort_unless($isSupervisor, 403, 'Forbidden: WIPUR supervisor access only.');

        // 2. Ensure the request belongs to a department this supervisor manages
        $departmentIds = WipurRoleUser::query()
            ->where('user_id', $user->id)
            ->whereNotNull('department_id')
            ->pluck('department_id')
            ->filter()
            ->unique()
            ->values();

        if (! $departmentIds->contains($wipurRequest->department_id)) {
            abort(403, 'Forbidden: This request is not assigned to your department.');
        }

        // 3. Validate the optional side note
        $remarks = trim((string) $request->input('remarks', ''));
        $decisionMessage = $remarks !== '' ? $remarks : 'No remarks provided.';

        $updatedRequest = DB::transaction(function () use (
            $wipurRequest,
            $departmentIds,
            $user,
            $decisionMessage,
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
                'Only requests awaiting supervisor review can be approved.'
            );
            $fromStatus = $step->status;

            $step->update([
                'step_order' => 1, 
                'assigned_to_user_id' => $user->id, 
                'remarks' => $decisionMessage,
                'status' => 'approved',
                'is_declined' => false,
                'approved_by' => $user->id,
                'approved_at' => now(),
                'declined_by' => null,
                'declined_at' => null,
                'decline_reason' => null,
            ]);

            $lockedRequest->approved_by = $user->name;
            $lockedRequest->approved_date = now();
            $lockedRequest->save();

            WipurStep::updateOrCreate(
                ['wipur_request_id' => $lockedRequest->id, 'step' => 'admin'],
                [
                'step_order' => 2,
                'status' => 'waiting_for_admin_approval',
                'remarks' => null,
                ]
            );

            WipurRequestEvent::record([
                'wipur_request_id' => $lockedRequest->id,
                'actor_user_id' => $user->id,
                'event_type' => 'supervisor_approved',
                'from_status' => $fromStatus,
                'to_status' => 'waiting_for_admin_approval',
                'request_desc' => $lockedRequest->request_desc,
                'remarks' => $remarks ?: 'No remarks provided.',
            ]);

            return $lockedRequest;
        });

        return response()->json([
            'message' => 'Request approved and forwarded to Admin successfully.',
            'data' => $updatedRequest->fresh()->load('steps'),
        ]);
    }
}