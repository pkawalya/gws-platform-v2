<?php

namespace App\Filament\Resources\System\Branches;

use App\Filament\Resources\System\Branches\Pages\CreateBranch;
use App\Filament\Resources\System\Branches\Pages\EditBranch;
use App\Filament\Resources\System\Branches\Pages\ListBranches;
use App\Filament\Resources\System\Branches\Pages\ViewBranch;
use App\Filament\Resources\System\Branches\Schemas\BranchForm;
use App\Filament\Resources\System\Branches\Schemas\BranchInfolist;
use App\Filament\Resources\System\Branches\Tables\BranchesTable;
use App\Models\Branch;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class BranchResource extends Resource
{
    protected static ?string $model = Branch::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedBuildingStorefront;

    protected static string|\UnitEnum|null $navigationGroup = 'System';

    protected static ?string $navigationLabel = 'Branches';

    protected static ?int $navigationSort = 20;

    public static function form(Schema $schema): Schema
    {
        return BranchForm::configure($schema);
    }

    public static function infolist(Schema $schema): Schema
    {
        return BranchInfolist::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return BranchesTable::configure($table);
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
            'index' => ListBranches::route('/'),
            'create' => CreateBranch::route('/create'),
            'view' => ViewBranch::route('/{record}'),
            'edit' => EditBranch::route('/{record}/edit'),
        ];
    }
}
