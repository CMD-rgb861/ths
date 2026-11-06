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
        if (Schema::hasColumn('wipur_requests', 'sub_status')) {
            Schema::table('wipur_requests', function (Blueprint $table) {
                $table->dropColumn('sub_status');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasColumn('wipur_requests', 'sub_status')) {
            Schema::table('wipur_requests', function (Blueprint $table) {
                $table->enum('sub_status', [
                    'waiting_for_supervisor_approval',
                    'waiting_for_admin_approval',
                    'returned',
                    'approved',
                    'declined',
                    'completed',
                ])->nullable()->after('status_id');
            });
        }
    }
};
