<?php

namespace App\Filament\Resources\Spatial\SpatialLayers\Pages;

use App\Filament\Resources\Spatial\SpatialLayers\SpatialLayerResource;
use Filament\Resources\Pages\EditRecord;

/**
 * EditSpatialLayer — Edit page for the SpatialLayer resource.
 */
class EditSpatialLayer extends EditRecord
{
    protected static string $resource = SpatialLayerResource::class;

    protected function getRedirectUrl(): string
    {
        return $this->getResource()::getUrl('index');
    }
}
