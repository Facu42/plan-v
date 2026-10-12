import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('bolsa atómica en Postgres, cerrada a usuarias', () => {
  it('rechaza exceso, duplicados y permisos directos; liquida sin liberar gasto incierto', async () => {
    const db = new PGlite();
    try {
      await db.exec('create role anon; create role authenticated; create role service_role bypassrls; grant usage on schema public to service_role;');
      await db.exec(await readFile(new URL('../../supabase/migrations/20261011140000_clinical_ai_budget.sql', import.meta.url), 'utf8'));
      await db.exec('set role service_role');
      const month = (await db.query<{ month: string }>("select to_char(now() at time zone 'America/Argentina/Buenos_Aires','YYYY-MM') as month")).rows[0].month;
      await db.query('select public.reserve_clinical_ai_budget($1,$2,$3)', ['a', month, 4_000_000]);
      await expect(db.query('select public.reserve_clinical_ai_budget($1,$2,$3)', ['b', month, 1_000_001])).rejects.toThrow();
      await expect(db.query('select public.reserve_clinical_ai_budget($1,$2,$3)', ['a', month, 0])).rejects.toThrow();
      await db.query('select public.settle_clinical_ai_budget($1,$2,$3)', ['a', 'uncertain', 0]);
      const result = (await db.query<{ used_micros: number }>('select used_micros from public.clinical_ai_budget_months')).rows[0];
      expect(Number(result.used_micros)).toBe(4_000_000);
      await db.exec('reset role; set role authenticated');
      await expect(db.query('select * from public.clinical_ai_spend')).rejects.toThrow();
      await expect(db.query('select public.reserve_clinical_ai_budget($1,$2,$3)', ['c', month, 0])).rejects.toThrow();
    } finally { await db.close(); }
  });
});
