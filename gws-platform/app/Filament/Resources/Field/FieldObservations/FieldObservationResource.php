<?php

namespace App\Filament\Resources\Field\FieldObservations;

use App\Filament\Resources\Field\FieldObservations\Pages\ListFieldObservations;
use App\Filament\Resources\Field\FieldObservations\Pages\ViewFieldObservation;
use App\Filament\Resources\Field\FieldObservations\Schemas\FieldObservationInfolist;
use App\Filament\Resources\Field\FieldObservations\Tables\FieldObservationsTable;
use App\Models\FieldObservation;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class FieldObservationResource extends Resource
{
    protected static ?string $model = FieldObservation::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedClipboardDocumentList;

    protected static string|\UnitEnum|null $navigationGroup = 'Field Operations';

    protected static ?string $navigationLabel = 'Field Observations';

    protected static ?int $navigationSort = 10;

    protected static ?string $recordTitleAttribute = 'title';

    /**
     * This resource is read-only — observations come from the field.
     * No form is needed as observations are created via the mobile API.
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
        return FieldObservationInfolist::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return FieldObservationsTable::configure($table);
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
            'index' => ListFieldObservations::route('/'),
            'view' => ViewFieldObservation::route('/{record}'),
        ];
    }
}
