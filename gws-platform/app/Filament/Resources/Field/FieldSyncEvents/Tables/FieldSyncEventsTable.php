<?php

namespace App\Filament\Resources\Field\FieldSyncEvents\Tables;

use Filament\Actions\ViewAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class FieldSyncEventsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('device_id')
                    ->label('Device ID')
                    ->searchable()
                    ->copyable()
                    ->limit(20)
                    ->tooltip(fn ($record) => $record->device_id),

                TextColumn::make('user.name')
                    ->label('User')
                    ->searchable()
                    ->sortable(),

                TextColumn::make('sync_type')
                    ->label('Type')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'push' => 'info',
                        'pull' => 'success',
                        'full' => 'warning',
                        default => 'gray',
                    })
                    ->formatStateUsing(fn (string $state): string => ucfirst($state))
                    ->sortable(),

                TextColumn::make('status')
                    ->label('Status')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'started' => 'info',
                        'completed' => 'success',
                        'failed' => 'danger',
                        'conflict' => 'warning',
                        default => 'gray',
                    })
                    ->formatStateUsing(fn (string $state): string => ucfirst($state))
                    ->sortable(),

                TextColumn::make('records_pushed')
                    ->label('Pushed')
                    ->numeric()
                    ->sortable(),

                TextColumn::make('records_pulled')
                    ->label('Pulled')
                    ->numeric()
                    ->sortable(),

                TextColumn::make('records_conflicted')
                    ->label('Conflicts')
                    ->numeric()
                    ->color(fn (int $state): string => $state > 0 ? 'danger' : 'gray')
                    ->sortable(),

                TextColumn::make('started_at')
                    ->label('Started')
                    ->dateTime('M j, Y H:i')
                    ->sortable(),

                TextColumn::make('duration')
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
            ])
            ->filters([
                SelectFilter::make('sync_type')
                    ->label('Sync Type')
                    ->options([
                        'push' => 'Push',
                        'pull' => 'Pull',
                        'full' => 'Full',
                    ])
                    ->multiple(),

                SelectFilter::make('status')
                    ->label('Status')
                    ->options([
                        'started' => 'Started',
                        'completed' => 'Completed',
                        'failed' => 'Failed',
                        'conflict' => 'Conflict',
                    ])
                    ->multiple(),
            ])
            ->recordActions([
                ViewAction::make(),
            ])
            ->defaultSort('started_at', 'desc');
    }
}
