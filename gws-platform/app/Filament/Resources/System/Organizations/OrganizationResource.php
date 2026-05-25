<?php

namespace App\Filament\Resources\System\Organizations;

use App\Filament\Resources\System\Organizations\Pages\CreateOrganization;
use App\Filament\Resources\System\Organizations\Pages\EditOrganization;
use App\Filament\Resources\System\Organizations\Pages\ListOrganizations;
use App\Filament\Resources\System\Organizations\Pages\ViewOrganization;
use App\Filament\Resources\System\Organizations\Schemas\OrganizationForm;
use App\Filament\Resources\System\Organizations\Schemas\OrganizationInfolist;
use App\Filament\Resources\System\Organizations\Tables\OrganizationsTable;
use App\Models\Organization;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class OrganizationResource extends Resource
{
    protected static ?string $model = Organization::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedBuildingOffice2;

    protected static string|\UnitEnum|null $navigationGroup = 'System';

    protected static ?string $navigationLabel = 'Organizations';

    protected static ?int $navigationSort = 10;

    public static function form(Schema $schema): Schema
    {
        return OrganizationForm::configure($schema);
    }

    public static function infolist(Schema $schema): Schema
    {
        return OrganizationInfolist::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return OrganizationsTable::configure($table);
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
            'index' => ListOrganizations::route('/'),
            'create' => CreateOrganization::route('/create'),
            'view' => ViewOrganization::route('/{record}'),
            'edit' => EditOrganization::route('/{record}/edit'),
        ];
    }
}
