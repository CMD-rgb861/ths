<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class TechnicianSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['id_number' => 'TECH-0001'], // unique identifier
            [
                'name' => 'Rushena (Technician)',
                'email' => 'tech1@example.com',
                'email_verified_at' => now(),
                'password' => Hash::make('password123'),
                'role' => 'technician',
            ]
        );

        User::updateOrCreate(
            ['id_number' => 'TECH-0002'],
            [
                'name' => 'Lie Anne (Technician)',
                'email' => 'tech2@example.com',
                'email_verified_at' => now(),
                'password' => Hash::make('password123'),
                'role' => 'technician',
            ]
        );
    }
}
