<?php

// app/Http/Controllers/UserController.php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::with('roles'); // eager load roles

        if ($request->filled('search')) {
            $search = $request->search;

            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $limit = $request->limit ?? ($request->filled('search') ? 10 : 50);

        $users = $query
            ->orderBy('name')
            ->limit($limit)
            ->get(['id', 'name', 'email']);

        // Map to include all roles
        return $users->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'roles' => $user->roles->pluck('name')->toArray(),
            ];
        });
    }

    public function technicians()
    {
        // Get users who have the 'technician' role
        return User::whereHas('roles', function ($q) {
                $q->where('name', 'technician');
            })
            ->orderBy('name')
            ->get(['id', 'name']);
    }
}


