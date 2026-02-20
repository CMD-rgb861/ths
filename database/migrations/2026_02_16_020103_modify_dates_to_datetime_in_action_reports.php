<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {

    public function up(): void
    {
        Schema::table('action_reports', function (Blueprint $table) {
            $table->dateTime('date_started')->nullable()->change();
            $table->dateTime('date_finished')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('action_reports', function (Blueprint $table) {
            $table->date('date_started')->nullable()->change();
            $table->date('date_finished')->nullable()->change();
        });
    }
};

