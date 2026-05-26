<?php

namespace App\Filament\Resources\Field\FieldObservations\Pages;

use App\Filament\Resources\Field\FieldObservations\FieldObservationResource;
use Filament\Resources\Pages\ListRecords;

class ListFieldObservations extends ListRecords
{
    protected static string $resource = FieldObservationResource::class;

    protected function getHeaderActions(): array
    {
        return [
            // No CreateAction — observations come from the field API only
        ];
    }
}
