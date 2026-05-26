<?php

namespace App\Http\Middleware\Api;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * EnsureApiTokenAbility — Verifies that the current API token has the required ability.
 *
 * This middleware checks that the Sanctum token used for authentication
 * has the specified ability (e.g., 'field-write', 'sync', 'offline').
 * Returns a 403 response if the token lacks the required ability.
 *
 * Usage in routes:
 *   Route::middleware('ability:field-write')->group(...)
 *   Route::middleware('ability:sync')->group(...)
 */
class EnsureApiTokenAbility
{
    /**
     * Handle an incoming request.
     *
     * Checks that the authenticated user's current API token has the
     * required ability. The ability is passed as a parameter to the
     * middleware alias.
     *
     * @param  Request  $request  The incoming HTTP request
     * @param  Closure(Request): Response  $next  The next middleware handler
     * @param  string  $ability  The required token ability
     * @return Response The response, or 403 if the token lacks the ability
     */
    public function handle(Request $request, Closure $next, string $ability): Response
    {
        $user = $request->user();

        if (! $user || ! $user->currentAccessToken()) {
            return response()->json([
                'data' => null,
                'meta' => ['error' => 'Authentication required.'],
            ], 401);
        }

        // Super-admin tokens have all abilities
        if ($user->hasRole('super-admin')) {
            return $next($request);
        }

        if (! $user->tokenCan($ability)) {
            return response()->json([
                'data' => null,
                'meta' => [
                    'error' => 'Insufficient token ability.',
                    'required_ability' => $ability,
                ],
            ], 403);
        }

        return $next($request);
    }
}
