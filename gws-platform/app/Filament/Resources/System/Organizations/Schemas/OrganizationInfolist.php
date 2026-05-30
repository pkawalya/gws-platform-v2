<?php

namespace App\Filament\Resources\System\Organizations\Schemas;

use Filament\Infolists\Components\IconEntry;
use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Components\Group;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class OrganizationInfolist
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Organization Details')
                    ->schema([
                        Group::make([
                            TextEntry::make('name')
                                ->label('Name')
                                ->weight('bold'),
                            TextEntry::make('slug')
                                ->label('Slug')
                                ->badge()
                                ->color('gray'),
                            TextEntry::make('subscription_plan')
                                ->label('Plan')
                                ->badge()
                                ->color(fn (string $state): string => match ($state) {
                                    'enterprise' => 'primary',
                                    'professional' => 'success',
                                    'starter' => 'info',
                                    'free' => 'gray',
                                    default => 'gray',
                                })
                                ->formatStateUsing(fn (string $state): string => ucfirst($state ?? 'Free')),
                            IconEntry::make('is_active')
                                ->label('Active')
                                ->boolean()
                                ->trueIcon('heroicon-o-check-circle')
                                ->falseIcon('heroicon-o-x-circle')
                                ->trueColor('success')
                                ->falseColor('danger'),
                        ])->columns(2),
                        Group::make([
                            TextEntry::make('branches_count')
                                ->label('Branches')
                                ->counts('branches')
                                ->badge()
                                ->color('info'),
                            TextEntry::make('users_count')
                                ->label('Users')
                                ->counts('users')
                                ->badge()
                                ->color('gray'),
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
