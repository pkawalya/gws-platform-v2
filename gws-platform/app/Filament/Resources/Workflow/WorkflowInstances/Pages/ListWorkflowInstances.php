<?php

namespace App\Filament\Resources\Workflow\WorkflowInstances\Pages;

use App\Filament\Resources\Workflow\WorkflowInstances\WorkflowInstanceResource;
use App\Services\WorkflowEngine;
use Filament\Actions\Action;
use Filament\Notifications\Notification;
use Filament\Resources\Pages\ListRecords;

class ListWorkflowInstances extends ListRecords
{
    protected static string $resource = WorkflowInstanceResource::class;

    protected function getHeaderActions(): array
    {
        return [
            // No create action — instances are created via WorkflowEngine
        ];
    }
}
