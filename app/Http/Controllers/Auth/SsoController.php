<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Carbon;

class SsoController extends Controller
{
    public function validateToken(Request $request)
    {
        // dd('NEW SSO CONTROLLER');
        $token = $request->query('sso_token');
        $id_number = $request->query('id_number');

        if (!$token || !$id_number) {
            Log::warning('SSO validation: Missing parameters');
            return redirect()->route('dashboard')->withErrors([
                'error' => 'Missing SSO credentials.'
            ]);
        }

        // Clean up any expired tokens first
        DB::table('sso_tokens')->where('expires_at', '<', now())->delete();

        // Check if token already exists and is valid
        $ssoToken = DB::table('sso_tokens')
            ->where('token', $token)
            ->where('id_number', $id_number)
            ->first();

        if (!$ssoToken) {
            Log::warning('SSO validation: Invalid token', ['token' => $token, 'id_number' => $id_number]);
            return redirect()->route('dashboard')->withErrors([
                'error' => 'Invalid SSO token. Please return to SSO and try again.'
            ]);
        }

        // Token exists - check if expired
        if (Carbon::parse($ssoToken->expires_at)->isPast()) {
            // Delete expired token
            DB::table('sso_tokens')
                ->where('token', $token)
                ->where('id_number', $id_number)
                ->delete();
            
            return redirect()->route('dashboard')->withErrors([
                'error' => 'SSO token has expired. Please return to SSO and try again.'
            ]);
        }

        // Find user in THS
        $user = User::query()->firstWhere('id_number', $id_number);

        if (!$user) {
            Log::warning('SSO validation: User not found', ['id_number' => $id_number]);
            
            // Delete the token since validation failed
            DB::table('sso_tokens')
                ->where('token', $token)
                ->where('id_number', $id_number)
                ->delete();
            
            return redirect()->route('dashboard')->withErrors([
                'error' => 'User not found in this system.'
            ]);
        }

        // Store token in session for later cleanup
        session(['sso_token' => $token]);

        // Clear the token after successful use
        DB::table('sso_tokens')
            ->where('token', $token)
            ->where('id_number', $id_number)
            ->delete();

        // Auto-login the user
        Auth::login($user);
        $request->session()->regenerate();

        Log::info('SSO authentication successful', [
            'user_id' => $user->id,
            'id_number' => $id_number,
            'token' => substr($token, 0, 10) . '...'
        ]);

        return redirect()->intended(route('dashboard'));
    }
}
