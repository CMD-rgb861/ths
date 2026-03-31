<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ServiceStatusSeeder extends Seeder
{
    public function run(): void
    {
        $statuses = [
            'Unserviceable with Form',
            'Unserviceable without Form',
            'Diagnosed',
            'Serviced',
            'Close',
        ];

        foreach ($statuses as $status) {
            DB::table('service_statuses')->updateOrInsert(['name' => $status]);
        }
    }
}
