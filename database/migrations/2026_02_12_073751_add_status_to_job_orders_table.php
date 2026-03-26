<?php

// database/migrations/2026_02_12_000001_add_status_to_job_orders_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('job_orders', function (Blueprint $table) {
            $table->enum('status', [
                'Pending',
                'Ongoing',
                'Completed',
                'Cancelled',
                'Unserviceable',
                'Cancelled by User'
            ])->default('Pending')->after('signature_name'); // Add this after the signature_name column
        });
    }

    public function down(): void
    {
        Schema::table('job_orders', function (Blueprint $table) {
            $table->dropColumn('status');
        });
    }
};

