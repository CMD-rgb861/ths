<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {

    public function up(): void
    {
        Schema::table('action_reports', function (Blueprint $table) {

            $table->foreignId('accepted_by')
                ->nullable()
                ->after('serviced_by')
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamp('accepted_at')
                ->nullable()
                ->after('accepted_by');

            $table->foreignId('cancelled_by')
                ->nullable()
                ->after('accepted_at')
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamp('cancelled_at')
                ->nullable()
                ->after('cancelled_by');

        });
    }

    public function down(): void
    {
        Schema::table('action_reports', function (Blueprint $table) {

            $table->dropForeign(['accepted_by']);
            $table->dropForeign(['cancelled_by']);

            $table->dropColumn([
                'accepted_by',
                'accepted_at',
                'cancelled_by',
                'cancelled_at',
            ]);

        });
    }
};
