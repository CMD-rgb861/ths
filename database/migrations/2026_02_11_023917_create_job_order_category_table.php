<?php

// database/migrations/2026_01_01_000005_create_job_order_category_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('job_order_category', function (Blueprint $table) {
            $table->id();
            // Foreign key to the job_orders table
            $table->foreignId('job_order_id')->constrained()->cascadeOnDelete();
            // Foreign key to the categories table
            $table->foreignId('category_id')->constrained()->cascadeOnDelete();
            // Other description for 'Others' category
            $table->string('other_description')->nullable();
        });
    }

    public function down(): void {
        Schema::dropIfExists('job_order_category');
    }
};

