<?php

namespace App\Filament\Resources\Spatial\SpatialLayers;

use App\Filament\Resources\Spatial\SpatialLayers\Pages\CreateSpatialLayer;
use App\Filament\Resources\Spatial\SpatialLayers\Pages\EditSpatialLayer;
use App\Filament\Resources\Spatial\SpatialLayers\Pages\ListSpatialLayers;
use App\Filament\Resources\Spatial\SpatialLayers\Pages\ViewSpatialLayer;
use App\Filament\Resources\Spatial\SpatialLayers\Schemas\SpatialLayerForm;
use App\Filament\Resources\Spatial\SpatialLayers\Tables\SpatialLayersTable;
use App\Models\SpatialLayer;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

/**
 * SpatialLayerResource — Filament resource for managing map overlay layers.
 *
 * Provides CRUD operations for spatial layers that can be toggled on/off
 * in the map UI. Each layer represents a distinct set of geographic data
 * sourced from uploaded GeoJSON, OSM, WMS, or external APIs.
 */
class SpatialLayerResource extends Resource
{
    protected static ?string $model = SpatialLayer::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedMap;

    protected static string|\UnitEnum|null $navigationGroup = 'Spatial';

    protected static ?string $navigationLabel = 'Spatial Layers';

    protected static ?int $navigationSort = 10;

    public static function form(Schema $schema): Schema
    {
        return SpatialLayerForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return SpatialLayersTable::configure($table);
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => ListSpatialLayers::route('/'),
            'create' => CreateSpatialLayer::route('/create'),
            'view' => ViewSpatialLayer::route('/{record}'),
            'edit' => EditSpatialLayer::route('/{record}/edit'),
        ];
    }
}
