<?php

// database/migrations/2026_01_01_000006_create_action_reports_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('action_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_order_id')->constrained()->cascadeOnDelete();

            $table->text('diagnosis')->nullable();
            $table->text('action_taken')->nullable();

            $table->enum('status', [
                'Pending',
                'Ongoing',
                'Completed',
                'Cancelled'
            ])->default('Pending');

            $table->foreignId('serviced_by')->nullable()->constrained('users');
            $table->date('date_started')->nullable();
            $table->date('date_finished')->nullable();

            $table->timestamps();

            $table->unique('job_order_id');
        });
    }

    public function down(): void {
        Schema::dropIfExists('action_reports');
    }
};
