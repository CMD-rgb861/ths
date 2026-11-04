<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gjor_attachments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('gjor_job_order_id')
                ->constrained('gjor_job_orders')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->string('original_name');
            $table->string('file_path');
            $table->string('type')->nullable(); // e.g. image/png, application/pdf

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gjor_attachments');
    }
};