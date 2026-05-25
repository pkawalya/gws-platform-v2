<?php

namespace App\Livewire\ClientWorkspace;

use App\Models\Client;
use App\Models\AiCallLog;
use App\Services\Ai\AiOrchestrator;
use App\Services\EventStore;
use Filament\Notifications\Notification;
use Illuminate\Support\Facades\Auth;
use Livewire\Attributes\Computed;
use Livewire\Attributes\Locked;
use Livewire\Component;

class AiInsightsBlock extends Component
{
    #[Locked]
    public int $clientId;

    public bool $isGenerating = false;

    public ?string $generatedInsight = null;

    public string $insightType = 'next_best_action';

    /**
     * Get recent AI call logs for this client.
     */
    #[Computed]
    public function recentAiCalls()
    {
        return AiCallLog::where('context_type', Client::class)
            ->where('context_id', $this->clientId)
            ->where('status', 'completed')
            ->with('aiModelVersion')
            ->orderByDesc('created_at')
            ->limit(10)
            ->get();
    }

    /**
     * Get insight types available.
     */
    public function insightTypes(): array
    {
        return [
            'next_best_action' => 'Next Best Action',
            'deferral_risk' => 'Deferral Risk Assessment',
            'completion_estimate' => 'Completion Estimate',
        ];
    }

    /**
     * Generate an AI insight for this client.
     */
    public function generateInsight(): void
    {
        $this->validate([
            'insightType' => 'required|string',
        ]);

        $this->isGenerating = true;
        $client = Client::find($this->clientId);

        try {
            $orchestrator = app(AiOrchestrator::class);

            $variables = [
                'client_name' => $client->full_name,
                'client_number' => $client->client_number,
                'lifecycle_state' => $client->lifecycle_state,
                'district' => $client->district ?? 'Unknown',
                'project_count' => $client->surveyProjects()->count(),
                'active_projects' => $client->surveyProjects()->where('status', '!=', 'completed')->count(),
                'kyc_verified' => $client->kyc_verified ? 'Yes' : 'No',
                'has_outstanding_invoices' => $client->invoices()->whereNotIn('status', ['paid', 'cancelled', 'draft'])->exists() ? 'Yes' : 'No',
            ];

            $response = $orchestrator->ask($this->insightType, $variables, $client);

            $this->generatedInsight = $response->content;

            EventStore::record(
                'ai.insight_generated',
                $client,
                [
                    'insight_type' => $this->insightType,
                    'confidence' => $response->confidence,
                ],
                causer: Auth::user()
            );

            unset($this->recentAiCalls);

            Notification::make()
                ->title('AI Insight Generated')
                ->success()
                ->body('New insight has been generated for this client.')
                ->send();

        } catch (\Throwable $e) {
            Notification::make()
                ->title('AI Insight Failed')
                ->danger()
                ->body('Could not generate insight: ' . $e->getMessage())
                ->send();
        } finally {
            $this->isGenerating = false;
        }
    }

    public function render()
    {
        return view('livewire.client-workspace.ai-insights-block');
    }
}
