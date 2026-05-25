<?php

namespace App\Filament\Resources\Clients\Schemas;

use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Components\Group;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class ClientInfolist
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Personal Information')
                    ->schema([
                        Group::make([
                            TextEntry::make('full_name')
                                ->label('Full Name')
                                ->weight('bold'),
                            TextEntry::make('client_number')
                                ->label('Client Number')
                                ->badge()
                                ->color('gray'),
                            TextEntry::make('email')
                                ->label('Email')
                                ->copyable()
                                ->placeholder('—'),
                            TextEntry::make('phone')
                                ->label('Phone')
                                ->copyable()
                                ->placeholder('—'),
                        ])->columns(2),
                        Group::make([
                            TextEntry::make('nin')
                                ->label('National ID (NIN)')
                                ->copyable()
                                ->placeholder('—'),
                            TextEntry::make('date_of_birth')
                                ->label('Date of Birth')
                                ->date('M j, Y')
                                ->placeholder('—'),
                        ])->columns(2),
                    ]),

                Section::make('Address & Location')
                    ->schema([
                        Group::make([
                            TextEntry::make('address')
                                ->label('Address')
                                ->placeholder('—'),
                            TextEntry::make('district')
                                ->label('District')
                                ->placeholder('—'),
                            TextEntry::make('lc1_area')
                                ->label('LC1 Area')
                                ->placeholder('—'),
                        ])->columns(3),
                    ]),

                Section::make('Status')
                    ->schema([
                        Group::make([
                            TextEntry::make('lifecycle_state')
                                ->label('Lifecycle State')
                                ->badge()
                                ->color(fn (string $state): string => match ($state) {
                                    'prospect' => 'info',
                                    'active' => 'success',
                                    'dormant' => 'warning',
                                    'suspended' => 'danger',
                                    'closed' => 'gray',
                                    default => 'gray',
                                })
                                ->formatStateUsing(fn (string $state): string => ucfirst($state)),
                            TextEntry::make('kyc_verified')
                                ->label('KYC Verified')
                                ->badge()
                                ->color(fn (bool $state): string => $state ? 'success' : 'danger')
                                ->formatStateUsing(fn (bool $state): string => $state ? 'Verified' : 'Not Verified'),
                            TextEntry::make('created_at')
                                ->label('Created')
                                ->dateTime('M j, Y H:i'),
                        ])->columns(3),
                    ]),
            ]);
    }
}
