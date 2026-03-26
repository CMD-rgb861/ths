<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::table('action_reports', function (Blueprint $table) {
            $table->string('serial_number')->nullable();
            $table->string('brand_name')->nullable();
            $table->string('brand_model')->nullable();
            $table->string('software_name')->nullable();
        });
    }

    public function down()
    {
        Schema::table('action_reports', function (Blueprint $table) {
            $table->dropColumn(['serial_number', 'brand_name', 'brand_model', 'software_name']);
        });
    }
};