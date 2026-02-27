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
        Schema::table('client_satisfaction_measurements', function (Blueprint $table) {
            if (!Schema::hasColumn('client_satisfaction_measurements', 'client_category_other')) {
                $table->string('client_category_other')->nullable()->after('client_category');
            }

            if (!Schema::hasColumn('client_satisfaction_measurements', 'who_to_evaluate_other')) {
                $table->string('who_to_evaluate_other')->nullable()->after('who_to_evaluate');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('client_satisfaction_measurements', function (Blueprint $table) {
            if (Schema::hasColumn('client_satisfaction_measurements', 'client_category_other')) {
                $table->dropColumn('client_category_other');
            }

            if (Schema::hasColumn('client_satisfaction_measurements', 'who_to_evaluate_other')) {
                $table->dropColumn('who_to_evaluate_other');
            }
        });
    }
};
