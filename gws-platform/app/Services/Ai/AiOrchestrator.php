<?php

namespace App\Services\Ai;

use App\Models\AiCallLog;
use App\Models\AiModelVersion;
use App\Models\AiPromptTemplate;
use App\Services\EventStore;
use App\ValueObjects\AiResponse;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use OpenAI;
use RuntimeException;

/**
 * AiOrchestrator — Central AI service for the GWS Platform.
 *
 * Manages all AI calls across providers (OpenAI, Anthropic, Ollama),
 * enforcing consistent logging, error handling, and structured responses.
 * Every call produces an AiCallLog record and optionally fires a domain event.
 *
 * Usage:
 *   $response = app(AiOrchestrator::class)->ask('client.risk_summary', [
 *       'client_name' => 'Acme Corp',
 *       'revenue'     => '$2.4M',
 *   ], $client);
 *
 *   $response = app(AiOrchestrator::class)->askRaw(
 *       'Summarize this document in 3 bullets.',
 *       $document
 *   );
 */
class AiOrchestrator
{
    /**
     * Call an AI prompt by its template key.
     *
     * Resolves the active AiPromptTemplate by key, merges variables into
     * the template, resolves the model version, and dispatches to the
     * appropriate provider. All activity is logged to AiCallLog.
     *
     * @param  string  $promptKey  The unique key of the AiPromptTemplate.
     * @param  array  $variables  Key-value pairs to merge into the template.
     * @param  Model|null  $context  The Eloquent model this call relates to (for domain events).
     * @return AiResponse Structured response with content, confidence, and metadata.
     *
     * @throws RuntimeException If the template is not found or the model version is missing.
     */
    public function ask(string $promptKey, array $variables = [], ?Model $context = null): AiResponse
    {
        // ── Resolve the prompt template ──────────────────────────────
        $template = AiPromptTemplate::where('key', $promptKey)
            ->where('is_active', true)
            ->first();

        if (! $template) {
            throw new RuntimeException("AiPromptTemplate not found for key: {$promptKey}");
        }

        // ── Render the prompt from template ─────────────────────────
        $renderedPrompt = $template->renderTemplate($variables);

        // ── Resolve the model version from the template ──────────────
        $modelVersion = $template->aiModelVersion;

        if (! $modelVersion || ! $modelVersion->is_active) {
            throw new RuntimeException(
                "No active AiModelVersion associated with template key: {$promptKey}"
            );
        }

        // ── Execute the AI call ──────────────────────────────────────
        return $this->executeCall(
            prompt: $renderedPrompt,
            modelVersion: $modelVersion,
            promptKey: $promptKey,
            promptTemplateId: $template->id,
            context: $context
        );
    }

    /**
     * Call an AI provider with an ad-hoc prompt (no template).
     *
     * Resolves the model version from config or falls back to the default,
     * then dispatches to the appropriate provider. All activity is logged.
     *
     * @param  string  $prompt  The raw prompt text to send.
     * @param  Model|null  $context  The Eloquent model this call relates to (for domain events).
     * @param  string  $modelKey  Config key to resolve the model version (default: 'default').
     * @return AiResponse Structured response with content, confidence, and metadata.
     *
     * @throws RuntimeException If no model version can be resolved.
     */
    public function askRaw(string $prompt, ?Model $context = null, string $modelKey = 'default'): AiResponse
    {
        // ── Resolve the model version from config ────────────────────
        $modelVersion = $this->resolveModelVersion($modelKey);

        if (! $modelVersion) {
            throw new RuntimeException(
                "No active AiModelVersion found for model key: {$modelKey}"
            );
        }

        // ── Execute the AI call ──────────────────────────────────────
        return $this->executeCall(
            prompt: $prompt,
            modelVersion: $modelVersion,
            promptKey: $modelKey,
            promptTemplateId: null,
            context: $context
        );
    }

    // ──────────────────────────────────────────────────────────────────
    // Core Execution
    // ──────────────────────────────────────────────────────────────────

    /**
     * Execute an AI call with full logging, error handling, and event firing.
     *
     * This is the shared pipeline used by both ask() and askRaw():
     *   1. Create an AiCallLog record (status = 'pending')
     *   2. Dispatch to the correct provider
     *   3. Measure latency
     *   4. Update AiCallLog with results
     *   5. Fire a domain event if context is provided
     *   6. Return an AiResponse value object
     */
    protected function executeCall(
        string $prompt,
        AiModelVersion $modelVersion,
        string $promptKey,
        ?int $promptTemplateId = null,
        ?Model $context = null
    ): AiResponse {
        $startTime = now();

        // ── Create the call log BEFORE calling the provider ──────────
        $callLog = AiCallLog::create([
            'ai_model_version_id' => $modelVersion->id,
            'prompt_template_id' => $promptTemplateId,
            'input_prompt' => $prompt,
            'output_response' => null,
            'status' => 'pending',
            'input_tokens' => null,
            'output_tokens' => null,
            'latency_ms' => null,
            'error_message' => null,
            'cost_usd' => null,
            'context_type' => $context ? get_class($context) : null,
            'context_id' => $context?->getKey(),
        ]);

        try {
            // ── Dispatch to the correct provider ─────────────────────
            $provider = strtolower($modelVersion->provider);

            $result = match ($provider) {
                'openai' => $this->callOpenAI($prompt, $modelVersion),
                'anthropic' => $this->callAnthropic($prompt, $modelVersion),
                'ollama' => $this->callOllama($prompt, $modelVersion),
                default => throw new RuntimeException("Unsupported AI provider: {$modelVersion->provider}"),
            };

            // ── Measure latency ──────────────────────────────────────
            $latencyMs = (int) $startTime->diffInMilliseconds(now());

            // ── Calculate cost ───────────────────────────────────────
            $costUsd = $modelVersion->calculateCost(
                $result['input_tokens'],
                $result['output_tokens']
            );

            // ── Update the call log with success ─────────────────────
            $callLog->update([
                'output_response' => $result['content'],
                'status' => 'completed',
                'input_tokens' => $result['input_tokens'],
                'output_tokens' => $result['output_tokens'],
                'latency_ms' => $latencyMs,
                'cost_usd' => $costUsd,
            ]);

            // ── Fire domain event if context is provided ─────────────
            if ($context) {
                EventStore::record(
                    eventType: 'ai.suggestion_generated',
                    aggregate: $context,
                    payload: [
                        'prompt_key' => $promptKey,
                        'model' => $modelVersion->getDisplayNameAttribute(),
                        'tokens_used' => $result['input_tokens'] + $result['output_tokens'],
                        'latency_ms' => $latencyMs,
                        'confidence' => $result['confidence'],
                        'call_log_id' => $callLog->id,
                    ]
                );
            }

            // ── Build and return the AiResponse ──────────────────────
            return AiResponse::fromCallLog(
                log: $callLog->fresh(),
                content: $result['content'],
                confidence: $result['confidence'],
            );

        } catch (\Throwable $e) {
            // ── Log the error to AiCallLog ───────────────────────────
            $latencyMs = (int) $startTime->diffInMilliseconds(now());

            $callLog->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
                'latency_ms' => $latencyMs,
            ]);

            // ── Also log to the Laravel log for observability ────────
            Log::error('AiOrchestrator call failed', [
                'prompt_key' => $promptKey,
                'provider' => $modelVersion->provider,
                'model' => $modelVersion->model_name,
                'call_log_id' => $callLog->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            throw $e;
        }
    }

    // ──────────────────────────────────────────────────────────────────
    // Provider Implementations
    // ──────────────────────────────────────────────────────────────────

    /**
     * Call the OpenAI API using the openai-php/laravel client.
     *
     * @return array{content: string, input_tokens: int, output_tokens: int, confidence: float|null}
     */
    protected function callOpenAI(string $prompt, AiModelVersion $modelVersion): array
    {
        $client = OpenAI::client(config('openai.api_key'));

        $config = $modelVersion->config_json ?? [];

        $response = $client->chat()->create([
            'model' => $modelVersion->model_name,
            'messages' => [
                ['role' => 'user', 'content' => $prompt],
            ],
            'temperature' => $config['temperature'] ?? 0.3,
            'max_tokens' => $config['max_tokens'] ?? 2048,
        ]);

        $content = $response->choices[0]->message->content ?? '';
        $inputTokens = $response->usage->promptTokens ?? 0;
        $outputTokens = $response->usage->completionTokens ?? 0;

        // OpenAI doesn't return confidence natively;
        // we estimate null unless logprobs are enabled
        $confidence = null;

        return [
            'content' => $content,
            'input_tokens' => $inputTokens,
            'output_tokens' => $outputTokens,
            'confidence' => $confidence,
        ];
    }

    /**
     * Call the Anthropic API using the anthropic-ai/sdk client.
     *
     * @return array{content: string, input_tokens: int, output_tokens: int, confidence: float|null}
     */
    protected function callAnthropic(string $prompt, AiModelVersion $modelVersion): array
    {
        $client = \Anthropic::client(config('anthropic.api_key'));

        $config = $modelVersion->config_json ?? [];

        $response = $client->messages()->create([
            'model' => $modelVersion->model_name,
            'max_tokens' => $config['max_tokens'] ?? 2048,
            'messages' => [
                ['role' => 'user', 'content' => $prompt],
            ],
        ]);

        $content = $response->content[0]->text ?? '';
        $inputTokens = $response->usage->inputTokens ?? 0;
        $outputTokens = $response->usage->outputTokens ?? 0;

        // Anthropic doesn't return confidence natively
        $confidence = null;

        return [
            'content' => $content,
            'input_tokens' => $inputTokens,
            'output_tokens' => $outputTokens,
            'confidence' => $confidence,
        ];
    }

    /**
     * Call a local Ollama instance via HTTP.
     *
     * Ollama runs locally and exposes a REST API at http://localhost:11434.
     * We use Laravel's HTTP client to make the request.
     *
     * @return array{content: string, input_tokens: int, output_tokens: int, confidence: float|null}
     */
    protected function callOllama(string $prompt, AiModelVersion $modelVersion): array
    {
        $config = $modelVersion->config_json ?? [];

        $baseUrl = $config['base_url'] ?? 'http://localhost:11434';

        $response = Http::timeout(120)->post("{$baseUrl}/api/generate", [
            'model' => $modelVersion->model_name,
            'prompt' => $prompt,
            'stream' => false,
            'options' => array_filter([
                'temperature' => $config['temperature'] ?? 0.3,
                'num_predict' => $config['max_tokens'] ?? 2048,
            ]),
        ]);

        if (! $response->successful()) {
            throw new RuntimeException(
                "Ollama API error: {$response->status()} - {$response->body()}"
            );
        }

        $data = $response->json();

        $content = $data['response'] ?? '';
        $inputTokens = $data['prompt_eval_count'] ?? 0;
        $outputTokens = $data['eval_count'] ?? 0;

        // Ollama doesn't return confidence natively
        $confidence = null;

        return [
            'content' => $content,
            'input_tokens' => $inputTokens,
            'output_tokens' => $outputTokens,
            'confidence' => $confidence,
        ];
    }

    // ──────────────────────────────────────────────────────────────────
    // Model Resolution
    // ──────────────────────────────────────────────────────────────────

    /**
     * Resolve an AiModelVersion from the config-based model key.
     *
     * The config key maps to an AiModelVersion ID stored in the
     * `gws.ai_models` config. Falls back to the first active model
     * for the provider specified in the config.
     */
    protected function resolveModelVersion(string $modelKey): ?AiModelVersion
    {
        // Check if a specific model version ID is configured
        $configuredId = config("gws.ai_models.{$modelKey}.model_version_id");

        if ($configuredId) {
            $model = AiModelVersion::active()->find($configuredId);
            if ($model) {
                return $model;
            }
        }

        // Fall back to the configured provider's default active model
        $configuredProvider = config("gws.ai_models.{$modelKey}.provider", 'openai');

        return AiModelVersion::active()
            ->forProvider($configuredProvider)
            ->orderByDesc('id')
            ->first();
    }
}
