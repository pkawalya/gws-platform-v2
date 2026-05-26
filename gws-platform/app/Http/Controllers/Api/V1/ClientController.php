<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\ClientSummaryResource;
use App\Models\Client;
use App\Models\SurveyProject;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * ClientController — Read-only client data for the mobile field app.
 *
 * Provides limited client information to field surveyors, showing only
 * the clients associated with their assigned projects. Privacy-sensitive
 * fields (NIN, full address) are excluded.
 */
class ClientController extends Controller
{
    /**
     * List clients assigned to the surveyor's projects.
     *
     * Returns a paginated list of clients whose projects are assigned
     * to the authenticated surveyor, with limited fields for privacy.
     *
     * @param  Request  $request  The incoming request with optional filters
     * @return JsonResponse Paginated list of client summaries
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        // Get client IDs from the surveyor's assigned projects
        $clientIds = SurveyProject::where('assigned_surveyor_user_id', $user->id)
            ->pluck('client_id')
            ->unique()
            ->filter();

        // Admins can see all clients
        if ($user->hasRole('admin') || $user->hasRole('super-admin')) {
            $query = Client::query();
        } else {
            $query = Client::whereIn('id', $clientIds);
        }

        // Optional district filter
        if ($request->filled('district')) {
            $query->where('district', $request->input('district'));
        }

        // Optional search by name or client number
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'LIKE', "%{$search}%")
                    ->orWhere('last_name', 'LIKE', "%{$search}%")
                    ->orWhere('client_number', 'LIKE', "%{$search}%")
                    ->orWhere('phone', 'LIKE', "%{$search}%");
            });
        }

        $clients = $query->orderBy('created_at', 'desc')
            ->paginate($request->input('per_page', 20));

        return response()->json([
            'data' => ClientSummaryResource::collection($clients),
            'meta' => [
                'current_page' => $clients->currentPage(),
                'last_page' => $clients->lastPage(),
                'per_page' => $clients->perPage(),
                'total' => $clients->total(),
            ],
        ]);
    }

    /**
     * Show client detail for field work (limited fields).
     *
     * Returns only the fields needed for field survey operations,
     * excluding sensitive information like NIN and full address.
     *
     * @param  Request  $request  The incoming request
     * @param  Client  $client  The client (route model binding)
     * @return JsonResponse Limited client details
     */
    public function show(Request $request, Client $client): JsonResponse
    {
        $user = $request->user();

        // Ensure the surveyor has access to this client's projects (unless admin)
        if (! $user->hasRole('admin') && ! $user->hasRole('super-admin')) {
            $hasAccess = SurveyProject::where('assigned_surveyor_user_id', $user->id)
                ->where('client_id', $client->id)
                ->exists();

            if (! $hasAccess) {
                return response()->json([
                    'data' => null,
                    'meta' => ['error' => 'You do not have access to this client.'],
                ], 403);
            }
        }

        return response()->json([
            'data' => new ClientSummaryResource($client),
            'meta' => [],
        ]);
    }
}
