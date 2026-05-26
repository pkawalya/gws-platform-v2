<?php

namespace Tests\Feature\Api;

use App\Models\Client;
use App\Models\FieldObservation;
use App\Models\FieldSyncEvent;
use App\Models\SurveyProject;
use App\Models\User;
use App\Services\FieldSyncService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * FieldSyncServiceTest — Tests for Phase 2C Mobile Field App API + Sync.
 *
 * Tests API authentication, observation CRUD, sync push/pull, conflict
 * detection/resolution, and domain event recording.
 */
class FieldSyncServiceTest extends TestCase
{
    use RefreshDatabase;

    protected User $surveyor;
    protected User $otherUser;
    protected Client $client;
    protected SurveyProject $project;

    protected function setUp(): void
    {
        parent::setUp();

        $this->surveyor = User::factory()->create([
            'email' => 'surveyor@gws.co.ug',
        ]);
        $this->actingAs($this->surveyor);

        $this->otherUser = User::factory()->create([
            'email' => 'other@gws.co.ug',
        ]);

        $this->client = Client::create([
            'first_name' => 'Field',
            'last_name' => 'Client',
            'phone' => '+256700000003',
            'district' => 'Mukono',
        ]);

        $this->project = SurveyProject::create([
            'project_number' => 'SP-2026-0050',
            'project_type' => 'boundary',
            'client_id' => $this->client->id,
            'district' => 'Mukono',
            'status' => 'surveying',
            'assigned_surveyor_user_id' => $this->surveyor->id,
        ]);
    }

    // ------------------------------------------------------------------
    // FieldObservation Model
    // ------------------------------------------------------------------

    public function test_can_create_field_observation(): void
    {
        $observation = FieldObservation::create([
            'survey_project_id' => $this->project->id,
            'observation_type' => 'boundary_point',
            'title' => 'Northwest Corner',
            'geometry' => ['type' => 'Point', 'coordinates' => [32.75, 0.35]],
            'latitude' => 0.35,
            'longitude' => 32.75,
            'accuracy_meters' => 2.5,
            'observed_at' => now(),
            'sync_status' => 'synced',
            'recorded_by_user_id' => $this->surveyor->id,
        ]);

        $this->assertNotNull($observation->uuid);
        $this->assertEquals('boundary_point', $observation->observation_type);
        $this->assertEquals('synced', $observation->sync_status);
    }

    public function test_observation_auto_generates_uuid(): void
    {
        $observation = FieldObservation::create([
            'survey_project_id' => $this->project->id,
            'observation_type' => 'note',
            'title' => 'Field Note',
            'observed_at' => now(),
            'recorded_by_user_id' => $this->surveyor->id,
        ]);

        $this->assertNotNull($observation->uuid);
        $this->assertIsString($observation->uuid);
    }

    public function test_observation_mark_synced(): void
    {
        $observation = FieldObservation::create([
            'survey_project_id' => $this->project->id,
            'observation_type' => 'note',
            'title' => 'Test Note',
            'observed_at' => now(),
            'sync_status' => 'pending',
            'recorded_by_user_id' => $this->surveyor->id,
        ]);

        $observation->markSynced();

        $this->assertEquals('synced', $observation->fresh()->sync_status);
        $this->assertNotNull($observation->fresh()->synced_at);
    }

    public function test_observation_mark_conflicted(): void
    {
        $observation = FieldObservation::create([
            'survey_project_id' => $this->project->id,
            'observation_type' => 'note',
            'title' => 'Conflict Test',
            'observed_at' => now(),
            'sync_status' => 'synced',
            'recorded_by_user_id' => $this->surveyor->id,
        ]);

        $observation->markConflicted('server_wins');

        $this->assertEquals('conflict', $observation->fresh()->sync_status);
    }

    public function test_observation_to_geojson(): void
    {
        $observation = FieldObservation::create([
            'survey_project_id' => $this->project->id,
            'observation_type' => 'boundary_point',
            'title' => 'GeoJSON Test',
            'geometry' => ['type' => 'Point', 'coordinates' => [32.75, 0.35]],
            'observed_at' => now(),
            'recorded_by_user_id' => $this->surveyor->id,
        ]);

        $geojson = $observation->toGeoJSON();
        $this->assertEquals('Feature', $geojson['type']);
        $this->assertEquals('Point', $geojson['geometry']['type']);
        $this->assertEquals('GeoJSON Test', $geojson['properties']['title']);
    }

    public function test_observation_scopes(): void
    {
        FieldObservation::create([
            'survey_project_id' => $this->project->id,
            'observation_type' => 'note',
            'title' => 'Pending Note',
            'observed_at' => now(),
            'sync_status' => 'pending',
            'recorded_by_user_id' => $this->surveyor->id,
        ]);

        FieldObservation::create([
            'survey_project_id' => $this->project->id,
            'observation_type' => 'photo',
            'title' => 'Synced Photo',
            'observed_at' => now(),
            'sync_status' => 'synced',
            'recorded_by_user_id' => $this->surveyor->id,
        ]);

        $this->assertCount(1, FieldObservation::pendingSync()->get());
        $this->assertCount(1, FieldObservation::ofType('photo')->get());
        $this->assertCount(2, FieldObservation::forProject($this->project->id)->get());
        $this->assertCount(2, FieldObservation::byUser($this->surveyor->id)->get());
    }

    // ------------------------------------------------------------------
    // FieldSyncEvent Model
    // ------------------------------------------------------------------

    public function test_can_create_sync_event(): void
    {
        $event = FieldSyncEvent::create([
            'device_id' => 'device-abc123',
            'user_id' => $this->surveyor->id,
            'sync_type' => 'push',
            'status' => 'started',
            'started_at' => now(),
        ]);

        $this->assertNotNull($event);
        $this->assertEquals('started', $event->status);
    }

    public function test_sync_event_mark_completed(): void
    {
        $event = FieldSyncEvent::create([
            'device_id' => 'device-abc123',
            'user_id' => $this->surveyor->id,
            'sync_type' => 'push',
            'status' => 'started',
            'started_at' => now(),
        ]);

        $event->markCompleted(pushed: 5, pulled: 3, conflicted: 1);

        $this->assertEquals('completed', $event->fresh()->status);
        $this->assertEquals(5, $event->fresh()->records_pushed);
        $this->assertEquals(3, $event->fresh()->records_pulled);
        $this->assertEquals(1, $event->fresh()->records_conflicted);
        $this->assertNotNull($event->fresh()->completed_at);
    }

    public function test_sync_event_mark_failed(): void
    {
        $event = FieldSyncEvent::create([
            'device_id' => 'device-abc123',
            'user_id' => $this->surveyor->id,
            'sync_type' => 'push',
            'status' => 'started',
            'started_at' => now(),
        ]);

        $event->markFailed('Network timeout');

        $this->assertEquals('failed', $event->fresh()->status);
        $this->assertEquals('Network timeout', $event->fresh()->error_message);
    }

    // ------------------------------------------------------------------
    // FieldSyncService — Push
    // ------------------------------------------------------------------

    public function test_push_creates_new_observations(): void
    {
        $observations = [
            [
                'uuid' => 'obs-uuid-001',
                'survey_project_id' => $this->project->id,
                'observation_type' => 'boundary_point',
                'title' => 'Point A',
                'geometry' => ['type' => 'Point', 'coordinates' => [32.75, 0.35]],
                'latitude' => 0.35,
                'longitude' => 32.75,
                'observed_at' => now()->toIso8601String(),
                'is_offline_creation' => true,
            ],
            [
                'uuid' => 'obs-uuid-002',
                'survey_project_id' => $this->project->id,
                'observation_type' => 'note',
                'title' => 'Field Note 1',
                'observed_at' => now()->toIso8601String(),
                'is_offline_creation' => true,
            ],
        ];

        $result = FieldSyncService::push(
            $this->surveyor,
            'device-test-001',
            $observations,
            now()
        );

        $this->assertCount(2, $result['synced']);
        $this->assertEquals(2, $result['records_pushed']);
        $this->assertEquals(0, $result['records_conflicted']);
    }

    public function test_push_updates_existing_observation_by_uuid(): void
    {
        // Create initial observation
        FieldObservation::create([
            'uuid' => 'obs-uuid-update',
            'survey_project_id' => $this->project->id,
            'observation_type' => 'note',
            'title' => 'Original Title',
            'observed_at' => now()->subHour(),
            'sync_status' => 'synced',
            'synced_at' => now()->subMinutes(30),
            'recorded_by_user_id' => $this->surveyor->id,
        ]);

        $observations = [
            [
                'uuid' => 'obs-uuid-update',
                'survey_project_id' => $this->project->id,
                'observation_type' => 'note',
                'title' => 'Updated Title',
                'observed_at' => now()->toIso8601String(),
            ],
        ];

        $result = FieldSyncService::push(
            $this->surveyor,
            'device-test-002',
            $observations,
            now()
        );

        $this->assertEquals(1, $result['records_pushed']);
        $updated = FieldObservation::where('uuid', 'obs-uuid-update')->first();
        $this->assertEquals('Updated Title', $updated->title);
    }

    public function test_push_creates_sync_event(): void
    {
        FieldSyncService::push(
            $this->surveyor,
            'device-test-003',
            [],
            now()
        );

        $this->assertDatabaseHas('field_sync_events', [
            'device_id' => 'device-test-003',
            'user_id' => $this->surveyor->id,
            'sync_type' => 'push',
        ]);
    }

    // ------------------------------------------------------------------
    // FieldSyncService — Pull
    // ------------------------------------------------------------------

    public function test_pull_returns_observations_projects_clients(): void
    {
        // Create an observation
        FieldObservation::create([
            'survey_project_id' => $this->project->id,
            'observation_type' => 'note',
            'title' => 'Pull Test Note',
            'observed_at' => now(),
            'sync_status' => 'synced',
            'recorded_by_user_id' => $this->surveyor->id,
        ]);

        $result = FieldSyncService::pull(
            $this->surveyor,
            'device-test-004',
            null // Full sync
        );

        $this->assertGreaterThan(0, $result['records_pulled']);
        $this->assertNotNull($result['observations']);
        $this->assertNotNull($result['projects']);
        $this->assertNotNull($result['clients']);
    }

    public function test_pull_creates_sync_event(): void
    {
        FieldSyncService::pull(
            $this->surveyor,
            'device-test-005',
            null
        );

        $this->assertDatabaseHas('field_sync_events', [
            'device_id' => 'device-test-005',
            'user_id' => $this->surveyor->id,
            'sync_type' => 'pull',
        ]);
    }

    // ------------------------------------------------------------------
    // FieldSyncService — Status
    // ------------------------------------------------------------------

    public function test_get_sync_status(): void
    {
        FieldObservation::create([
            'survey_project_id' => $this->project->id,
            'observation_type' => 'note',
            'title' => 'Pending Status Note',
            'observed_at' => now(),
            'sync_status' => 'pending',
            'recorded_by_user_id' => $this->surveyor->id,
        ]);

        $status = FieldSyncService::getStatus($this->surveyor, 'device-test-006');

        $this->assertArrayHasKey('last_sync_at', $status);
        $this->assertArrayHasKey('pending_count', $status);
        $this->assertArrayHasKey('conflict_count', $status);
        $this->assertEquals(1, $status['pending_count']);
    }

    // ------------------------------------------------------------------
    // FieldSyncService — Conflict Resolution
    // ------------------------------------------------------------------

    public function test_resolve_conflict_server_wins(): void
    {
        $observation = FieldObservation::create([
            'survey_project_id' => $this->project->id,
            'observation_type' => 'note',
            'title' => 'Server Version',
            'observed_at' => now(),
            'sync_status' => 'conflict',
            'recorded_by_user_id' => $this->surveyor->id,
        ]);

        $resolved = FieldSyncService::resolveConflict($observation, 'server_wins');

        $this->assertEquals('synced', $resolved->sync_status);
        $this->assertEquals('server_wins', $resolved->conflict_resolution);
    }

    public function test_resolve_conflict_client_wins(): void
    {
        $observation = FieldObservation::create([
            'survey_project_id' => $this->project->id,
            'observation_type' => 'note',
            'title' => 'Client Version',
            'observed_at' => now(),
            'sync_status' => 'conflict',
            'recorded_by_user_id' => $this->surveyor->id,
        ]);

        $resolved = FieldSyncService::resolveConflict($observation, 'client_wins');

        $this->assertEquals('synced', $resolved->sync_status);
        $this->assertEquals('client_wins', $resolved->conflict_resolution);
    }

    public function test_resolve_conflict_merged(): void
    {
        $observation = FieldObservation::create([
            'survey_project_id' => $this->project->id,
            'observation_type' => 'note',
            'title' => 'Original Title',
            'observed_at' => now(),
            'sync_status' => 'conflict',
            'recorded_by_user_id' => $this->surveyor->id,
        ]);

        $mergedData = ['title' => 'Merged Title', 'description' => 'Merged content'];
        $resolved = FieldSyncService::resolveConflict($observation, 'merged', $mergedData);

        $this->assertEquals('synced', $resolved->sync_status);
        $this->assertEquals('merged', $resolved->conflict_resolution);
        $this->assertEquals('Merged Title', $resolved->title);
    }

    public function test_resolve_conflict_fires_domain_event(): void
    {
        $observation = FieldObservation::create([
            'survey_project_id' => $this->project->id,
            'observation_type' => 'note',
            'title' => 'Conflict Event Test',
            'observed_at' => now(),
            'sync_status' => 'conflict',
            'recorded_by_user_id' => $this->surveyor->id,
        ]);

        FieldSyncService::resolveConflict($observation, 'server_wins');

        $events = \App\Services\EventStore::replay('FieldObservation', $observation->id);
        $conflictEvent = $events->firstWhere('event_type', 'field_observation.conflict_resolved');

        $this->assertNotNull($conflictEvent);
        $this->assertEquals('server_wins', $conflictEvent->payload['resolution']);
    }

    // ------------------------------------------------------------------
    // Observation Soft Deletes
    // ------------------------------------------------------------------

    public function test_observation_uses_soft_deletes(): void
    {
        $observation = FieldObservation::create([
            'survey_project_id' => $this->project->id,
            'observation_type' => 'note',
            'title' => 'Soft Delete Test',
            'observed_at' => now(),
            'recorded_by_user_id' => $this->surveyor->id,
        ]);

        $observation->delete();

        $this->assertSoftDeleted('field_observations', ['id' => $observation->id]);
        $this->assertNotNull(FieldObservation::withTrashed()->find($observation->id));
    }
}
