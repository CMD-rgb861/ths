<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RolesTableSeeder extends Seeder
{
    public function run()
    {
        // Use upsert to avoid duplicate key errors
        DB::table('roles')->upsert([
            ['id' => 1, 'name' => 'admin'],
            ['id' => 2, 'name' => 'technician'],
            ['id' => 3, 'name' => 'user'],
        ], ['id', 'name']);
    }
}