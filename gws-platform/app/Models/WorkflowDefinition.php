<?php

namespace App\Models;

use App\Traits\RecordsDomainEvents;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

/**
 * WorkflowDefinition — Template for a configurable workflow.
 *
 * Each definition describes a workflow type (e.g., "Uganda Land Survey
 * Approval") with a version, target entity type, and a collection of
 * ordered steps. Definitions can be activated/deactivated and versioned
 * to support evolving business processes.
 *
 * Usage:
 *   WorkflowDefinition::active()->forEntity('SurveyProject')->first();
 *   $definition->seedFromApprovalSteps();
 *   $newVersion = $definition->createNewVersion();
 *
 * @property int         $id
 * @property string      $name
 * @property string      $slug
 * @property string|null $description
 * @property string      $entity_type
 * @property int         $version
 * @property bool        $is_active
 * @property array|null  $metadata
 * @property int|null    $organization_id
 */
class WorkflowDefinition extends Model
{
    use RecordsDomainEvents;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'slug',
        'description',
        'entity_type',
        'version',
        'is_active',
        'metadata',
        'organization_id',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'version' => 'integer',
        'is_active' => 'boolean',
        'metadata' => 'array',
    ];

    // --------------------------------------------------------------------------
    // Relationships
    // --------------------------------------------------------------------------

    /**
     * The steps that belong to this workflow definition.
     */
    public function steps(): HasMany
    {
        return $this->hasMany(WorkflowStep::class, 'workflow_definition_id');
    }

    /**
     * The instances that have been created from this workflow definition.
     */
    public function instances(): HasMany
    {
        return $this->hasMany(WorkflowInstance::class, 'workflow_definition_id');
    }

    /**
     * The organization this workflow definition belongs to.
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    // --------------------------------------------------------------------------
    // Scopes
    // --------------------------------------------------------------------------

    /**
     * Scope to only active workflow definitions.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to filter definitions by entity type.
     */
    public function scopeForEntity($query, string $type)
    {
        return $query->where('entity_type', $type);
    }

    /**
     * Scope to get the latest version of definitions.
     *
     * Returns only the highest version number for each slug group.
     */
    public function scopeLatestVersion($query)
    {
        return $query->whereIn('id', function ($subQuery) {
            $subQuery->selectRaw('MAX(id)')
                ->from('workflow_definitions')
                ->groupBy('slug');
        });
    }

    // --------------------------------------------------------------------------
    // Boot / Auto-generation
    // --------------------------------------------------------------------------

    /**
     * The "booted" method of the model.
     *
     * Auto-generates slug from name on creating if slug is empty.
     */
    protected static function booted(): void
    {
        static::creating(function (self $definition) {
            if (empty($definition->slug)) {
                $definition->slug = static::generateUniqueSlug($definition->name);
            }
        });
    }

    /**
     * Generate a unique slug from the given name.
     *
     * On collision, appends a numeric suffix.
     */
    public static function generateUniqueSlug(string $name): string
    {
        $baseSlug = Str::slug($name);
        $slug = $baseSlug;
        $counter = 2;

        while (static::where('slug', $slug)->exists()) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;
        }

        return $slug;
    }

    // --------------------------------------------------------------------------
    // Business Logic
    // --------------------------------------------------------------------------

    /**
     * Activate this workflow definition.
     *
     * @return bool Whether the update was successful.
     */
    public function activate(): bool
    {
        return $this->update(['is_active' => true]);
    }

    /**
     * Deactivate this workflow definition.
     *
     * Deactivated definitions cannot be used to start new workflow instances,
     * but existing instances continue to run.
     *
     * @return bool Whether the update was successful.
     */
    public function deactivate(): bool
    {
        return $this->update(['is_active' => false]);
    }

    /**
     * Create a new version of this workflow definition.
     *
     * Duplicates the definition and all its steps with version incremented
     * by 1. The original definition is deactivated.
     *
     * @return self The new version of the workflow definition.
     */
    public function createNewVersion(): self
    {
        $newDefinition = static::create([
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'entity_type' => $this->entity_type,
            'version' => $this->version + 1,
            'is_active' => true,
            'metadata' => $this->metadata,
            'organization_id' => $this->organization_id,
        ]);

        // Duplicate all steps for the new version
        foreach ($this->steps()->orderBy('step_order')->get() as $step) {
            WorkflowStep::create([
                'workflow_definition_id' => $newDefinition->id,
                'name' => $step->name,
                'slug' => $step->slug,
                'step_order' => $step->step_order,
                'step_type' => $step->step_type,
                'assignee_type' => $step->assignee_type,
                'assignee_identifier' => $step->assignee_identifier,
                'sla_days' => $step->sla_days,
                'is_mandatory' => $step->is_mandatory,
                'auto_advance_on_approval' => $step->auto_advance_on_approval,
                'config' => $step->config,
            ]);
        }

        // Deactivate the old version
        $this->deactivate();

        return $newDefinition;
    }

    /**
     * Seed the default Uganda 8-step workflow from ApprovalStep::DEFAULT_STEPS.
     *
     * Creates a WorkflowDefinition with the 8 institution steps as
     * WorkflowStep records. Maps each institution to appropriate step_type
     * and assignee_type values.
     *
     * @return self The created workflow definition.
     */
    public static function seedFromApprovalSteps(): self
    {
        // Check if a definition with this slug already exists
        $existing = static::where('slug', 'uganda-land-survey-approval')->first();
        if ($existing) {
            return $existing;
        }

        $stepMapping = [
            'client_signed' => [
                'name' => 'Client Signed',
                'step_type' => 'notification',
                'assignee_type' => 'role',
                'assignee_identifier' => 'client',
                'sla_days' => 3,
            ],
            'lc1' => [
                'name' => 'LC1 Endorsement',
                'step_type' => 'approval',
                'assignee_type' => 'role',
                'assignee_identifier' => 'surveyor',
                'sla_days' => 7,
            ],
            'alc' => [
                'name' => 'ALC Review',
                'step_type' => 'approval',
                'assignee_type' => 'department',
                'assignee_identifier' => 'alc',
                'sla_days' => 14,
            ],
            'physical_planning' => [
                'name' => 'Physical Planning Review',
                'step_type' => 'review',
                'assignee_type' => 'department',
                'assignee_identifier' => 'physical_planning',
                'sla_days' => 14,
            ],
            'dlb' => [
                'name' => 'DLB Review',
                'step_type' => 'approval',
                'assignee_type' => 'department',
                'assignee_identifier' => 'dlb',
                'sla_days' => 14,
            ],
            'gws' => [
                'name' => 'GWS Officer Review',
                'step_type' => 'approval',
                'assignee_type' => 'role',
                'assignee_identifier' => 'gws_officer',
                'sla_days' => 7,
            ],
            'mzo' => [
                'name' => 'MZO Review',
                'step_type' => 'approval',
                'assignee_type' => 'department',
                'assignee_identifier' => 'mzo',
                'sla_days' => 21,
            ],
            'land_office' => [
                'name' => 'Land Office Registration',
                'step_type' => 'approval',
                'assignee_type' => 'department',
                'assignee_identifier' => 'land_office',
                'sla_days' => 30,
            ],
        ];

        $definition = static::create([
            'name' => 'Uganda Land Survey Approval',
            'description' => 'The 8-step approval workflow for land survey projects in Uganda, from client signing through land office registration.',
            'entity_type' => 'SurveyProject',
            'version' => 1,
            'is_active' => true,
            'metadata' => [
                'stalled_threshold_days' => ApprovalStep::STALLED_THRESHOLD_DAYS,
            ],
        ]);

        foreach (ApprovalStep::DEFAULT_STEPS as $order => $institution) {
            $mapping = $stepMapping[$institution] ?? [
                'name' => Str::headline($institution),
                'step_type' => 'approval',
                'assignee_type' => 'role',
                'assignee_identifier' => null,
                'sla_days' => 7,
            ];

            WorkflowStep::create([
                'workflow_definition_id' => $definition->id,
                'name' => $mapping['name'],
                'slug' => $institution,
                'step_order' => $order,
                'step_type' => $mapping['step_type'],
                'assignee_type' => $mapping['assignee_type'],
                'assignee_identifier' => $mapping['assignee_identifier'],
                'sla_days' => $mapping['sla_days'],
                'is_mandatory' => true,
                'auto_advance_on_approval' => true,
                'config' => null,
            ]);
        }

        return $definition;
    }
}
