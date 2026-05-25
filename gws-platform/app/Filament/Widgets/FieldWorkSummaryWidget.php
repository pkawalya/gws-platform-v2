<?php

namespace App\Filament\Widgets;

use App\Models\Client;
use App\Models\SurveyProject;
use Filament\Widgets\StatsOverviewWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

/**
 * FieldWorkSummaryWidget — Dashboard summary of field work activity.
 *
 * Shows active field projects, recent completions, and project status
 * breakdown for survey field operations.
 */
class FieldWorkSummaryWidget extends StatsOverviewWidget
{
    protected static ?string $heading = 'Field Work Summary';

    protected static ?int $sort = 15;

    protected function getStats(): array
    {
        $activeProjects = SurveyProject::whereIn('status', ['active', 'in_progress', 'surveying'])->count();
        $completedThisMonth = SurveyProject::where('status', 'completed')
            ->whereMonth('completion_date', now()->month)
            ->whereYear('completion_date', now()->year)
            ->count();
        $inquiryQueue = SurveyProject::where('status', 'inquiry')->count();

        $avgDaysToComplete = SurveyProject::where('status', 'completed')
            ->whereNotNull('start_date')
            ->whereNotNull('completion_date')
            ->where('completion_date', '>=', now()->subDays(90))
            ->get()
            ->avg(fn ($p) => $p->start_date->diffInDays($p->completion_date));

        $totalAreaSurveyed = SurveyProject::where('status', 'completed')
            ->whereMonth('completion_date', now()->month)
            ->whereYear('completion_date', now()->year)
            ->sum('area_hectares');

        return [
            Stat::make('Active Projects', $activeProjects)
                ->description($inquiryQueue . ' in inquiry queue')
                ->descriptionIcon('heroicon-m-map')
                ->color('primary')
                ->chart($this->getProjectTrend()),

            Stat::make('Completed This Month', $completedThisMonth)
                ->description(round($totalAreaSurveyed, 1) . ' hectares surveyed')
                ->descriptionIcon('heroicon-m-check-circle')
                ->color('success'),

            Stat::make('Avg Completion Time', round($avgDaysToComplete ?? 0) . ' days')
                ->description('Based on last 90 days')
                ->descriptionIcon('heroicon-m-clock')
                ->color($avgDaysToComplete > 30 ? 'warning' : 'success'),
        ];
    }

    /**
     * Get project completion trend for the last 7 days.
     */
    protected function getProjectTrend(): array
    {
        $trend = [];

        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i)->startOfDay();
            $count = SurveyProject::where('status', 'completed')
                ->whereDate('completion_date', $date)
                ->count();
            $trend[] = $count;
        }

        return $trend;
    }
}
