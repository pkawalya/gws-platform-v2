<?php

namespace App\Filament\Resources\Field\FieldSyncEvents\Pages;

use App\Filament\Resources\Field\FieldSyncEvents\FieldSyncEventResource;
use Filament\Resources\Pages\ListRecords;

class ListFieldSyncEvents extends ListRecords
{
    protected static string $resource = FieldSyncEventResource::class;

    protected function getHeaderActions(): array
    {
        return [
            // No CreateAction — sync events are system-generated
        ];
    }
}
