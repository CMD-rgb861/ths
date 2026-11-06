<?php

namespace App\Http\Controllers\WebsiteInformation\Supervisor;

use App\Http\Controllers\Controller;
use App\Models\WipurRequest;
use App\Models\WipurStep;
use App\Models\WipurRoleUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WIPURReturnController extends Controller
{
    /**
     * Handle the supervisor returning a request for revision.
     * The remarks are strictly required here to provide context.
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

        // 3. Validate the mandatory remarks
        $remarks = trim((string) $request->input('remarks', ''));
        
        if ($remarks === '') {
            return response()->json([
                'message' => 'Remarks are required when returning a request.',
                'errors' => ['remarks' => ['You must provide a reason for returning this request.']]
            ], 422);
        }

        // 4. Update the Supervisor Step (Mark as Returned)
        WipurStep::updateOrCreate(
            ['wipur_request_id' => $wipurRequest->id, 'step' => 'supervisor'],
            [
                'step_order' => 1, 
                'assigned_to_user_id' => $user->id, 
                'remarks' => $remarks,
                'status' => 'returned', // 👈 The status becomes returned
                'declined_by' => $user->id,
                'declined_at' => now(),
                'decline_reason' => $remarks,
                'approved_by' => null,
                'approved_at' => null,
            ]
        );

        // Note: We do NOT create an admin step here.
        // The request goes back to the user, and the status remains 'Pending' overall.

        return response()->json([
            'message' => 'Request returned for revision successfully.',
            'data' => $wipurRequest->load('steps'),
        ]);
    }
}