<?php

namespace App\Http\Requests\Api\V1;

use App\Models\FieldObservation;
use App\Models\SurveyProject;
use Illuminate\Foundation\Http\FormRequest;

/**
 * StoreFieldObservationRequest — Validates creation of a new field observation.
 *
 * Ensures that the authenticated user can create observations for their
 * assigned survey projects and that all required field data is present.
 */
class StoreFieldObservationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * The user must be assigned to the survey project they are creating
     * an observation for, or be an admin.
     */
    public function authorize(): bool
    {
        $projectId = $this->input('survey_project_id');

        if (! $projectId) {
            return false;
        }

        $user = $this->user();

        // Admins can create observations for any project
        if ($user->hasRole('admin') || $user->hasRole('super-admin')) {
            return true;
        }

        // Field surveyors can only create observations for their assigned projects
        $project = SurveyProject::find($projectId);

        return $project && $project->assigned_surveyor_user_id === $user->id;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $observationTypes = implode(',', FieldObservation::OBSERVATION_TYPES);

        return [
            'survey_project_id' => ['required', 'exists:survey_projects,id'],
            'observation_type' => ['required', 'string', "in:{$observationTypes}"],
            'title' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string'],
            'geometry' => ['nullable', 'array'],
            'latitude' => ['nullable', 'numeric'],
            'longitude' => ['nullable', 'numeric'],
            'accuracy_meters' => ['nullable', 'numeric'],
            'altitude_meters' => ['nullable', 'numeric'],
            'observation_data' => ['nullable', 'array'],
            'media_paths' => ['nullable', 'array'],
            'media_paths.*' => ['string'],
            'observed_at' => ['required', 'date'],
            'is_offline_creation' => ['boolean'],
            'uuid' => ['nullable', 'uuid', 'unique:field_observations,uuid'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'survey_project_id.required' => 'A survey project is required.',
            'survey_project_id.exists' => 'The selected survey project does not exist.',
            'observation_type.required' => 'An observation type is required.',
            'observation_type.in' => 'The observation type must be one of: boundary_point, landmark, photo, video, note, measurement, sketch.',
            'title.required' => 'A title is required for the observation.',
            'title.max' => 'The title must not exceed 200 characters.',
            'observed_at.required' => 'The observation timestamp is required.',
            'uuid.uuid' => 'The UUID must be a valid UUID.',
            'uuid.unique' => 'An observation with this UUID already exists.',
        ];
    }
}
