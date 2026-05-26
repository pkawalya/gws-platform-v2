<?php

use App\Http\Middleware\Api\EnsureApiTokenAbility;
use App\Http\Middleware\Api\ThrottlePerUser;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Register middleware aliases for API-specific middleware
        $middleware->alias([
            'ability' => EnsureApiTokenAbility::class,
            'throttle.per-user' => ThrottlePerUser::class,
        ]);

        // Configure API middleware group
        $middleware->api(prepend: [
            // Throttle API requests per user
        ]);

        // Remove CSRF from API routes (Sanctum handles auth)
        $middleware->validateCsrfTokens(except: [
            'api/*',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
