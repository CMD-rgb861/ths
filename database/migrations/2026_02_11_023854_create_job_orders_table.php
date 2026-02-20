<?php

// database/migrations/2026_01_01_000004_create_job_orders_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('job_orders', function (Blueprint $table) {
            $table->id();
            $table->string('job_order_no')->unique();  // Job Order Number
            $table->date('date');

            $table->foreignId('department_id')->constrained();  // References departments table

            // References users table
            $table->foreignId('requested_by')->constrained('users');
            $table->foreignId('created_by')->constrained('users');

            $table->text('request_description');
            $table->string('contact_no');
            $table->string('signature_name');

            // Optional approval and conformance
            $table->foreignId('approved_by')->nullable()->constrained('users');
            $table->date('approval_date')->nullable();

            $table->foreignId('conformed_by')->nullable()->constrained('users');
            $table->date('conformance_date')->nullable();

            $table->timestamps();  // Automatically adds created_at, updated_at
        });
    }

    public function down(): void {
        Schema::dropIfExists('job_orders');
    }
};



