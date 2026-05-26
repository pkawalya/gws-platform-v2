<?php

namespace App\Filament\Resources\Field\FieldObservations\Schemas;

use Filament\Infolists\Components\IconEntry;
use Filament\Infolists\Components\ImageEntry;
use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Components\Grid;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class FieldObservationInfolist
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Observation Details')
                    ->schema([
                        Grid::make([
                            TextEntry::make('title')
                                ->label('Title')
                                ->weight('bold'),
                            TextEntry::make('observation_type')
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
                                ->formatStateUsing(fn (string $state): string => str_replace('_', ' ', ucfirst($state))),
                        ])->columns(2),
                        Grid::make([
                            TextEntry::make('description')
                                ->label('Description')
                                ->placeholder('—')
                                ->columnSpanFull(),
                        ])->columns(1),
                    ]),

                Section::make('Project & Surveyor')
                    ->schema([
                        Grid::make([
                            TextEntry::make('surveyProject.project_number')
                                ->label('Project Number')
                                ->badge()
                                ->color('gray'),
                            TextEntry::make('surveyProject.project_type')
                                ->label('Project Type')
                                ->placeholder('—'),
                        ])->columns(2),
                        Grid::make([
                            TextEntry::make('recordedBy.name')
                                ->label('Recorded By'),
                            TextEntry::make('observed_at')
                                ->label('Observed At')
                                ->dateTime('M j, Y H:i'),
                        ])->columns(2),
                    ]),

                Section::make('Location & Accuracy')
                    ->schema([
                        Grid::make([
                            TextEntry::make('latitude')
                                ->label('Latitude')
                                ->placeholder('—')
                                ->copyable(),
                            TextEntry::make('longitude')
                                ->label('Longitude')
                                ->placeholder('—')
                                ->copyable(),
                        ])->columns(2),
                        Grid::make([
                            TextEntry::make('accuracy_meters')
                                ->label('GPS Accuracy (m)')
                                ->placeholder('—')
                                ->suffix(' m'),
                            TextEntry::make('altitude_meters')
                                ->label('Altitude (m)')
                                ->placeholder('—')
                                ->suffix(' m'),
                        ])->columns(2),
                    ]),

                Section::make('Observation Data')
                    ->schema([
                        TextEntry::make('observation_data')
                            ->label('Data')
                            ->json()
                            ->columnSpanFull()
                            ->placeholder('No additional data'),
                        TextEntry::make('geometry')
                            ->label('Geometry (GeoJSON)')
                            ->json()
                            ->columnSpanFull()
                            ->placeholder('No geometry data'),
                    ])
                    ->visible(fn ($record) => $record->observation_data || $record->geometry),

                Section::make('Media')
                    ->schema([
                        TextEntry::make('media_paths')
                            ->label('Attached Files')
                            ->listWithLineBreaks()
                            ->placeholder('No media attached'),
                    ])
                    ->visible(fn ($record) => !empty($record->media_paths)),

                Section::make('Sync Status')
                    ->schema([
                        Grid::make([
                            TextEntry::make('sync_status')
                                ->label('Sync Status')
                                ->badge()
                                ->color(fn (string $state): string => match ($state) {
                                    'pending' => 'warning',
                                    'synced' => 'success',
                                    'conflict' => 'danger',
                                    default => 'gray',
                                })
                                ->formatStateUsing(fn (string $state): string => ucfirst($state)),
                            TextEntry::make('is_offline_creation')
                                ->label('Offline Creation')
                                ->badge()
                                ->color(fn (bool $state): string => $state ? 'info' : 'gray')
                                ->formatStateUsing(fn (bool $state): string => $state ? 'Yes' : 'No'),
                        ])->columns(2),
                        Grid::make([
                            TextEntry::make('synced_at')
                                ->label('Synced At')
                                ->dateTime('M j, Y H:i')
                                ->placeholder('—'),
                            TextEntry::make('conflict_resolution')
                                ->label('Conflict Resolution')
                                ->badge()
                                ->color(fn (?string $state): string => match ($state) {
                                    'server_wins' => 'warning',
                                    'client_wins' => 'info',
                                    'merged' => 'success',
                                    default => 'gray',
                                })
                                ->formatStateUsing(fn (?string $state): string => $state ? str_replace('_', ' ', ucfirst($state)) : '—'),
                        ])->columns(2),
                    ]),

                Section::make('Metadata')
                    ->schema([
                        Grid::make([
                            TextEntry::make('uuid')
                                ->label('UUID')
                                ->copyable()
                                ->columnSpanFull(),
                            TextEntry::make('created_at')
                                ->label('Created')
                                ->dateTime('M j, Y H:i'),
                            TextEntry::make('updated_at')
                                ->label('Updated')
                                ->dateTime('M j, Y H:i'),
                            TextEntry::make('deleted_at')
                                ->label('Deleted')
                                ->dateTime('M j, Y H:i')
                                ->placeholder('—'),
                        ])->columns(3),
                    ]),
            ]);
    }
}
