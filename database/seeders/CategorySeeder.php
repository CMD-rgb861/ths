<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;
use Illuminate\Support\Facades\DB;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        Category::truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $categories = [
            'Computer Desktop',
            'Information System',
            'Internet Connection',
            'Laptop',
            'IP/VoIP Phone',
            'Local Area Network',
            'Printer',
            'Software',
            'Institutional Email Request',
            'Others',
        ];

        foreach ($categories as $name) {
            Category::create(['name' => $name]);
        }
    }
}