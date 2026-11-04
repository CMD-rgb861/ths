<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gjor_action_taken', function (Blueprint $table) {
            $table->id();

            $table->foreignId('gjor_job_order_id')
                ->constrained('gjor_job_orders')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->enum('action_taken', ['Complied', 'Not Complied']);

            // Required only when action_taken = 'Not Complied'
            $table->text('reason')->nullable();

            $table->text('remarks')->nullable();
            $table->string('signatory')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gjor_action_taken');
    }
};