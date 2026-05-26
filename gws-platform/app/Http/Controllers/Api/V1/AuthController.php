<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

/**
 * AuthController — Handles API authentication for mobile field surveyors.
 *
 * Provides login (token issuance), device registration, logout (token revocation),
 * and profile retrieval endpoints for the mobile field app.
 */
class AuthController extends Controller
{
    /**
     * Authenticate a user and return an API token.
     *
     * Validates email and password credentials, then creates a new Sanctum
     * token with abilities based on the user's role.
     *
     * @param  Request  $request  The incoming login request
     * @return JsonResponse The token and user data
     *
     * @throws ValidationException If credentials are invalid
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
            'device_name' => 'required|string|max:200',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $abilities = $user->getDefaultTokenAbilities();
        $token = $user->createToken($request->device_name, $abilities)->plainTextToken;

        return response()->json([
            'data' => [
                'token' => $token,
                'token_type' => 'Bearer',
                'abilities' => $abilities,
                'user' => new UserResource($user->load(['roles', 'organization', 'branch'])),
            ],
            'meta' => [
                'expires_in_days' => config('sanctum.expiration') 
                    ? (int) (config('sanctum.expiration') / 1440) 
                    : null,
            ],
        ]);
    }

    /**
     * Register a mobile device and return a device-specific token.
     *
     * Similar to login but specifically designed for device registration
     * during the initial mobile app setup flow. Requires authentication.
     *
     * @param  Request  $request  The incoming device registration request
     * @return JsonResponse The new device-specific token
     */
    public function registerDevice(Request $request): JsonResponse
    {
        $request->validate([
            'device_name' => 'required|string|max:200',
            'device_id' => 'required|string|max:200',
            'platform' => 'nullable|string|max:50',
            'app_version' => 'nullable|string|max:50',
        ]);

        $user = $request->user();

        // Revoke any existing tokens for this device
        $user->tokens()
            ->where('name', $request->device_name)
            ->delete();

        $abilities = $user->getDefaultTokenAbilities();
        $token = $user->createToken($request->device_name, $abilities)->plainTextToken;

        return response()->json([
            'data' => [
                'token' => $token,
                'token_type' => 'Bearer',
                'abilities' => $abilities,
                'device_name' => $request->device_name,
            ],
            'meta' => [
                'expires_in_days' => config('sanctum.expiration') 
                    ? (int) (config('sanctum.expiration') / 1440) 
                    : null,
            ],
        ]);
    }

    /**
     * Revoke the current API token (logout).
     *
     * Deletes the token that was used to authenticate this request,
     * effectively logging the device out.
     *
     * @param  Request  $request  The incoming logout request
     * @return JsonResponse Confirmation of logout
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'data' => [
                'message' => 'Successfully logged out.',
            ],
            'meta' => [],
        ]);
    }

    /**
     * Return the authenticated user's profile with roles and permissions.
     *
     * @param  Request  $request  The incoming profile request
     * @return JsonResponse The user profile data
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load(['roles.permissions', 'organization', 'branch']);

        return response()->json([
            'data' => new UserResource($user),
            'meta' => [],
        ]);
    }
}
