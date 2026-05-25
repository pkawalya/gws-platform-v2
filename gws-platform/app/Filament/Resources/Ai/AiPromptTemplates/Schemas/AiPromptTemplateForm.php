<?php

namespace App\Filament\Resources\Ai\AiPromptTemplates\Schemas;

use App\Models\AiModelVersion;
use Filament\Forms\Components\KeyValue;
use Filament\Forms\Components\Section;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;

class AiPromptTemplateForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Template Identity')
                    ->schema([
                        TextInput::make('key')
                            ->label('Template Key')
                            ->required()
                            ->maxLength(100)
                            ->unique(ignoreRecord: true)
                            ->helperText('Unique identifier, e.g. client.next_best_action')
                            ->columnSpan(1),

                        TextInput::make('version')
                            ->label('Version')
                            ->required()
                            ->numeric()
                            ->default(1)
                            ->minValue(1)
                            ->maxValue(255)
                            ->columnSpan(1),
                    ])
                    ->columns(2),

                Section::make('Template Content')
                    ->schema([
                        Textarea::make('template_text')
                            ->label('Template Text')
                            ->required()
                            ->rows(12)
                            ->helperText('Use {{variable_name}} for merge variables. Example: {{client_name}}, {{outstanding_amount}}')
                            ->columnSpanFull(),
                    ]),

                Section::make('Variables Schema')
                    ->schema([
                        KeyValue::make('variables_schema')
                            ->label('Variable Definitions')
                            ->keyLabel('Variable Name')
                            ->valueLabel('Description')
                            ->helperText('Define the merge variables this template expects, e.g. key=client_name, value=Full name of the client')
                            ->columnSpanFull(),
                    ]),

                Section::make('Model & Parameters')
                    ->schema([
                        Select::make('ai_model_version_id')
                            ->label('AI Model Version')
                            ->relationship('aiModelVersion', 'model_name')
                            ->searchable()
                            ->preload()
                            ->required()
                            ->columnSpan(2),

                        TextInput::make('max_tokens')
                            ->label('Max Tokens')
                            ->numeric()
                            ->default(1000)
                            ->minValue(1)
                            ->maxValue(32000)
                            ->columnSpan(1),

                        TextInput::make('temperature')
                            ->label('Temperature')
                            ->numeric()
                            ->default(0.7)
                            ->minValue(0)
                            ->maxValue(2)
                            ->step(0.01)
                            ->columnSpan(1),
                    ])
                    ->columns(4),

                Section::make('Status')
                    ->schema([
                        Toggle::make('is_active')
                            ->label('Active')
                            ->default(true)
                            ->helperText('Inactive templates cannot be used by the AiOrchestrator'),
                    ]),
            ]);
    }
}
