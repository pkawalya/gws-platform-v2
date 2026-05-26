<?php

namespace App\Filament\Resources\Field\FieldSyncEvents\Schemas;

use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Components\Grid;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class FieldSyncEventInfolist
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Sync Overview')
                    ->schema([
                        Grid::make([
                            TextEntry::make('device_id')
                                ->label('Device ID')
                                ->copyable(),
                            TextEntry::make('sync_type')
                                ->label('Sync Type')
                                ->badge()
                                ->color(fn (string $state): string => match ($state) {
                                    'push' => 'info',
                                    'pull' => 'success',
                                    'full' => 'warning',
                                    default => 'gray',
                                })
                                ->formatStateUsing(fn (string $state): string => ucfirst($state)),
                        ])->columns(2),
                        Grid::make([
                            TextEntry::make('status')
                                ->label('Status')
                                ->badge()
                                ->color(fn (string $state): string => match ($state) {
                                    'started' => 'info',
                                    'completed' => 'success',
                                    'failed' => 'danger',
                                    'conflict' => 'warning',
                                    default => 'gray',
                                })
                                ->formatStateUsing(fn (string $state): string => ucfirst($state)),
                            TextEntry::make('user.name')
                                ->label('User'),
                        ])->columns(2),
                    ]),

                Section::make('Record Counts')
                    ->schema([
                        Grid::make([
                            TextEntry::make('records_pushed')
                                ->label('Records Pushed')
                                ->numeric()
                                ->color('info'),
                            TextEntry::make('records_pulled')
                                ->label('Records Pulled')
                                ->numeric()
                                ->color('success'),
                            TextEntry::make('records_conflicted')
                                ->label('Records Conflicted')
                                ->numeric()
                                ->color(fn (int $state): string => $state > 0 ? 'danger' : 'gray'),
                        ])->columns(3),
                    ]),

                Section::make('Timing')
                    ->schema([
                        Grid::make([
                            TextEntry::make('started_at')
                                ->label('Started At')
                                ->dateTime('M j, Y H:i:s'),
                            TextEntry::make('completed_at')
                                ->label('Completed At')
                                ->dateTime('M j, Y H:i:s')
                                ->placeholder('—'),
                        ])->columns(2),
                        Grid::make([
                            TextEntry::make('device_timestamp')
                                ->label('Device Timestamp')
                                ->dateTime('M j, Y H:i:s'),
                            TextEntry::make('duration')
                                ->label('Duration')
                                ->state(function ($record) {
                                    if (! $record->completed_at || ! $record->started_at) {
                                        return '—';
                                    }

                                    $diff = $record->started_at->diffInSeconds($record->completed_at);

                                    return $diff < 60
                                        ? "{$diff}s"
                                        : gmdate('i:s', $diff);
                                }),
                        ])->columns(2),
                    ]),

                Section::make('Errors')
                    ->schema([
                        TextEntry::make('error_message')
                            ->label('Error Message')
                            ->placeholder('No errors')
                            ->columnSpanFull(),
                    ])
                    ->visible(fn ($record) => !empty($record->error_message)),

                Section::make('Conflicts')
                    ->schema([
                        TextEntry::make('conflicts')
                            ->label('Conflict Details')
                            ->json()
                            ->columnSpanFull()
                            ->placeholder('No conflicts'),
                    ])
                    ->visible(fn ($record) => !empty($record->conflicts)),

                Section::make('Device & App Info')
                    ->schema([
                        TextEntry::make('metadata')
                            ->label('Metadata')
                            ->json()
                            ->columnSpanFull()
                            ->placeholder('No metadata'),
                    ])
                    ->visible(fn ($record) => !empty($record->metadata)),
            ]);
    }
}
