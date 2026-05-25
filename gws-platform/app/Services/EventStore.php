<?php

namespace App\Services;

use App\Models\DomainEvent;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

/**
 * EventStore — Central service for recording and querying domain events.
 *
 * This is the ONLY entry point for creating DomainEvent records.
 * It automatically enriches events with request metadata (IP, user agent,
 * correlation ID, etc.) before persisting them.
 *
 * Usage:
 *   EventStore::record(
 *       'approval.step_deferred',
 *       $client,
 *       ['step' => 'DLB', 'reason' => 'Missing affidavit'],
 *       causer: Auth::user()
 *   );
 *
 *   $timeline = EventStore::timeline('Client', 42);
 *   $events   = EventStore::replay('Client', 42, since: Carbon::parse('2026-01-01'));
 */
class EventStore
{
    /**
     * Record a new domain event with full request metadata.
     *
     * Automatically captures:
     *  - ip_address:    from the current HTTP request
     *  - user_agent:    browser/client identifier
     *  - request_id:    unique UUID for request tracing
     *  - auth_user_id:  currently authenticated user
     *  - channel:       web | api | cli | queue
     *
     * @param  string  $eventType  Dot-notation event type (e.g. 'client.workspace_viewed')
     * @param  Model  $aggregate  The model this event belongs to
     * @param  array  $payload  Event-specific data
     * @param  array  $metadata  Additional metadata to merge (optional)
     * @param  Model|null  $causer  Who/what triggered this event
     */
    public static function record(
        string $eventType,
        Model $aggregate,
        array $payload,
        array $metadata = [],
        ?Model $causer = null
    ): DomainEvent {
        $enrichedMetadata = array_merge(self::buildMetadata(), $metadata);

        return DomainEvent::create([
            'event_type' => $eventType,
            'aggregate_type' => class_basename($aggregate),
            'aggregate_id' => $aggregate->getKey(),
            'payload' => $payload,
            'metadata' => $enrichedMetadata,
            'causer_type' => $causer ? get_class($causer) : null,
            'causer_id' => $causer?->getKey(),
            'occurred_at' => now(),
            'recorded_at' => now(),
        ]);
    }

    /**
     * Replay events for an aggregate in chronological order.
     *
     * Returns all events for the given aggregate, ordered by occurred_at ASC.
     * Optionally filter events since a given timestamp.
     *
     * @return Collection<DomainEvent>
     */
    public static function replay(
        string $aggregateType,
        int $aggregateId,
        ?Carbon $since = null
    ): Collection {
        $query = DomainEvent::forAggregate($aggregateType, $aggregateId)
            ->orderBy('occurred_at', 'asc');

        if ($since) {
            $query->where('occurred_at', '>=', $since);
        }

        return $query->get();
    }

    /**
     * Get a timeline of events for UI rendering.
     *
     * Returns events in reverse chronological order (most recent first),
     * suitable for displaying in the ClientWorkspace timeline.
     *
     * @return Collection<DomainEvent>
     */
    public static function timeline(
        string $aggregateType,
        int $aggregateId,
        int $limit = 50
    ): Collection {
        return DomainEvent::forAggregate($aggregateType, $aggregateId)
            ->orderBy('occurred_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Build automatic metadata from the current request context.
     *
     * Safely handles CLI and queue contexts where no HTTP request exists.
     */
    protected static function buildMetadata(): array
    {
        $channel = 'cli';

        if (app()->runningInConsole() && ! app()->runningUnitTests()) {
            $channel = 'cli';
        } elseif (app()->runningUnitTests()) {
            $channel = 'testing';
        } else {
            $channel = request()->isApi() ? 'api' : 'web';
        }

        // Check if running in a queue worker
        if (app()->runningInConsole() && app()->environment() !== 'testing') {
            if (str_contains(request()->server('argv')[1] ?? '', 'queue:work')) {
                $channel = 'queue';
            }
        }

        return [
            'ip_address' => request()->ip() ?? '127.0.0.1',
            'user_agent' => request()->userAgent() ?? 'CLI',
            'request_id' => (string) Str::uuid(),
            'auth_user_id' => Auth::id(),
            'channel' => $channel,
        ];
    }
}
