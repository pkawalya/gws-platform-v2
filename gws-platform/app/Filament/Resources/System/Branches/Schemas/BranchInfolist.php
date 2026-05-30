<?php

namespace App\Filament\Resources\System\Branches\Schemas;

use Filament\Infolists\Components\IconEntry;
use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Components\Group;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class BranchInfolist
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Branch Details')
                    ->schema([
                        Group::make([
                            TextEntry::make('name')
                                ->label('Branch Name')
                                ->weight('bold'),
                            TextEntry::make('code')
                                ->label('Code')
                                ->badge()
                                ->color('gray'),
                            TextEntry::make('organization.name')
                                ->label('Organization')
                                ->badge()
                                ->color('primary'),
                            TextEntry::make('manager.name')
                                ->label('Manager')
                                ->placeholder('Not assigned'),
                        ])->columns(2),
                        Group::make([
                            TextEntry::make('district')
                                ->label('District')
                                ->placeholder('--'),
                            TextEntry::make('address')
                                ->label('Address')
                                ->placeholder('--'),
                            TextEntry::make('phone')
                                ->label('Phone')
                                ->copyable()
                                ->placeholder('--'),
                            TextEntry::make('email')
                                ->label('Email')
                                ->copyable()
                                ->placeholder('--'),
                        ])->columns(2),
                        Group::make([
                            IconEntry::make('is_headquarters')
                                ->label('Headquarters')
                                ->boolean()
                                ->trueIcon('heroicon-o-building-office-2')
                                ->falseIcon('heroicon-o-building-storefront')
                                ->trueColor('primary')
                                ->falseColor('gray'),
                            IconEntry::make('is_active')
                                ->label('Active')
                                ->boolean()
                                ->trueIcon('heroicon-o-check-circle')
                                ->falseIcon('heroicon-o-x-circle')
                                ->trueColor('success')
                                ->falseColor('danger'),
                            TextEntry::make('users_count')
                                ->label('Users')
                                ->counts('users')
                                ->badge()
                                ->color('gray'),
                            TextEntry::make('created_at')
                                ->label('Created')
                                ->dateTime('M j, Y H:i'),
                        ])->columns(2),
                    ]),
            ]);
    }
}
