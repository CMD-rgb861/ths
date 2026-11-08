<?php

namespace App\Http\Controllers\GeneralJobOrderControllers\Users;

use App\Http\Controllers\Controller;
use App\Models\GjorCsm;
use App\Models\GjorJobOrder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CSMController extends Controller
{
    public function show(Request $request, GjorJobOrder $jobOrder): JsonResponse
    {
        $this->authorizeOwner($request, $jobOrder);

        return response()->json([
            'data' => $jobOrder->csm,
        ]);
    }

    public function store(Request $request, GjorJobOrder $jobOrder): JsonResponse
    {
        $user = $this->authorizeOwner($request, $jobOrder);

        abort_unless(
            !$jobOrder->is_conformed
                && $jobOrder->sub_status === 'Waiting for Confirmation'
                && $jobOrder->status()->where('name', 'Ongoing')->exists(),
            422,
            'This request is not awaiting confirmation.'
        );

        $validated = $request->validate([
            'client_type' => ['required', 'string', 'max:255'],
            'client_category' => ['required', 'string', 'max:255'],
            'client_category_other' => ['required_if:client_category,Others', 'nullable', 'string', 'max:255'],
            'name' => ['nullable', 'string', 'max:255'],
            'sex' => ['required', 'string', 'max:255'],
            'age' => ['required', 'integer'],
            'date_time_visited' => ['required', 'date'],
            'services_availed' => ['required', 'string'],
            'service_provider_name' => ['nullable', 'string', 'max:255'],
            'who_to_evaluate' => ['required', 'string', 'max:255'],
            'who_to_evaluate_other' => ['required_if:who_to_evaluate,Others', 'nullable', 'string', 'max:255'],
            'office_or_faculty_unit_transacted' => ['required', 'string', 'max:255'],
            'cc1' => ['required', 'integer', 'between:1,6'],
            'cc2' => ['required', 'integer', 'between:1,6'],
            'cc3' => ['required', 'integer', 'between:1,6'],
            'sqd0' => ['required', 'integer', 'between:1,6'],
            'sqd1' => ['required', 'integer', 'between:1,6'],
            'sqd2' => ['required', 'integer', 'between:1,6'],
            'sqd3' => ['required', 'integer', 'between:1,6'],
            'sqd4' => ['required', 'integer', 'between:1,6'],
            'sqd5' => ['required', 'integer', 'between:1,6'],
            'sqd6' => ['required', 'integer', 'between:1,6'],
            'sqd7' => ['required', 'integer', 'between:1,6'],
            'sqd8' => ['required', 'integer', 'between:1,6'],
            'suggestions' => ['nullable', 'string'],
            'email_address' => ['nullable', 'email', 'max:255'],
        ]);

        $csm = DB::transaction(function () use ($validated, $jobOrder, $user) {
            $csm = GjorCsm::updateOrCreate(
                ['job_order_id' => $jobOrder->id],
                $validated
            );

            $jobOrder->update([
                'is_conformed' => true,
                'sub_status' => 'Confirmed',
                'confirmed_by' => $user->name,
            ]);

            return $csm;
        });

        return response()->json([
            'message' => 'CSM saved and request confirmed.',
            'data' => $csm,
        ], 201);
    }

    private function authorizeOwner(Request $request, GjorJobOrder $jobOrder)
    {
        $user = $request->user();
        abort_unless($user, 401, 'Unauthenticated.');
        abort_unless((int) $jobOrder->user_id === (int) $user->id, 403, 'Forbidden.');

        return $user;
    }
}