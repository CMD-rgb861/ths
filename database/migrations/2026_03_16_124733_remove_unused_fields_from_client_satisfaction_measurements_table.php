<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('client_satisfaction_measurements', function (Blueprint $table) {
            if (Schema::hasColumn('client_satisfaction_measurements', 'region_of_residence')) {
                $table->dropColumn('region_of_residence');
            }

            if (Schema::hasColumn('client_satisfaction_measurements', 'student_program')) {
                $table->dropColumn('student_program');
            }
        });
    }

    public function down(): void
    {
        Schema::table('client_satisfaction_measurements', function (Blueprint $table) {
            if (!Schema::hasColumn('client_satisfaction_measurements', 'region_of_residence')) {
                $table->string('region_of_residence')->nullable();
            }

            if (!Schema::hasColumn('client_satisfaction_measurements', 'student_program')) {
                $table->string('student_program')->nullable();
            }
        });
    }
};