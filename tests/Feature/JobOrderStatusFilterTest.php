<?php

namespace Tests\Feature;

use App\Http\Controllers\JobOrderController;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class JobOrderStatusFilterTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::create('departments', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->timestamps();
        });

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
            $table->string('name');
            $table->timestamps();
        });

        Schema::create('job_orders', function (Blueprint $table) {
            $table->id();
            $table->string('job_order_no')->nullable();
            $table->date('date');
            $table->unsignedBigInteger('department_id')->nullable();
            $table->unsignedBigInteger('requested_by')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->text('request_description')->nullable();
            $table->string('contact_no')->nullable();
            $table->string('signature_name')->nullable();
            $table->unsignedBigInteger('status')->nullable();
            $table->timestamps();
        });

        Schema::create('action_reports', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('job_order_id');
            $table->string('status')->nullable();
            $table->boolean('conformed')->nullable();
            $table->string('action_taken')->nullable();
            $table->text('diagnosis')->nullable();
            $table->date('date_started')->nullable();
            $table->date('date_finished')->nullable();
            $table->text('remarks')->nullable();
            $table->unsignedBigInteger('serviced_by')->nullable();
            $table->timestamps();
        });

        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->timestamps();
        });

        Schema::create('job_order_category', function (Blueprint $table) {
            $table->unsignedBigInteger('job_order_id');
            $table->unsignedBigInteger('category_id');
            $table->string('other_description')->nullable();
            $table->timestamps();
        });

        Schema::create('job_order_attachments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('job_order_id');
            $table->string('file_name')->nullable();
            $table->string('file_path')->nullable();
            $table->timestamps();
        });

        Schema::create('client_satisfaction_measurements', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('job_order_id');
            $table->timestamps();
        });
    }

    public function test_completed_status_page_returns_completed_jobs(): void
    {
        $departmentId = DB::table('departments')->insertGetId(['name' => 'IT']);
        $requesterId = DB::table('users')->insertGetId([
            'id_number' => 'U-001',
            'name' => 'Requester',
            'email' => 'requester@example.com',
            'password' => bcrypt('secret')
        ]);

        $pendingId = DB::table('request_statuses')->insertGetId(['name' => 'Pending']);
        $completedId = DB::table('request_statuses')->insertGetId(['name' => 'Completed']);

        DB::table('job_orders')->insert([
            'job_order_no' => 'JO-1001',
            'date' => now()->toDateString(),
            'department_id' => $departmentId,
            'requested_by' => $requesterId,
            'created_by' => $requesterId,
            'request_description' => 'Laptop not booting',
            'contact_no' => '09123456789',
            'status' => $completedId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $admin = new User([
            'id' => 999,
            'id_number' => 'A-001',
            'name' => 'Admin',
            'email' => 'admin@example.com',
        ]);
        $admin->setRelation('roles', collect([(object) ['name' => 'admin']]));

        $request = Request::create('/job-orders', 'GET', ['status' => $completedId]);
        $request->setUserResolver(fn () => $admin);

        $response = (new JobOrderController())->index($request);

        $this->assertSame(200, $response->getStatusCode());

        $payload = json_decode($response->getContent(), true);
        $this->assertCount(1, $payload['data']);
        $this->assertSame($completedId, $payload['data'][0]['status']);
    }
}
