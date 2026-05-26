<?php

namespace App\Filament\Resources\Workflow\WorkflowDefinitions\Pages;

use App\Filament\Resources\Workflow\WorkflowDefinitions\WorkflowDefinitionResource;
use Filament\Actions\DeleteAction;
use Filament\Actions\ViewAction;
use Filament\Resources\Pages\EditRecord;

class EditWorkflowDefinition extends EditRecord
{
    protected static string $resource = WorkflowDefinitionResource::class;

    protected function getHeaderActions(): array
    {
        return [
            ViewAction::make(),
            DeleteAction::make(),
        ];
    }
}
