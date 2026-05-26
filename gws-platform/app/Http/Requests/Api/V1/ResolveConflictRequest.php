<?php

namespace App\Http\Requests\Api\V1;

use App\Models\FieldObservation;
use Illuminate\Foundation\Http\FormRequest;

/**
 * ResolveConflictRequest — Validates a sync conflict resolution request.
 *
 * The resolution strategy must be one of the allowed values. If the
 * resolution is 'merged', merged_data must be provided containing
 * the merged observation fields.
 */
class ResolveConflictRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * The user must have the 'sync' ability and must be the one who
     * recorded the observation or an admin.
     */
    public function authorize(): bool
    {
        $user = $this->user();

        if (! $user || ! $user->tokenCan('sync')) {
            return false;
        }

        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $resolutions = implode(',', FieldObservation::CONFLICT_RESOLUTIONS);

        return [
            'observation_uuid' => ['required', 'uuid', 'exists:field_observations,uuid'],
            'resolution' => ['required', 'string', "in:{$resolutions}"],
            'merged_data' => ['nullable', 'array', 'required_if:resolution,merged'],
            'merged_data.title' => ['sometimes', 'string', 'max:200'],
            'merged_data.description' => ['nullable', 'string'],
            'merged_data.geometry' => ['nullable', 'array'],
            'merged_data.observation_data' => ['nullable', 'array'],
            'merged_data.media_paths' => ['nullable', 'array'],
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
            'observation_uuid.required' => 'The observation UUID is required.',
            'observation_uuid.uuid' => 'The observation UUID must be a valid UUID.',
            'observation_uuid.exists' => 'No observation found with this UUID.',
            'resolution.required' => 'A conflict resolution strategy is required.',
            'resolution.in' => 'The resolution must be one of: server_wins, client_wins, merged.',
            'merged_data.required_if' => 'Merged data is required when the resolution is "merged".',
        ];
    }
}
