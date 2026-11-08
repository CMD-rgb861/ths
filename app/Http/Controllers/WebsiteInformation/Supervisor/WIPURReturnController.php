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

class WIPURReturnController extends Controller
{
    /**
     * Handle the supervisor returning a request for revision.
     * The remarks are strictly required here to provide context.
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

        // 3. Validate the mandatory remarks
        $remarks = trim((string) $request->input('remarks', ''));
        
        if ($remarks === '') {
            return response()->json([
                'message' => 'Remarks are required when returning a request.',
                'errors' => ['remarks' => ['You must provide a reason for returning this request.']]
            ], 422);
        }

        $updatedRequest = DB::transaction(function () use ($wipurRequest, $departmentIds, $user, $remarks) {
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
                'Only requests awaiting supervisor review can be returned.'
            );

            $fromStatus = $step->status;
            $step->update([
                'step_order' => 1, 
                'assigned_to_user_id' => $user->id, 
                'remarks' => $remarks,
                'status' => 'returned',
                'is_declined' => false,
                'declined_by' => null,
                'declined_at' => null,
                'decline_reason' => null,
                'approved_by' => null,
                'approved_at' => null,
            ]);

            WipurRequestEvent::record([
                'wipur_request_id' => $lockedRequest->id,
                'actor_user_id' => $user->id,
                'event_type' => 'supervisor_returned',
                'from_status' => $fromStatus,
                'to_status' => 'returned',
                'request_desc' => $lockedRequest->request_desc,
                'remarks' => $remarks,
            ]);

            return $lockedRequest;
        });

        return response()->json([
            'message' => 'Request returned for revision successfully.',
            'data' => $updatedRequest->fresh()->load('steps'),
        ]);
    }
}