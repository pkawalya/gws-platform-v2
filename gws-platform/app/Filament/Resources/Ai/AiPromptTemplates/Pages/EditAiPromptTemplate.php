<?php

namespace App\Filament\Resources\Ai\AiPromptTemplates\Pages;

use App\Filament\Resources\Ai\AiPromptTemplates\AiPromptTemplateResource;
use Filament\Actions\DeleteAction;
use Filament\Actions\ViewAction;
use Filament\Resources\Pages\EditRecord;

class EditAiPromptTemplate extends EditRecord
{
    protected static string $resource = AiPromptTemplateResource::class;

    protected function getHeaderActions(): array
    {
        return [
            ViewAction::make(),
            DeleteAction::make(),
        ];
    }
}
