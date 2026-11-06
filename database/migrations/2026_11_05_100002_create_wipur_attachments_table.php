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
        if (Schema::hasTable('wipur_attachments')) {
            return;
        }

        Schema::create('wipur_attachments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('wipur_request_id')
                ->constrained('wipur_requests')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->string('original_name');
            $table->string('file_path');
            $table->string('type')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wipur_attachments');
    }
};
