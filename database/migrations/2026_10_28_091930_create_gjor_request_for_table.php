<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gjor_request_for', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->timestamps();
        });

        // Seed the lookup values
        DB::table('gjor_request_for')->insert([
            ['name' => 'Janitor(s)',     'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Plumber(s)',     'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Engineer(s)',    'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Electrician(s)', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Carpenter(s)',   'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Others',         'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('gjor_request_for');
    }
};