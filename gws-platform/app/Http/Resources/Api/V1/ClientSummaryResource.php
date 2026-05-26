<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * ClientSummaryResource — Limited client fields for the field surveyor view.
 *
 * Exposes only the information a field surveyor needs on-site,
 * protecting sensitive data like NIN and full address details.
 */
class ClientSummaryResource extends JsonResource
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
            'client_number' => $this->client_number,
            'full_name' => $this->full_name,
            'phone' => $this->phone,
            'district' => $this->district,
            'lc1_area' => $this->lc1_area,
        ];
    }
}
