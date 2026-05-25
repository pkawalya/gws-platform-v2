# Task: Create AiOrchestrator Service and AiResponse Value Object

## Agent: Code Agent

## Summary

Created two PHP files for the GWS Platform's AI orchestration layer:

### File 1: `app/ValueObjects/AiResponse.php`
- Readonly value object with properties: `content`, `confidence`, `model`, `tokensUsed`, `callLogId`
- `isConfident()` method — returns true when confidence > 0.7
- `fromCallLog()` static factory — constructs from an AiCallLog record with fallback model name resolution
- Proper import for `App\Models\AiCallLog`

### File 2: `app/Services/Ai/AiOrchestrator.php`
- Central AI service with two public methods:
  - `ask(string $promptKey, array $variables, ?Model $context)` — template-based AI calls
  - `askRaw(string $prompt, ?Model $context, string $modelKey)` — ad-hoc AI calls
- Core `executeCall()` pipeline:
  1. Creates AiCallLog record with status='pending' before API call
  2. Dispatches to provider via `match()` expression
  3. Measures latency with `diffInMilliseconds()`
  4. Updates AiCallLog with results or error
  5. Fires `ai.suggestion_generated` domain event via EventStore when context model is provided
  6. Returns AiResponse value object
- Three provider implementations:
  - `callOpenAI()` — uses `OpenAI::client()` from openai-php/laravel
  - `callAnthropic()` — uses `\Anthropic::client()` from anthropic-ai/sdk
  - `callOllama()` — uses Laravel HTTP client to call local Ollama REST API
- Each provider returns `['content', 'input_tokens', 'output_tokens', 'confidence']`
- Full error handling: try/catch updates AiCallLog with status='failed' and logs to Laravel log
- `resolveModelVersion()` — config-based model resolution with fallback to provider default

## Patterns Followed
- Aligned with existing EventStore service pattern (static-like usage, structured payloads)
- Consistent with AiModelVersion model conventions (scopes, accessors, casts)
- PHP 8.3 readonly classes, named arguments, match expressions, null-safe operator
- Comprehensive docblocks with @param/@return/@throws annotations
