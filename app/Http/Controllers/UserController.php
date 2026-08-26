<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * Display users with search, roles, role filter, and pagination.
     *
     * GET /api/users
     */
    public function index(Request $request)
    {
        $search = $request->input('search');
        $role = $request->input('role'); // 'all', 'admin', 'technician', 'regular'

        $query = User::with('roles');

        // Search by name or email
        if ($request->filled('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Filter by role
        if ($request->filled('role') && $role !== 'all') {
            if ($role === 'regular') {
                // Regular users = users with NO roles OR users with only 'user' role
                $query->whereDoesntHave('roles', function ($q) {
                    $q->whereIn('name', ['admin', 'technician']);
                });
            } else {
                // Filter by specific role (admin, technician, etc.)
                $query->whereHas('roles', function ($q) use ($role) {
                    $q->where('name', $role);
                });
            }
        }

        // Always 10 users per page
        $users = $query
            ->orderBy('name')
            ->paginate(10);

        return response()->json([
            'data' => $users->getCollection()->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'roles' => $user->roles->pluck('name')->values()->toArray(),
                    'role_ids' => $user->roles->pluck('id')->values()->toArray(),
                ];
            }),
            'current_page' => $users->currentPage(),
            'last_page' => $users->lastPage(),
            'per_page' => $users->perPage(),
            'total' => $users->total(),
        ]);
    }

    /**
     * Get user summary counts.
     *
     * GET /api/users/counts
     */
    public function counts()
    {
        $totalUsers = User::count();

        $adminCount = User::whereHas('roles', function ($query) {
            $query->where('name', 'admin');
        })->count();

        $technicianCount = User::whereHas('roles', function ($query) {
            $query->where('name', 'technician');
        })->count();

        // Regular users = users with NO roles OR users with only 'user' role
        $regularCount = User::whereDoesntHave('roles', function ($query) {
            $query->whereIn('name', ['admin', 'technician']);
        })->count();

        return response()->json([
            'total' => $totalUsers,
            'admins' => $adminCount,
            'technicians' => $technicianCount,
            'regular' => $regularCount,
        ]);
    }

    /**
     * Get available roles.
     *
     * GET /api/roles
     */
    public function roles()
    {
        $roles = DB::table('roles')
            ->orderBy('name')
            ->get(['id', 'name']);

        return response()->json($roles);
    }

    /**
     * Update a user's role.
     *
     * PUT /api/users/{user}/role
     */
    public function updateRole(Request $request, User $user)
    {
        $validated = $request->validate([
            'role_id' => [
                'required',
                'integer',
                Rule::exists('roles', 'id'),
            ],
        ]);

        /*
         * Replace the user's current role with the selected role.
         *
         * This assumes each user should have ONE role.
         */
        DB::table('role_user')
            ->where('user_id', $user->id)
            ->delete();

        DB::table('role_user')->insert([
            'user_id' => $user->id,
            'role_id' => $validated['role_id'],
        ]);

        // Get the updated role
        $user->load('roles');

        return response()->json([
            'message' => 'User role updated successfully.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'roles' => $user->roles->pluck('name')->values()->toArray(),
                'role_ids' => $user->roles->pluck('id')->values()->toArray(),
            ],
        ]);
    }

    /**
     * Get users who have the technician role.
     *
     * GET /api/technicians
     */
    public function technicians()
    {
        return User::whereHas('roles', function ($query) {
                $query->where('name', 'technician');
            })
            ->orderBy('name')
            ->get(['id', 'name']);
    }
}