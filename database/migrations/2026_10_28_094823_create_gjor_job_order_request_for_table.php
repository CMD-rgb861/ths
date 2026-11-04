<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gjor_job_order_request_for', function (Blueprint $table) {
            $table->id();

            $table->foreignId('gjor_job_order_id')
                ->constrained('gjor_job_orders')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->foreignId('request_for_id')
                ->constrained('gjor_request_for')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            // How many personnel of this type the user is requesting
            $table->unsignedInteger('quantity')->default(0);

            $table->timestamps();

            // One row per (job order, request_for) pair
            $table->unique(['gjor_job_order_id', 'request_for_id'], 'gjor_job_order_request_for_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gjor_job_order_request_for');
    }
};