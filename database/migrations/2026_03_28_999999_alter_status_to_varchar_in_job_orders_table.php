<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('job_orders', function (Blueprint $table) {
            $table->string('status', 32)->default('Pending')->change();
        });
    }

    public function down()
    {
        Schema::table('job_orders', function (Blueprint $table) {
            $table->enum('status', [
                'Pending','Ongoing','Completed','Cancelled','Unserviceable','Cancelled by User'
            ])->default('Pending')->change();
        });
    }
};
