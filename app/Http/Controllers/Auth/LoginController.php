<?php

// app/Http/Controllers/Auth/LoginController.php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class LoginController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'id_number' => 'required|string',
            'password'  => 'required|string',
        ]);

        // Fetch user by id_number
        $user = User::where('id_number', $request->id_number)->first();

        // Check if the user exists and if the password is correct
        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Invalid credentials'
            ], 401);
        }

        // Delete old tokens (optional but recommended)
        $user->tokens()->delete();

        // Create a new token for the user
        $token = $user->createToken('auth-token')->plainTextToken;

        // Return the token and user information
        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'roles' => $user->roles->pluck('name')->toArray(),
            'token' => $token,
        ]);
    }

    // Logout method to invalidate the current token
    public function logout(Request $request)
    {
        /** @var \Laravel\Sanctum\PersonalAccessToken|null $token */
        $token = $request->user()->currentAccessToken();
        if ($token) {
            // @phpstan-ignore-next-line
            $token->delete();
        }

        return response()->json([
            'message' => 'Logged out successfully'
        ]);
    }
}

