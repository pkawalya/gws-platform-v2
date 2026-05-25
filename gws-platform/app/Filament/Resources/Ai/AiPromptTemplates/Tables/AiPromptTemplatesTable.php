<?php

namespace App\Filament\Resources\Ai\AiPromptTemplates\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Actions\ViewAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\TernaryFilter;
use Filament\Tables\Table;

class AiPromptTemplatesTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('key')
                    ->label('Key')
                    ->searchable()
                    ->sortable()
                    ->copyable()
                    ->description(fn ($record) => "v{$record->version}"),

                TextColumn::make('version')
                    ->label('Version')
                    ->sortable()
                    ->badge(),

                TextColumn::make('aiModelVersion.model_name')
                    ->label('Model')
                    ->sortable()
                    ->searchable()
                    ->limit(25),

                TextColumn::make('max_tokens')
                    ->label('Max Tokens')
                    ->numeric()
                    ->sortable(),

                TextColumn::make('temperature')
                    ->label('Temperature')
                    ->numeric(decimalPlaces: 2)
                    ->sortable(),

                TextColumn::make('is_active')
                    ->label('Active')
                    ->badge()
                    ->color(fn (bool $state): string => $state ? 'success' : 'danger')
                    ->formatStateUsing(fn (bool $state): string => $state ? 'Active' : 'Inactive')
                    ->sortable(),

                TextColumn::make('updated_at')
                    ->label('Updated')
                    ->dateTime('M j, Y H:i')
                    ->sortable()
                    ->since(),
            ])
            ->filters([
                TernaryFilter::make('is_active')
                    ->label('Active'),
            ])
            ->recordActions([
                ViewAction::make(),
                EditAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ])
            ->defaultSort('updated_at', 'desc');
    }
}
