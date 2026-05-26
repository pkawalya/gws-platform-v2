<?php

namespace App\Filament\Resources\Spatial\SpatialLayers\Pages;

use App\Filament\Resources\Spatial\SpatialLayers\SpatialLayerResource;
use Filament\Resources\Pages\CreateRecord;

/**
 * CreateSpatialLayer — Create page for the SpatialLayer resource.
 */
class CreateSpatialLayer extends CreateRecord
{
    protected static string $resource = SpatialLayerResource::class;

    protected function getRedirectUrl(): string
    {
        return $this->getResource()::getUrl('index');
    }
}
