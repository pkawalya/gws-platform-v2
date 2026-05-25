<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * AI Governance Tables
     * --------------------
     * NOTE: SQLite does not support native ENUM columns, so all columns that
     * logically represent an enumeration use STRING instead. ENUM constraints
     * are enforced at the application level via model validation, form requests,
     * and cast attributes.
     */
    public function up(): void
    {
        /*
        |-------------------------------------------------------------
        | Table 1: ai_model_versions
        |-------------------------------------------------------------
        | Tracks every LLM model/version available to the platform.
        | Cost fields allow per-model billing calculations.
        */
        Schema::create('ai_model_versions', function (Blueprint $table) {
            $table->id();

            // ENUM(openai, anthropic, ollama, google) — stored as string for
            // SQLite compatibility; constrained at the application level.
            $table->string('provider');

            $table->string('model_name', 100);
            $table->string('version', 50);
            $table->boolean('is_active')->default(true);

            // Default inference parameters: temperature, max_tokens, system_prompt, etc.
            $table->json('config_json');

            $table->decimal('cost_per_1k_input_tokens', 10, 6)->default(0);
            $table->decimal('cost_per_1k_output_tokens', 10, 6)->default(0);

            $table->text('notes')->nullable();

            $table->timestamps();

            // Index for looking up active models by provider + name
            $table->index(['provider', 'model_name', 'is_active'], 'ai_model_versions_lookup_index');
        });

        /*
        |-------------------------------------------------------------
        | Table 2: ai_prompt_templates
        |-------------------------------------------------------------
        | Versioned prompt templates with merge-variable schemas.
        | Each template can optionally pin to a specific model version.
        */
        Schema::create('ai_prompt_templates', function (Blueprint $table) {
            $table->id();

            $table->string('key', 100)->unique();
            // e.g. 'client.next_best_action', 'survey.follow_up_email'

            $table->unsignedTinyInteger('version')->default(1);

            $table->text('template_text');

            // Describes the merge variables expected by this template,
            // e.g. {"client_name": "string", "last_interaction": "date"}
            $table->json('variables_schema');

            // Optional: pin this template to a specific model version;
            // null = resolve at call time via application defaults.
            $table->foreignId('ai_model_version_id')
                ->nullable()
                ->constrained('ai_model_versions')
                ->nullOnDelete();

            $table->integer('max_tokens')->default(1000);
            $table->decimal('temperature', 3, 2)->default(0.70);
            $table->boolean('is_active')->default(true);

            // Audit: who created / last updated this template
            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->foreignId('updated_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamps();

            // Index for active lookup by key + version
            $table->index(['key', 'version', 'is_active'], 'ai_prompt_templates_lookup_index');
        });

        /*
        |-------------------------------------------------------------
        | Table 3: ai_call_logs
        |-------------------------------------------------------------
        | IMMUTABLE — append-only log of every AI API call.
        |
        | No row may be updated after creation EXCEPT for the
        | human_feedback and feedback_notes columns, which are
        | populated during the human review / QA workflow.
        |
        | No updated_at column is included to reinforce append-only
        | semantics. The model should use $timestamps = false and
        | set created_at manually or via a creating observer.
        */
        Schema::create('ai_call_logs', function (Blueprint $table) {
            $table->bigIncrements('id');

            // Null = ad-hoc call not tied to a managed template
            $table->foreignId('prompt_template_id')
                ->nullable()
                ->constrained('ai_prompt_templates')
                ->nullOnDelete();

            $table->foreignId('ai_model_version_id')
                ->constrained('ai_model_versions')
                ->restrictOnDelete();

            // Polymorphic-style context — e.g. context_type='Client', context_id=42
            $table->string('context_type', 100)->nullable();
            $table->unsignedBigInteger('context_id')->nullable();

            $table->text('input_prompt');
            $table->text('output_response')->nullable();

            $table->unsignedInteger('input_tokens')->nullable();
            $table->unsignedInteger('output_tokens')->nullable();

            $table->decimal('cost_usd', 10, 6)->nullable();
            $table->unsignedInteger('latency_ms')->nullable();

            // ENUM(success, failed, timeout, rate_limited) — stored as string
            // for SQLite compatibility; constrained at the application level.
            $table->string('status');

            $table->text('error_message')->nullable();

            // ENUM(accepted, rejected, ignored) — stored as string for SQLite
            // compatibility; constrained at the application level.
            // These two columns are the ONLY updatable fields on this table.
            $table->string('human_feedback')->nullable();
            $table->text('feedback_notes')->nullable();

            // Who initiated the AI call
            $table->foreignId('causer_user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            // Append-only: only created_at, no updated_at
            $table->timestamp('created_at')->default(DB::raw('CURRENT_TIMESTAMP'));

            // Required indexes
            $table->index(['context_type', 'context_id'], 'ai_call_logs_context_index');
            $table->index('status', 'ai_call_logs_status_index');
            $table->index('created_at', 'ai_call_logs_created_at_index');
        });

        // Add DB comments for immutability documentation (PostgreSQL only)
        if (DB::getDriverName() === 'pgsql') {
            DB::statement(
                "COMMENT ON TABLE ai_call_logs IS 'IMMUTABLE — append-only. No updates allowed except on human_feedback and feedback_notes columns'"
            );
            DB::statement(
                "COMMENT ON COLUMN ai_call_logs.status IS 'ENUM constraint enforced at application level: success, failed, timeout, rate_limited'"
            );
            DB::statement(
                "COMMENT ON COLUMN ai_call_logs.human_feedback IS 'ENUM constraint enforced at application level: accepted, rejected, ignored'"
            );
            DB::statement(
                "COMMENT ON COLUMN ai_model_versions.provider IS 'ENUM constraint enforced at application level: openai, anthropic, ollama, google'"
            );
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ai_call_logs');
        Schema::dropIfExists('ai_prompt_templates');
        Schema::dropIfExists('ai_model_versions');
    }
};
