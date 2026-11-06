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
        if (! Schema::hasTable('wipur_role_user')) {
            Schema::create('wipur_role_user', function (Blueprint $table) {
                $table->unsignedBigInteger('user_id');
                $table->unsignedBigInteger('role_id');

                $table->primary(['user_id', 'role_id']);

                $table->index('role_id', 'wipur_role_user_role_id_index');

                $table->foreign('user_id', 'wipur_role_user_user_id_foreign')
                    ->references('id')
                    ->on('users')
                    ->onDelete('cascade');

                $table->foreign('role_id', 'wipur_role_user_role_id_foreign')
                    ->references('id')
                    ->on('roles')
                    ->onDelete('cascade');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('wipur_role_user')) {
            Schema::dropIfExists('wipur_role_user');
        }
    }
};
