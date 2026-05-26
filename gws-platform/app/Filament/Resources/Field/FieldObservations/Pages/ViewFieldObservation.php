<?php

namespace App\Filament\Resources\Field\FieldObservations\Pages;

use App\Filament\Resources\Field\FieldObservations\FieldObservationResource;
use App\Models\FieldObservation;
use App\Services\FieldSyncService;
use Filament\Actions\Action;
use Filament\Notifications\Notification;
use Filament\Resources\Pages\ViewRecord;

class ViewFieldObservation extends ViewRecord
{
    protected static string $resource = FieldObservationResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Action::make('resolveConflict')
                ->label('Resolve Conflict')
                ->icon('heroicon-o-shield-check')
                ->color('danger')
                ->visible(fn () => $this->getRecord()->sync_status === 'conflict')
                ->form([
                    \Filament\Schemas\Components\Select::make('resolution')
                        ->label('Resolution Strategy')
                        ->options([
                            'server_wins' => 'Server Wins — Keep server version',
                            'client_wins' => 'Client Wins — Keep device version',
                            'merged' => 'Merged — Apply custom merged data',
                        ])
                        ->required()
                        ->live(),
                    \Filament\Schemas\Components\Textarea::make('merged_data_json')
                        ->label('Merged Data (JSON)')
                        ->placeholder('{"title": "Merged Title", "description": "Merged description"}')
                        ->visible(fn (callable $get) => $get('resolution') === 'merged')
                        ->required(fn (callable $get) => $get('resolution') === 'merged')
                        ->hint('Enter JSON with the observation fields to merge.'),
                ])
                ->action(function (array $data, FieldObservation $record) {
                    $mergedData = null;

                    if ($data['resolution'] === 'merged' && !empty($data['merged_data_json'])) {
                        $mergedData = json_decode($data['merged_data_json'], true);

                        if (json_last_error() !== JSON_ERROR_NONE) {
                            Notification::make()
                                ->title('Invalid JSON')
                                ->body('The merged data must be valid JSON.')
                                ->danger()
                                ->send();

                            return;
                        }
                    }

                    FieldSyncService::resolveConflict(
                        observation: $record,
                        resolution: $data['resolution'],
                        mergedData: $mergedData
                    );

                    Notification::make()
                        ->title('Conflict Resolved')
                        ->body('The observation conflict has been resolved using: ' . str_replace('_', ' ', $data['resolution']))
                        ->success()
                        ->send();

                    $this->refreshFormData([
                        'sync_status',
                        'conflict_resolution',
                        'synced_at',
                    ]);
                }),
        ];
    }
}
