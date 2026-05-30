<?php

namespace App\Filament\Resources\Clients\Pages;

use App\Filament\Resources\Clients\ClientResource;
use Filament\Actions\Action;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListClients extends ListRecords
{
    protected static string $resource = ClientResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Action::make('export')
                ->label('Export CSV')
                ->icon('heroicon-o-arrow-down-tray')
                ->color('gray')
                ->action(function () {
                    $clients = \App\Models\Client::with(['branch', 'organization'])
                        ->orderBy('created_at', 'desc')
                        ->get();

                    $csv = "Client Number,Full Name,Email,Phone,NIN,District,LC1 Area,Lifecycle State,KYC Verified,Created At\n";
                    foreach ($clients as $client) {
                        $csv .= sprintf(
                            "%s,%s,%s,%s,%s,%s,%s,%s,%s,%s\n",
                            $client->client_number,
                            $client->full_name,
                            $client->email ?? '',
                            $client->phone ?? '',
                            $client->nin ?? '',
                            $client->district ?? '',
                            $client->lc1_area ?? '',
                            $client->lifecycle_state,
                            $client->kyc_verified ? 'Yes' : 'No',
                            $client->created_at?->format('Y-m-d') ?? ''
                        );
                    }

                    return response()->streamDownload(function () use ($csv) {
                        echo $csv;
                    }, 'clients-export-' . now()->format('Y-m-d') . '.csv', [
                        'Content-Type' => 'text/csv',
                    ]);
                }),
            CreateAction::make()
                ->label('New Client')
                ->icon('heroicon-o-plus'),
        ];
    }
}
