<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        // Create or update the admin user without role_id
        $user = User::updateOrCreate(
            ['id_number' => 'ADMIN001'],
            [
                'name' => 'System Administrator',
                'email' => 'admin@local.system',
                'password' => bcrypt('password'),
                'email_verified_at' => now(),
            ]
        );
        // Assign the admin role (assuming 1 = admin)
        $user->roles()->syncWithoutDetaching([1]);
    }
}

