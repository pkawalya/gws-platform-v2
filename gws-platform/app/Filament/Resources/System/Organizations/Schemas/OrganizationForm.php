<?php

namespace App\Filament\Resources\System\Organizations\Schemas;

use Filament\Forms\Components\Section;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;

class OrganizationForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Organization Details')
                    ->schema([
                        TextInput::make('name')
                            ->label('Organization Name')
                            ->required()
                            ->maxLength(255)
                            ->live(onBlur: true)
                            ->debounce(500),

                        TextInput::make('slug')
                            ->label('Slug')
                            ->maxLength(255)
                            ->unique(ignoreRecord: true)
                            ->helperText('Auto-generated from name. Leave blank to auto-generate.')
                            ->columnSpan(1),

                        Select::make('subscription_plan')
                            ->label('Subscription Plan')
                            ->options([
                                'free' => 'Free',
                                'starter' => 'Starter',
                                'professional' => 'Professional',
                                'enterprise' => 'Enterprise',
                            ])
                            ->required()
                            ->default('free')
                            ->native(false)
                            ->columnSpan(1),

                        Toggle::make('is_active')
                            ->label('Active')
                            ->default(true)
                            ->columnSpan(1),
                    ])
                    ->columns(2),

                Section::make('Settings')
                    ->schema([
                        TextInput::make('logo_path')
                            ->label('Logo Path')
                            ->maxLength(500)
                            ->placeholder('Path to organization logo')
                            ->columnSpanFull(),
                    ])
                    ->collapsed(),
            ]);
    }
}
