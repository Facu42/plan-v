import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const sql = await readFile(new URL('../supabase/migrations/20261010183000_patient_goal_followup.sql', import.meta.url), 'utf8');

function viewBody(name: string) {
  const match = sql.match(new RegExp(`create or replace view public\\.${name}[\\s\\S]*?;`));
  if (!match) throw new Error(`Falta la vista ${name}`);
  return match[0];
}

describe('migración del objetivo de seguimiento', () => {
  it('guarda estado, avance e historial, y la vista de la paciente no trae la nota', () => {
    expect(sql).toContain('create table if not exists public.goal_history');
    expect(sql).toContain('set_patient_goal');
    expect(sql).toContain("next_status not in ('active', 'paused', 'completed')");
    expect(viewBody('goal_updates_patient_view')).not.toMatch(/\bnote\b/);
    expect(viewBody('patient_goal_patient_view')).toContain('goal_status');
    expect(viewBody('patient_goal_patient_view')).not.toMatch(/\bnote\b/);
    expect(sql).toContain('private.patient_goal_projection()');
    expect(sql).not.toContain('drop function if exists private.patient_profile_projection');
    expect(sql).toContain('security_invoker = true');
    expect(sql).not.toMatch(/DRAFT|DO NOT APPLY|NO CORRER/i);
  });
});