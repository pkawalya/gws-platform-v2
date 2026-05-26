<?php

namespace App\Filament\Resources\Field\FieldObservations\Tables;

use Filament\Actions\ViewAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class FieldObservationsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('title')
                    ->label('Title')
                    ->searchable()
                    ->sortable()
                    ->limit(40)
                    ->tooltip(fn ($record) => $record->title)
                    ->weight('medium'),

                TextColumn::make('observation_type')
                    ->label('Type')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'boundary_point' => 'warning',
                        'landmark' => 'info',
                        'photo' => 'success',
                        'video' => 'success',
                        'note' => 'gray',
                        'measurement' => 'primary',
                        'sketch' => 'danger',
                        default => 'gray',
                    })
                    ->formatStateUsing(fn (string $state): string => str_replace('_', ' ', ucfirst($state)))
                    ->sortable(),

                TextColumn::make('surveyProject.project_number')
                    ->label('Project #')
                    ->searchable()
                    ->sortable()
                    ->badge()
                    ->color('gray'),

                TextColumn::make('latitude')
                    ->label('Lat')
                    ->formatStateUsing(fn ($state) => $state ? number_format((float) $state, 5) : '—')
                    ->toggleable(),

                TextColumn::make('longitude')
                    ->label('Lng')
                    ->formatStateUsing(fn ($state) => $state ? number_format((float) $state, 5) : '—')
                    ->toggleable(),

                TextColumn::make('observed_at')
                    ->label('Observed')
                    ->dateTime('M j, Y H:i')
                    ->sortable()
                    ->since(),

                TextColumn::make('sync_status')
                    ->label('Sync')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'pending' => 'warning',
                        'synced' => 'success',
                        'conflict' => 'danger',
                        default => 'gray',
                    })
                    ->formatStateUsing(fn (string $state): string => ucfirst($state))
                    ->sortable(),

                TextColumn::make('recordedBy.name')
                    ->label('Recorded By')
                    ->searchable()
                    ->toggleable(isToggledHiddenByDefault: true),

                TextColumn::make('created_at')
                    ->label('Created')
                    ->dateTime('M j, Y')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                SelectFilter::make('observation_type')
                    ->label('Observation Type')
                    ->options([
                        'boundary_point' => 'Boundary Point',
                        'landmark' => 'Landmark',
                        'photo' => 'Photo',
                        'video' => 'Video',
                        'note' => 'Note',
                        'measurement' => 'Measurement',
                        'sketch' => 'Sketch',
                    ])
                    ->multiple(),

                SelectFilter::make('sync_status')
                    ->label('Sync Status')
                    ->options([
                        'pending' => 'Pending',
                        'synced' => 'Synced',
                        'conflict' => 'Conflict',
                    ])
                    ->multiple(),

                SelectFilter::make('survey_project_id')
                    ->label('Project')
                    ->relationship('surveyProject', 'project_number')
                    ->searchable()
                    ->preload(),
            ])
            ->recordActions([
                ViewAction::make(),
            ])
            ->defaultSort('observed_at', 'desc');
    }
}
