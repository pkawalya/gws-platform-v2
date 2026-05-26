<?php

namespace Database\Seeders;

use App\Models\WorkflowDefinition;
use Illuminate\Database\Seeder;

/**
 * WorkflowDefinitionSeeder — Seeds the default Uganda Land Survey Approval workflow.
 *
 * Creates the standard 8-step workflow from ApprovalStep::DEFAULT_STEPS,
 * mapping each institution to the appropriate step_type and assignee_type.
 * This seeder is idempotent — it will not create duplicates.
 */
class WorkflowDefinitionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        WorkflowDefinition::seedFromApprovalSteps();
    }
}
