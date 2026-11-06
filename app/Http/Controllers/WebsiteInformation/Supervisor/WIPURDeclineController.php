<?php

namespace App\Http\Controllers\WebsiteInformation\Supervisor;

use App\Http\Controllers\Controller;
use App\Models\WipurRequest;
use App\Models\WipurStep;
use App\Models\WipurRoleUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WIPURDeclineController extends Controller
{
    /**
     * Handle the supervisor declining a request.
     * The reason is required and saved to decline_reason, while remarks are optional side notes.
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

        // 3. Validate the mandatory reason
        $reason = trim((string) $request->input('reason', ''));
        $remarks = trim((string) $request->input('remarks', ''));
        
        if ($reason === '') {
            return response()->json([
                'message' => 'A reason is required when declining a request.',
                'errors' => ['reason' => ['You must provide a reason for declining this request.']]
            ], 422);
        }

        // 4. Update the Supervisor Step (Mark as Declined)
        WipurStep::updateOrCreate(
            ['wipur_request_id' => $wipurRequest->id, 'step' => 'supervisor'],
            [
                'step_order' => 1, 
                'assigned_to_user_id' => $user->id, 
                'status' => 'declined', // 👈 The status becomes declined
                'declined_by' => $user->id,
                'declined_at' => now(),
                'decline_reason' => $reason, // 👈 Saved in the dedicated column
                'remarks' => $remarks ?: null, // 👈 Side notes in their own column
                'approved_by' => null,
                'approved_at' => null,
            ]
        );

        // Note: No Admin step is created here. The request is dead.
        // If you have a logic to update the main status_id to Cancelled or Declined, add it here.
        // e.g., $wipurRequest->status_id = $cancelledStatusId; $wipurRequest->save();

        return response()->json([
            'message' => 'Request declined successfully.',
            'data' => $wipurRequest->load('steps'),
        ]);
    }
}