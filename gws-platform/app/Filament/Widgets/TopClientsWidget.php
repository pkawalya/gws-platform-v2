<?php

namespace App\Filament\Widgets;

use App\Models\Client;
use App\Models\Invoice;
use Filament\Widgets\StatsOverviewWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

/**
 * TopClientsWidget — Dashboard overview of top clients by revenue.
 *
 * Shows the top revenue-generating clients, total client count,
 * and key financial metrics.
 */
class TopClientsWidget extends StatsOverviewWidget
{
    protected static ?string $heading = 'Top Clients';

    protected static ?int $sort = 2;

    protected function getStats(): array
    {
        $totalClients = Client::count();
        $activeClients = Client::active()->count();
        $newThisMonth = Client::whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();

        $totalRevenue = Invoice::where('status', 'paid')->sum('amount_paid');
        $outstandingRevenue = Invoice::whereNotIn('status', ['paid', 'cancelled', 'draft'])
            ->sum('amount_due');

        $topClient = Client::withSum(['invoices' => function ($query) {
            $query->where('status', 'paid');
        }], 'amount_paid')
            ->orderByDesc('invoices_sum_amount_paid')
            ->first();

        return [
            Stat::make('Total Clients', $totalClients)
                ->description($activeClients . ' active, ' . $newThisMonth . ' new this month')
                ->descriptionIcon('heroicon-m-user-group')
                ->color('primary')
                ->chart($this->getClientGrowthTrend()),

            Stat::make('Revenue Collected', 'UGX ' . number_format($totalRevenue))
                ->description('UGX ' . number_format($outstandingRevenue) . ' outstanding')
                ->descriptionIcon('heroicon-m-banknotes')
                ->color('success'),

            Stat::make('Top Client', $topClient?->full_name ?? 'N/A')
                ->description($topClient ? 'UGX ' . number_format($topClient->invoices_sum_amount_paid ?? 0) . ' collected' : 'No data')
                ->descriptionIcon('heroicon-m-trophy')
                ->color('warning'),
        ];
    }

    /**
     * Get client growth trend for the last 7 days.
     */
    protected function getClientGrowthTrend(): array
    {
        $trend = [];

        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i)->startOfDay();
            $count = Client::whereDate('created_at', $date)->count();
            $trend[] = $count;
        }

        return $trend;
    }
}
