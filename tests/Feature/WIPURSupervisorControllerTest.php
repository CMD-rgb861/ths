<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\RequestStatus;
use App\Models\Role;
use App\Models\User;
use App\Models\WipurRequest;
use App\Models\WipurRoleUser;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WIPURSupervisorControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_supervisor_can_fetch_pending_queue(): void
    {
        $department = Department::create([
            'name' => 'Academic Affairs',
            'shorten' => 'AA',
        ]);

        $status = RequestStatus::firstOrCreate(['name' => 'Pending']);

        $supervisorRole = Role::firstOrCreate(['name' => 'wipur_supervisor']);
        $supervisor = User::factory()->create([
            'name' => 'Supervisor User',
            'email' => 'supervisor@example.com',
        ]);

        WipurRoleUser::create([
            'user_id' => $supervisor->id,
            'role_id' => $supervisorRole->id,
            'department_id' => $department->id,
        ]);

        $requester = User::factory()->create([
            'name' => 'Requester User',
            'email' => 'requester@example.com',
        ]);

        $request = WipurRequest::create([
            'control_number' => '2026110001',
            'user_id' => $requester->id,
            'department_id' => $department->id,
            'requested_by' => $requester->name,
            'request_desc' => 'Update the website banner for the academic office.',
            'status_id' => $status->id,
            'sub_status' => 'waiting_for_supervisor_approval',
            'date_requested' => now(),
        ]);

        $response = $this->actingAs($supervisor, 'sanctum')
            ->getJson('/api/website-information/supervisor/pending');

        $response->assertOk();
        $response->assertJsonFragment([
            'requester' => $requester->name,
            'department' => 'Academic Affairs',
        ]);
        $response->assertJsonPath('meta.total', 1);

        $this->assertDatabaseHas('wipur_requests', [
            'id' => $request->id,
            'sub_status' => 'waiting_for_supervisor_approval',
        ]);
    }

    public function test_supervisor_only_sees_requests_from_same_department(): void
    {
        $department = Department::create([
            'name' => 'Academic Affairs',
            'shorten' => 'AA',
        ]);

        $otherDepartment = Department::create([
            'name' => 'Finance',
            'shorten' => 'FIN',
        ]);

        $status = RequestStatus::firstOrCreate(['name' => 'Pending']);

        $supervisorRole = Role::firstOrCreate(['name' => 'wipur_supervisor']);
        $supervisor = User::factory()->create([
            'name' => 'Department Supervisor',
            'email' => 'dept-supervisor@example.com',
        ]);

        WipurRoleUser::create([
            'user_id' => $supervisor->id,
            'role_id' => $supervisorRole->id,
            'department_id' => $department->id,
        ]);

        $sameDepartmentRequester = User::factory()->create([
            'name' => 'Same Dept Requester',
            'email' => 'same-dept@example.com',
        ]);

        $otherDepartmentRequester = User::factory()->create([
            'name' => 'Other Dept Requester',
            'email' => 'other-dept@example.com',
        ]);

        $sameDepartmentRequest = WipurRequest::create([
            'control_number' => '2026110003',
            'user_id' => $sameDepartmentRequester->id,
            'department_id' => $department->id,
            'requested_by' => $sameDepartmentRequester->name,
            'request_desc' => 'Update the academic office contact page.',
            'status_id' => $status->id,
            'sub_status' => 'waiting_for_supervisor_approval',
            'date_requested' => now(),
        ]);

        WipurRequest::create([
            'control_number' => '2026110004',
            'user_id' => $otherDepartmentRequester->id,
            'department_id' => $otherDepartment->id,
            'requested_by' => $otherDepartmentRequester->name,
            'request_desc' => 'Update the finance page.',
            'status_id' => $status->id,
            'sub_status' => 'waiting_for_supervisor_approval',
            'date_requested' => now(),
        ]);

        $response = $this->actingAs($supervisor, 'sanctum')
            ->getJson('/api/website-information/supervisor/pending');

        $response->assertOk();
        $response->assertJsonPath('meta.total', 1);
        $response->assertJsonFragment([
            'request_id' => $sameDepartmentRequest->id,
        ]);
        $response->assertJsonMissing([
            'request_id' => 999999,
        ]);
    }

    public function test_supervisor_can_record_a_decision(): void
    {
        $department = Department::create([
            'name' => 'Finance',
            'shorten' => 'FIN',
        ]);

        $pendingStatus = RequestStatus::firstOrCreate(['name' => 'Pending']);

        $supervisorRole = Role::firstOrCreate(['name' => 'wipur_supervisor']);
        $supervisor = User::factory()->create([
            'name' => 'Review Supervisor',
            'email' => 'review-supervisor@example.com',
        ]);

        WipurRoleUser::create([
            'user_id' => $supervisor->id,
            'role_id' => $supervisorRole->id,
            'department_id' => $department->id,
        ]);

        $requester = User::factory()->create([
            'name' => 'Finance Requester',
            'email' => 'finance-requester@example.com',
        ]);

        $request = WipurRequest::create([
            'control_number' => '2026110002',
            'user_id' => $requester->id,
            'department_id' => $department->id,
            'requested_by' => $requester->name,
            'request_desc' => 'Revise the finance contact page.',
            'status_id' => $pendingStatus->id,
            'sub_status' => 'waiting_for_supervisor_approval',
            'date_requested' => now(),
        ]);

        $response = $this->actingAs($supervisor, 'sanctum')
            ->postJson('/api/website-information/supervisor/requests/' . $request->id . '/decision', [
                'decision' => 'approve',
                'remarks' => 'Approved for admin review.',
            ]);

        $response->assertOk();
        $response->assertJsonPath('data.sub_status', 'waiting_for_admin_approval');
        $this->assertDatabaseHas('wipur_steps', [
            'wipur_request_id' => $request->id,
            'step' => 'supervisor',
            'status' => 'approved',
            'approved_by' => $supervisor->id,
        ]);
    }
}
