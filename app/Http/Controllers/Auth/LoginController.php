<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LoginController extends Controller
{
    /**
     * Handle an incoming login request via API.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $request->authenticate();

        $user = $request->user();

        // Delete old tokens (optional but recommended)
        $user->tokens()->delete();

        // Create a new token for the user
        $token = $user->createToken('auth-token')->plainTextToken;

        // Return the token and user information
        return response()->json([
            'id' => $user->id,
            'id_number' => $user->id_number,
            'name' => $user->name,
            'email' => $user->email,
            'roles' => $user->roles->pluck('name')->toArray(),
            'token' => $token,
        ]);
    }

    /**
     * Destroy an authenticated session.
     */
    public function logout(Request $request): JsonResponse
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

