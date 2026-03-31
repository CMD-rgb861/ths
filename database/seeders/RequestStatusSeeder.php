<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RequestStatusSeeder extends Seeder
{
    public function run(): void
    {
        $statuses = [
            'Pending',
            'Ongoing',
            'Completed',
            'Cancelled',
        ];

        foreach ($statuses as $status) {
            DB::table('request_statuses')->updateOrInsert(['name' => $status]);
        }
    }
}
