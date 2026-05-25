<?php

namespace App\Traits;

use App\Models\DomainEvent;
use App\Services\EventStore;
use Illuminate\Database\Eloquent\Model;

/**
 * RecordsDomainEvents — Automatic domain event recording for Eloquent models.
 *
 * Add this trait to any model that should automatically record domain events
 * when it is created, updated, or deleted. The trait hooks into Eloquent's
 * boot cycle and uses the EventStore service to persist immutable events.
 *
 * Usage:
 *   class Client extends Model {
 *       use RecordsDomainEvents;
 *   }
 *
 *   // Creating a client automatically records 'client.created'
 *   // Updating a client automatically records 'client.updated' (with old values)
 *   // Deleting a client automatically records 'client.deleted'
 *
 * Guard: DomainEvent itself does NOT use this trait to prevent recursion.
 */
trait RecordsDomainEvents
{
    /**
     * Boot the trait — register Eloquent event listeners.
     */
    protected static function bootRecordsDomainEvents(): void
    {
        // Record event on model creation
        static::created(function (Model $model) {
            EventStore::record(
                eventType: class_basename($model) . '.created',
                aggregate: $model,
                payload: $model->toArray(),
                causer: auth()->user()
            );
        });

        // Record event on model update — include old values in payload
        static::updated(function (Model $model) {
            $oldValues = collect($model->getRawOriginal())
                ->only(array_keys($model->getChanges()))
                ->toArray();

            EventStore::record(
                eventType: class_basename($model) . '.updated',
                aggregate: $model,
                payload: [
                    'old' => $oldValues,
                    'new' => $model->getChanges(),
                ],
                causer: auth()->user()
            );
        });

        // Record event on model deletion
        static::deleted(function (Model $model) {
            EventStore::record(
                eventType: class_basename($model) . '.deleted',
                aggregate: $model,
                payload: $model->toArray(),
                causer: auth()->user()
            );
        });
    }

    /**
     * Determine if this model should record domain events.
     *
     * Override in models to conditionally disable event recording.
     * DomainEvent itself overrides this to prevent recursion.
     */
    public function shouldRecordDomainEvents(): bool
    {
        return true;
    }
}
