<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class TechnicianSeeder extends Seeder
{
    public function run(): void
    {
        $user1 = User::updateOrCreate(
            ['id_number' => 'TECH-0001'],
            [
                'name' => 'Rushena (Technician)',
                'email' => 'tech1@example.com',
                'email_verified_at' => now(),
                'password' => Hash::make('password123'),
            ]
        );
        $user1->roles()->syncWithoutDetaching([2]); // 2 = technician

        $user2 = User::updateOrCreate(
            ['id_number' => 'TECH-0002'],
            [
                'name' => 'John Doe (Technician)',
                'email' => 'tech2@example.com',
                'email_verified_at' => now(),
                'password' => Hash::make('password123'),
            ]
        );
        $user2->roles()->syncWithoutDetaching([2]);

        $user3 = User::updateOrCreate(
            ['id_number' => 'TECH-0003'],
            [
                'name' => 'Jane Smith (Technician)',
                'email' => 'tech3@example.com',
                'email_verified_at' => now(),
                'password' => Hash::make('password123'),
            ]
        );
        $user3->roles()->syncWithoutDetaching([2]);

        $user4 = User::updateOrCreate(
            ['id_number' => '2024-T001'],
            [
                'name' => 'Tech One',
                'email' => 'tech4@example.com',
                'email_verified_at' => now(),
                'password' => Hash::make('password123'),
            ]
        );
        $user4->roles()->syncWithoutDetaching([2]);

        $user = User::updateOrCreate(
            ['id_number' => 'ADTECH001'],
            [
                'name' => 'Alex DualRole',
                'email' => 'admintech@example.com',
                'email_verified_at' => now(),
                'password' => Hash::make('password'),
            ]
        );
        $user->roles()->sync([1, 2]); // 1 = admin, 2 = technician
    }
}