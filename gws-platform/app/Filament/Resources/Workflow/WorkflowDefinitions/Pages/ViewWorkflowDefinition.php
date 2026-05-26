<?php

namespace App\Filament\Resources\Workflow\WorkflowDefinitions\Pages;

use App\Filament\Resources\Workflow\WorkflowDefinitions\WorkflowDefinitionResource;
use App\Models\WorkflowDefinition;
use Filament\Actions\EditAction;
use Filament\Actions\Action;
use Filament\Notifications\Notification;
use Filament\Resources\Pages\ViewRecord;

class ViewWorkflowDefinition extends ViewRecord
{
    protected static string $resource = WorkflowDefinitionResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Action::make('createNewVersion')
                ->label('Create New Version')
                ->icon('heroicon-o-arrow-path')
                ->color('warning')
                ->requiresConfirmation()
                ->modalHeading('Create New Version')
                ->modalDescription('This will create a new version of this workflow definition with all current steps duplicated. The current version will be deactivated.')
                ->modalSubmitActionLabel('Create Version')
                ->visible(fn () => $this->getRecord()->is_active)
                ->action(function () {
                    $newVersion = $this->getRecord()->createNewVersion();

                    Notification::make()
                        ->title('New Version Created')
                        ->success()
                        ->body("Version {$newVersion->version} has been created. The previous version has been deactivated.")
                        ->send();

                    $this->redirect(WorkflowDefinitionResource::getUrl('view', ['record' => $newVersion]));
                }),
            EditAction::make(),
        ];
    }
}
