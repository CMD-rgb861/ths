<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        DB::table('roles')->insertOrIgnore([
            ['id' => 1, 'name' => 'admin'],
            ['id' => 2, 'name' => 'technician'],
            ['id' => 3, 'name' => 'user'],
        ]);

        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'role_id')) {
                $table->unsignedBigInteger('role_id')->default(3)->after('id');
            }
        });

        $hasForeignKey = DB::table('information_schema.KEY_COLUMN_USAGE')
            ->where('TABLE_SCHEMA', DB::connection()->getDatabaseName())
            ->where('TABLE_NAME', 'users')
            ->where('COLUMN_NAME', 'role_id')
            ->whereNotNull('REFERENCED_TABLE_NAME')
            ->exists();

        if (!$hasForeignKey) {
            Schema::table('users', function (Blueprint $table) {
                $table->foreign('role_id')->references('id')->on('roles');
            });
        }
    }

    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['role_id']);
            $table->dropColumn('role_id');
        });
    }
};
