import { describe, expect, it } from 'vitest';
import { createActorClient } from './db/supabase-client.js';

const live = Boolean(
  process.env.DISPOSABLE_SUPABASE_URL
  && process.env.VITE_SUPABASE_ANON_KEY
  && process.env.RLS_JWT_NUTRI_A
  && process.env.RLS_JWT_NUTRI_B
  && process.env.RLS_PATIENT_B_ID,
);

describe('RLS A/B matrix (JWT, never service_role)', () => {
  it('keeps the disposable runner from applying drafts without an explicit confirm', async () => {
    const { readFile } = await import('node:fs/promises');
    const sql = await readFile(new URL('../supabase/contracts/016_plan_v_contract_draft.sql', import.meta.url), 'utf8');
    expect(sql).toContain('DO NOT APPLY');
    expect(sql).toContain('create policy');
  });

  it.skipIf(!live)('RLS-02: Nutri A cannot read Paciente B with a JWT client', async () => {
    process.env.SUPABASE_URL = process.env.DISPOSABLE_SUPABASE_URL;
    process.env.VITE_SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
    const nutriA = createActorClient(process.env.RLS_JWT_NUTRI_A);
    expect(nutriA).not.toBeNull();
    const { data, error } = await nutriA!.from('patients').select('id').eq('id', process.env.RLS_PATIENT_B_ID);
    expect(error).toBeNull();
    expect(data ?? []).toEqual([]);
  });

  it.skipIf(!live)('RLS-02 write: Nutri A cannot update Paciente B', async () => {
    process.env.SUPABASE_URL = process.env.DISPOSABLE_SUPABASE_URL;
    const nutriA = createActorClient(process.env.RLS_JWT_NUTRI_A);
    const { data } = await nutriA!.from('patients').update({ goal: 'cross-tenant' }).eq('id', process.env.RLS_PATIENT_B_ID).select('id');
    expect(data ?? []).toEqual([]);
  });
});
