<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('wipur_steps') && ! Schema::hasColumn('wipur_steps', 'is_declined')) {
            Schema::table('wipur_steps', function (Blueprint $table) {
                $table->boolean('is_declined')->default(false)->after('status');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('wipur_steps', 'is_declined')) {
            Schema::table('wipur_steps', function (Blueprint $table) {
                $table->dropColumn('is_declined');
            });
        }
    }
};