<?php

namespace App\Filament\Resources\Ai\AiPromptTemplates;

use App\Filament\Resources\Ai\AiPromptTemplates\Pages\CreateAiPromptTemplate;
use App\Filament\Resources\Ai\AiPromptTemplates\Pages\EditAiPromptTemplate;
use App\Filament\Resources\Ai\AiPromptTemplates\Pages\ListAiPromptTemplates;
use App\Filament\Resources\Ai\AiPromptTemplates\Pages\ViewAiPromptTemplate;
use App\Filament\Resources\Ai\AiPromptTemplates\Schemas\AiPromptTemplateForm;
use App\Filament\Resources\Ai\AiPromptTemplates\Schemas\AiPromptTemplateInfolist;
use App\Filament\Resources\Ai\AiPromptTemplates\Tables\AiPromptTemplatesTable;
use App\Models\AiPromptTemplate;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class AiPromptTemplateResource extends Resource
{
    protected static ?string $model = AiPromptTemplate::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedDocumentText;

    protected static string|\UnitEnum|null $navigationGroup = 'AI Studio';

    protected static ?string $navigationLabel = 'Prompt Templates';

    protected static ?int $navigationSort = 10;

    public static function form(Schema $schema): Schema
    {
        return AiPromptTemplateForm::configure($schema);
    }

    public static function infolist(Schema $schema): Schema
    {
        return AiPromptTemplateInfolist::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return AiPromptTemplatesTable::configure($table);
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => ListAiPromptTemplates::route('/'),
            'create' => CreateAiPromptTemplate::route('/create'),
            'view' => ViewAiPromptTemplate::route('/{record}'),
            'edit' => EditAiPromptTemplate::route('/{record}/edit'),
        ];
    }
}
