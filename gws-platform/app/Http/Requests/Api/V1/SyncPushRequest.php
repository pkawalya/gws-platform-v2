<?php

namespace App\Http\Requests\Api\V1;

use App\Models\FieldObservation;
use Illuminate\Foundation\Http\FormRequest;

/**
 * SyncPushRequest — Validates a batch push of observations from a mobile device.
 *
 * Each observation in the batch must have a UUID for idempotent upsert
 * and the required observation fields. The device_id and device_timestamp
 * are required for sync tracking.
 */
class SyncPushRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * Any authenticated user with the 'sync' ability can push data.
     */
    public function authorize(): bool
    {
        return $this->user() !== null
            && $this->user()->tokenCan('sync');
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
            'device_id' => ['required', 'string', 'max:200'],
            'device_timestamp' => ['required', 'date'],
            'observations' => ['required', 'array'],
            'observations.*.uuid' => ['required', 'uuid'],
            'observations.*.survey_project_id' => ['required', 'integer', 'exists:survey_projects,id'],
            'observations.*.observation_type' => ['required', 'string', "in:{$observationTypes}"],
            'observations.*.title' => ['required', 'string', 'max:200'],
            'observations.*.description' => ['nullable', 'string'],
            'observations.*.geometry' => ['nullable', 'array'],
            'observations.*.latitude' => ['nullable', 'numeric'],
            'observations.*.longitude' => ['nullable', 'numeric'],
            'observations.*.accuracy_meters' => ['nullable', 'numeric'],
            'observations.*.altitude_meters' => ['nullable', 'numeric'],
            'observations.*.observation_data' => ['nullable', 'array'],
            'observations.*.media_paths' => ['nullable', 'array'],
            'observations.*.observed_at' => ['required', 'date'],
            'observations.*.is_offline_creation' => ['boolean'],
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
            'device_id.required' => 'A device identifier is required for sync.',
            'device_timestamp.required' => 'The device timestamp is required.',
            'observations.required' => 'At least one observation is required.',
            'observations.*.uuid.required' => 'Each observation must have a UUID.',
            'observations.*.uuid.uuid' => 'Each observation UUID must be a valid UUID.',
            'observations.*.survey_project_id.required' => 'Each observation must reference a survey project.',
            'observations.*.observation_type.required' => 'Each observation must have a type.',
            'observations.*.title.required' => 'Each observation must have a title.',
            'observations.*.observed_at.required' => 'Each observation must have a timestamp.',
        ];
    }
}
