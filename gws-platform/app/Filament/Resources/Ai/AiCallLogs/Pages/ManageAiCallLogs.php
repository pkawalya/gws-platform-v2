<?php

namespace App\Filament\Resources\Ai\AiCallLogs\Pages;

use App\Filament\Resources\Ai\AiCallLogs\AiCallLogResource;
use Filament\Resources\Pages\ListRecords;

class ManageAiCallLogs extends ListRecords
{
    protected static string $resource = AiCallLogResource::class;

    protected function getHeaderActions(): array
    {
        // No create action — read-only resource
        return [];
    }
}
