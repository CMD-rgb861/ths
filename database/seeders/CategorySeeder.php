<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        // Define a list of categories to seed
        $categories = [
            'Computer Hardware',
            'Information System',
            'Internet Connection',
            'Laptop',
            'IP/VoIP Phone',
            'Local Area Network',
            'Printer',
            'Software',
            'Others',  // Option for "other" category
        ];

        // Insert each category into the database
        foreach ($categories as $name) {
            Category::create(['name' => $name]);
        }
    }
}
