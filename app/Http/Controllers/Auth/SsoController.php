<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class SsoController extends Controller
{
    public function validateToken(Request $request)
    {
        $ip = getHostByName(getHostName());

        $token = $request->query('sso_token');
        $id_number = $request->query('id_number');

        if (!$token || !$id_number) {
            return redirect()->away(
                "https://{$ip}/ids/itsms/home/n?error=" .
                urlencode('Missing SSO credentials.')
            );
        }

        // Clean up any expired tokens first
        DB::table('sso_tokens')
            ->where('expires_at', '<', now())
            ->delete();

        // Check if token already exists and is valid
        $ssoToken = DB::table('sso_tokens')
            ->where('token', $token)
            ->where('id_number', $id_number)
            ->first();

        if (!$ssoToken) {
            return redirect()->away(
                "https://{$ip}/ids/itsms/home/n?error=" .
                urlencode('Invalid SSO token. Please return to SSO and try again.')
            );
        }

        // Token exists - check if expired
        if (Carbon::parse($ssoToken->expires_at)->isPast()) {

            // Delete expired token
            DB::table('sso_tokens')
                ->where('token', $token)
                ->where('id_number', $id_number)
                ->delete();

            return redirect()->away(
                "https://{$ip}/ids/itsms/home/n?error=" .
                urlencode('SSO token has expired. Please return to SSO and try again.')
            );
        }

        // Find user in THS
        $user = User::query()
            ->firstWhere('id_number', $id_number);

        if (!$user) {

            // Delete the token since validation failed
            DB::table('sso_tokens')
                ->where('token', $token)
                ->where('id_number', $id_number)
                ->delete();

            return redirect()->away(
                "https://{$ip}/ids/itsms/home/n?error=" .
                urlencode('User not found in this system.')
            );
        }

        // Clear the token after successful use
        DB::table('sso_tokens')
            ->where('token', $token)
            ->where('id_number', $id_number)
            ->delete();

        // Log the user into the web session
        Auth::login($user);

        // Regenerate session
        $request->session()->regenerate();

        $user->tokens()->delete();

        // Generate Sanctum Token for API usage
        $sanctumToken = $user
            ->createToken('auth-token')
            ->plainTextToken;

        // Redirect to dashboard
        return redirect()
            ->intended(route('dashboard'))
            ->with('api_token', $sanctumToken);
    }
}
