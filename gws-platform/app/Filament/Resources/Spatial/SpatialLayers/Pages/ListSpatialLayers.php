<?php

namespace App\Filament\Resources\Spatial\SpatialLayers\Pages;

use App\Filament\Resources\Spatial\SpatialLayers\SpatialLayerResource;
use Filament\Resources\Pages\ListRecords;

/**
 * ListSpatialLayers — List page for the SpatialLayer resource.
 */
class ListSpatialLayers extends ListRecords
{
    protected static string $resource = SpatialLayerResource::class;
}
