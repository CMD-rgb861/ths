<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('job_order_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_order_id')
                  ->constrained()
                  ->cascadeOnDelete();

            $table->string('original_name');
            $table->string('file_path');
            $table->string('type'); // image or pdf

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('job_order_attachments');
    }
};
