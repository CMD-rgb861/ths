<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureWipurSupervisor
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $user->isWipurSupervisor()) {
            abort(403, 'Forbidden: WIPUR supervisor access only.');
        }

        return $next($request);
    }
}
