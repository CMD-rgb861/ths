<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['id_number' => 'ADMIN001'], // must match unique column
            [
                'name' => 'System Administrator',
                'email' => 'admin@local.system',
                'password' => Hash::make('Admin@123456'),
                'email_verified_at' => now(),
                'role' => 'admin', // ✅ IMPORTANT
            ]
        );
    }
}
    