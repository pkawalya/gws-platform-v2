<?php

namespace App\Filament\Resources\Workflow\WorkflowDefinitions;

use App\Filament\Resources\Workflow\WorkflowDefinitions\Pages\CreateWorkflowDefinition;
use App\Filament\Resources\Workflow\WorkflowDefinitions\Pages\EditWorkflowDefinition;
use App\Filament\Resources\Workflow\WorkflowDefinitions\Pages\ListWorkflowDefinitions;
use App\Filament\Resources\Workflow\WorkflowDefinitions\Pages\ViewWorkflowDefinition;
use App\Filament\Resources\Workflow\WorkflowDefinitions\Schemas\WorkflowDefinitionForm;
use App\Filament\Resources\Workflow\WorkflowDefinitions\Schemas\WorkflowDefinitionInfolist;
use App\Filament\Resources\Workflow\WorkflowDefinitions\Tables\WorkflowDefinitionsTable;
use App\Models\WorkflowDefinition;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class WorkflowDefinitionResource extends Resource
{
    protected static ?string $model = WorkflowDefinition::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedArrowPathRoundedSquare;

    protected static string|\UnitEnum|null $navigationGroup = 'Workflows';

    protected static ?string $navigationLabel = 'Workflow Definitions';

    protected static ?int $navigationSort = 10;

    protected static ?string $recordTitleAttribute = 'name';

    public static function form(Schema $schema): Schema
    {
        return WorkflowDefinitionForm::configure($schema);
    }

    public static function infolist(Schema $schema): Schema
    {
        return WorkflowDefinitionInfolist::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return WorkflowDefinitionsTable::configure($table);
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
            'index' => ListWorkflowDefinitions::route('/'),
            'create' => CreateWorkflowDefinition::route('/create'),
            'view' => ViewWorkflowDefinition::route('/{record}'),
            'edit' => EditWorkflowDefinition::route('/{record}/edit'),
        ];
    }
}
