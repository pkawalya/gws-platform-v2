<?php

namespace App\Filament\Resources\Workflow\WorkflowInstances\Tables;

use App\Services\WorkflowEngine;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\ViewAction;
use Filament\Actions\Action;
use Filament\Notifications\Notification;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class WorkflowInstancesTable
{
    /**
     * Configure the table for WorkflowInstance.
     */
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('entity_type')
                    ->label('Entity')
                    ->formatStateUsing(fn (string $state): string => ucfirst($state))
                    ->description(fn ($record) => "ID: {$record->entity_id}")
                    ->searchable()
                    ->sortable(),

                TextColumn::make('definition.name')
                    ->label('Workflow')
                    ->searchable()
                    ->sortable()
                    ->limit(30),

                TextColumn::make('status')
                    ->label('Status')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'pending' => 'warning',
                        'active' => 'success',
                        'completed' => 'primary',
                        'cancelled' => 'danger',
                        'suspended' => 'gray',
                        default => 'gray',
                    })
                    ->formatStateUsing(fn (string $state): string => ucfirst($state))
                    ->sortable(),

                TextColumn::make('currentStep.name')
                    ->label('Current Step')
                    ->placeholder('—')
                    ->weight('medium'),

                TextColumn::make('progress')
                    ->label('Progress')
                    ->formatStateUsing(function ($record) {
                        $progress = WorkflowEngine::calculateProgress($record);
                        return number_format($progress, 0) . '%';
                    })
                    ->color(fn ($record) => {
                        $progress = WorkflowEngine::calculateProgress($record);
                        return $progress >= 100 ? 'success' : ($progress >= 50 ? 'warning' : 'danger');
                    }),

                TextColumn::make('started_at')
                    ->label('Started')
                    ->dateTime('M j, Y')
                    ->sortable()
                    ->since()
                    ->placeholder('—'),

                TextColumn::make('completed_at')
                    ->label('Completed')
                    ->dateTime('M j, Y')
                    ->sortable()
                    ->placeholder('—')
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                SelectFilter::make('status')
                    ->label('Status')
                    ->options([
                        'pending' => 'Pending',
                        'active' => 'Active',
                        'completed' => 'Completed',
                        'cancelled' => 'Cancelled',
                        'suspended' => 'Suspended',
                    ])
                    ->multiple(),

                SelectFilter::make('entity_type')
                    ->label('Entity Type')
                    ->options([
                        'SurveyProject' => 'Survey Project',
                        'Client' => 'Client',
                    ]),
            ])
            ->recordActions([
                ViewAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ])
            ->defaultSort('created_at', 'desc');
    }
}
