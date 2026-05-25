<?php

namespace App\Livewire\ClientWorkspace;

use App\Models\Client;
use App\Models\Communication;
use App\Services\EventStore;
use Filament\Notifications\Notification;
use Illuminate\Support\Facades\Auth;
use Livewire\Attributes\Computed;
use Livewire\Attributes\Locked;
use Livewire\Attributes\Validate;
use Livewire\Component;

/**
 * CommunicationHubBlock — Client Workspace communication tracking component.
 *
 * Provides a hub for recording and viewing client communications
 * across channels (note, sms, email, phone). Supports filtering
 * by channel and displays communication stats.
 */
class CommunicationHubBlock extends Component
{
    #[Locked]
    public int $clientId;

    #[Validate('required|string')]
    public string $newChannel = 'note';

    #[Validate('required|string')]
    public string $newDirection = 'outbound';

    #[Validate('nullable|string|max:255')]
    public ?string $newSubject = null;

    #[Validate('required|string')]
    public string $newBody = '';

    public string $filterChannel = 'all';

    /**
     * Get communications, optionally filtered by channel.
     */
    #[Computed]
    public function communications()
    {
        $query = Communication::where('client_id', $this->clientId)
            ->with(['client', 'surveyProject']);

        if ($this->filterChannel !== 'all') {
            $query->where('channel', $this->filterChannel);
        }

        return $query->orderByDesc('created_at')
            ->limit(50)
            ->get();
    }

    /**
     * Get channel counts for the filter bar.
     */
    #[Computed]
    public function channelCounts(): array
    {
        $counts = Communication::where('client_id', $this->clientId)
            ->selectRaw('channel, COUNT(*) as count')
            ->groupBy('channel')
            ->pluck('count', 'channel')
            ->toArray();

        $counts['all'] = array_sum($counts);

        return $counts;
    }

    /**
     * Get recent communication stats.
     */
    #[Computed]
    public function communicationStats(): array
    {
        $clientId = $this->clientId;

        $last7Days = Communication::where('client_id', $clientId)
            ->where('created_at', '>=', now()->subDays(7))
            ->count();

        $last30Days = Communication::where('client_id', $clientId)
            ->where('created_at', '>=', now()->subDays(30))
            ->count();

        $failedSms = Communication::where('client_id', $clientId)
            ->where('channel', 'sms')
            ->where('status', 'failed')
            ->count();

        $lastCommunication = Communication::where('client_id', $clientId)
            ->latest()
            ->first();

        return [
            'last_7_days' => $last7Days,
            'last_30_days' => $last30Days,
            'failed_sms' => $failedSms,
            'last_communication_at' => $lastCommunication?->created_at?->diffForHumans(),
            'last_channel' => $lastCommunication?->channelLabel(),
        ];
    }

    /**
     * Send a new communication / add a note.
     */
    public function sendCommunication(): void
    {
        $this->validate();

        $client = Client::find($this->clientId);

        $communication = Communication::create([
            'client_id' => $this->clientId,
            'channel' => $this->newChannel,
            'direction' => $this->newDirection,
            'subject' => $this->newSubject,
            'body' => $this->newBody,
            'status' => $this->newChannel === 'note' ? 'sent' : 'draft',
            'sender_type' => get_class(Auth::user()),
            'sender_id' => Auth::id(),
            'recipient_phone' => $client?->phone,
            'recipient_email' => $client?->email,
            'sent_at' => now(),
            'organization_id' => $client?->organization_id,
            'branch_id' => $client?->branch_id,
        ]);

        // TODO: If channel is 'sms', dispatch SMS job (reuse MzoStageChanged pattern)
        // TODO: If channel is 'email', dispatch email notification

        EventStore::record(
            'communication.created',
            $client,
            [
                'communication_id' => $communication->id,
                'channel' => $communication->channel,
                'direction' => $communication->direction,
                'subject' => $communication->subject,
            ],
            causer: Auth::user()
        );

        activity()
            ->performedOn($communication)
            ->causedBy(Auth::user())
            ->withProperties([
                'channel' => $communication->channel,
                'direction' => $communication->direction,
            ])
            ->log("{$communication->channelLabel()} recorded for client");

        // Reset form
        $this->reset(['newChannel', 'newDirection', 'newSubject', 'newBody']);
        $this->newChannel = 'note';
        $this->newDirection = 'outbound';

        unset($this->communications, $this->channelCounts, $this->communicationStats);

        Notification::make()
            ->title('Communication Recorded')
            ->success()
            ->body("{$communication->channelLabel()} has been recorded.")
            ->send();
    }

    public function updatedFilterChannel(): void
    {
        unset($this->communications);
    }

    public function render()
    {
        return view('livewire.client-workspace.communication-hub-block');
    }
}
