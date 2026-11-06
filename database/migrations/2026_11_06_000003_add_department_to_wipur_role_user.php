<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('wipur_role_user', function (Blueprint $table) {
            if (! Schema::hasColumn('wipur_role_user', 'department_id')) {
                $table->unsignedBigInteger('department_id')->nullable()->after('role_id');
            }
        });

        $hasDepartmentForeignKey = DB::table('INFORMATION_SCHEMA.KEY_COLUMN_USAGE')
            ->where('TABLE_SCHEMA', config('database.connections.mysql.database'))
            ->where('TABLE_NAME', 'wipur_role_user')
            ->where('COLUMN_NAME', 'department_id')
            ->whereNotNull('REFERENCED_TABLE_NAME')
            ->exists();

        if (! $hasDepartmentForeignKey) {
            Schema::table('wipur_role_user', function (Blueprint $table) {
                $table->foreign('department_id', 'wipur_role_user_department_id_foreign')
                    ->references('id')
                    ->on('departments')
                    ->onDelete('cascade');
            });
        }

        if (! Schema::hasIndex('wipur_role_user', 'wipur_role_user_department_id_index')) {
            Schema::table('wipur_role_user', function (Blueprint $table) {
                $table->index('department_id', 'wipur_role_user_department_id_index');
            });
        }

        if (! Schema::hasIndex('wipur_role_user', 'wipur_role_user_user_role_department_unique')) {
            Schema::table('wipur_role_user', function (Blueprint $table) {
                $table->unique(['user_id', 'role_id', 'department_id'], 'wipur_role_user_user_role_department_unique');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('wipur_role_user', function (Blueprint $table) {
            if (Schema::hasColumn('wipur_role_user', 'department_id')) {
                $table->dropUnique('wipur_role_user_user_role_department_unique');
                $table->dropForeign('wipur_role_user_department_id_foreign');
                $table->dropIndex('wipur_role_user_department_id_index');
                $table->dropColumn('department_id');
            }
        });
    }
};
