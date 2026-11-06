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
        Schema::table('gjor_job_orders', function (Blueprint $table) {
            if (!Schema::hasColumn('gjor_job_orders', 'signatory_name')) {
                $table->string('signatory_name')->nullable()->after('confirmed_by');
            }

            if (!Schema::hasColumn('gjor_job_orders', 'signatory_position')) {
                $table->string('signatory_position')->nullable()->after('signatory_name');
            }
        });

        Schema::table('gjor_action_taken', function (Blueprint $table) {
            if (!Schema::hasColumn('gjor_action_taken', 'is_declined')) {
                $table->boolean('is_declined')->default(false)->after('action_taken');
            }

            if (!Schema::hasColumn('gjor_action_taken', 'decline_reason')) {
                $table->text('decline_reason')->nullable()->after('is_declined');
            }

            if (!Schema::hasColumn('gjor_action_taken', 'declined_by')) {
                $table->string('declined_by')->nullable()->after('decline_reason');
            }

            if (!Schema::hasColumn('gjor_action_taken', 'approved_by')) {
                $table->string('approved_by')->nullable()->after('declined_by');
            }

            if (!Schema::hasColumn('gjor_action_taken', 'action_date')) {
                $table->timestamp('action_date')->nullable()->after('approved_by');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('gjor_action_taken', function (Blueprint $table) {
            if (Schema::hasColumn('gjor_action_taken', 'action_date')) {
                $table->dropColumn('action_date');
            }

            if (Schema::hasColumn('gjor_action_taken', 'approved_by')) {
                $table->dropColumn('approved_by');
            }

            if (Schema::hasColumn('gjor_action_taken', 'declined_by')) {
                $table->dropColumn('declined_by');
            }

            if (Schema::hasColumn('gjor_action_taken', 'decline_reason')) {
                $table->dropColumn('decline_reason');
            }

            if (Schema::hasColumn('gjor_action_taken', 'is_declined')) {
                $table->dropColumn('is_declined');
            }
        });

        Schema::table('gjor_job_orders', function (Blueprint $table) {
            if (Schema::hasColumn('gjor_job_orders', 'signatory_position')) {
                $table->dropColumn('signatory_position');
            }

            if (Schema::hasColumn('gjor_job_orders', 'signatory_name')) {
                $table->dropColumn('signatory_name');
            }
        });
    }
};
