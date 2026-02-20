<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('action_reports', function (Blueprint $table) {
            $table->string('item')->nullable(); // Item field
            $table->text('findings')->nullable(); // Findings field
            $table->string('noted_by_its')->nullable(); // Noted by ITS field
            $table->string('noted_by_pc')->nullable(); // Noted by Property Custodian field
            $table->date('unserviceable_date')->nullable(); // Date field for when unserviceable was set
        });
    }

    public function down()
    {
        Schema::table('action_reports', function (Blueprint $table) {
            $table->dropColumn(['item', 'findings', 'noted_by_its', 'noted_by_pc', 'unserviceable_date']);
        });
    }
};
