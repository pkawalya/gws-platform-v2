<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\AssignmentResource;
use App\Models\SurveyProject;
use App\Services\EventStore;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * AssignmentController — Manages field surveyor project assignments.
 *
 * Provides endpoints for listing, viewing, and updating the status of
 * survey projects assigned to the authenticated field surveyor.
 */
class AssignmentController extends Controller
{
    /**
     * List projects assigned to the authenticated surveyor.
     *
     * Returns paginated projects with optional status filtering.
     * Default pagination is 20 per page.
     *
     * @param  Request  $request  The incoming request with optional filters
     * @return JsonResponse Paginated list of assignments
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = SurveyProject::where('assigned_surveyor_user_id', $user->id)
            ->with(['client', 'progress.approvalSteps'])
            ->withCount('fieldObservations');

        // Optional status filter
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        // Optional project type filter
        if ($request->filled('project_type')) {
            $query->where('project_type', $request->input('project_type'));
        }

        // Optional district filter
        if ($request->filled('district')) {
            $query->where('district', $request->input('district'));
        }

        $projects = $query->orderBy('created_at', 'desc')
            ->paginate($request->input('per_page', 20));

        return response()->json([
            'data' => AssignmentResource::collection($projects),
            'meta' => [
                'current_page' => $projects->currentPage(),
                'last_page' => $projects->lastPage(),
                'per_page' => $projects->perPage(),
                'total' => $projects->total(),
            ],
        ]);
    }

    /**
     * Show full project details with client info, progress, approval steps, and recent observations.
     *
     * @param  Request  $request  The incoming request
     * @param  SurveyProject  $project  The survey project (route model binding)
     * @return JsonResponse Full assignment details
     */
    public function show(Request $request, SurveyProject $project): JsonResponse
    {
        $user = $request->user();

        // Ensure the surveyor is assigned to this project (unless admin)
        if (! $user->hasRole('admin') && ! $user->hasRole('super-admin') && $project->assigned_surveyor_user_id !== $user->id) {
            return response()->json([
                'data' => null,
                'meta' => ['error' => 'You are not assigned to this project.'],
            ], 403);
        }

        $project->load([
            'client',
            'progress.approvalSteps',
            'fieldObservations' => fn ($q) => $q->orderBy('observed_at', 'desc')->limit(20),
            'fieldObservations.recordedBy',
        ]);

        return response()->json([
            'data' => new AssignmentResource($project),
            'meta' => [],
        ]);
    }

    /**
     * Update project status (e.g., inquiry→active, active→surveying).
     *
     * Validates the status transition and fires a domain event.
     *
     * @param  Request  $request  The incoming request with the new status
     * @param  SurveyProject  $project  The survey project to update
     * @return JsonResponse The updated assignment
     */
    public function updateStatus(Request $request, SurveyProject $project): JsonResponse
    {
        $user = $request->user();

        // Ensure the surveyor is assigned to this project (unless admin)
        if (! $user->hasRole('admin') && ! $user->hasRole('super-admin') && $project->assigned_surveyor_user_id !== $user->id) {
            return response()->json([
                'data' => null,
                'meta' => ['error' => 'You are not assigned to this project.'],
            ], 403);
        }

        $request->validate([
            'status' => 'required|string|in:inquiry,active,surveying,drawing,review,approved,completed,cancelled',
        ]);

        $oldStatus = $project->status;
        $newStatus = $request->input('status');

        $project->update(['status' => $newStatus]);

        // Fire domain event for the status change
        EventStore::record(
            eventType: 'project.status_updated',
            aggregate: $project,
            payload: [
                'old_status' => $oldStatus,
                'new_status' => $newStatus,
                'updated_by' => 'field_app',
            ],
            causer: $user
        );

        $project->load(['client', 'progress.approvalSteps']);

        return response()->json([
            'data' => new AssignmentResource($project),
            'meta' => [
                'previous_status' => $oldStatus,
            ],
        ]);
    }
}
