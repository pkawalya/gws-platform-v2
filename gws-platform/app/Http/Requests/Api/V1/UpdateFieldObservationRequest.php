<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

/**
 * UpdateFieldObservationRequest — Validates updates to an existing field observation.
 *
 * Only the user who created the observation or an admin can update it.
 * Only a subset of fields are allowed to be updated after creation.
 */
class UpdateFieldObservationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * Only the user who recorded the observation OR an admin can update it.
     */
    public function authorize(): bool
    {
        $observation = $this->route('observation');
        $user = $this->user();

        if (! $observation) {
            return false;
        }

        // Admins can update any observation
        if ($user->hasRole('admin') || $user->hasRole('super-admin')) {
            return true;
        }

        // Only the user who recorded the observation can update it
        return $observation->recorded_by_user_id === $user->id;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'string', 'max:200'],
            'description' => ['nullable', 'string'],
            'geometry' => ['nullable', 'array'],
            'observation_data' => ['nullable', 'array'],
            'media_paths' => ['nullable', 'array'],
            'media_paths.*' => ['string'],
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
            'title.max' => 'The title must not exceed 200 characters.',
        ];
    }
}
