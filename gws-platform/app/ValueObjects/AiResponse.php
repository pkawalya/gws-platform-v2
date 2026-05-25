<?php

namespace App\ValueObjects;

use App\Models\AiCallLog;

readonly class AiResponse
{
    public function __construct(
        public string $content,
        public ?float $confidence,
        public string $model,
        public int $tokensUsed,
        public int $callLogId,
    ) {}

    /**
     * Determine if the AI response has sufficient confidence.
     * Threshold: > 0.7
     */
    public function isConfident(): bool
    {
        return $this->confidence !== null && $this->confidence > 0.7;
    }

    /**
     * Create from an AiCallLog record and raw response data.
     */
    public static function fromCallLog(AiCallLog $log, string $content, ?float $confidence = null): self
    {
        return new self(
            content: $content,
            confidence: $confidence,
            model: $log->aiModelVersion?->getDisplayNameAttribute() ?? $log->aiModelVersion?->model_name ?? 'unknown',
            tokensUsed: ($log->input_tokens ?? 0) + ($log->output_tokens ?? 0),
            callLogId: $log->id,
        );
    }
}
