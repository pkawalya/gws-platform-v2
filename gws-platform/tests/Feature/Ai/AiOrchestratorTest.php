<?php

namespace Tests\Feature\Ai;

use App\Models\AiCallLog;
use App\Models\AiModelVersion;
use App\Models\AiPromptTemplate;
use App\Models\DomainEvent;
use App\Models\User;
use App\Services\Ai\AiOrchestrator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use RuntimeException;
use Tests\TestCase;

class AiOrchestratorTest extends TestCase
{
    use RefreshDatabase;

    protected AiModelVersion $modelVersion;

    protected AiPromptTemplate $promptTemplate;

    protected function setUp(): void
    {
        parent::setUp();

        // Create the AI model version that the orchestrator will resolve
        $this->modelVersion = AiModelVersion::create([
            'provider' => 'openai',
            'model_name' => 'gpt-4',
            'version' => '1',
            'is_active' => true,
            'config_json' => [],
            'cost_per_1k_input_tokens' => 0.030000,
            'cost_per_1k_output_tokens' => 0.060000,
        ]);

        // Create the prompt template that the orchestrator will look up
        $this->promptTemplate = AiPromptTemplate::create([
            'key' => 'test.prompt',
            'version' => 1,
            'template_text' => 'Summarize the following: {{input}}',
            'variables_schema' => ['input' => 'string'],
            'ai_model_version_id' => $this->modelVersion->id,
            'max_tokens' => 1000,
            'temperature' => 0.70,
            'is_active' => true,
        ]);
    }

    /**
     * Create a partial mock of AiOrchestrator that intercepts the
     * protected callOpenAI() method, avoiding real API calls.
     *
     * @param  array  $returnValue  The fake provider response to return.
     * @param  \Closure|null  $callback  Optional callback for andReturnUsing().
     */
    protected function mockOrchestrator(array $returnValue, ?\Closure $callback = null): AiOrchestrator
    {
        $orchestrator = \Mockery::mock(AiOrchestrator::class)->makePartial();

        $expectation = $orchestrator->shouldAllowMockingProtectedMethods()
            ->shouldReceive('callOpenAI')
            ->once();

        if ($callback) {
            $expectation->andReturnUsing($callback);
        } else {
            $expectation->andReturn($returnValue);
        }

        // Bind into the container so app(AiOrchestrator::class) resolves the mock
        app()->instance(AiOrchestrator::class, $orchestrator);

        return $orchestrator;
    }

    /**
     * Test that an AiCallLog record is created with status 'pending'
     * BEFORE the AI provider API is actually called.
     */
    public function test_ai_call_log_created_before_api_call(): void
    {
        $user = User::factory()->create();

        $this->mockOrchestrator(
            returnValue: [],
            callback: function () {
                // At this point, executeCall() has already created the log
                // but has NOT yet received the provider response.
                $this->assertDatabaseHas('ai_call_logs', [
                    'status' => 'pending',
                ]);

                return [
                    'content' => 'Test AI response',
                    'input_tokens' => 100,
                    'output_tokens' => 50,
                    'confidence' => 0.85,
                ];
            }
        );

        $orchestrator = app(AiOrchestrator::class);
        $orchestrator->ask('test.prompt', ['input' => 'test data'], $user);
    }

    /**
     * Test that on a successful AI call, the AiCallLog is updated
     * with the response content, token counts, cost, and latency.
     */
    public function test_ai_call_log_updated_with_response_on_success(): void
    {
        $user = User::factory()->create();

        $this->mockOrchestrator([
            'content' => 'The summary of the provided text.',
            'input_tokens' => 150,
            'output_tokens' => 75,
            'confidence' => 0.90,
        ]);

        $orchestrator = app(AiOrchestrator::class);
        $response = $orchestrator->ask('test.prompt', ['input' => 'sample text'], $user);

        // Refresh the call log from the database
        $callLog = AiCallLog::first();
        $this->assertNotNull($callLog, 'Expected an AiCallLog record to exist');

        // Status should be updated to completed
        $this->assertEquals('completed', $callLog->status);

        // Token counts should be recorded
        $this->assertEquals(150, (int) $callLog->input_tokens);
        $this->assertEquals(75, (int) $callLog->output_tokens);

        // Latency should be measured
        $this->assertNotNull($callLog->latency_ms);
        $this->assertGreaterThanOrEqual(0, $callLog->latency_ms);

        // Cost should be calculated and stored
        $this->assertNotNull($callLog->cost_usd);

        // Response content should be stored
        $this->assertEquals('The summary of the provided text.', $callLog->output_response);

        // Verify the returned AiResponse value object
        $this->assertEquals('The summary of the provided text.', $response->content);
        $this->assertEquals(150 + 75, $response->tokensUsed);
    }

    /**
     * Test that when an AI API call fails, the AiCallLog is updated
     * with status 'failed' and the error message is recorded.
     */
    public function test_ai_call_log_status_failed_on_api_error(): void
    {
        $user = User::factory()->create();

        $orchestrator = \Mockery::mock(AiOrchestrator::class)->makePartial();
        $orchestrator->shouldAllowMockingProtectedMethods()
            ->shouldReceive('callOpenAI')
            ->once()
            ->andThrow(new RuntimeException('API rate limit exceeded'));

        app()->instance(AiOrchestrator::class, $orchestrator);

        // The orchestrator re-throws the exception after logging,
        // so we catch it to verify the log was written first.
        $exceptionCaught = false;
        try {
            $orchestrator->ask('test.prompt', ['input' => 'test data'], $user);
        } catch (RuntimeException $e) {
            $exceptionCaught = true;
            $this->assertStringContainsString('API rate limit exceeded', $e->getMessage());
        }

        $this->assertTrue($exceptionCaught, 'Expected RuntimeException was not thrown');

        // Verify the call log reflects the failure
        $callLog = AiCallLog::first();
        $this->assertNotNull($callLog, 'Expected an AiCallLog record to exist');
        $this->assertEquals('failed', $callLog->status);
        $this->assertEquals('API rate limit exceeded', $callLog->error_message);
        $this->assertNotNull($callLog->latency_ms);
    }

    /**
     * Test that after a successful AI call with a context model,
     * a DomainEvent with type 'ai.suggestion_generated' is recorded
     * against the context model.
     */
    public function test_domain_event_fired_on_context_model_after_suggestion(): void
    {
        $user = User::factory()->create();

        $this->mockOrchestrator([
            'content' => 'Suggested next action: review documents',
            'input_tokens' => 200,
            'output_tokens' => 80,
            'confidence' => 0.92,
        ]);

        $orchestrator = app(AiOrchestrator::class);
        $orchestrator->ask('test.prompt', ['input' => 'client data'], $user);

        // Verify a domain event was recorded for the context model
        $this->assertDatabaseHas('domain_events', [
            'event_type' => 'ai.suggestion_generated',
            'aggregate_type' => 'User',
            'aggregate_id' => $user->id,
        ]);

        // Verify the event payload contains the expected data
        $event = DomainEvent::ofType('ai.suggestion_generated')
            ->forAggregate('User', $user->id)
            ->first();

        $this->assertNotNull($event);

        $payload = $event->payload;
        $this->assertEquals('test.prompt', $payload['prompt_key']);
        $this->assertEquals(280, $payload['tokens_used']); // 200 + 80
        $this->assertArrayHasKey('latency_ms', $payload);
        $this->assertArrayHasKey('call_log_id', $payload);
    }

    /**
     * Test that human feedback (human_feedback and feedback_notes)
     * can be recorded on an existing AiCallLog.
     *
     * These feedback columns are allowed for updates alongside the
     * orchestrator fields (output, tokens, cost, status) on the
     * append-only ai_call_logs table.
     */
    public function test_feedback_can_be_recorded_on_call_log(): void
    {
        $callLog = AiCallLog::create([
            'ai_model_version_id' => $this->modelVersion->id,
            'input_prompt' => 'Summarize: quarterly report',
            'status' => 'completed',
            'input_tokens' => 120,
            'output_tokens' => 60,
            'cost_usd' => 0.007200,
        ]);

        // Update only the feedback columns — this should succeed
        $callLog->update([
            'human_feedback' => 'accepted',
            'feedback_notes' => 'Good suggestion, very helpful.',
        ]);

        $callLog->refresh();

        $this->assertEquals('accepted', $callLog->human_feedback);
        $this->assertEquals('Good suggestion, very helpful.', $callLog->feedback_notes);

        // Verify the rest of the record is untouched
        $this->assertEquals('completed', $callLog->status);
        $this->assertEquals('Summarize: quarterly report', $callLog->input_prompt);
    }

    /**
     * Test that input-side columns (like input_prompt) cannot be
     * updated on an existing AiCallLog.
     *
     * Input fields are immutable after creation to ensure a
     * tamper-proof audit trail for AI governance.
     */
    public function test_call_log_other_fields_cannot_be_updated(): void
    {
        $callLog = AiCallLog::create([
            'ai_model_version_id' => $this->modelVersion->id,
            'input_prompt' => 'Original prompt text',
            'status' => 'completed',
            'input_tokens' => 100,
            'output_tokens' => 50,
        ]);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('append-only');

        $callLog->update([
            'input_prompt' => 'Tampered prompt text',
        ]);
    }
}
