<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * UserResource — Transforms a User model for API responses.
 *
 * Includes the user's profile information along with their roles,
 * permissions, and organization details for the mobile field app.
 */
class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'roles' => $this->whenLoaded('roles', function () {
                return $this->roles->pluck('name');
            }, []),
            'permissions' => $this->whenLoaded('roles', function () {
                return $this->getAllPermissions()->pluck('name');
            }, []),
            'organization' => [
                'id' => $this->organization_id,
                'name' => $this->whenLoaded('organization', fn () => $this->organization?->name),
            ],
            'branch' => [
                'id' => $this->branch_id,
                'name' => $this->whenLoaded('branch', fn () => $this->branch?->name),
            ],
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
