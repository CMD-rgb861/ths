<?php

namespace Tests\Feature;

use App\Models\GjorJobOrder;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class GjorCsmControllerTest extends TestCase
{
    protected User $owner;
    protected GjorJobOrder $jobOrder;

    protected function setUp(): void
    {
        parent::setUp();

        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('id_number')->nullable();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password')->nullable();
            $table->timestamps();
        });

        Schema::create('request_statuses', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->timestamps();
        });

        Schema::create('gjor_job_orders', function (Blueprint $table) {
            $table->id();
            $table->string('request_no')->unique();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('status_id');
            $table->string('sub_status')->nullable();
            $table->boolean('is_conformed')->default(false);
            $table->string('confirmed_by')->nullable();
            $table->timestamps();
        });

        $migration = require database_path('migrations/2026_11_08_000001_create_gjor_csm_table.php');
        $migration->up();

        $this->owner = User::create([
            'id_number' => 'GJOR-USER-1',
            'name' => 'GJOR Requester',
            'email' => 'gjor-requester@example.com',
            'password' => 'password',
        ]);

        $statusId = DB::table('request_statuses')->insertGetId([
            'name' => 'Ongoing',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->jobOrder = GjorJobOrder::create([
            'request_no' => '2026110001',
            'user_id' => $this->owner->id,
            'status_id' => $statusId,
            'sub_status' => 'Waiting for Confirmation',
            'is_conformed' => false,
        ]);
    }

    protected function tearDown(): void
    {
        Schema::dropIfExists('gjor_csm');
        Schema::dropIfExists('gjor_job_orders');
        Schema::dropIfExists('request_statuses');
        Schema::dropIfExists('users');

        parent::tearDown();
    }

    public function test_requester_can_save_and_fetch_csm_and_confirm_their_job_order(): void
    {
        $this->actingAs($this->owner, 'sanctum')
            ->postJson("/api/gjor/job-orders/{$this->jobOrder->id}/csm", $this->validCsm())
            ->assertCreated()
            ->assertJsonPath('message', 'CSM saved and request confirmed.')
            ->assertJsonPath('data.client_type', 'Citizen');

        $this->assertDatabaseHas('gjor_csm', [
            'job_order_id' => $this->jobOrder->id,
            'client_type' => 'Citizen',
            'sqd8' => 5,
        ]);
        $this->assertDatabaseHas('gjor_job_orders', [
            'id' => $this->jobOrder->id,
            'is_conformed' => true,
            'sub_status' => 'Confirmed',
            'confirmed_by' => $this->owner->name,
        ]);

        $this->getJson("/api/gjor/job-orders/{$this->jobOrder->id}/csm")
            ->assertOk()
            ->assertJsonPath('data.client_type', 'Citizen')
            ->assertJsonPath('data.email_address', 'requester@example.com');
    }

    public function test_another_user_cannot_fetch_or_submit_csm_for_the_job_order(): void
    {
        $otherUser = User::create([
            'id_number' => 'GJOR-USER-2',
            'name' => 'Another Requester',
            'email' => 'another-requester@example.com',
            'password' => 'password',
        ]);

        $this->actingAs($otherUser, 'sanctum')
            ->getJson("/api/gjor/job-orders/{$this->jobOrder->id}/csm")
            ->assertForbidden();

        $this->postJson("/api/gjor/job-orders/{$this->jobOrder->id}/csm", $this->validCsm())
            ->assertForbidden();

        $this->assertDatabaseCount('gjor_csm', 0);
    }

    private function validCsm(): array
    {
        return [
            'client_type' => 'Citizen',
            'client_category' => 'Student',
            'name' => 'Test User',
            'sex' => 'Female',
            'age' => '25',
            'date_time_visited' => '2026-11-08T10:00',
            'services_availed' => 'Repair request',
            'service_provider_name' => 'Service Team',
            'who_to_evaluate' => 'Service Provider',
            'office_or_faculty_unit_transacted' => 'IT Office',
            'cc1' => '1',
            'cc2' => '2',
            'cc3' => '3',
            'sqd0' => '5',
            'sqd1' => '5',
            'sqd2' => '5',
            'sqd3' => '5',
            'sqd4' => '5',
            'sqd5' => '5',
            'sqd6' => '5',
            'sqd7' => '5',
            'sqd8' => '5',
            'email_address' => 'requester@example.com',
        ];
    }
}
