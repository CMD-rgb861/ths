<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gjor_job_orders', function (Blueprint $table) {
            $table->id();

            $table->string('request_no')->unique();

            $table->foreignId('request_for_id')
                ->constrained('gjor_request_for')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->foreignId('department_id')
                ->nullable()
                ->constrained('departments')
                ->cascadeOnUpdate()
                ->nullOnDelete();

            // "Requested by" name (snapshot at creation time)
            $table->string('requested_by');

            $table->string('contact_no')->nullable();
            $table->text('purpose');

            // Required only when request_for_id = Others
            $table->text('others_desc')->nullable();

            $table->foreignId('status_id')
                ->constrained('request_statuses')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->enum('sub_status', [
                'Waiting for Confirmation',
                'Confirmed',
            ])->nullable();    

            // Cancellation
            $table->boolean('is_cancelled')->default(false);
            $table->string('cancelled_by')->nullable();

            // Confirmation
            $table->boolean('is_conformed')->default(false); // "is_conformed" per your spec
            $table->string('confirmed_by')->nullable();

            $table->boolean('notified')->default(false);

            $table->timestamps();

            $table->index(['user_id', 'status_id']);
            $table->index('request_no');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gjor_job_orders');
    }
};