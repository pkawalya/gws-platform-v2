<?php

namespace App\Filament\Resources\Ai\AiCallLogs;

use App\Filament\Resources\Ai\AiCallLogs\Pages\ManageAiCallLogs;
use App\Models\AiCallLog;
use BackedEnum;
use Filament\Actions\Action;
use Filament\Actions\ViewAction;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

/**
 * AiCallLogResource — Read-only Filament resource for viewing AI call logs.
 *
 * Access: admin, manager roles only.
 * No create, edit, or delete operations are permitted — this resource
 * enforces the append-only audit trail guarantee of the ai_call_logs table.
 * The only mutable operation is recording human feedback via a dedicated action.
 */
class AiCallLogResource extends Resource
{
    protected static ?string $model = AiCallLog::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedCpuChip;

    protected static string|\UnitEnum|null $navigationGroup = 'AI Studio';

    protected static ?string $navigationLabel = 'AI Call Logs';

    protected static ?int $navigationSort = 20;

    // ──────────────────────────────────────────────
    // Disable all write operations
    // ──────────────────────────────────────────────

    public static function canCreate(): bool
    {
        return false;
    }

    public static function canEdit($record): bool
    {
        return false;
    }

    public static function canDelete($record): bool
    {
        return false;
    }

    // ──────────────────────────────────────────────
    // Schemas (minimal — read-only resource)
    // ──────────────────────────────────────────────

    public static function form(Schema $schema): Schema
    {
        return $schema->components([]);
    }

    public static function infolist(Schema $schema): Schema
    {
        return $schema
            ->components([
                \Filament\Schemas\Components\Section::make('Call Overview')
                    ->schema([
                        \Filament\Schemas\Components\Group::make([
                            \Filament\Infolists\Components\TextEntry::make('id')
                                ->label('Log ID')
                                ->badge(),
                            \Filament\Infolists\Components\TextEntry::make('status')
                                ->badge()
                                ->color(fn (string $state): string => match ($state) {
                                    'success' => 'success',
                                    'failed' => 'danger',
                                    'timeout' => 'warning',
                                    'rate_limited' => 'gray',
                                    default => 'gray',
                                }),
                            \Filament\Infolists\Components\TextEntry::make('context_type')
                                ->label('Context Type')
                                ->placeholder('—'),
                            \Filament\Infolists\Components\TextEntry::make('context_id')
                                ->label('Context ID')
                                ->placeholder('—'),
                        ])->columns(4),
                        \Filament\Schemas\Components\Group::make([
                            \Filament\Infolists\Components\TextEntry::make('promptTemplate.key')
                                ->label('Prompt Key')
                                ->badge()
                                ->color('info')
                                ->placeholder('Ad-hoc'),
                            \Filament\Infolists\Components\TextEntry::make('aiModelVersion.model_name')
                                ->label('Model')
                                ->placeholder('—'),
                            \Filament\Infolists\Components\TextEntry::make('created_at')
                                ->label('Created At')
                                ->dateTime(),
                        ])->columns(3),
                    ]),
                \Filament\Schemas\Components\Section::make('Performance & Cost')
                    ->schema([
                        \Filament\Schemas\Components\Group::make([
                            \Filament\Infolists\Components\TextEntry::make('input_tokens')
                                ->label('Input Tokens')
                                ->numeric()
                                ->placeholder('—'),
                            \Filament\Infolists\Components\TextEntry::make('output_tokens')
                                ->label('Output Tokens')
                                ->numeric()
                                ->placeholder('—'),
                            \Filament\Infolists\Components\TextEntry::make('cost_usd')
                                ->label('Cost (USD)')
                                ->money('USD')
                                ->placeholder('—'),
                            \Filament\Infolists\Components\TextEntry::make('latency_ms')
                                ->label('Latency')
                                ->formatStateUsing(fn ($state): string => $state ? number_format($state) . ' ms' : '—'),
                        ])->columns(4),
                    ]),
                \Filament\Schemas\Components\Section::make('Input Prompt')
                    ->schema([
                        \Filament\Infolists\Components\TextEntry::make('input_prompt')
                            ->label('')
                            ->copyable()
                            ->columnSpanFull(),
                    ])
                    ->collapsible(),
                \Filament\Schemas\Components\Section::make('Output Response')
                    ->schema([
                        \Filament\Infolists\Components\TextEntry::make('output_response')
                            ->label('')
                            ->copyable()
                            ->columnSpanFull(),
                    ])
                    ->collapsible(),
                \Filament\Schemas\Components\Section::make('Error')
                    ->schema([
                        \Filament\Infolists\Components\TextEntry::make('error_message')
                            ->label('')
                            ->copyable()
                            ->color('danger')
                            ->columnSpanFull(),
                    ])
                    ->visible(fn (AiCallLog $record): bool => filled($record->error_message))
                    ->collapsed(),
                \Filament\Schemas\Components\Section::make('Human Feedback')
                    ->schema([
                        \Filament\Schemas\Components\Group::make([
                            \Filament\Infolists\Components\TextEntry::make('human_feedback')
                                ->label('Feedback')
                                ->badge()
                                ->color(fn (?string $state): string => match ($state) {
                                    'accepted' => 'success',
                                    'rejected' => 'danger',
                                    'ignored' => 'gray',
                                    default => 'gray',
                                })
                                ->placeholder('Not reviewed'),
                            \Filament\Infolists\Components\TextEntry::make('feedback_notes')
                                ->label('Notes')
                                ->placeholder('No notes')
                                ->columnSpan(3),
                        ])->columns(4),
                    ]),
            ]);
    }

    // ──────────────────────────────────────────────
    // Table Configuration
    // ──────────────────────────────────────────────

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('created_at', 'desc')
            ->columns([
                TextColumn::make('context')
                    ->label('Context')
                    ->getStateUsing(fn (AiCallLog $record): string => $record->context_type
                        ? "{$record->context_type} #{$record->context_id}"
                        : '—'
                    )
                    ->searchable(query: function ($query, $search) {
                        $query->where('context_type', 'like', "%{$search}%")
                              ->orWhere('context_id', 'like', "%{$search}%");
                    })
                    ->sortable(['context_type', 'context_id']),

                TextColumn::make('promptTemplate.key')
                    ->label('Prompt Key')
                    ->badge()
                    ->color('info')
                    ->sortable()
                    ->searchable()
                    ->placeholder('Ad-hoc'),

                TextColumn::make('aiModelVersion.model_name')
                    ->label('Model')
                    ->sortable()
                    ->searchable()
                    ->limit(30),

                TextColumn::make('status')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'success' => 'success',
                        'failed' => 'danger',
                        'timeout' => 'warning',
                        'rate_limited' => 'gray',
                        default => 'gray',
                    })
                    ->sortable()
                    ->searchable(),

                TextColumn::make('input_tokens')
                    ->label('In Tokens')
                    ->numeric(thousandsSeparator: true)
                    ->sortable()
                    ->alignEnd(),

                TextColumn::make('output_tokens')
                    ->label('Out Tokens')
                    ->numeric(thousandsSeparator: true)
                    ->sortable()
                    ->alignEnd(),

                TextColumn::make('cost_usd')
                    ->label('Cost (USD)')
                    ->money('USD')
                    ->sortable()
                    ->alignEnd(),

                TextColumn::make('latency_ms')
                    ->label('Latency')
                    ->formatStateUsing(fn ($state): string => $state ? number_format($state) . ' ms' : '—')
                    ->sortable()
                    ->alignEnd(),

                TextColumn::make('human_feedback')
                    ->label('Feedback')
                    ->badge()
                    ->color(fn (?string $state): string => match ($state) {
                        'accepted' => 'success',
                        'rejected' => 'danger',
                        'ignored' => 'gray',
                        default => 'gray',
                    })
                    ->sortable()
                    ->placeholder('—'),

                TextColumn::make('created_at')
                    ->label('Created')
                    ->dateTime('M j, Y H:i')
                    ->sortable()
                    ->since(),
            ])
            ->filters([
                SelectFilter::make('status')
                    ->options([
                        'success' => 'Success',
                        'failed' => 'Failed',
                        'timeout' => 'Timeout',
                        'rate_limited' => 'Rate Limited',
                    ])
                    ->multiple(),

                SelectFilter::make('human_feedback')
                    ->options([
                        'accepted' => 'Accepted',
                        'rejected' => 'Rejected',
                        'ignored' => 'Ignored',
                    ])
                    ->multiple(),
            ])
            ->recordActions([
                ViewAction::make(),
                Action::make('recordFeedback')
                    ->label('Feedback')
                    ->icon('heroicon-o-hand-thumb-up')
                    ->visible(fn (AiCallLog $record): bool => blank($record->human_feedback))
                    ->form([
                        Select::make('human_feedback')
                            ->label('Feedback')
                            ->options([
                                'accepted' => 'Accepted',
                                'rejected' => 'Rejected',
                                'ignored' => 'Ignored',
                            ])
                            ->required()
                            ->native(false),
                        Textarea::make('feedback_notes')
                            ->label('Notes')
                            ->rows(3)
                            ->maxLength(1000),
                    ])
                    ->action(function (AiCallLog $record, array $data): void {
                        $record->update([
                            'human_feedback' => $data['human_feedback'],
                            'feedback_notes' => $data['feedback_notes'] ?? null,
                        ]);

                        Notification::make()
                            ->title('Feedback recorded')
                            ->success()
                            ->send();
                    })
                    ->modalHeading('Record Human Feedback')
                    ->modalSubmitActionLabel('Save Feedback'),
            ])
            ->toolbarActions([]);
    }

    public static function getPages(): array
    {
        return [
            'index' => ManageAiCallLogs::route('/'),
        ];
    }
}
