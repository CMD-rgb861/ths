<?php

// app/Http/Controllers/UserController.php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::query();

        if ($request->filled('search')) {
            $search = $request->search;

            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $limit = $request->limit ?? ($request->filled('search') ? 10 : 50);

        return $query
            ->orderBy('name')
            ->limit($limit)
            ->get(['id', 'name', 'email']);
    }

    public function technicians()
    {
        return User::where('role', 'technician')
            ->orderBy('name')
            ->get(['id', 'name']);
    }
}


