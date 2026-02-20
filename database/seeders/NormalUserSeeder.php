<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class NormalUserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['id_number' => '2024-0001'], // better to match unique id_number
            [
                'name' => 'Jorenz',
                'email' => 'user@example.com',
                'email_verified_at' => now(),
                'password' => Hash::make('password123'),
                'role' => 'user', 
            ]
        );
        User::updateOrCreate(
            ['id_number' => '2024-0002'], // unique identifier
            [
                'name' => 'Gwyneth',
                'email' => 'user1@example.com',
                'email_verified_at' => now(),
                'password' => Hash::make('password123'),
                'role' => 'user',
            ]
        );
    }
}
