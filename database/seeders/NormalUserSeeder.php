<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class NormalUserSeeder extends Seeder
{
    public function run(): void
    {
        $user1 = User::updateOrCreate(
            ['id_number' => '2024-0001'],
            [
                'name' => 'Jorenz',
                'email' => 'user@example.com',
                'email_verified_at' => now(),
                'password' => Hash::make('password123'),
            ]
        );
        $user1->roles()->syncWithoutDetaching([3]); // 3 = user

        $user2 = User::updateOrCreate(
            ['id_number' => '2024-0002'],
            [
                'name' => 'Gwyneth',
                'email' => 'user1@example.com',
                'email_verified_at' => now(),
                'password' => Hash::make('password123'),
            ]
        );
        $user2->roles()->syncWithoutDetaching([3]); // 3 = user
    }
}
