<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * AiPromptTemplate — Versioned prompt template for AI interactions.
 *
 * Each template is keyed (e.g. "client.summary_generator") and versioned
 * so that historical call logs always reference the exact template that
 * was used at the time of the call.
 *
 * Usage:
 *   AiPromptTemplate::active()->forKey('client.summary_generator')->first();
 *   $template->renderTemplate(['client_name' => 'Acme Corp']);
 *   $template->incrementVersion();
 */
class AiPromptTemplate extends Model
{
    protected $table = 'ai_prompt_templates';

    protected $fillable = [
        'key',
        'version',
        'template_text',
        'variables_schema',
        'ai_model_version_id',
        'max_tokens',
        'temperature',
        'is_active',
        'created_by',
        'updated_by',
    ];

    /**
     * The attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'variables_schema' => 'array',
            'is_active' => 'boolean',
            'version' => 'integer',
            'max_tokens' => 'integer',
            'temperature' => 'decimal:2',
        ];
    }

    // ──────────────────────────────────────────────
    // Relationships
    // ──────────────────────────────────────────────

    /**
     * The AI model version this template is configured for.
     */
    public function aiModelVersion(): BelongsTo
    {
        return $this->belongsTo(AiModelVersion::class);
    }

    /**
     * The call logs that used this prompt template.
     */
    public function callLogs(): HasMany
    {
        return $this->hasMany(AiCallLog::class);
    }

    /**
     * The user who created this template version.
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * The user who last updated this template version.
     */
    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    // ──────────────────────────────────────────────
    // Scopes
    // ──────────────────────────────────────────────

    /**
     * Scope: only active prompt templates.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope: filter by template key.
     */
    public function scopeForKey(Builder $query, string $key): Builder
    {
        return $query->where('key', $key);
    }

    // ──────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────

    /**
     * Render the template by replacing {{variable_name}} placeholders
     * with the corresponding values from the provided array.
     *
     * Placeholders that have no matching variable are left as-is.
     *
     * @param  array  $variables  Associative array of variable names to values.
     * @return string The rendered template text.
     */
    public function renderTemplate(array $variables): string
    {
        $rendered = $this->template_text;

        foreach ($variables as $name => $value) {
            $rendered = str_replace('{{' . $name . '}}', (string) $value, $rendered);
        }

        return $rendered;
    }

    /**
     * Create a new version of this prompt template.
     *
     * Copies all attributes from the current template, increments the version,
     * and persists the new record. The original template remains untouched.
     *
     * @return self The newly created template version.
     */
    public function incrementVersion(): self
    {
        return static::create([
            'key' => $this->key,
            'version' => $this->version + 1,
            'template_text' => $this->template_text,
            'variables_schema' => $this->variables_schema,
            'ai_model_version_id' => $this->ai_model_version_id,
            'max_tokens' => $this->max_tokens,
            'temperature' => $this->temperature,
            'is_active' => true,
            'created_by' => $this->updated_by ?? $this->created_by,
            'updated_by' => $this->updated_by ?? $this->created_by,
        ]);
    }
}
