<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     *
     * Execution order matters:
     *   1. Staff roles & permissions (no dependencies)
     *   2. AI model versions (no dependencies)
     *   3. AI prompt templates (depends on model versions)
     */
    public function run(): void
    {
        // ──────────────────────────────────────────────
        // Phase 0 Seeders
        // ──────────────────────────────────────────────

        // 1. Roles and permissions (Spatie)
        $this->call(StaffRolesSeeder::class);

        // 2. AI model versions (must run before prompt templates)
        $this->call(AiModelVersionSeeder::class);

        // 3. AI prompt templates (references model versions)
        $this->call(AiPromptTemplateSeeder::class);

        // ──────────────────────────────────────────────
        // Default user for local development
        // ──────────────────────────────────────────────
        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);
    }
}
