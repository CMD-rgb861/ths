<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => false,
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy1(Request $request): RedirectResponse
    {
        // ===== DELETE THE SSO TOKEN ON LOGOUT =====
        $ssoToken = session('sso_token');
        
        if ($ssoToken) {
            // Delete the token from sso_tokens table
            DB::table('sso_tokens')->where('token', $ssoToken)->delete();
            
            // Clear SSO token from session
            session()->forget('sso_token');
        }
        
        // Logout from THS
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        // Redirect to SSO Dashboard
        return redirect()->away(config('services.sso.redirect_url', '/'));
    }

    public function destroy(Request $request)
    {
        // Revoke the current Sanctum token, if available
        if ($request->user()) {
            $token = $request->user()->currentAccessToken();

            if ($token) {
                // @phpstan-ignore-next-line
                $token->delete();
            }
        }

        $ssoToken = session('sso_token');
        
        if ($ssoToken) {
            // Delete the token from sso_tokens table
            DB::table('sso_tokens')->where('token', $ssoToken)->delete();
            
            // Clear SSO token from session
            session()->forget('sso_token');
        }

        // Logout from the Laravel web session
        Auth::logout();
        Auth::guard('web')->logout();

        // Invalidate the current session
        $request->session()->invalidate();

        // Regenerate the CSRF token
        $request->session()->regenerateToken();

        // Redirect back to ITSMS / SSO
        $ip = getHostByName(getHostName());

        return redirect()->away(
            "https://{$ip}/ids/itsms/home/n?success=" .
            urlencode('You have been logged out successfully.')
        );
    }
}
