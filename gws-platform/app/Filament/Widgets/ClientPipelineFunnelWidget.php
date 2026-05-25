<?php

namespace App\Filament\Widgets;

use App\Models\Client;
use App\Models\ClientProjectProgress;
use Filament\Widgets\ChartWidget;

/**
 * ClientPipelineFunnelWidget — Shows client pipeline by lifecycle stage.
 *
 * Displays a bar chart showing the number of clients at each lifecycle
 * stage: prospect, active, dormant, suspended, closed.
 */
class ClientPipelineFunnelWidget extends ChartWidget
{
    protected static ?string $heading = 'Client Pipeline';

    protected static ?int $sort = 10;

    protected int | string | array $columnSpan = 'full';

    protected static ?string $maxHeight = '250px';

    protected function getData(): array
    {
        $stages = ['prospect', 'active', 'dormant', 'suspended', 'closed'];

        $counts = collect($stages)->map(function ($stage) {
            return Client::where('lifecycle_state', $stage)->count();
        })->toArray();

        $colors = [
            'rgba(59, 130, 246, 0.8)',   // blue - prospect
            'rgba(34, 197, 94, 0.8)',     // green - active
            'rgba(156, 163, 175, 0.8)',   // gray - dormant
            'rgba(239, 68, 68, 0.8)',     // red - suspended
            'rgba(107, 114, 128, 0.8)',   // dark gray - closed
        ];

        $borderColors = [
            'rgba(59, 130, 246, 1)',
            'rgba(34, 197, 94, 1)',
            'rgba(156, 163, 175, 1)',
            'rgba(239, 68, 68, 1)',
            'rgba(107, 114, 128, 1)',
        ];

        return [
            'datasets' => [
                [
                    'label' => 'Clients',
                    'data' => $counts,
                    'backgroundColor' => $colors,
                    'borderColor' => $borderColors,
                    'borderWidth' => 1,
                    'borderRadius' => 6,
                ],
            ],
            'labels' => collect($stages)->map(fn ($s) => ucfirst($s))->toArray(),
        ];
    }

    protected function getType(): string
    {
        return 'bar';
    }

    protected function getOptions(): array
    {
        return [
            'plugins' => [
                'legend' => [
                    'display' => false,
                ],
            ],
            'scales' => [
                'y' => [
                    'beginAtZero' => true,
                    'ticks' => [
                        'stepSize' => 1,
                    ],
                ],
            ],
        ];
    }
}
