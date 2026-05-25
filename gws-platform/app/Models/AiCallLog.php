<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use RuntimeException;

/**
 * AiCallLog — Append-only audit record for every AI API call.
 *
 * Once written, the input-side columns (prompt, model, context) are
 * immutable. The following columns MAY be updated after creation:
 *
 *   Orchestrator fields (set during/after the API call):
 *     • output_response, status, input_tokens, output_tokens,
 *       latency_ms, error_message, cost_usd
 *
 *   Human feedback fields (set during the QA review workflow):
 *     • human_feedback, feedback_notes
 *
 * All other columns are immutable after creation. This guarantees
 * a complete, tamper-proof audit trail for AI governance.
 *
 * Usage:
 *   AiCallLog::forContext('Client', 42)->successful()->get();
 *   $log->calculateTotalCost();
 *   $log->totalTokens();
 */
class AiCallLog extends Model
{
    protected $table = 'ai_call_logs';

    /**
     * Allow mass assignment on every column except id.
     */
    protected $guarded = ['id'];

    /**
     * We only use created_at — disable Eloquent's automatic timestamps.
     */
    public $timestamps = false;

    /**
     * The attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
        ];
    }

    // ──────────────────────────────────────────────
    // Immutability Enforcement
    // ──────────────────────────────────────────────

    /**
     * Override save() to enforce the append-only constraint.
     *
     * On insert (new record) everything is allowed.
     * On update (existing record) only the following columns may be changed:
     *   - Orchestrator fields: output_response, status, input_tokens,
     *     output_tokens, latency_ms, error_message, cost_usd
     *   - Human feedback fields: human_feedback, feedback_notes
     *
     * Input-side columns (input_prompt, ai_model_version_id, context_type,
     * context_id, etc.) are immutable after creation.
     *
     * @throws RuntimeException when a disallowed column is dirty on update.
     */
    public function save(array $options = []): bool
    {
        if ($this->exists) {
            $allowedOnUpdate = [
                // Orchestrator fields (set after API call completes)
                'output_response',
                'status',
                'input_tokens',
                'output_tokens',
                'latency_ms',
                'error_message',
                'cost_usd',
                // Human feedback fields (set during QA review)
                'human_feedback',
                'feedback_notes',
            ];

            $dirtyKeys = array_keys($this->getDirty());

            $disallowed = array_diff($dirtyKeys, $allowedOnUpdate);

            if (!empty($disallowed)) {
                throw new RuntimeException(
                    'AiCallLog is append-only. Only output, status, token, cost, and feedback fields can be updated.'
                );
            }
        }

        return parent::save($options);
    }

    // ──────────────────────────────────────────────
    // Relationships
    // ──────────────────────────────────────────────

    /**
     * The prompt template that was used for this call.
     */
    public function promptTemplate(): BelongsTo
    {
        return $this->belongsTo(AiPromptTemplate::class);
    }

    /**
     * The AI model version that was used for this call.
     */
    public function aiModelVersion(): BelongsTo
    {
        return $this->belongsTo(AiModelVersion::class);
    }

    /**
     * The user who initiated (caused) this AI call.
     */
    public function causer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'causer_user_id');
    }

    // ──────────────────────────────────────────────
    // Scopes
    // ──────────────────────────────────────────────

    /**
     * Scope: filter call logs for a specific context (polymorphic-like).
     *
     * Usage: AiCallLog::forContext('Client', 42)->get();
     */
    public function scopeForContext(Builder $query, string $type, int $id): Builder
    {
        return $query->where('context_type', $type)
                     ->where('context_id', $id);
    }

    /**
     * Scope: only successfully completed calls (no error).
     */
    public function scopeSuccessful(Builder $query): Builder
    {
        return $query->whereNull('error_message');
    }

    /**
     * Scope: only failed calls (has an error message).
     */
    public function scopeFailed(Builder $query): Builder
    {
        return $query->whereNotNull('error_message');
    }

    // ──────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────

    /**
     * Return the pre-calculated cost in USD for this call.
     */
    public function calculateTotalCost(): float
    {
        return (float) $this->cost_usd;
    }

    /**
     * Return the total number of tokens consumed (input + output).
     */
    public function totalTokens(): int
    {
        return (int) $this->input_tokens + (int) $this->output_tokens;
    }
}
