<?php

namespace App\Filament\Resources\Workflow\WorkflowDefinitions\Schemas;

use Filament\Forms\Components\KeyValue;
use Filament\Forms\Components\Section;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;

class WorkflowDefinitionForm
{
    /**
     * Configure the form schema for WorkflowDefinition.
     */
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Definition Details')
                    ->schema([
                        TextInput::make('name')
                            ->label('Name')
                            ->required()
                            ->maxLength(200)
                            ->live(onBlur: true)
                            ->helperText('e.g., "Uganda Land Survey Approval"')
                            ->columnSpan(2),

                        TextInput::make('slug')
                            ->label('Slug')
                            ->maxLength(200)
                            ->unique(ignoreRecord: true)
                            ->helperText('Auto-generated from name if left empty')
                            ->columnSpan(1),

                        Select::make('entity_type')
                            ->label('Entity Type')
                            ->options([
                                'SurveyProject' => 'Survey Project',
                                'Client' => 'Client',
                            ])
                            ->required()
                            ->native(false)
                            ->columnSpan(1),

                        TextInput::make('version')
                            ->label('Version')
                            ->numeric()
                            ->default(1)
                            ->minValue(1)
                            ->disabledOn('edit')
                            ->dehydrated()
                            ->columnSpan(1),

                        Toggle::make('is_active')
                            ->label('Active')
                            ->default(true)
                            ->helperText('Inactive definitions cannot be used to start new instances')
                            ->columnSpan(1),
                    ])
                    ->columns(3),

                Section::make('Description & Configuration')
                    ->schema([
                        \Filament\Forms\Components\Textarea::make('description')
                            ->label('Description')
                            ->rows(3)
                            ->maxLength(65535)
                            ->columnSpanFull(),

                        KeyValue::make('metadata')
                            ->label('Configuration')
                            ->keyLabel('Setting')
                            ->valueLabel('Value')
                            ->helperText('Extra config like SLA days per step, notification channels, etc.')
                            ->columnSpanFull(),
                    ]),
            ]);
    }
}
