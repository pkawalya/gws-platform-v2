<?php

use App\Http\Controllers\Api\V1\AssignmentController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\ClientController;
use App\Http\Controllers\Api\V1\ObservationController;
use App\Http\Controllers\Api\V1\SpatialController;
use App\Http\Controllers\Api\V1\SyncController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — GWS Platform V2 Mobile Field App
|--------------------------------------------------------------------------
|
| These routes are prefixed with /api/v1 and provide the API contract
| for the mobile field surveyor application. Authentication is handled
| via Laravel Sanctum token-based authentication.
|
*/

Route::prefix('v1')->group(function () {

    // ──────────────────────────────────────────────
    // Public Auth Routes (no auth:sanctum required)
    // ──────────────────────────────────────────────
    Route::post('/auth/token', [AuthController::class, 'login']);
    Route::post('/auth/register-device', [AuthController::class, 'registerDevice'])
        ->middleware('auth:sanctum');

    // ──────────────────────────────────────────────
    // Authenticated Routes
    // ──────────────────────────────────────────────
    Route::middleware(['auth:sanctum'])->group(function () {

        // Auth & Profile
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me', [AuthController::class, 'me']);

        // Field Assignments
        Route::get('/assignments', [AssignmentController::class, 'index']);
        Route::get('/assignments/{project}', [AssignmentController::class, 'show']);
        Route::patch('/assignments/{project}/status', [AssignmentController::class, 'updateStatus'])
            ->middleware('ability:field-write');

        // Field Observations
        Route::get('/observations', [ObservationController::class, 'index']);
        Route::post('/observations', [ObservationController::class, 'store'])
            ->middleware('ability:field-write');
        Route::get('/observations/{observation}', [ObservationController::class, 'show']);
        Route::put('/observations/{observation}', [ObservationController::class, 'update'])
            ->middleware('ability:field-write');
        Route::delete('/observations/{observation}', [ObservationController::class, 'destroy'])
            ->middleware('ability:field-write');

        // Sync
        Route::post('/sync/push', [SyncController::class, 'push'])
            ->middleware('ability:sync');
        Route::get('/sync/pull', [SyncController::class, 'pull'])
            ->middleware('ability:sync');
        Route::get('/sync/status', [SyncController::class, 'status'])
            ->middleware('ability:sync');
        Route::post('/sync/conflicts/resolve', [SyncController::class, 'resolveConflict'])
            ->middleware('ability:sync');

        // Clients (read-only for field)
        Route::get('/clients', [ClientController::class, 'index']);
        Route::get('/clients/{client}', [ClientController::class, 'show']);

        // Spatial
        Route::get('/spatial/projects', [SpatialController::class, 'projects']);
        Route::get('/spatial/layers', [SpatialController::class, 'layers']);
        Route::get('/spatial/annotations', [SpatialController::class, 'annotations']);
    });
});
