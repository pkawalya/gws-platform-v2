<?php

namespace App\Filament\Resources\System\Branches\Schemas;

use Filament\Forms\Components\Section;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;

class BranchForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Branch Details')
                    ->schema([
                        Select::make('organization_id')
                            ->label('Organization')
                            ->relationship('organization', 'name')
                            ->searchable()
                            ->preload()
                            ->required()
                            ->columnSpan(1),

                        TextInput::make('name')
                            ->label('Branch Name')
                            ->required()
                            ->maxLength(255)
                            ->columnSpan(1),

                        TextInput::make('code')
                            ->label('Branch Code')
                            ->maxLength(20)
                            ->unique(ignoreRecord: true)
                            ->placeholder('e.g. KLA-01')
                            ->columnSpan(1),

                        TextInput::make('district')
                            ->label('District')
                            ->maxLength(100)
                            ->columnSpan(1),

                        TextInput::make('address')
                            ->label('Address')
                            ->maxLength(255)
                            ->columnSpanFull(),

                        TextInput::make('phone')
                            ->label('Phone')
                            ->tel()
                            ->maxLength(20)
                            ->columnSpan(1),

                        TextInput::make('email')
                            ->label('Email')
                            ->email()
                            ->maxLength(255)
                            ->columnSpan(1),
                    ])
                    ->columns(2),

                Section::make('Settings')
                    ->schema([
                        Toggle::make('is_headquarters')
                            ->label('Headquarters')
                            ->default(false)
                            ->helperText('Mark as the main branch for this organization'),

                        Toggle::make('is_active')
                            ->label('Active')
                            ->default(true),

                        Select::make('manager_user_id')
                            ->label('Branch Manager')
                            ->relationship('manager', 'name')
                            ->searchable()
                            ->preload()
                            ->placeholder('Select a manager'),
                    ])
                    ->columns(3),
            ]);
    }
}
