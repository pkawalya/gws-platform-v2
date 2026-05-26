<?php

namespace App\Filament\Resources\Spatial\SpatialLayers\Tables;

use Filament\Support\Icons\Heroicon;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

/**
 * SpatialLayersTable — Table configuration for the SpatialLayer Filament resource.
 *
 * Defines columns, filters, and actions for the list view of spatial layers.
 */
class SpatialLayersTable
{
    /**
     * Configure the table for spatial layers.
     */
    public static function configure(Table $table): Table
    {
        return $table
            ->defaultSort('display_order', 'asc')
            ->columns([
                TextColumn::make('name')
                    ->label('Layer Name')
                    ->searchable()
                    ->sortable()
                    ->weight('medium')
                    ->description(fn ($record) => $record->slug),
                TextColumn::make('layer_type')
                    ->label('Type')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'boundary' => 'warning',
                        'parcel' => 'success',
                        'infrastructure' => 'info',
                        'annotation' => 'danger',
                        'overlay' => 'purple',
                        default => 'gray',
                    })
                    ->formatStateUsing(fn (string $state): string => ucfirst($state))
                    ->sortable(),
                TextColumn::make('source_type')
                    ->label('Source')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'upload' => 'gray',
                        'osm' => 'info',
                        'wms' => 'warning',
                        'api' => 'success',
                        default => 'gray',
                    })
                    ->formatStateUsing(fn (string $state): string => strtoupper($state))
                    ->sortable(),
                IconColumn::make('is_visible_by_default')
                    ->label('Default')
                    ->boolean()
                    ->trueIcon(Heroicon::OutlinedEye)
                    ->falseIcon(Heroicon::OutlinedEyeSlash)
                    ->sortable(),
                TextColumn::make('display_order')
                    ->label('Order')
                    ->numeric()
                    ->sortable()
                    ->alignCenter(),
                IconColumn::make('is_active')
                    ->label('Active')
                    ->boolean()
                    ->trueIcon(Heroicon::OutlinedCheckCircle)
                    ->falseIcon(Heroicon::OutlinedXCircle)
                    ->sortable(),
                TextColumn::make('organization.name')
                    ->label('Organization')
                    ->placeholder('Global')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('updated_at')
                    ->label('Updated')
                    ->since()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                SelectFilter::make('layer_type')
                    ->label('Layer Type')
                    ->options([
                        'boundary' => 'Boundary',
                        'parcel' => 'Parcel',
                        'infrastructure' => 'Infrastructure',
                        'annotation' => 'Annotation',
                        'overlay' => 'Overlay',
                    ])
                    ->multiple(),
                SelectFilter::make('source_type')
                    ->label('Source Type')
                    ->options([
                        'upload' => 'Upload',
                        'osm' => 'OpenStreetMap',
                        'wms' => 'WMS',
                        'api' => 'API',
                    ])
                    ->multiple(),
            ])
            ->recordActions([
                \Filament\Actions\ViewAction::make(),
                \Filament\Actions\EditAction::make(),
            ])
            ->toolbarActions([
                \Filament\Tables\Actions\BulkActionGroup::make([
                    \Filament\Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }
}
