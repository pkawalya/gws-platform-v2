<?php

namespace Database\Seeders;

use App\Models\AiModelVersion;
use App\Models\AiPromptTemplate;
use Illuminate\Database\Seeder;

class AiPromptTemplateSeeder extends Seeder
{
    /**
     * Seed the three core AI prompt templates for GWS Platform Phase 0.
     *
     * This seeder is idempotent — it uses firstOrCreate on the unique `key`
     * column so it can be run multiple times without creating duplicates.
     *
     * Order matters: AiModelVersionSeeder must run before this seeder
     * because templates reference model versions.
     */
    public function run(): void
    {
        // Resolve the default model version for prompt templates:
        // first active OpenAI model, or null if none exists yet.
        $defaultModelVersionId = AiModelVersion::active()
            ->forProvider('openai')
            ->value('id');

        $templates = [
            [
                'key' => 'client.next_best_action',
                'template_text' => "You are an expert land surveying practice manager in Uganda.\nAnalyse this client and recommend ONE specific next action.\n\nClient: {{client_name}}\nOutstanding balance: UGX {{outstanding_amount}}\nStalled approval steps: {{stalled_steps}}\nOpen tasks: {{open_tasks}}\nLast contacted: {{last_sms_sent_days_ago}} days ago\n\nRespond in JSON only:\n{\"action\": \"...\", \"reason\": \"...\", \"priority\": \"high|medium|low\"}",
                'max_tokens' => 300,
                'temperature' => 0.30,
                'variables_schema' => [
                    'client_name' => [
                        'type' => 'string',
                        'description' => 'The name of the client.',
                        'required' => true,
                    ],
                    'outstanding_amount' => [
                        'type' => 'number',
                        'description' => 'Outstanding invoice balance in UGX.',
                        'required' => true,
                    ],
                    'stalled_steps' => [
                        'type' => 'string',
                        'description' => 'Comma-separated list of approval steps that are currently stalled.',
                        'required' => true,
                    ],
                    'open_tasks' => [
                        'type' => 'string',
                        'description' => 'Comma-separated list of open tasks for the client.',
                        'required' => true,
                    ],
                    'last_sms_sent_days_ago' => [
                        'type' => 'integer',
                        'description' => 'Number of days since the last SMS was sent to the client.',
                        'required' => true,
                    ],
                ],
            ],
            [
                'key' => 'client.deferral_risk',
                'template_text' => "You are a land title expert in Uganda familiar with DLB, MZO, ALC, and Physical Planning procedures.\n\nReview these approval steps and predict deferral risk:\n{{current_approval_steps}}\n\nHistorical deferrals: {{historical_deferral_reasons}}\n\nRespond in JSON only:\n{\"risk_level\": \"low|medium|high\", \"predicted_institution\": \"...\", \"missing_documents\": [\"...\"], \"explanation\": \"...\"}",
                'max_tokens' => 500,
                'temperature' => 0.20,
                'variables_schema' => [
                    'current_approval_steps' => [
                        'type' => 'string',
                        'description' => 'Current approval steps in the title application pipeline.',
                        'required' => true,
                    ],
                    'historical_deferral_reasons' => [
                        'type' => 'string',
                        'description' => 'Comma-separated list of historical deferral reasons for similar applications.',
                        'required' => true,
                    ],
                ],
            ],
            [
                'key' => 'client.completion_estimate',
                'template_text' => "Based on these step durations (in days) and current step, estimate time to title completion for a Uganda land file.\n\nCurrent step: {{current_step}}\nStep durations (historical): {{historical_step_durations}}\n\nRespond in JSON only:\n{\"estimated_days\": 45, \"confidence_pct\": 72, \"explanation\": \"...\"}",
                'max_tokens' => 200,
                'temperature' => 0.10,
                'variables_schema' => [
                    'current_step' => [
                        'type' => 'string',
                        'description' => 'The current step name in the title application process.',
                        'required' => true,
                    ],
                    'historical_step_durations' => [
                        'type' => 'string',
                        'description' => 'JSON or comma-separated list of historical durations (in days) for each step.',
                        'required' => true,
                    ],
                ],
            ],
        ];

        foreach ($templates as $template) {
            AiPromptTemplate::firstOrCreate(
                ['key' => $template['key']],
                [
                    'version' => 1,
                    'template_text' => $template['template_text'],
                    'variables_schema' => $template['variables_schema'],
                    'ai_model_version_id' => $defaultModelVersionId,
                    'max_tokens' => $template['max_tokens'],
                    'temperature' => $template['temperature'],
                    'is_active' => true,
                    'created_by' => null,
                    'updated_by' => null,
                ],
            );
        }
    }
}
