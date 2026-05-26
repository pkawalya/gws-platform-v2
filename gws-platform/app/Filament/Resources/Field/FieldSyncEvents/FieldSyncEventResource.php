<?php

namespace App\Filament\Resources\Field\FieldSyncEvents;

use App\Filament\Resources\Field\FieldSyncEvents\Pages\ListFieldSyncEvents;
use App\Filament\Resources\Field\FieldSyncEvents\Pages\ViewFieldSyncEvent;
use App\Filament\Resources\Field\FieldSyncEvents\Schemas\FieldSyncEventInfolist;
use App\Filament\Resources\Field\FieldSyncEvents\Tables\FieldSyncEventsTable;
use App\Models\FieldSyncEvent;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class FieldSyncEventResource extends Resource
{
    protected static ?string $model = FieldSyncEvent::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedArrowPath;

    protected static string|\UnitEnum|null $navigationGroup = 'Field Operations';

    protected static ?string $navigationLabel = 'Sync Events';

    protected static ?int $navigationSort = 20;

    protected static ?string $recordTitleAttribute = 'device_id';

    /**
     * This resource is read-only — sync events are system-generated.
     * No form is needed as events are created by the FieldSyncService.
     */
    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                //
            ]);
    }

    public static function infolist(Schema $schema): Schema
    {
        return FieldSyncEventInfolist::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return FieldSyncEventsTable::configure($table);
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => ListFieldSyncEvents::route('/'),
            'view' => ViewFieldSyncEvent::route('/{record}'),
        ];
    }
}
