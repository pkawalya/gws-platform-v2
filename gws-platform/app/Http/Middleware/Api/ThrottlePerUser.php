<?php

namespace App\Http\Middleware\Api;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\Response;

/**
 * ThrottlePerUser — Rate limiting per user ID for API routes.
 *
 * Limits API requests to a configurable number per minute per user,
 * identified by their authenticated user ID (or IP for unauthenticated
 * requests). This provides finer-grained rate limiting than the default
 * global throttle middleware.
 *
 * Default: 60 requests per minute per user.
 *
 * Usage in routes:
 *   Route::middleware('throttle.per-user:60,1')->group(...)
 */
class ThrottlePerUser
{
    /**
     * Handle an incoming request.
     *
     * Applies rate limiting based on the authenticated user's ID.
     * If the user is not authenticated, falls back to IP-based limiting.
     *
     * @param  Request  $request  The incoming HTTP request
     * @param  Closure(Request): Response  $next  The next middleware handler
     * @param  int  $maxAttempts  Maximum requests per decay minutes (default 60)
     * @param  int  $decayMinutes  The rate limit window in minutes (default 1)
     * @return Response The response, or 429 if rate limit exceeded
     */
    public function handle(Request $request, Closure $next, int $maxAttempts = 60, int $decayMinutes = 1): Response
    {
        $key = $this->resolveRequestSignature($request);

        if (RateLimiter::tooManyAttempts($key, $maxAttempts)) {
            return response()->json([
                'data' => null,
                'meta' => [
                    'error' => 'Too many requests.',
                    'retry_after_seconds' => RateLimiter::availableIn($key),
                ],
            ], 429);
        }

        RateLimiter::hit($key, $decayMinutes * 60);

        $response = $next($request);

        // Add rate limit headers
        $response->headers->set('X-RateLimit-Limit', $maxAttempts);
        $response->headers->set('X-RateLimit-Remaining', $maxAttempts - RateLimiter::attempts($key));

        return $response;
    }

    /**
     * Resolve the rate limiting key for the request.
     *
     * Uses the authenticated user ID if available, otherwise falls back
     * to the IP address.
     *
     * @param  Request  $request  The incoming HTTP request
     * @return string The rate limiting key
     */
    protected function resolveRequestSignature(Request $request): string
    {
        $user = $request->user();

        if ($user) {
            return 'api_throttle:' . $user->id;
        }

        return 'api_throttle:ip:' . $request->ip();
    }
}
