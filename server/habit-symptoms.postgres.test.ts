import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFile, readdir } from 'node:fs/promises';
import { SYMPTOM_KEYS } from '../src/types/symptoms.js';

// La columna de síntomas acepta solo la lista cerrada de la app y arranca vacía.
let db: PGlite;

beforeAll(async () => {
  db = new PGlite();
  await db.exec(await readFile(new URL('../supabase/disposable/bootstrap.sql', import.meta.url), 'utf8'));
  const dir = new URL('../supabase/migrations/', import.meta.url);
  for (const f of (await readdir(dir)).filter(f => f.endsWith('.sql')).sort()) await db.exec(await readFile(new URL(f, dir), 'utf8'));
  // Solo se prueba la restricción de la columna: sin claves foráneas para no armar una paciente entera.
  await db.exec("set session_replication_role = replica");
}, 120000);
afterAll(async () => { await db?.close(); });

const insert = (symptoms: string[] | null, date: string) => db.query(
  `insert into public.habit_logs (patient_id, date${symptoms ? ', symptoms' : ''}) values (gen_random_uuid(), $1${symptoms ? ', $2' : ''}) returning symptoms`,
  symptoms ? [date, symptoms] : [date],
);

describe('síntomas del día en habit_logs', () => {
  it('una fila nueva arranca sin síntomas', async () => {
    const result = await insert(null, '2026-10-15');
    expect(result.rows[0]).toEqual({ symptoms: [] });
  });

  it('acepta todas las claves que ofrece la app', async () => {
    const result = await insert([...SYMPTOM_KEYS], '2026-10-16');
    expect(result.rows[0]).toEqual({ symptoms: [...SYMPTOM_KEYS] });
  });

  it('rechaza un síntoma que no está en la lista', async () => {
    await expect(insert(['acidez', 'inventado'], '2026-10-17')).rejects.toThrow(/habit_logs_symptoms_known/);
  });
});
