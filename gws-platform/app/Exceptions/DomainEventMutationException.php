<?php

namespace App\Exceptions;

use RuntimeException;

/**
 * Thrown when attempting to update or delete a DomainEvent.
 *
 * Domain events are immutable by design — they represent facts that
 * have occurred in the system and must never be altered after recording.
 * This exception ensures the append-only invariant is enforced at the
 * model level, preventing accidental mutations even if database-level
 * constraints are not in place.
 */
class DomainEventMutationException extends RuntimeException
{
    protected $message = 'Domain events are immutable and cannot be updated or deleted.';

    /**
     * Create a new exception instance with context about the attempted mutation.
     */
    public static function onUpdate(int $eventId, string $eventType): self
    {
        return new self(
            "Domain event #{$eventId} ({$eventType}) is immutable and cannot be updated."
        );
    }

    /**
     * Create a new exception instance for a delete attempt.
     */
    public static function onDelete(int $eventId, string $eventType): self
    {
        return new self(
            "Domain event #{$eventId} ({$eventType}) is immutable and cannot be deleted."
        );
    }
}
