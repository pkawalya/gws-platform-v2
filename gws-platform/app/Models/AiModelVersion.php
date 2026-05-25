<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * AiModelVersion — Tracks an AI model version available in the GWS Platform.
 *
 * Each record represents a specific version of an AI model from a provider
 * (e.g. OpenAI GPT-4o v2024-08-06). Stores pricing configuration and
 * metadata used for cost tracking and governance.
 *
 * Usage:
 *   AiModelVersion::active()->forProvider('openai')->get();
 *   $version->calculateCost(1500, 800);
 */
class AiModelVersion extends Model
{
    protected $table = 'ai_model_versions';

    protected $fillable = [
        'provider',
        'model_name',
        'version',
        'is_active',
        'config_json',
        'cost_per_1k_input_tokens',
        'cost_per_1k_output_tokens',
        'notes',
    ];

    /**
     * The attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'config_json' => 'array',
            'is_active' => 'boolean',
            'cost_per_1k_input_tokens' => 'decimal:6',
            'cost_per_1k_output_tokens' => 'decimal:6',
        ];
    }

    // ──────────────────────────────────────────────
    // Relationships
    // ──────────────────────────────────────────────

    /**
     * Get the prompt templates configured for this model version.
     */
    public function promptTemplates(): HasMany
    {
        return $this->hasMany(AiPromptTemplate::class);
    }

    /**
     * Get the call logs recorded against this model version.
     */
    public function callLogs(): HasMany
    {
        return $this->hasMany(AiCallLog::class);
    }

    // ──────────────────────────────────────────────
    // Scopes
    // ──────────────────────────────────────────────

    /**
     * Scope: only active model versions.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope: filter by provider.
     */
    public function scopeForProvider(Builder $query, string $provider): Builder
    {
        return $query->where('provider', $provider);
    }

    // ──────────────────────────────────────────────
    // Accessors
    // ──────────────────────────────────────────────

    /**
     * Human-readable display name for this model version.
     *
     * Example: "gpt-4o v2024-08-06 (openai)"
     */
    public function getDisplayNameAttribute(): string
    {
        return "{$this->model_name} v{$this->version} ({$this->provider})";
    }

    // ──────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────

    /**
     * Calculate the USD cost for a given number of input and output tokens.
     *
     * Rates are stored as cost per 1,000 tokens.
     *
     * @param  int  $inputTokens   Number of input (prompt) tokens consumed.
     * @param  int  $outputTokens  Number of output (completion) tokens produced.
     * @return float Total cost in USD.
     */
    public function calculateCost(int $inputTokens, int $outputTokens): float
    {
        $inputCost = ($inputTokens / 1000) * (float) $this->cost_per_1k_input_tokens;
        $outputCost = ($outputTokens / 1000) * (float) $this->cost_per_1k_output_tokens;

        return round($inputCost + $outputCost, 6);
    }
}
