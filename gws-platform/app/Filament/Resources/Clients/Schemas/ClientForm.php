<?php

namespace App\Filament\Resources\Clients\Schemas;

use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\Section;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;

class ClientForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Personal Information')
                    ->schema([
                        TextInput::make('first_name')
                            ->label('First Name')
                            ->required()
                            ->maxLength(100)
                            ->columnSpan(1),

                        TextInput::make('last_name')
                            ->label('Last Name')
                            ->required()
                            ->maxLength(100)
                            ->columnSpan(1),

                        TextInput::make('email')
                            ->label('Email')
                            ->email()
                            ->maxLength(255)
                            ->unique(ignoreRecord: true)
                            ->columnSpan(1),

                        TextInput::make('phone')
                            ->label('Phone')
                            ->tel()
                            ->required()
                            ->maxLength(20)
                            ->columnSpan(1),

                        TextInput::make('nin')
                            ->label('National ID (NIN)')
                            ->maxLength(20)
                            ->unique(ignoreRecord: true)
                            ->columnSpan(1),

                        DatePicker::make('date_of_birth')
                            ->label('Date of Birth')
                            ->maxDate(now()->subYears(18))
                            ->displayFormat('M j, Y')
                            ->columnSpan(1),
                    ])
                    ->columns(2),

                Section::make('Address & Location')
                    ->schema([
                        TextInput::make('address')
                            ->label('Address')
                            ->maxLength(255)
                            ->columnSpanFull(),

                        TextInput::make('district')
                            ->label('District')
                            ->maxLength(100)
                            ->columnSpan(1),

                        TextInput::make('lc1_area')
                            ->label('LC1 Area')
                            ->maxLength(100)
                            ->columnSpan(1),
                    ])
                    ->columns(2),

                Section::make('Status')
                    ->schema([
                        Select::make('lifecycle_state')
                            ->label('Lifecycle State')
                            ->options([
                                'prospect' => 'Prospect',
                                'active' => 'Active',
                                'dormant' => 'Dormant',
                                'suspended' => 'Suspended',
                                'closed' => 'Closed',
                            ])
                            ->required()
                            ->default('prospect')
                            ->native(false)
                            ->columnSpan(1),

                        Toggle::make('kyc_verified')
                            ->label('KYC Verified')
                            ->default(false)
                            ->helperText('Mark as verified once all KYC documents have been validated')
                            ->columnSpan(1),
                    ])
                    ->columns(2),
            ]);
    }
}
