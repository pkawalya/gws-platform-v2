<?php

namespace App\Models;

use App\Exceptions\DomainEventMutationException;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * DomainEvent — Immutable append-only event store record.
 *
 * Every significant business event in the GWS Platform is recorded here.
 * Events can never be updated or deleted — they are facts.
 *
 * Usage:
 *   DomainEvent::record('client.workspace_viewed', $client, ['active_block' => 'approvals']);
 *
 * Querying:
 *   DomainEvent::forAggregate('Client', 42)->get();
 *   DomainEvent::ofType('approval.step_deferred')->get();
 */
class DomainEvent extends Model
{
    /**
     * Allow mass assignment from EventStore only.
     * The EventStore service is the sole entry point for creating events.
     */
    protected $guarded = [];

    /**
     * We manage occurred_at and recorded_at manually —
     * disable Eloquent's automatic timestamps.
     */
    public $timestamps = false;

    /**
     * The attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'metadata' => 'array',
            'occurred_at' => 'datetime',
            'recorded_at' => 'datetime',
        ];
    }

    // ──────────────────────────────────────────────
    // Immutability Enforcement
    // ──────────────────────────────────────────────

    /**
     * Override save() to prevent updates to existing events.
     * New events (inserts) are allowed; updates are not.
     */
    public function save(array $options = []): bool
    {
        if ($this->exists && $this->isDirty()) {
            throw DomainEventMutationException::onUpdate(
                $this->id,
                $this->event_type
            );
        }

        return parent::save($options);
    }

    /**
     * Override delete() — domain events cannot be deleted.
     */
    public function delete(): bool|null
    {
        throw DomainEventMutationException::onDelete(
            $this->id ?? 0,
            $this->event_type ?? 'unknown'
        );
    }

    /**
     * Override forceDelete() — domain events cannot be force-deleted.
     */
    public function forceDelete(): bool|null
    {
        throw DomainEventMutationException::onDelete(
            $this->id ?? 0,
            $this->event_type ?? 'unknown'
        );
    }

    // ──────────────────────────────────────────────
    // Scopes
    // ──────────────────────────────────────────────

    /**
     * Scope: filter events for a specific aggregate.
     *
     * Usage: DomainEvent::forAggregate('Client', 42)->get();
     */
    public function scopeForAggregate(Builder $query, string $type, int $id): Builder
    {
        return $query->where('aggregate_type', $type)
                     ->where('aggregate_id', $id);
    }

    /**
     * Scope: filter events by type.
     *
     * Usage: DomainEvent::ofType('approval.step_deferred')->get();
     */
    public function scopeOfType(Builder $query, string $eventType): Builder
    {
        return $query->where('event_type', $eventType);
    }

    // ──────────────────────────────────────────────
    // Static Factory
    // ──────────────────────────────────────────────

    /**
     * Record a new domain event.
     *
     * This is the low-level factory method. Prefer using EventStore::record()
     * which automatically builds metadata from the current request context.
     */
    public static function record(
        string $type,
        Model $aggregate,
        array $payload,
        ?Model $causer = null
    ): self {
        return static::create([
            'event_type' => $type,
            'aggregate_type' => class_basename($aggregate),
            'aggregate_id' => $aggregate->getKey(),
            'payload' => $payload,
            'metadata' => [], // Populated by EventStore::record()
            'causer_type' => $causer ? get_class($causer) : null,
            'causer_id' => $causer?->getKey(),
            'occurred_at' => now(),
            'recorded_at' => now(),
        ]);
    }
}
