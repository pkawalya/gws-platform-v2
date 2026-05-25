<?php

namespace Tests\Feature\EventStore;

use App\Exceptions\DomainEventMutationException;
use App\Models\DomainEvent;
use App\Models\User;
use App\Services\EventStore;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DomainEventTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that a domain event is recorded with the correct aggregate
     * reference, payload, causer, and timestamps.
     */
    public function test_event_is_recorded_with_correct_aggregate_and_payload(): void
    {
        $user = User::factory()->create([
            'name' => 'Ada Lovelace',
            'email' => 'ada@example.com',
        ]);

        $event = EventStore::record(
            eventType: 'user.login',
            aggregate: $user,
            payload: ['ip' => '192.168.1.1', 'device' => 'mobile'],
            causer: $user
        );

        // Verify the persisted record matches expectations
        $this->assertDatabaseHas('domain_events', [
            'id' => $event->id,
            'event_type' => 'user.login',
            'aggregate_type' => 'User',
            'aggregate_id' => $user->id,
            'causer_type' => get_class($user),
            'causer_id' => $user->id,
        ]);

        // Verify the payload was stored correctly
        $this->assertEquals(['ip' => '192.168.1.1', 'device' => 'mobile'], $event->payload);

        // Verify metadata was enriched by EventStore
        $this->assertIsArray($event->metadata);
        $this->assertArrayHasKey('channel', $event->metadata);
        $this->assertArrayHasKey('request_id', $event->metadata);

        // Verify timestamps are set
        $this->assertNotNull($event->occurred_at);
        $this->assertNotNull($event->recorded_at);
    }

    /**
     * Test that a domain event cannot be updated after it has been persisted.
     * Domain events are immutable facts — the append-only invariant must hold.
     */
    public function test_domain_event_cannot_be_updated(): void
    {
        $user = User::factory()->create();

        $event = EventStore::record(
            eventType: 'user.profile_viewed',
            aggregate: $user,
            payload: ['section' => 'settings']
        );

        $this->expectException(DomainEventMutationException::class);

        $event->update(['payload' => ['section' => 'tampered']]);
    }

    /**
     * Test that a domain event cannot be deleted.
     * Deletion would break the event-sourcing replay capability.
     */
    public function test_domain_event_cannot_be_deleted(): void
    {
        $user = User::factory()->create();

        $event = EventStore::record(
            eventType: 'user.logout',
            aggregate: $user,
            payload: ['session_duration' => 3600]
        );

        $this->expectException(DomainEventMutationException::class);

        $event->delete();
    }

    /**
     * Test that EventStore::replay() returns events in chronological order
     * (oldest first), which is essential for correct state reconstruction.
     */
    public function test_replay_returns_events_in_chronological_order(): void
    {
        $user = User::factory()->create();

        // Create events at different absolute points in time
        // Using Carbon::parse() to avoid compounding relative offsets
        // that occur when travelTo() shifts the frozen clock.
        $this->travelTo(Carbon::parse('2026-06-01 10:00:00'));
        EventStore::record('user.step_one', $user, ['step' => 1]);

        $this->travelTo(Carbon::parse('2026-06-01 11:00:00'));
        EventStore::record('user.step_two', $user, ['step' => 2]);

        $this->travelTo(Carbon::parse('2026-06-01 12:00:00'));
        EventStore::record('user.step_three', $user, ['step' => 3]);

        $events = EventStore::replay('User', $user->id);

        $this->assertCount(3, $events);

        // Verify chronological order — oldest first
        $this->assertEquals('user.step_one', $events[0]->event_type);
        $this->assertEquals('user.step_two', $events[1]->event_type);
        $this->assertEquals('user.step_three', $events[2]->event_type);

        // Verify timestamps are strictly ascending
        $this->assertTrue($events[0]->occurred_at->lessThan($events[1]->occurred_at));
        $this->assertTrue($events[1]->occurred_at->lessThan($events[2]->occurred_at));
    }

    /**
     * Test that EventStore::timeline() returns events in reverse chronological
     * order (newest first), which is the natural ordering for UI timelines.
     */
    public function test_timeline_returns_events_in_reverse_chronological_order(): void
    {
        $user = User::factory()->create();

        // Create events at different absolute points in time
        // Using Carbon::parse() to avoid compounding relative offsets
        // that occur when travelTo() shifts the frozen clock.
        $this->travelTo(Carbon::parse('2026-06-01 10:00:00'));
        EventStore::record('user.step_one', $user, ['step' => 1]);

        $this->travelTo(Carbon::parse('2026-06-01 11:00:00'));
        EventStore::record('user.step_two', $user, ['step' => 2]);

        $this->travelTo(Carbon::parse('2026-06-01 12:00:00'));
        EventStore::record('user.step_three', $user, ['step' => 3]);

        $events = EventStore::timeline('User', $user->id);

        $this->assertCount(3, $events);

        // Verify reverse chronological order — newest first
        $this->assertEquals('user.step_three', $events[0]->event_type);
        $this->assertEquals('user.step_two', $events[1]->event_type);
        $this->assertEquals('user.step_one', $events[2]->event_type);

        // Verify timestamps are strictly descending
        $this->assertTrue($events[0]->occurred_at->greaterThan($events[1]->occurred_at));
        $this->assertTrue($events[1]->occurred_at->greaterThan($events[2]->occurred_at));
    }
}
