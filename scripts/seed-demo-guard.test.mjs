import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { decideSeedApply, PLAN_V_APP_REF, SEED_CONFIRM, SYNTHETIC_ROSTER } from './seed-demo-guard.mjs';

const localUrl = 'postgres://planv@127.0.0.1:55433/planv_disposable';

describe('NV-SEED guard', () => {
  it('arma Verónica Demo y cuatro pacientes sintéticos, sin PHI real', () => {
    expect(SYNTHETIC_ROSTER.nutritionist.displayName).toBe('Verónica Demo');
    expect(SYNTHETIC_ROSTER.nutritionist.email).toMatch(/@planv\.test$/);
    expect(SYNTHETIC_ROSTER.patients).toHaveLength(4);
    expect(SYNTHETIC_ROSTER.patients.map((row) => row.fullName)).toEqual([
      'Sofía Demo', 'Marina Demo', 'Luca Demo', 'Elena Demo',
    ]);
    const blob = JSON.stringify(SYNTHETIC_ROSTER);
    expect(blob).not.toMatch(/gmail\.com|hotmail|@planv\.com/i);
  });

  it('aplica sólo en localhost vacío y con la confirmación explícita', () => {
    expect(decideSeedApply({
      databaseUrl: localUrl,
      confirm: SEED_CONFIRM,
      appMode: 'test',
      patientCount: 0,
    })).toEqual({ ok: true, reason: 'empty' });
  });

  it('se detiene si ya hay filas en patients, sin ejecutar el SQL', () => {
    expect(decideSeedApply({
      databaseUrl: localUrl,
      confirm: SEED_CONFIRM,
      appMode: 'test',
      patientCount: 1,
    })).toEqual({ ok: false, reason: 'patients' });
  });

  it('rechaza plan-v-app, Supabase hospedado, producción y un conteo no verificado', () => {
    const hosted = `postgres://postgres:secret@db.${PLAN_V_APP_REF}.supabase.co:5432/postgres`;
    expect(decideSeedApply({ databaseUrl: hosted, confirm: SEED_CONFIRM, appMode: 'test', patientCount: 0 }).reason).toBe('hosted');
    expect(decideSeedApply({
      databaseUrl: 'postgres://postgres@db.example.supabase.co:5432/postgres',
      confirm: SEED_CONFIRM,
      appMode: 'test',
      patientCount: 0,
    }).reason).toBe('hosted');
    expect(decideSeedApply({ databaseUrl: localUrl, confirm: SEED_CONFIRM, appMode: 'production', patientCount: 0 }).reason).toBe('production');
    expect(decideSeedApply({ databaseUrl: localUrl, confirm: 'yes', appMode: 'test', patientCount: 0 }).reason).toBe('confirm');
    expect(decideSeedApply({ databaseUrl: localUrl, confirm: SEED_CONFIRM, appMode: 'test', patientCount: null }).reason).toBe('unverified');
    expect(decideSeedApply({
      databaseUrl: 'postgres://planv@db.internal:5432/planv',
      confirm: SEED_CONFIRM,
      appMode: 'test',
      patientCount: 0,
    }).reason).toBe('host');
  });

  it('el script sale antes de psql si falta la confirmación', () => {
    const result = spawnSync(process.execPath, ['scripts/seed-demo.mjs'], {
      encoding: 'utf8',
      env: { ...process.env, APP_MODE: 'test', PLANV_SEED_APPLY: '', DISPOSABLE_DATABASE_URL: '' },
    });
    expect(result.status).not.toBe(0);
    expect(`${result.stderr}${result.stdout}`).toMatch(/Refusing demo seed/);
  });

  it('el SQL es idempotente, sintético y no nombra el proyecto hospedado', () => {
    const sql = readFileSync(new URL('./seed-demo.sql', import.meta.url), 'utf8');
    expect(sql).toMatch(/on conflict/i);
    expect(sql).toContain('Verónica Demo');
    expect(sql).toContain('Bowl de pollo y vegetales');
    expect(sql).toContain('begin;');
    expect(sql).toContain('commit;');
    expect(sql).not.toContain(PLAN_V_APP_REF);
    expect(sql).not.toMatch(/https?:\/\//);
    expect(sql).toContain('photo_path');
  });
});
