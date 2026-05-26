<?php

namespace App\Filament\Resources\Field\FieldSyncEvents\Pages;

use App\Filament\Resources\Field\FieldSyncEvents\FieldSyncEventResource;
use Filament\Resources\Pages\ViewRecord;

class ViewFieldSyncEvent extends ViewRecord
{
    protected static string $resource = FieldSyncEventResource::class;

    protected function getHeaderActions(): array
    {
        return [
            // No EditAction — sync events are immutable audit records
        ];
    }
}
