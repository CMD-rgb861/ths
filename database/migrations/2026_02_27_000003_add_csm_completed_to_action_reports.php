<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('action_reports', function (Blueprint $table) {
            $table->boolean('csm_completed')->default(false)->after('conformed');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('action_reports', function (Blueprint $table) {
            $table->dropColumn('csm_completed');
        });
    }
};
