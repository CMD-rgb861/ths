<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        // Create signatories table
        Schema::create('signatories', function (Blueprint $table) {
            $table->id();
            $table->string('role')->index();
            $table->foreignId('user_id')->nullable()->constrained('users');
            $table->string('name')->nullable();
            $table->timestamps();
        });

        // Update job_orders.approved_by foreign key to reference signatories
        Schema::table('job_orders', function (Blueprint $table) {
            // Drop existing foreign key to users if present
            try {
                $table->dropForeign(['approved_by']);
            } catch (\Exception $e) {
                // ignore if it doesn't exist
            }

            // Ensure column exists and is unsignedBigInteger
            if (!Schema::hasColumn('job_orders', 'approved_by')) {
                $table->unsignedBigInteger('approved_by')->nullable();
            } else {
                // Attempt to change type if DB supports it; otherwise no-op
                try {
                    $table->unsignedBigInteger('approved_by')->nullable()->change();
                } catch (\Exception $e) {
                    // change() may require doctrine/dbal; ignore if unavailable
                }
            }

            // Add new foreign key to signatories
            $table->foreign('approved_by')->references('id')->on('signatories')->nullOnDelete();
        });
    }

    public function down(): void {
        Schema::table('job_orders', function (Blueprint $table) {
            try {
                $table->dropForeign(['approved_by']);
            } catch (\Exception $e) {
            }
        });

        Schema::dropIfExists('signatories');
    }
};
