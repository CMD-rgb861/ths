<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('job_orders', function (Blueprint $table) {
            $table->unsignedBigInteger('status')->default(1)->change(); // 1 = Pending (adjust as needed)
            $table->foreign('status')->references('id')->on('request_statuses');
        });
    }

    public function down()
    {
        Schema::table('job_orders', function (Blueprint $table) {
            $table->dropForeign(['status']);
            $table->string('status', 32)->default('Pending')->change();
        });
    }
};
