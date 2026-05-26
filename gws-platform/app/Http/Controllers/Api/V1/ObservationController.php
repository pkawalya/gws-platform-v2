<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreFieldObservationRequest;
use App\Http\Requests\Api\V1\UpdateFieldObservationRequest;
use App\Http\Resources\Api\V1\ObservationResource;
use App\Models\FieldObservation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * ObservationController — Manages field observations for the mobile app.
 *
 * Provides full CRUD operations for field observations, with authorization
 * checks ensuring that surveyors can only manage observations within their
 * assigned projects.
 */
class ObservationController extends Controller
{
    /**
     * List observations for the user's assigned projects.
     *
     * Supports filtering by observation type, project, and date range.
     *
     * @param  Request  $request  The incoming request with optional filters
     * @return JsonResponse Paginated list of observations
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = FieldObservation::where('recorded_by_user_id', $user->id)
            ->with(['surveyProject', 'recordedBy']);

        // Filter by observation type
        if ($request->filled('observation_type')) {
            $query->ofType($request->input('observation_type'));
        }

        // Filter by project
        if ($request->filled('survey_project_id')) {
            $query->forProject($request->input('survey_project_id'));
        }

        // Filter by sync status
        if ($request->filled('sync_status')) {
            $query->where('sync_status', $request->input('sync_status'));
        }

        // Filter by date range (observed_at)
        if ($request->filled('observed_from')) {
            $query->where('observed_at', '>=', $request->input('observed_from'));
        }

        if ($request->filled('observed_to')) {
            $query->where('observed_at', '<=', $request->input('observed_to'));
        }

        // Only non-deleted
        $query->whereNull('deleted_at');

        $observations = $query->orderBy('observed_at', 'desc')
            ->paginate($request->input('per_page', 20));

        return response()->json([
            'data' => ObservationResource::collection($observations),
            'meta' => [
                'current_page' => $observations->currentPage(),
                'last_page' => $observations->lastPage(),
                'per_page' => $observations->perPage(),
                'total' => $observations->total(),
            ],
        ]);
    }

    /**
     * Create a new field observation.
     *
     * Handles media upload and offline UUID patterns. If a UUID is provided
     * (from offline creation), it is preserved for idempotent sync.
     *
     * @param  StoreFieldObservationRequest  $request  The validated observation data
     * @return JsonResponse The created observation
     */
    public function store(StoreFieldObservationRequest $request): JsonResponse
    {
        $user = $request->user();

        $data = $request->validated();
        $data['recorded_by_user_id'] = $user->id;
        $data['organization_id'] = $user->organization_id;
        $data['branch_id'] = $user->branch_id;

        // Handle offline creation flag
        if (! isset($data['is_offline_creation'])) {
            $data['is_offline_creation'] = false;
        }

        // Mark as synced since it's being created directly on the server
        $data['sync_status'] = 'synced';
        $data['synced_at'] = now();

        $observation = FieldObservation::create($data);
        $observation->load(['surveyProject', 'recordedBy']);

        return response()->json([
            'data' => new ObservationResource($observation),
            'meta' => [],
        ], 201);
    }

    /**
     * Show observation detail.
     *
     * @param  Request  $request  The incoming request
     * @param  FieldObservation  $observation  The observation (route model binding)
     * @return JsonResponse The observation details
     */
    public function show(Request $request, FieldObservation $observation): JsonResponse
    {
        $user = $request->user();

        // Ensure access (admin or owner)
        if (! $user->hasRole('admin') && ! $user->hasRole('super-admin') && $observation->recorded_by_user_id !== $user->id) {
            return response()->json([
                'data' => null,
                'meta' => ['error' => 'You do not have access to this observation.'],
            ], 403);
        }

        $observation->load(['surveyProject', 'recordedBy']);

        return response()->json([
            'data' => new ObservationResource($observation),
            'meta' => [],
        ]);
    }

    /**
     * Update an existing observation.
     *
     * Only the user who created the observation or an admin can update it.
     *
     * @param  UpdateFieldObservationRequest  $request  The validated update data
     * @param  FieldObservation  $observation  The observation to update
     * @return JsonResponse The updated observation
     */
    public function update(UpdateFieldObservationRequest $request, FieldObservation $observation): JsonResponse
    {
        $observation->update($request->validated());
        $observation->load(['surveyProject', 'recordedBy']);

        return response()->json([
            'data' => new ObservationResource($observation),
            'meta' => [],
        ]);
    }

    /**
     * Soft delete an observation.
     *
     * Only the user who created the observation or an admin can delete it.
     *
     * @param  Request  $request  The incoming request
     * @param  FieldObservation  $observation  The observation to delete
     * @return JsonResponse Confirmation of deletion
     */
    public function destroy(Request $request, FieldObservation $observation): JsonResponse
    {
        $user = $request->user();

        // Ensure access (admin or owner)
        if (! $user->hasRole('admin') && ! $user->hasRole('super-admin') && $observation->recorded_by_user_id !== $user->id) {
            return response()->json([
                'data' => null,
                'meta' => ['error' => 'You do not have access to this observation.'],
            ], 403);
        }

        $observation->delete();

        return response()->json([
            'data' => [
                'message' => 'Observation deleted successfully.',
                'uuid' => $observation->uuid,
            ],
            'meta' => [],
        ]);
    }
}
