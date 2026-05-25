<?php

namespace App\Filament\Resources\Ai\AiPromptTemplates\Pages;

use App\Filament\Resources\Ai\AiPromptTemplates\AiPromptTemplateResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListAiPromptTemplates extends ListRecords
{
    protected static string $resource = AiPromptTemplateResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
