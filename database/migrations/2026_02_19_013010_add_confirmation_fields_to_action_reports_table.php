<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {

    public function up(): void
    {
        Schema::table('action_reports', function (Blueprint $table) {

            $table->foreignId('confirmed_by')
                ->nullable()
                ->after('conformed')
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamp('confirmed_at')
                ->nullable()
                ->after('confirmed_by');

        });
    }

    public function down(): void
    {
        Schema::table('action_reports', function (Blueprint $table) {

            $table->dropForeign(['confirmed_by']);

            $table->dropColumn([
                'confirmed_by',
                'confirmed_at',
            ]);

        });
    }
};

