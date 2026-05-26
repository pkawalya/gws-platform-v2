<?php

namespace App\Filament\Resources\Workflow\WorkflowDefinitions\Schemas;

use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Components\Group;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class WorkflowDefinitionInfolist
{
    /**
     * Configure the infolist schema for WorkflowDefinition.
     */
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Definition Details')
                    ->schema([
                        Group::make([
                            TextEntry::make('name')
                                ->label('Name')
                                ->weight('bold'),

                            TextEntry::make('slug')
                                ->label('Slug')
                                ->badge()
                                ->color('gray')
                                ->copyable(),

                            TextEntry::make('entity_type')
                                ->label('Entity Type')
                                ->badge()
                                ->color('info')
                                ->formatStateUsing(fn (string $state): string => ucfirst($state)),
                        ])->columns(3),

                        Group::make([
                            TextEntry::make('version')
                                ->label('Version')
                                ->badge()
                                ->color('primary'),

                            TextEntry::make('is_active')
                                ->label('Status')
                                ->badge()
                                ->color(fn (bool $state): string => $state ? 'success' : 'danger')
                                ->formatStateUsing(fn (bool $state): string => $state ? 'Active' : 'Inactive'),

                            TextEntry::make('steps_count')
                                ->label('Steps')
                                ->badge()
                                ->color('gray')
                                ->state(fn ($record) => $record->steps()->count()),

                            TextEntry::make('instances_count')
                                ->label('Instances')
                                ->badge()
                                ->color('gray')
                                ->state(fn ($record) => $record->instances()->count()),
                        ])->columns(4),
                    ]),

                Section::make('Description')
                    ->schema([
                        TextEntry::make('description')
                            ->label('')
                            ->placeholder('No description provided')
                            ->prose(),
                    ])
                    ->hidden(fn ($record) => empty($record->description)),

                Section::make('Configuration')
                    ->schema([
                        TextEntry::make('metadata')
                            ->label('Settings')
                            ->formatStateUsing(fn ($state) => is_array($state) ? collect($state)->map(fn ($v, $k) => "{$k}: {$v}")->join("\n") : '—')
                            ->prose()
                            ->placeholder('No configuration defined'),
                    ])
                    ->hidden(fn ($record) => empty($record->metadata)),

                Section::make('Timestamps')
                    ->schema([
                        Group::make([
                            TextEntry::make('created_at')
                                ->label('Created')
                                ->dateTime('M j, Y H:i'),
                            TextEntry::make('updated_at')
                                ->label('Updated')
                                ->dateTime('M j, Y H:i'),
                        ])->columns(2),
                    ]),
            ]);
    }
}
