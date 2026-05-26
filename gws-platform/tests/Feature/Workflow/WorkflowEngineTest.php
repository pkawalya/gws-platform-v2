<?php

namespace Tests\Feature\Workflow;

use App\Models\Client;
use App\Models\SurveyProject;
use App\Models\User;
use App\Models\WorkflowDefinition;
use App\Models\WorkflowInstance;
use App\Models\WorkflowStep;
use App\Models\WorkflowTransition;
use App\Services\EventStore;
use App\Services\WorkflowEngine;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * WorkflowEngineTest — Comprehensive tests for Phase 2A Workflow Engine.
 *
 * Tests the full workflow lifecycle: definition creation, instance start,
 * step transitions (advance, defer, reject, skip, escalate), completion,
 * cancellation, suspension, and query methods.
 */
class WorkflowEngineTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Client $client;
    protected SurveyProject $project;
    protected WorkflowDefinition $definition;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->actingAs($this->user);

        $this->client = Client::create([
            'first_name' => 'Test',
            'last_name' => 'Client',
            'phone' => '+256700000001',
        ]);

        $this->project = SurveyProject::create([
            'project_number' => 'SP-2026-0001',
            'project_type' => 'cadastral',
            'client_id' => $this->client->id,
            'district' => 'Wakiso',
            'status' => 'active',
        ]);

        $this->definition = WorkflowDefinition::create([
            'name' => 'Test Workflow',
            'entity_type' => 'SurveyProject',
            'version' => 1,
            'is_active' => true,
        ]);

        WorkflowStep::create([
            'workflow_definition_id' => $this->definition->id,
            'name' => 'Step 1 - Review',
            'slug' => 'step-1-review',
            'step_order' => 1,
            'step_type' => 'review',
            'assignee_type' => 'role',
            'assignee_identifier' => 'surveyor',
            'sla_days' => 7,
            'is_mandatory' => true,
            'auto_advance_on_approval' => true,
        ]);

        WorkflowStep::create([
            'workflow_definition_id' => $this->definition->id,
            'name' => 'Step 2 - Approval',
            'slug' => 'step-2-approval',
            'step_order' => 2,
            'step_type' => 'approval',
            'assignee_type' => 'department',
            'assignee_identifier' => 'dlb',
            'sla_days' => 14,
            'is_mandatory' => true,
            'auto_advance_on_approval' => true,
        ]);

        WorkflowStep::create([
            'workflow_definition_id' => $this->definition->id,
            'name' => 'Step 3 - Optional Check',
            'slug' => 'step-3-optional',
            'step_order' => 3,
            'step_type' => 'review',
            'assignee_type' => 'role',
            'assignee_identifier' => 'manager',
            'sla_days' => 3,
            'is_mandatory' => false,
            'auto_advance_on_approval' => true,
        ]);
    }

    public function test_can_start_workflow_instance(): void
    {
        $instance = WorkflowEngine::start($this->definition, $this->project, $this->user);

        $this->assertInstanceOf(WorkflowInstance::class, $instance);
        $this->assertEquals('active', $instance->status);
        $this->assertEquals(1, $instance->current_step_order);
        $this->assertNotNull($instance->started_at);
        $this->assertEquals($this->definition->id, $instance->workflow_definition_id);
        $this->assertEquals('SurveyProject', $instance->entity_type);
        $this->assertEquals($this->project->id, $instance->entity_id);
    }

    public function test_start_creates_initial_pending_transitions(): void
    {
        $instance = WorkflowEngine::start($this->definition, $this->project, $this->user);

        $transitions = $instance->transitions;
        $this->assertCount(3, $transitions);
        $this->assertEquals('pending', $transitions->first()->to_status);
    }

    public function test_start_fires_domain_event(): void
    {
        WorkflowEngine::start($this->definition, $this->project, $this->user);

        $events = EventStore::replay('SurveyProject', $this->project->id);
        $startEvent = $events->firstWhere('event_type', 'workflow.instance_started');

        $this->assertNotNull($startEvent);
        $this->assertEquals($this->definition->name, $startEvent->payload['definition_name']);
        $this->assertEquals(3, $startEvent->payload['total_steps']);
    }

    public function test_cannot_start_inactive_definition(): void
    {
        $this->definition->deactivate();

        $this->expectException(\InvalidArgumentException::class);
        WorkflowEngine::start($this->definition, $this->project, $this->user);
    }

    public function test_cannot_start_definition_with_no_steps(): void
    {
        $emptyDef = WorkflowDefinition::create([
            'name' => 'Empty Workflow',
            'entity_type' => 'SurveyProject',
            'version' => 1,
            'is_active' => true,
        ]);

        $this->expectException(\InvalidArgumentException::class);
        WorkflowEngine::start($emptyDef, $this->project, $this->user);
    }

    public function test_can_advance_step_with_approve(): void
    {
        $instance = WorkflowEngine::start($this->definition, $this->project, $this->user);
        $transition = WorkflowEngine::advance($instance, 'approve', 'Looks good', $this->user);

        $this->assertInstanceOf(WorkflowTransition::class, $transition);
        $this->assertEquals('approved', $transition->to_status);
        $this->assertEquals('approve', $transition->action);

        $instance->refresh();
        $this->assertEquals(2, $instance->current_step_order);
    }

    public function test_advance_with_invalid_action_throws_exception(): void
    {
        $instance = WorkflowEngine::start($this->definition, $this->project, $this->user);

        $this->expectException(\InvalidArgumentException::class);
        WorkflowEngine::advance($instance, 'invalid_action');
    }

    public function test_advance_fires_domain_event(): void
    {
        $instance = WorkflowEngine::start($this->definition, $this->project, $this->user);
        WorkflowEngine::advance($instance, 'approve', 'OK', $this->user);

        $events = EventStore::replay('SurveyProject', $this->project->id);
        $advanceEvent = $events->firstWhere('event_type', 'workflow.step_approved');

        $this->assertNotNull($advanceEvent);
        $this->assertEquals('Step 1 - Review', $advanceEvent->payload['step_name']);
        $this->assertEquals('approved', $advanceEvent->payload['to_status']);
    }

    public function test_workflow_completes_when_all_mandatory_steps_approved(): void
    {
        $instance = WorkflowEngine::start($this->definition, $this->project, $this->user);

        WorkflowEngine::advance($instance, 'approve', 'Step 1 OK', $this->user);
        WorkflowEngine::advance($instance, 'approve', 'Step 2 OK', $this->user);
        WorkflowEngine::skip($instance, 'Not needed', $this->user);

        $instance->refresh();
        $this->assertEquals('completed', $instance->status);
        $this->assertNotNull($instance->completed_at);
    }

    public function test_completion_fires_domain_event(): void
    {
        $instance = WorkflowEngine::start($this->definition, $this->project, $this->user);
        WorkflowEngine::advance($instance, 'approve', 'Step 1 OK', $this->user);
        WorkflowEngine::advance($instance, 'approve', 'Step 2 OK', $this->user);
        WorkflowEngine::skip($instance, 'Not needed', $this->user);

        $events = EventStore::replay('SurveyProject', $this->project->id);
        $completedEvent = $events->firstWhere('event_type', 'workflow.instance_completed');

        $this->assertNotNull($completedEvent);
        $this->assertArrayHasKey('progress', $completedEvent->payload);
    }

    public function test_can_defer_step(): void
    {
        $instance = WorkflowEngine::start($this->definition, $this->project, $this->user);
        $transition = WorkflowEngine::defer($instance, 'Missing documents', $this->user);

        $this->assertEquals('deferred', $transition->to_status);
        $this->assertEquals('defer', $transition->action);
    }

    public function test_can_reject_workflow(): void
    {
        $instance = WorkflowEngine::start($this->definition, $this->project, $this->user);
        $transition = WorkflowEngine::reject($instance, 'Invalid application', $this->user);

        $this->assertEquals('rejected', $transition->to_status);

        $instance->refresh();
        $this->assertEquals('cancelled', $instance->status);
        $this->assertNotNull($instance->cancelled_at);
    }

    public function test_can_skip_non_mandatory_step(): void
    {
        $instance = WorkflowEngine::start($this->definition, $this->project, $this->user);
        WorkflowEngine::advance($instance, 'approve', 'Step 1 OK', $this->user);
        WorkflowEngine::advance($instance, 'approve', 'Step 2 OK', $this->user);

        $transition = WorkflowEngine::skip($instance, 'Optional step not needed', $this->user);
        $this->assertEquals('skipped', $transition->to_status);
    }

    public function test_cannot_skip_mandatory_step(): void
    {
        $instance = WorkflowEngine::start($this->definition, $this->project, $this->user);

        $this->expectException(\InvalidArgumentException::class);
        WorkflowEngine::skip($instance, 'Try to skip mandatory');
    }

    public function test_can_cancel_workflow(): void
    {
        $instance = WorkflowEngine::start($this->definition, $this->project, $this->user);
        $result = WorkflowEngine::cancel($instance, 'Client withdrew', $this->user);

        $this->assertEquals('cancelled', $result->status);
        $this->assertEquals('Client withdrew', $result->cancellation_reason);
    }

    public function test_can_suspend_and_resume_workflow(): void
    {
        $instance = WorkflowEngine::start($this->definition, $this->project, $this->user);

        $suspended = WorkflowEngine::suspend($instance, 'Awaiting documents');
        $this->assertEquals('suspended', $suspended->status);

        $resumed = WorkflowEngine::resume($suspended);
        $this->assertEquals('active', $resumed->status);
    }

    public function test_calculate_progress_initially_zero(): void
    {
        $instance = WorkflowEngine::start($this->definition, $this->project, $this->user);
        $progress = WorkflowEngine::calculateProgress($instance);

        $this->assertEquals(0.0, $progress);
    }

    public function test_calculate_progress_after_partial_completion(): void
    {
        $instance = WorkflowEngine::start($this->definition, $this->project, $this->user);
        WorkflowEngine::advance($instance, 'approve', 'Step 1 OK', $this->user);

        $progress = WorkflowEngine::calculateProgress($instance);
        $this->assertEqualsWithDelta(33.33, $progress, 0.1);
    }

    public function test_can_replay_workflow_history(): void
    {
        $instance = WorkflowEngine::start($this->definition, $this->project, $this->user);
        WorkflowEngine::advance($instance, 'approve', 'Step 1 OK', $this->user);

        $history = WorkflowEngine::replayHistory($instance);

        $this->assertCount(4, $history);
        $this->assertEquals('pending', $history->first()->to_status);
        $this->assertEquals('approved', $history->last()->to_status);
    }

    public function test_definition_auto_generates_slug(): void
    {
        $def = WorkflowDefinition::create([
            'name' => 'My Custom Workflow',
            'entity_type' => 'SurveyProject',
        ]);

        $this->assertEquals('my-custom-workflow', $def->slug);
    }

    public function test_can_create_new_version_of_definition(): void
    {
        $newVersion = $this->definition->createNewVersion();

        $this->assertEquals(2, $newVersion->version);
        $this->assertTrue($newVersion->is_active);
        $this->assertFalse($this->definition->fresh()->is_active);
        $this->assertEquals(
            $this->definition->steps()->count(),
            $newVersion->steps()->count()
        );
    }

    public function test_seed_from_approval_steps(): void
    {
        $definition = WorkflowDefinition::seedFromApprovalSteps();

        $this->assertInstanceOf(WorkflowDefinition::class, $definition);
        $this->assertEquals('uganda-land-survey-approval', $definition->slug);
        $this->assertEquals('SurveyProject', $definition->entity_type);
        $this->assertEquals(8, $definition->steps()->count());
    }

    public function test_seed_from_approval_steps_is_idempotent(): void
    {
        $first = WorkflowDefinition::seedFromApprovalSteps();
        $second = WorkflowDefinition::seedFromApprovalSteps();

        $this->assertEquals($first->id, $second->id);
    }

    public function test_current_step_accessor(): void
    {
        $instance = WorkflowEngine::start($this->definition, $this->project, $this->user);

        $currentStep = $instance->currentStep;
        $this->assertInstanceOf(WorkflowStep::class, $currentStep);
        $this->assertEquals('Step 1 - Review', $currentStep->name);
    }

    public function test_instance_for_entity_scope(): void
    {
        WorkflowEngine::start($this->definition, $this->project, $this->user);

        $instances = WorkflowInstance::forEntity('SurveyProject', $this->project->id)->get();
        $this->assertCount(1, $instances);
    }

    public function test_get_stalled_instances_returns_empty_when_none_stalled(): void
    {
        WorkflowEngine::start($this->definition, $this->project, $this->user);

        $stalled = WorkflowEngine::getStalledInstances('SurveyProject');
        $this->assertCount(0, $stalled);
    }

    public function test_can_escalate_step(): void
    {
        $instance = WorkflowEngine::start($this->definition, $this->project, $this->user);
        $transition = WorkflowEngine::escalate($instance, 'SLA breach');

        $this->assertEquals('escalate', $transition->action);
        $this->assertEquals('submitted', $transition->to_status);
    }
}
