<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('wipur_requests')) {
            return;
        }

        Schema::create('wipur_requests', function (Blueprint $table) {
            $table->id();
            $table->string('control_number')->unique();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->foreignId('department_id')
                ->nullable()
                ->constrained('departments')
                ->cascadeOnUpdate()
                ->nullOnDelete();

            $table->string('requested_by');
            $table->longText('request_desc')->nullable();

            $table->foreignId('status_id')
                ->nullable()
                ->constrained('request_statuses')
                ->cascadeOnUpdate()
                ->nullOnDelete();

            $table->enum('sub_status', [
                'Waiting for Confirmation',
                'Confirmed',
            ])->nullable();

            $table->boolean('is_cancelled')->default(false);
            $table->string('cancelled_by')->nullable();
            $table->boolean('is_conformed')->default(false);
            $table->string('confirmed_by')->nullable();
            $table->string('approved_by')->nullable();
            $table->dateTime('approved_date')->nullable();
            $table->string('processed_by')->nullable();
            $table->dateTime('processed_date')->nullable();
            $table->string('acknowledged_by')->nullable();
            $table->dateTime('acknowledged_date')->nullable();
            $table->boolean('notified')->default(false);
            $table->dateTime('date_requested')->nullable();
            $table->string('signature')->nullable();

            $table->timestamps();

            $table->index(['user_id', 'status_id']);
            $table->index('control_number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wipur_requests');
    }
};
