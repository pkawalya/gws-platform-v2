<?php

namespace App\Filament\Resources\Workflow\WorkflowDefinitions\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Actions\ViewAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Filters\TernaryFilter;
use Filament\Tables\Table;

class WorkflowDefinitionsTable
{
    /**
     * Configure the table for WorkflowDefinition.
     */
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('name')
                    ->label('Name')
                    ->searchable()
                    ->sortable()
                    ->weight('medium')
                    ->description(fn ($record) => $record->slug),

                TextColumn::make('entity_type')
                    ->label('Entity Type')
                    ->badge()
                    ->color('info')
                    ->formatStateUsing(fn (string $state): string => ucfirst($state))
                    ->sortable(),

                TextColumn::make('version')
                    ->label('Version')
                    ->badge()
                    ->color('primary')
                    ->sortable(),

                TextColumn::make('is_active')
                    ->label('Status')
                    ->badge()
                    ->color(fn (bool $state): string => $state ? 'success' : 'danger')
                    ->formatStateUsing(fn (bool $state): string => $state ? 'Active' : 'Inactive')
                    ->sortable(),

                TextColumn::make('steps_count')
                    ->label('Steps')
                    ->state(fn ($record) => $record->steps()->count())
                    ->badge()
                    ->color('gray')
                    ->alignCenter(),

                TextColumn::make('instances_count')
                    ->label('Instances')
                    ->state(fn ($record) => $record->instances()->count())
                    ->badge()
                    ->color('gray')
                    ->alignCenter(),

                TextColumn::make('updated_at')
                    ->label('Updated')
                    ->dateTime('M j, Y H:i')
                    ->sortable()
                    ->since()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                SelectFilter::make('entity_type')
                    ->label('Entity Type')
                    ->options([
                        'SurveyProject' => 'Survey Project',
                        'Client' => 'Client',
                    ]),

                TernaryFilter::make('is_active')
                    ->label('Active'),
            ])
            ->recordActions([
                ViewAction::make(),
                EditAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ])
            ->defaultSort('created_at', 'desc');
    }
}
