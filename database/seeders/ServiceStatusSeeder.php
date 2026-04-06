<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ServiceStatusSeeder extends Seeder
{
    public function run(): void
    {
        // Fix existing incorrect value
        DB::table('service_statuses')
            ->where('name', 'Close')
            ->update(['name' => 'Closed']);

        $statuses = [
            'Unserviceable with Form',
            'Unserviceable without Form',
            'Diagnosed',
            'Serviced',
            'Closed',
        ];

        foreach ($statuses as $status) {
            DB::table('service_statuses')->updateOrInsert(
                ['name' => $status],
                ['name' => $status]
            );
        }
    }
}
