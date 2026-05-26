<?php

namespace Tests\Feature\Spatial;

use App\Models\Client;
use App\Models\MapAnnotation;
use App\Models\SpatialLayer;
use App\Models\SurveyProject;
use App\Models\User;
use App\Services\SpatialQueryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * SpatialQueryServiceTest — Tests for Phase 2B Spatial OS.
 *
 * Tests spatial query methods, model creation, GeoJSON generation,
 * Haversine distance calculations, and layer management.
 */
class SpatialQueryServiceTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Client $client;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->actingAs($this->user);

        $this->client = Client::create([
            'first_name' => 'Spatial',
            'last_name' => 'Client',
            'phone' => '+256700000002',
            'district' => 'Wakiso',
        ]);
    }

    // ------------------------------------------------------------------
    // SurveyProject Spatial Methods
    // ------------------------------------------------------------------

    public function test_project_has_spatial_data_returns_false_when_no_geojson(): void
    {
        $project = SurveyProject::create([
            'project_number' => 'SP-2026-0001',
            'project_type' => 'cadastral',
            'client_id' => $this->client->id,
            'district' => 'Wakiso',
            'status' => 'active',
        ]);

        $this->assertFalse($project->hasSpatialData());
    }

    public function test_project_has_spatial_data_returns_true_with_geojson(): void
    {
        $project = SurveyProject::create([
            'project_number' => 'SP-2026-0002',
            'project_type' => 'cadastral',
            'client_id' => $this->client->id,
            'district' => 'Wakiso',
            'status' => 'active',
            'geojson_data' => [
                'type' => 'Point',
                'coordinates' => [32.2903, 1.3733],
            ],
        ]);

        $this->assertTrue($project->hasSpatialData());
    }

    public function test_project_get_center_coordinates_from_geojson(): void
    {
        $project = SurveyProject::create([
            'project_number' => 'SP-2026-0003',
            'project_type' => 'cadastral',
            'client_id' => $this->client->id,
            'district' => 'Wakiso',
            'status' => 'active',
            'geojson_data' => [
                'type' => 'Point',
                'coordinates' => [32.2903, 1.3733],
            ],
        ]);

        $center = $project->getCenterCoordinates();
        $this->assertNotNull($center);
        $this->assertEqualsWithDelta(1.3733, $center[0], 0.0001);
        $this->assertEqualsWithDelta(32.2903, $center[1], 0.0001);
    }

    public function test_project_get_center_coordinates_falls_back_to_district(): void
    {
        $project = SurveyProject::create([
            'project_number' => 'SP-2026-0004',
            'project_type' => 'cadastral',
            'client_id' => $this->client->id,
            'district' => 'Wakiso',
            'status' => 'active',
        ]);

        $center = $project->getCenterCoordinates();
        // Should use district center lookup for Wakiso
        $this->assertNotNull($center);
    }

    public function test_project_to_geojson_feature(): void
    {
        $project = SurveyProject::create([
            'project_number' => 'SP-2026-0005',
            'project_type' => 'cadastral',
            'client_id' => $this->client->id,
            'district' => 'Kampala',
            'status' => 'active',
            'geojson_data' => [
                'type' => 'Point',
                'coordinates' => [32.58, 0.32],
            ],
        ]);

        $feature = $project->toGeoJSONFeature();

        $this->assertEquals('Feature', $feature['type']);
        $this->assertArrayHasKey('geometry', $feature);
        $this->assertArrayHasKey('properties', $feature);
        $this->assertEquals('SP-2026-0005', $feature['properties']['projectNumber']);
    }

    public function test_project_update_spatial_data(): void
    {
        $project = SurveyProject::create([
            'project_number' => 'SP-2026-0006',
            'project_type' => 'cadastral',
            'client_id' => $this->client->id,
            'district' => 'Wakiso',
            'status' => 'active',
        ]);

        $geojson = ['type' => 'Point', 'coordinates' => [32.2903, 1.3733]];
        $project->updateSpatialData($geojson);

        $project->refresh();
        $this->assertEquals($geojson, $project->geojson_data);
        $this->assertNotNull($project->last_georef_update);
    }

    // ------------------------------------------------------------------
    // Haversine Distance
    // ------------------------------------------------------------------

    public function test_haversine_distance_same_point(): void
    {
        $distance = SpatialQueryService::haversineDistance(1.3733, 32.2903, 1.3733, 32.2903);
        $this->assertEqualsWithDelta(0.0, $distance, 0.01);
    }

    public function test_haversine_distance_known_distance(): void
    {
        // Kampala to Entebbe ≈ 34 km
        $distance = SpatialQueryService::haversineDistance(0.3476, 32.5825, 0.0544, 32.4461);
        $this->assertGreaterThan(30, $distance);
        $this->assertLessThan(40, $distance);
    }

    // ------------------------------------------------------------------
    // SpatialLayer
    // ------------------------------------------------------------------

    public function test_can_create_spatial_layer(): void
    {
        $layer = SpatialLayer::create([
            'name' => 'Uganda Districts',
            'layer_type' => 'boundary',
            'source_type' => 'upload',
            'style_config' => ['color' => '#8b5cf6', 'weight' => 2],
            'is_visible_by_default' => true,
        ]);

        $this->assertEquals('uganda-districts', $layer->slug);
        $this->assertEquals('boundary', $layer->layer_type);
        $this->assertTrue($layer->is_active);
    }

    public function test_spatial_layer_get_default_style(): void
    {
        $layer = SpatialLayer::create([
            'name' => 'Styled Layer',
            'layer_type' => 'parcel',
            'source_type' => 'upload',
            'style_config' => ['color' => '#ff0000', 'weight' => 3],
        ]);

        $style = $layer->getDefaultStyle();
        $this->assertEquals('#ff0000', $style['color']);
        $this->assertEquals(3, $style['weight']);
    }

    public function test_spatial_layer_to_leaflet_config(): void
    {
        $layer = SpatialLayer::create([
            'name' => 'Test Layer',
            'layer_type' => 'boundary',
            'source_type' => 'upload',
            'is_visible_by_default' => true,
            'style_config' => ['color' => '#3b82f6'],
        ]);

        $config = $layer->toLeafletConfig();
        $this->assertArrayHasKey('id', $config);
        $this->assertArrayHasKey('name', $config);
        $this->assertArrayHasKey('style', $config);
        $this->assertTrue($config['isVisibleByDefault']);
    }

    // ------------------------------------------------------------------
    // MapAnnotation
    // ------------------------------------------------------------------

    public function test_can_create_map_annotation(): void
    {
        $project = SurveyProject::create([
            'project_number' => 'SP-2026-0010',
            'project_type' => 'cadastral',
            'client_id' => $this->client->id,
            'district' => 'Wakiso',
            'status' => 'active',
        ]);

        $annotation = MapAnnotation::create([
            'annotation_type' => 'marker',
            'entity_type' => 'SurveyProject',
            'entity_id' => $project->id,
            'title' => 'Boundary Point A',
            'geometry' => ['type' => 'Point', 'coordinates' => [32.2903, 1.3733]],
        ]);

        $this->assertNotNull($annotation);
        $this->assertEquals('marker', $annotation->annotation_type);
        // Lat/lng should be auto-extracted from geometry
        $this->assertEqualsWithDelta(1.3733, (float) $annotation->latitude, 0.0001);
        $this->assertEqualsWithDelta(32.2903, (float) $annotation->longitude, 0.0001);
    }

    public function test_annotation_to_geojson(): void
    {
        $annotation = MapAnnotation::create([
            'annotation_type' => 'marker',
            'title' => 'Test Marker',
            'geometry' => ['type' => 'Point', 'coordinates' => [32.2903, 1.3733]],
        ]);

        $geojson = $annotation->toGeoJSON();
        $this->assertEquals('Feature', $geojson['type']);
        $this->assertEquals('Point', $geojson['geometry']['type']);
        $this->assertEquals('Test Marker', $geojson['properties']['title']);
    }

    // ------------------------------------------------------------------
    // SpatialQueryService
    // ------------------------------------------------------------------

    public function test_projects_near_point(): void
    {
        $project = SurveyProject::create([
            'project_number' => 'SP-2026-0020',
            'project_type' => 'cadastral',
            'client_id' => $this->client->id,
            'district' => 'Wakiso',
            'status' => 'active',
            'geojson_data' => ['type' => 'Point', 'coordinates' => [32.2903, 1.3733]],
        ]);

        $results = SpatialQueryService::projectsNearPoint(1.3733, 32.2903, 10);
        $this->assertCount(1, $results);

        // Far away query should return nothing
        $farResults = SpatialQueryService::projectsNearPoint(-1.0, 30.0, 5);
        $this->assertCount(0, $farResults);
    }

    public function test_projects_as_geojson(): void
    {
        SurveyProject::create([
            'project_number' => 'SP-2026-0030',
            'project_type' => 'cadastral',
            'client_id' => $this->client->id,
            'district' => 'Kampala',
            'status' => 'active',
        ]);

        $geojson = SpatialQueryService::projectsAsGeoJson();

        $this->assertEquals('FeatureCollection', $geojson['type']);
        $this->assertArrayHasKey('features', $geojson);
    }

    public function test_get_visible_layers(): void
    {
        SpatialLayer::create([
            'name' => 'Active Layer',
            'layer_type' => 'boundary',
            'source_type' => 'upload',
            'is_active' => true,
            'is_visible_by_default' => true,
        ]);

        SpatialLayer::create([
            'name' => 'Inactive Layer',
            'layer_type' => 'boundary',
            'source_type' => 'upload',
            'is_active' => false,
            'is_visible_by_default' => true,
        ]);

        $layers = SpatialQueryService::getVisibleLayers();
        $this->assertCount(1, $layers);
        $this->assertEquals('Active Layer', $layers->first()->name);
    }

    public function test_annotations_as_geojson(): void
    {
        MapAnnotation::create([
            'annotation_type' => 'marker',
            'title' => 'Public Marker',
            'geometry' => ['type' => 'Point', 'coordinates' => [32.29, 1.37]],
            'is_public' => true,
        ]);

        MapAnnotation::create([
            'annotation_type' => 'marker',
            'title' => 'Private Marker',
            'geometry' => ['type' => 'Point', 'coordinates' => [32.30, 1.38]],
            'is_public' => false,
        ]);

        $geojson = SpatialQueryService::annotationsAsGeoJson();

        $this->assertEquals('FeatureCollection', $geojson['type']);
        // Only public annotations should be included
        $this->assertCount(1, $geojson['features']);
        $this->assertEquals('Public Marker', $geojson['features'][0]['properties']['title']);
    }

    public function test_get_project_clusters(): void
    {
        SurveyProject::create([
            'project_number' => 'SP-2026-0040',
            'project_type' => 'cadastral',
            'client_id' => $this->client->id,
            'district' => 'Wakiso',
            'status' => 'active',
            'geojson_data' => ['type' => 'Point', 'coordinates' => [32.2903, 1.3733]],
        ]);

        $clusters = SpatialQueryService::getProjectClusters(
            southWestLat: -5.0,
            southWestLng: 28.0,
            northEastLat: 5.0,
            northEastLng: 36.0,
            zoomLevel: 8
        );

        $this->assertIsArray($clusters);
    }
}
