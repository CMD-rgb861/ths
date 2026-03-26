<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            // Only drop if the column exists
            if (Schema::hasColumn('users', 'role_id')) {
                // Check if the foreign key exists before dropping
                $sm = Schema::getConnection()->getDoctrineSchemaManager();
                $doctrineTable = $sm->listTableDetails('users');
                if ($doctrineTable->hasForeignKey('users_role_id_foreign')) {
                    $table->dropForeign('users_role_id_foreign');
                }
                $table->dropColumn('role_id');
            }
        });
    }

    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'role_id')) {
                $table->unsignedBigInteger('role_id')->nullable();
                if (Schema::hasTable('roles')) {
                    $table->foreign('role_id')->references('id')->on('roles')->nullOnDelete();
                }
            }
        });
    }
};
