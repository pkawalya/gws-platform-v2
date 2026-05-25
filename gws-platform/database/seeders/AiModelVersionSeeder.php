<?php

namespace Database\Seeders;

use App\Models\AiModelVersion;
use Illuminate\Database\Seeder;

class AiModelVersionSeeder extends Seeder
{
    /**
     * Seed default AI model versions for the GWS Platform.
     *
     * This seeder is idempotent — it uses firstOrCreate so it can be run
     * multiple times without creating duplicates.
     */
    public function run(): void
    {
        $models = [
            [
                'provider' => 'openai',
                'model_name' => 'gpt-4o',
                'version' => '2024-08-06',
                'is_active' => true,
                'config_json' => [
                    'temperature' => 0.7,
                    'max_tokens' => 4096,
                    'top_p' => 1.0,
                ],
                'cost_per_1k_input_tokens' => 0.0025,
                'cost_per_1k_output_tokens' => 0.01,
                'notes' => 'OpenAI GPT-4o flagship model — high-quality reasoning for complex tasks.',
            ],
            [
                'provider' => 'openai',
                'model_name' => 'gpt-4o-mini',
                'version' => '2024-07-18',
                'is_active' => true,
                'config_json' => [
                    'temperature' => 0.7,
                    'max_tokens' => 4096,
                    'top_p' => 1.0,
                ],
                'cost_per_1k_input_tokens' => 0.00015,
                'cost_per_1k_output_tokens' => 0.0006,
                'notes' => 'OpenAI GPT-4o-mini — cost-effective model for routine classification and summarization.',
            ],
            [
                'provider' => 'anthropic',
                'model_name' => 'claude-3-5-sonnet',
                'version' => '2024-10-22',
                'is_active' => true,
                'config_json' => [
                    'temperature' => 0.7,
                    'max_tokens' => 4096,
                    'top_p' => 1.0,
                ],
                'cost_per_1k_input_tokens' => 0.003,
                'cost_per_1k_output_tokens' => 0.015,
                'notes' => 'Anthropic Claude 3.5 Sonnet — strong reasoning and instruction-following.',
            ],
            [
                'provider' => 'ollama',
                'model_name' => 'llama3.1',
                'version' => 'latest',
                'is_active' => true,
                'config_json' => [
                    'temperature' => 0.7,
                    'max_tokens' => 4096,
                    'top_p' => 1.0,
                    'base_url' => 'http://localhost:11434',
                ],
                'cost_per_1k_input_tokens' => 0.0,
                'cost_per_1k_output_tokens' => 0.0,
                'notes' => 'Ollama Llama 3.1 — self-hosted model for air-gapped / zero-cost inference.',
            ],
        ];

        foreach ($models as $model) {
            AiModelVersion::firstOrCreate(
                [
                    'provider' => $model['provider'],
                    'model_name' => $model['model_name'],
                    'version' => $model['version'],
                ],
                [
                    'is_active' => $model['is_active'],
                    'config_json' => $model['config_json'],
                    'cost_per_1k_input_tokens' => $model['cost_per_1k_input_tokens'],
                    'cost_per_1k_output_tokens' => $model['cost_per_1k_output_tokens'],
                    'notes' => $model['notes'],
                ],
            );
        }
    }
}
