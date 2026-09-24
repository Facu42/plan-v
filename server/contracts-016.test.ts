import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const contractPath = new URL('../supabase/contracts/016_plan_v_contract_draft.sql', import.meta.url);

async function contractSql(): Promise<string> {
  return (await readFile(contractPath, 'utf8')).replace(/\r\n/g, '\n');
}

function viewBody(sql: string, viewName: string): string {
  const match = sql.match(new RegExp(`create or replace view public\\.${viewName}[\\s\\S]*?;\\r?\\n`));
  if (!match) throw new Error(`Missing view ${viewName}`);
  return match[0];
}

function viewSelectList(viewSql: string): string {
  return viewSql.split(/\bfrom\b/i)[0] ?? viewSql;
}

function tableBody(sql: string, tableName: string): string {
  const match = sql.match(new RegExp(`create table if not exists public\\.${tableName} \\([\\s\\S]*?\\n\\);`));
  if (!match) throw new Error(`Missing table ${tableName}`);
  return match[0];
}

function occurrences(value: string, needle: string): number {
  return value.split(needle).length - 1;
}

describe('016 draft contract v2', () => {
  it('is explicitly marked as review-only and not applicable', async () => {
    const sql = await contractSql();
    expect(sql).toContain('DRAFT v2 — REVIEW ONLY — DO NOT APPLY');
    expect(sql).toContain('NO CORRER');
    expect(sql).not.toContain('supabase db push');
  });

  it('keeps patient-facing views free of internal professional fields', async () => {
    const sql = await contractSql();
    const patientsView = viewBody(sql, 'patients_patient_view');
    const mealLogsView = viewBody(sql, 'meal_logs_patient_view');
    const messagesView = viewBody(sql, 'messages_patient_view');
    const appointmentsView = viewBody(sql, 'appointments_patient_view');

    for (const internalField of ['note_for_nutri', 'adherence_why', 'nutritionist_id', 'prep_note']) {
      expect(viewSelectList(patientsView)).not.toContain(internalField);
      expect(viewSelectList(mealLogsView)).not.toContain(internalField);
      expect(viewSelectList(messagesView)).not.toContain(internalField);
      expect(viewSelectList(appointmentsView)).not.toContain(internalField);
    }

    expect(viewSelectList(messagesView)).not.toContain('suggested_by_ai');
    expect(mealLogsView).not.toContain('note_for_nutri');
    expect(appointmentsView).not.toContain('prep_note');
    expect(messagesView).toContain('sent_at is not null');
    expect(messagesView).not.toContain('suggested_by_ai = false');
  });

  it('uses definer views with billing gates, not invoker views over revoked tables', async () => {
    const sql = await contractSql();
    expect(sql).not.toContain('security_invoker');
    expect(viewBody(sql, 'meal_logs_patient_view')).toContain('patient_has_full_access');
    expect(viewBody(sql, 'appointments_patient_view')).toContain('patient_has_full_access');
    for (const view of ['patients_patient_view', 'meal_logs_patient_view', 'messages_patient_view', 'appointments_patient_view']) {
      expect(sql).toContain(`grant select on public.${view} to authenticated;`);
    }
  });

  it('denies patients raw-table reads on tables with professional-only columns', async () => {
    const sql = await contractSql();
    expect(sql).not.toContain('create policy patients_patient_select');
    expect(sql).not.toContain('create policy meal_logs_patient_select');
    expect(sql).not.toContain('create policy messages_patient_select');
    expect(sql).not.toContain('create policy appointments_patient_select');
  });

  it('covers the demo features that need production persistence', async () => {
    const sql = await contractSql();
    for (const required of [
      'patient_invites',
      'patient_invite_events',
      'habit_logs',
      'reminders',
      'timeline_events',
      'patient_assets',
      'audit_events',
      'privacy_requests',
      'meet_url',
      "brief_status as enum ('pending_review', 'done', 'dismissed')",
      'payments',
      'payment_webhook_events',
      'meal-photos',
      'patient_has_full_access',
    ]) {
      expect(sql).toContain(required);
    }
  });

  it('models the weekly menu as a recurring template, not dated rows', async () => {
    const sql = await contractSql();
    const slots = tableBody(sql, 'meal_slots');
    expect(slots).toContain('weekday smallint not null check (weekday between 0 and 6)');
    expect(slots).toContain('unique (patient_id, weekday, slot)');
    expect(slots).not.toContain('for_date');
    expect(slots).not.toContain('scheduled_time');
    expect(sql).toContain('0 = Lunes');
  });

  it('keeps the habit snapshot derived from habit_logs, not duplicated in patients', async () => {
    const sql = await contractSql();
    const patients = tableBody(sql, 'patients');
    expect(patients).not.toContain('hydration');
    expect(patients).not.toContain('energy');
    const habits = tableBody(sql, 'habit_logs');
    expect(habits).toContain('hydration int not null default 0');
    expect(habits).toContain('sleep_minutes int');
    expect(habits).toContain('unique (patient_id, date)');
  });

  it('matches current domain shapes: text source ids and appointment reminders', async () => {
    const sql = await contractSql();
    expect(sql).toContain("source_ids text[] not null default '{}'");
    expect(sql).toContain("create type public.reminder_kind as enum ('meal', 'water', 'sleep', 'appointment')");
  });

  it('prevents authenticated users from changing roles, billing or auth links', async () => {
    const sql = await contractSql();
    expect(sql).toContain('grant update (full_name, avatar_url) on public.profiles to authenticated;');
    expect(sql).not.toContain('grant update on public.profiles to authenticated;');

    const patientUpdateGrant = sql.match(/grant update \(\s*full_name, initials[\s\S]*?\) on public\.patients to authenticated;/)?.[0] ?? '';
    expect(patientUpdateGrant).toContain('full_name');
    for (const forbidden of ['billing_status', 'billing_until', 'user_id', 'nutritionist_id', 'deactivated_at', 'anonymized_at']) {
      expect(patientUpdateGrant).not.toContain(forbidden);
    }
    expect(sql).not.toContain('grant update on public.patients to authenticated;');
  });

  it('enforces patient and nutritionist tenant pairs in every duplicated relation', async () => {
    const sql = await contractSql();
    expect(sql).toContain('unique (id, nutritionist_id)');
    expect(occurrences(sql, 'foreign key (patient_id, nutritionist_id) references public.patients (id, nutritionist_id)')).toBeGreaterThanOrEqual(6);
    expect(sql).toContain('create or replace function public.validate_meal_log_slot()');
    expect(sql).toContain('create trigger validate_meal_log_slot_before_write');
  });

  it('validates message authors with a trigger and caller binding, not a check subquery', async () => {
    const sql = await contractSql();
    const messages = tableBody(sql, 'messages');
    expect(messages).not.toMatch(/check[\s\S]*select/i);
    expect(sql).toContain('create or replace function public.validate_message_author()');
    expect(sql).toContain('create trigger validate_message_author_before_write');
    expect(sql).toContain('new.author_id is distinct from auth.uid()');
  });

  it('keeps messages immutable and invite/payment transitions backend-only', async () => {
    const sql = await contractSql();
    expect(sql).not.toContain('create policy messages_nutri_all');
    expect(sql).not.toContain('create policy patient_invites_nutri_all');
    expect(sql).not.toContain('create policy payments_nutri_all');
    expect(sql).not.toContain('create policy payments_nutri_insert');

    expect(sql).toContain('create policy messages_nutri_select');
    expect(sql).toContain('create policy messages_nutri_insert');
    expect(sql).toContain('create policy patient_invites_nutri_select');
    expect(sql).toContain('create policy patient_invites_nutri_insert');
    expect(sql).toContain('create policy payments_nutri_select');

    expect(sql).toContain('grant select, insert on public.messages to authenticated;');
    expect(sql).not.toContain('grant select, insert, update, delete on public.messages');
    expect(sql).toContain('grant select, insert on public.patient_invites to authenticated;');
    expect(sql).toContain('grant select on public.payments to authenticated;');
  });

  it('restricts security-definer helpers and keeps billing checks scoped to self', async () => {
    const sql = await contractSql();
    expect(sql).toContain('and p.user_id = auth.uid()');
    expect(sql).not.toContain('set search_path = public');
    expect(sql).toContain('revoke all on function public.handle_new_user() from public, anon, authenticated;');
    expect(sql).toContain('revoke all on function public.validate_message_author() from public, anon, authenticated;');
    expect(sql).toContain('grant execute on function public.my_patient_id() to authenticated;');
    expect(sql).toContain('grant execute on function public.my_nutritionist_id() to authenticated;');
  });

  it('defines an atomic invite acceptance that requires a confirmed matching Auth email', async () => {
    const sql = await contractSql();
    expect(sql).toContain('create or replace function public.accept_patient_invite(invite_id uuid)');
    expect(sql).toContain('u.email_confirmed_at is not null');
    expect(sql).toContain('lower(u.email) = i.email');
    expect(sql).toContain("i.status = 'pending'");
    expect(sql).toContain('i.expires_at > now()');
    expect(sql).toContain('grant execute on function public.accept_patient_invite(uuid) to authenticated;');
  });

  it('keeps nutritionist provisioning restricted to service role', async () => {
    const sql = await contractSql();
    expect(sql).toContain('create or replace function public.provision_nutritionist');
    expect(sql).toContain('revoke all on function public.provision_nutritionist');
    expect(sql).toContain('grant execute on function public.provision_nutritionist');
    expect(sql).toContain('to service_role;');
    expect(sql).not.toContain('create policy nutritionists_insert_own');
  });

  it('defines invite lifecycle with history, not one mutable row', async () => {
    const sql = await contractSql();
    const invites = tableBody(sql, 'patient_invites');
    for (const required of ['expires_at', 'accepted_by', 'revoked_at', 'updated_at']) expect(invites).toContain(required);
    expect(invites).not.toContain('patient_id uuid not null unique');
    expect(invites).toContain('check (email = lower(btrim(email)))');
    expect(sql).toContain('on public.patient_invites (patient_id)');
    expect(sql).toMatch(/on public\.patient_invites \(patient_id\)\s+where status in/);
    expect(sql).toContain('on public.patient_invites (nutritionist_id, email)');
  });

  it('hardens payments: idempotency, read-only nutri and financial retention', async () => {
    const sql = await contractSql();
    expect(sql).toContain('create unique index if not exists payments_mp_payment_unique');
    expect(sql).toContain('create unique index if not exists payments_mp_preference_unique');
    expect(sql).toContain('unique (provider, external_event_id)');
    expect(tableBody(sql, 'payments')).toContain('on delete restrict');
  });

  it('hardens storage: forced bucket config, canonical paths and paid reads', async () => {
    const sql = await contractSql();
    expect(sql).toContain('on conflict (id) do update');
    expect(occurrences(sql, "(storage.foldername(name))[1] = 'patients'")).toBeGreaterThanOrEqual(5);
    const storagePatientSelect = sql.match(/create policy meal_photos_patient_select[\s\S]*?;\r?\n/)?.[0] ?? '';
    expect(storagePatientSelect).toContain('patient_has_full_access');
  });

  it('keeps the core 016 schema free of post-pilot extensions', async () => {
    const sql = await contractSql();
    expect(sql).not.toContain('exercise_library');
    expect(sql).not.toContain('routine_assignments');
    expect(sql).not.toContain('create table if not exists public.organizations');
  });
});
