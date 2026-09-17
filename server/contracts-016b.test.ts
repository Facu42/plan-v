import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const contractPath = new URL('../supabase/contracts/016b_piloto_ampliacion_draft.sql', import.meta.url);

async function contractSql(): Promise<string> {
  return (await readFile(contractPath, 'utf8')).replace(/\r\n/g, '\n');
}

describe('016b pilot expansion draft', () => {
  it('is review-only and not a migration', async () => {
    const sql = await contractSql();
    expect(sql).toContain('DRAFT 016b — REVIEW ONLY — DO NOT APPLY');
    expect(sql).toContain('NO CORRER');
    expect(sql).not.toContain('supabase db push');
  });

  it('covers the remaining pilot domains without post-pilot extensions', async () => {
    const sql = await contractSql();
    for (const required of [
      'intake_sessions',
      'patient_health_profiles',
      'clinical_notes',
      'consent_events',
      'asset_upload_intents',
      'document_records',
      'body_photo_entries',
      'measurements',
      'recipes',
      'recipe_versions',
      'meal_plans',
      'meal_plan_versions',
      'meal_analysis_runs',
      'activity_logs',
      'goal_history',
      'message_receipts',
      'appointment_events',
      'resources',
      'resource_assignments',
      'ai_jobs',
      'ai_artifacts',
      'outbox_events',
    ]) {
      expect(sql).toContain(`create table if not exists public.${required}`);
    }
    expect(sql).not.toContain('create table if not exists public.exercise_library');
    expect(sql).not.toContain('create table if not exists public.routine_assignments');
    expect(sql).not.toContain('create table if not exists public.organizations');
    expect(sql).not.toContain('create table if not exists public.shopping_lists');
  });

  it('keeps clinical notes and AI drafts away from patients', async () => {
    const sql = await contractSql();
    expect(sql).toContain('create policy clinical_notes_nutri_all');
    expect(sql).not.toContain('create policy clinical_notes_patient');
    expect(sql).toContain('create policy ai_jobs_nutri_all');
    expect(sql).not.toContain('create policy ai_jobs_patient');
    expect(sql).toContain('revoke all on public.clinical_notes from anon, authenticated');
    expect(sql).toContain('revoke all on public.ai_jobs from anon, authenticated');
  });

  it('treats consents as append-only events with a hashed text version', async () => {
    const sql = await contractSql();
    expect(sql).toContain('text_hash text not null');
    expect(sql).toContain('create policy consent_events_patient_insert');
    expect(sql).not.toContain('create policy consent_events_patient_update');
    expect(sql).not.toContain('create policy consent_events_patient_delete');
    expect(sql).toContain('grant select, insert on public.consent_events to authenticated');
    expect(sql).not.toContain('grant update on public.consent_events');
  });

  it('versions recipes and plans so a draft cannot overwrite a published copy', async () => {
    const sql = await contractSql();
    expect(sql).toContain('unique (recipe_id, version)');
    expect(sql).toContain('unique (meal_plan_id, version)');
    expect(sql).toContain('meal_plan_versions_one_published');
    expect(sql).toContain("where status = 'published'");
  });
});
