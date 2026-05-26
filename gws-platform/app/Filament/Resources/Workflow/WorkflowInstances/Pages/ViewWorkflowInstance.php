<?php

namespace App\Filament\Resources\Workflow\WorkflowInstances\Pages;

use App\Filament\Resources\Workflow\WorkflowInstances\WorkflowInstanceResource;
use App\Services\WorkflowEngine;
use Filament\Actions\Action;
use Filament\Notifications\Notification;
use Filament\Resources\Pages\ViewRecord;

class ViewWorkflowInstance extends ViewRecord
{
    protected static string $resource = WorkflowInstanceResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Action::make('viewTimeline')
                ->label('View Timeline')
                ->icon('heroicon-o-clock')
                ->color('info')
                ->slideOver()
                ->modalHeading('Transition Timeline')
                ->modalDescription(fn () => "Full history for workflow instance #{$this->getRecord()->id}")
                ->modalContent(fn () => view('filament.resources.workflow.timeline-slideover', [
                    'transitions' => WorkflowEngine::replayHistory($this->getRecord()),
                ]))
                ->modalSubmitActionLabel('Close')
                ->modalCancelAction(false),

            Action::make('cancel')
                ->label('Cancel Workflow')
                ->icon('heroicon-o-x-circle')
                ->color('danger')
                ->requiresConfirmation()
                ->modalHeading('Cancel Workflow')
                ->modalDescription('Are you sure you want to cancel this workflow? This action cannot be undone.')
                ->modalSubmitActionLabel('Cancel Workflow')
                ->visible(fn () => in_array($this->getRecord()->status, ['pending', 'active', 'suspended']))
                ->form([
                    \Filament\Forms\Components\Textarea::make('cancellation_reason')
                        ->label('Reason for Cancellation')
                        ->required()
                        ->rows(3),
                ])
                ->action(function (array $data) {
                    WorkflowEngine::cancel($this->getRecord(), $data['cancellation_reason']);

                    Notification::make()
                        ->title('Workflow Cancelled')
                        ->danger()
                        ->send();

                    $this->refreshFormData(['status', 'cancelled_at', 'cancellation_reason']);
                }),

            Action::make('suspend')
                ->label('Suspend')
                ->icon('heroicon-o-pause-circle')
                ->color('warning')
                ->requiresConfirmation()
                ->visible(fn () => in_array($this->getRecord()->status, ['pending', 'active']))
                ->action(function () {
                    WorkflowEngine::suspend($this->getRecord());

                    Notification::make()
                        ->title('Workflow Suspended')
                        ->warning()
                        ->send();

                    $this->refreshFormData(['status']);
                }),

            Action::make('resume')
                ->label('Resume')
                ->icon('heroicon-o-play-circle')
                ->color('success')
                ->requiresConfirmation()
                ->visible(fn () => $this->getRecord()->status === 'suspended')
                ->action(function () {
                    WorkflowEngine::resume($this->getRecord());

                    Notification::make()
                        ->title('Workflow Resumed')
                        ->success()
                        ->send();

                    $this->refreshFormData(['status']);
                }),
        ];
    }
}
