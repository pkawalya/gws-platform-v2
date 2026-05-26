<?php

namespace App\Filament\Resources\Workflow\WorkflowInstances;

use App\Filament\Resources\Workflow\WorkflowInstances\Pages\ListWorkflowInstances;
use App\Filament\Resources\Workflow\WorkflowInstances\Pages\ViewWorkflowInstance;
use App\Filament\Resources\Workflow\WorkflowInstances\Schemas\WorkflowInstanceInfolist;
use App\Filament\Resources\Workflow\WorkflowInstances\Tables\WorkflowInstancesTable;
use App\Models\WorkflowInstance;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class WorkflowInstanceResource extends Resource
{
    protected static ?string $model = WorkflowInstance::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedQueueList;

    protected static string|\UnitEnum|null $navigationGroup = 'Workflows';

    protected static ?string $navigationLabel = 'Workflow Instances';

    protected static ?int $navigationSort = 20;

    protected static ?string $recordTitleAttribute = 'id';

    /**
     * Instances are read-only — no form schema needed.
     */
    public static function form(Schema $schema): Schema
    {
        return $schema->components([]);
    }

    public static function infolist(Schema $schema): Schema
    {
        return WorkflowInstanceInfolist::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return WorkflowInstancesTable::configure($table);
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
            'index' => ListWorkflowInstances::route('/'),
            'view' => ViewWorkflowInstance::route('/{record}'),
        ];
    }
}
