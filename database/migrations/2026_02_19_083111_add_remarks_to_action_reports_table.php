<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
        public function up()
    {
        Schema::table('action_reports', function (Blueprint $table) {
            $table->text('remarks')->nullable(); // Add a remarks field
        });
    }

    public function down()
    {
        Schema::table('action_reports', function (Blueprint $table) {
            $table->dropColumn('remarks'); // Drop the remarks field if the migration is rolled back
        });
    }

};
