<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        if (!Schema::hasTable('role_user')) {
            Schema::create('role_user', function (Blueprint $table) {
                $table->unsignedBigInteger('user_id');
                $table->unsignedBigInteger('role_id');
                $table->primary(['user_id', 'role_id']);
                $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
                $table->foreign('role_id')->references('id')->on('roles')->onDelete('cascade');
            });
        }

        // Remove role_id from users table
        if (Schema::hasColumn('users', 'role_id')) {
            $hasForeignKey = DB::table('information_schema.KEY_COLUMN_USAGE')
                ->where('TABLE_SCHEMA', DB::connection()->getDatabaseName())
                ->where('TABLE_NAME', 'users')
                ->where('COLUMN_NAME', 'role_id')
                ->whereNotNull('REFERENCED_TABLE_NAME')
                ->exists();

            if ($hasForeignKey) {
                Schema::table('users', function (Blueprint $table) {
                    $table->dropForeign(['role_id']);
                });
            }

            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('role_id');
            });
        }
    }

    public function down()
    {
        Schema::dropIfExists('role_user');
        // You may want to add back the role_id column if rolling back
    }
};
