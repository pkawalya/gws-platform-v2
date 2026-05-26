<?php

namespace App\Filament\Resources\Workflow\WorkflowInstances\Schemas;

use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Components\Group;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class WorkflowInstanceInfolist
{
    /**
     * Configure the infolist schema for WorkflowInstance.
     */
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Workflow Instance')
                    ->schema([
                        Group::make([
                            TextEntry::make('definition.name')
                                ->label('Workflow')
                                ->weight('bold'),

                            TextEntry::make('entity_type')
                                ->label('Entity Type')
                                ->badge()
                                ->color('info')
                                ->formatStateUsing(fn (string $state): string => ucfirst($state)),

                            TextEntry::make('entity_id')
                                ->label('Entity ID')
                                ->badge()
                                ->color('gray'),
                        ])->columns(3),

                        Group::make([
                            TextEntry::make('status')
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
                                ->formatStateUsing(fn (string $state): string => ucfirst($state)),

                            TextEntry::make('currentStep.name')
                                ->label('Current Step')
                                ->placeholder('—')
                                ->weight('medium'),

                            TextEntry::make('is_overdue')
                                ->label('SLA Status')
                                ->badge()
                                ->color(fn (bool $state): string => $state ? 'danger' : 'success')
                                ->formatStateUsing(fn (bool $state): string => $state ? 'Overdue' : 'On Time'),
                        ])->columns(3),

                        Group::make([
                            TextEntry::make('started_at')
                                ->label('Started')
                                ->dateTime('M j, Y H:i')
                                ->placeholder('—'),

                            TextEntry::make('completed_at')
                                ->label('Completed')
                                ->dateTime('M j, Y H:i')
                                ->placeholder('—'),

                            TextEntry::make('cancelled_at')
                                ->label('Cancelled')
                                ->dateTime('M j, Y H:i')
                                ->placeholder('—')
                                ->hidden(fn ($record) => ! $record->cancelled_at),

                            TextEntry::make('createdBy.name')
                                ->label('Started By')
                                ->placeholder('System'),
                        ])->columns(3),
                    ]),

                Section::make('Cancellation Details')
                    ->schema([
                        TextEntry::make('cancellation_reason')
                            ->label('Reason')
                            ->prose(),
                    ])
                    ->hidden(fn ($record) => ! $record->cancellation_reason),

                Section::make('Transition Timeline')
                    ->schema([
                        \Filament\Infolists\Components\RepeatableEntry::make('transitions')
                            ->label('')
                            ->schema([
                                TextEntry::make('step.name')
                                    ->label('Step')
                                    ->weight('medium')
                                    ->columnSpan(1),
                                TextEntry::make('action')
                                    ->label('Action')
                                    ->badge()
                                    ->color(fn (string $state): string => match ($state) {
                                        'approve' => 'success',
                                        'defer' => 'warning',
                                        'reject' => 'danger',
                                        'skip' => 'gray',
                                        'submit' => 'info',
                                        'escalate' => 'danger',
                                        'reopen' => 'info',
                                        default => 'gray',
                                    })
                                    ->formatStateUsing(fn (string $state): string => ucfirst($state))
                                    ->columnSpan(1),
                                TextEntry::make('from_status')
                                    ->label('From')
                                    ->badge()
                                    ->color('gray')
                                    ->columnSpan(1),
                                TextEntry::make('to_status')
                                    ->label('To')
                                    ->badge()
                                    ->color(fn (string $state): string => match ($state) {
                                        'approved' => 'success',
                                        'deferred' => 'warning',
                                        'rejected' => 'danger',
                                        'skipped' => 'gray',
                                        'submitted' => 'info',
                                        'pending' => 'gray',
                                        default => 'gray',
                                    })
                                    ->formatStateUsing(fn (string $state): string => ucfirst($state))
                                    ->columnSpan(1),
                                TextEntry::make('comment')
                                    ->label('Comment')
                                    ->placeholder('—')
                                    ->columnSpan(2),
                                TextEntry::make('transitioned_at')
                                    ->label('When')
                                    ->dateTime('M j, Y H:i')
                                    ->since()
                                    ->columnSpan(2),
                            ])
                            ->columns(4),
                    ]),
            ]);
    }
}
