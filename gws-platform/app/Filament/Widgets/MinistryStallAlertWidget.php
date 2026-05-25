<?php

namespace App\Filament\Widgets;

use App\Models\ApprovalStep;
use App\Models\ClientProjectProgress;
use Filament\Widgets\StatsOverviewWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

/**
 * MinistryStallAlertWidget — Dashboard alert for stalled approval steps.
 *
 * Shows the count of approval steps that have been idle for more than
 * 7 days, along with a breakdown by institution. Provides a direct
 * link to the most stalled clients.
 */
class MinistryStallAlertWidget extends StatsOverviewWidget
{
    protected static ?string $heading = 'Approval Bottleneck Alerts';

    protected static ?int $sort = 5;

    protected function getStats(): array
    {
        $stalledSteps = ApprovalStep::stalled()->with('clientProjectProgress.client')->get();

        $totalStalled = $stalledSteps->count();

        $byInstitution = $stalledSteps->groupBy('institution')
            ->map(fn ($items) => $items->count())
            ->sortDesc()
            ->toArray();

        $uniqueClients = $stalledSteps->pluck('clientProjectProgress.client_id')
            ->unique()
            ->count();

        $avgDaysStalled = $stalledSteps->avg('days_since_submission') ?? 0;

        // Build institution breakdown string
        $institutionBreakdown = collect($byInstitution)
            ->map(fn ($count, $inst) => strtoupper($inst) . ': ' . $count)
            ->take(4)
            ->implode(', ');

        return [
            Stat::make('Stalled Approvals', $totalStalled)
                ->description($uniqueClients . ' client(s) affected')
                ->descriptionIcon('heroicon-m-clock')
                ->color($totalStalled > 0 ? 'danger' : 'success')
                ->chart($this->getStalledTrend()),

            Stat::make('Avg Days Idle', round($avgDaysStalled, 1) . 'd')
                ->description('Threshold: 7 days')
                ->descriptionIcon('heroicon-m-exclamation-triangle')
                ->color($avgDaysStalled > 14 ? 'danger' : ($avgDaysStalled > 7 ? 'warning' : 'success')),

            Stat::make('By Institution', $institutionBreakdown ?: 'None')
                ->description($stalledSteps->count() > 0 ? 'Top stalled institutions' : 'All clear')
                ->descriptionIcon('heroicon-m-building-office')
                ->color('warning'),
        ];
    }

    /**
     * Get stalled step trend data for the last 7 days.
     */
    protected function getStalledTrend(): array
    {
        $trend = [];

        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i)->startOfDay();
            $nextDate = $date->copy()->addDay();

            $count = ApprovalStep::where('status', 'submitted')
                ->where('submitted_at', '<', $date)
                ->where(function ($query) use ($date, $nextDate) {
                    $query->whereNull('approved_at')
                        ->orWhere('approved_at', '>=', $date);
                })
                ->count();

            $trend[] = $count;
        }

        return $trend;
    }
}
