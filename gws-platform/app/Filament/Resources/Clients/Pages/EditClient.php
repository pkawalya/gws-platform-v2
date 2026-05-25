<?php

namespace App\Filament\Resources\Clients\Pages;

use App\Filament\Resources\Clients\ClientResource;
use Filament\Actions\ViewAction;
use Filament\Resources\Pages\EditRecord;

class EditClient extends EditRecord
{
    protected static string $resource = ClientResource::class;

    protected function getHeaderActions(): array
    {
        return [
            \Filament\Actions\Action::make('openWorkspace')
                ->label('Open Workspace')
                ->icon('heroicon-o-arrow-top-right-on-square')
                ->color('gray')
                ->url(fn () => ClientResource::getUrl('workspace', ['record' => $this->getRecord()])),
            ViewAction::make(),
        ];
    }
}
