<?php

namespace App\Filament\Resources\Spatial\SpatialLayers\Schemas;

use Filament\Forms\Components\ColorPicker;
use Filament\Forms\Components\KeyValue;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;
use App\Models\SpatialLayer;

/**
 * SpatialLayerForm — Form schema for the SpatialLayer Filament resource.
 *
 * Configures the create/edit form with fields for layer identity,
 * source configuration, style overrides, and visibility settings.
 */
class SpatialLayerForm
{
    /**
     * Configure the form schema for spatial layers.
     */
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                \Filament\Schemas\Components\Section::make('Layer Identity')
                    ->schema([
                        TextInput::make('name')
                            ->label('Layer Name')
                            ->required()
                            ->maxLength(200)
                            ->live(onBlur: true)
                            ->afterStateUpdated(function (string $context, $state, callable $set) {
                                if ($context === 'create' && filled($state)) {
                                    $set('slug', \Illuminate\Support\Str::slug($state));
                                }
                            }),
                        TextInput::make('slug')
                            ->label('Slug')
                            ->required()
                            ->maxLength(200)
                            ->unique(ignoreRecord: true)
                            ->helperText('Auto-generated from name. Must be unique.'),
                        Select::make('layer_type')
                            ->label('Layer Type')
                            ->required()
                            ->options(array_combine(SpatialLayer::LAYER_TYPES, array_map('ucfirst', SpatialLayer::LAYER_TYPES)))
                            ->native(false),
                        Select::make('source_type')
                            ->label('Source Type')
                            ->required()
                            ->options(array_combine(SpatialLayer::SOURCE_TYPES, array_map('ucfirst', SpatialLayer::SOURCE_TYPES)))
                            ->default('upload')
                            ->native(false),
                    ])->columns(2),

                \Filament\Schemas\Components\Section::make('Source Configuration')
                    ->schema([
                        KeyValue::make('source_config')
                            ->label('Source Config')
                            ->keyLabel('Key')
                            ->valueLabel('Value')
                            ->helperText('Configuration for the layer source (URL, API key, WMS endpoint, etc.)')
                            ->columnSpanFull(),
                    ])
                    ->collapsible(),

                \Filament\Schemas\Components\Section::make('Style Configuration')
                    ->schema([
                        KeyValue::make('style_config')
                            ->label('Leaflet Style Overrides')
                            ->keyLabel('Property')
                            ->valueLabel('Value')
                            ->helperText('Override default Leaflet style options (color, weight, opacity, fillColor, fillOpacity, dashArray)')
                            ->columnSpanFull(),
                    ])
                    ->collapsible(),

                \Filament\Schemas\Components\Section::make('Visibility & Zoom')
                    ->schema([
                        Toggle::make('is_visible_by_default')
                            ->label('Visible by Default')
                            ->default(true)
                            ->helperText('Show this layer when the map first loads'),
                        Toggle::make('is_active')
                            ->label('Active')
                            ->default(true)
                            ->helperText('Inactive layers are hidden from the map entirely'),
                        TextInput::make('min_zoom')
                            ->label('Min Zoom')
                            ->numeric()
                            ->minValue(0)
                            ->maxValue(18)
                            ->default(0)
                            ->helperText('Minimum zoom level at which this layer is visible'),
                        TextInput::make('max_zoom')
                            ->label('Max Zoom')
                            ->numeric()
                            ->minValue(0)
                            ->maxValue(18)
                            ->default(18)
                            ->helperText('Maximum zoom level at which this layer is visible'),
                        TextInput::make('display_order')
                            ->label('Display Order')
                            ->numeric()
                            ->default(0)
                            ->helperText('Lower values appear first in the layer list'),
                    ])->columns(3),

                \Filament\Schemas\Components\Section::make('Organization')
                    ->schema([
                        Select::make('organization_id')
                            ->label('Organization')
                            ->relationship('organization', 'name')
                            ->searchable()
                            ->preload()
                            ->helperText('Leave empty for global (all organizations) layer'),
                    ]),
            ]);
    }
}
