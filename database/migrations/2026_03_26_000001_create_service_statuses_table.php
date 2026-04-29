<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('service_statuses', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique(); // e.g., Unserviceable, Diagnosed, etc.
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('service_statuses');
    }
};
