<?php

namespace App\Filament\Resources\Ai\AiPromptTemplates\Pages;

use App\Filament\Resources\Ai\AiPromptTemplates\AiPromptTemplateResource;
use Filament\Actions\EditAction;
use Filament\Resources\Pages\ViewRecord;

class ViewAiPromptTemplate extends ViewRecord
{
    protected static string $resource = AiPromptTemplateResource::class;

    protected function getHeaderActions(): array
    {
        return [
            EditAction::make(),
        ];
    }
}
