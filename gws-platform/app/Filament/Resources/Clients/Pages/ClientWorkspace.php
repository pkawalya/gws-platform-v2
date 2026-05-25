<?php

namespace App\Filament\Resources\Clients\Pages;

use App\Filament\Resources\Clients\ClientResource;
use App\Models\Client;
use App\Services\EventStore;
use App\Traits\PrefillsContextFromUrl;
use Filament\Resources\Pages\Page;
use Illuminate\Support\Facades\Auth;

class ClientWorkspace extends Page
{
    protected static string $resource = ClientResource::class;

    protected string $view = 'filament.pages.client-workspace';

    protected static ?string $navigationLabel = 'Client Workspace';

    public ?Client $client = null;

    public string $activeBlock = 'approvals';

    use PrefillsContextFromUrl;

    public function mount(int|string $record): void
    {
        $this->client = Client::findOrFail($record);
        $this->authorizeAccess();

        // Deep-link: support ?block=approvals|financial|documents|communications|spatial|ai
        $this->activeBlock = $this->prefillFromUrl(
            'block',
            ['approvals', 'financial', 'documents', 'communications', 'spatial', 'ai'],
            'approvals'
        );

        // Record domain event
        EventStore::record(
            'client.workspace_viewed',
            $this->client,
            ['active_block' => $this->activeBlock, 'user_role' => Auth::user()?->roles->first()?->name],
            causer: Auth::user()
        );
    }

    public function getTitle(): string
    {
        return $this->client?->full_name . ' — Workspace';
    }

    protected function authorizeAccess(): void
    {
        // User must have view_clients permission
        if (! Auth::user()?->can('view_clients')) {
            abort(403, 'You do not have permission to view this client workspace.');
        }
    }
}
