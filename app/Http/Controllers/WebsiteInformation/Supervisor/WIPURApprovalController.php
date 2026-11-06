<?php

namespace App\Http\Controllers\WebsiteInformation\Supervisor;

use App\Http\Controllers\Controller;
use App\Models\WipurRequest;
use App\Models\WipurStep;
use App\Models\WipurRoleUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WIPURApprovalController extends Controller
{
    /**
     * Handle the supervisor approving a request.
     * Moves the request from the Supervisor step to the Admin step.
     */
    public function store(Request $request, WipurRequest $wipurRequest): JsonResponse
    {
        $user = $request->user();
        
        // 1. Ensure the user is an authorized WIPUR supervisor
        $isSupervisor = $user->isWipurSupervisor() ?? WipurRoleUser::where('user_id', $user->id)->exists();
        abort_unless($user && $isSupervisor, 403, 'Forbidden: WIPUR supervisor access only.');

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

        // 4. Update the Supervisor Step
        WipurStep::updateOrCreate(
            ['wipur_request_id' => $wipurRequest->id, 'step' => 'supervisor'],
            [
                'step_order' => 1, 
                'assigned_to_user_id' => $user->id, 
                'remarks' => $decisionMessage,
                'status' => 'approved',
                'approved_by' => $user->id,
                'approved_at' => now(),
                'declined_by' => null,
                'declined_at' => null,
                'decline_reason' => null,
            ]
        );

        // 5. Update the main WIPUR Request
        $wipurRequest->approved_by = $user->name;
        $wipurRequest->approved_date = now();
        $wipurRequest->save();

        // 6. Create or move to the Admin Step (Progression)
        WipurStep::updateOrCreate(
            ['wipur_request_id' => $wipurRequest->id, 'step' => 'admin'],
            [
                'step_order' => 2,
                'status' => 'waiting_for_admin_approval',
                'remarks' => null,
            ]
        );

        return response()->json([
            'message' => 'Request approved and forwarded to Admin successfully.',
            'data' => $wipurRequest->load('steps'),
        ]);
    }
}