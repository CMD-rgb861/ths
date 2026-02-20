<?php

//app/Http/Controllers/CategoryController.php

namespace App\Http\Controllers;

use App\Models\Category;

class CategoryController extends Controller
{
    public function index()
    {
        $categories = Category::orderBy('created_at')->get(); // Adjust this if you want a different order
        return response()->json($categories);
    }
}   
