import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { expect, it } from 'vitest';
import { foodInputSchema } from '../../src/types/foods.js';

const a = 'a0000000-0000-4000-8000-000000000001';
const b = 'b0000000-0000-4000-8000-000000000002';
const id = 'f0000000-0000-4000-8000-000000000001';
const input = foodInputSchema.parse({ id, expected_revision: 0, name: 'Avena', kind: 'food', source: 'Etiqueta', nutrients: { kcal: 380, fat: 0 }, portions: [{ name: 'Cucharada', grams: 10 }] });
const { id: _, expected_revision: __, ...payload } = input;
it('ejecuta la migración y conserva datos con RLS A/B, revisión y validación en base', async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role;
      create table public.nutritionists(id uuid primary key);
      insert into public.nutritionists values ('${a}'),('${b}');
      create function public.my_nutritionist_id() returns uuid language sql stable as $$select nullif(current_setting('test.owner',true),'')::uuid$$;
      grant execute on function public.my_nutritionist_id() to authenticated;`);
    await db.exec(await readFile(new URL('../../supabase/migrations/20261007160000_food_catalog.sql', import.meta.url), 'utf8'));
    await db.exec(`set role authenticated; set test.owner='${a}';`);
    const save = (revision: number, data: unknown = payload) => db.query<{ saved: { id: string; revision: number; payload: typeof payload } }>('select public.save_food_catalog_item($1::uuid,$2::bigint,$3::jsonb) as saved', [id, revision, JSON.stringify(data)]);
    expect((await save(0)).rows[0].saved).toMatchObject({ revision: 1, payload: { nutrients: { kcal: 380, protein: null, fat: 0 } } });
    expect((await save(0)).rows[0].saved.revision).toBe(1);
    expect((await save(1, { ...payload, name: 'Avena integral' })).rows[0].saved.revision).toBe(2);
    await expect(save(1)).rejects.toMatchObject({ code: 'PT409' });
    await expect(save(2, { ...payload, nutrients: { ...payload.nutrients, kcal: -1 } })).rejects.toMatchObject({ code: '22023' });
    await expect(save(2, { ...payload, portions: [{ name: 'Taza', grams: 1 }, { name: ' taza ', grams: 2 }] })).rejects.toMatchObject({ code: '22023' });
    await db.exec(`set test.owner='${b}';`);
    expect((await db.query('select * from public.food_catalog')).rows).toEqual([]);
    await expect(save(2)).rejects.toMatchObject({ code: 'PT409' });
    await expect(db.query('insert into public.food_catalog(id,owner_id,payload) values($1,$2,$3)', ['f0000000-0000-4000-8000-000000000003', a, JSON.stringify(payload)])).rejects.toMatchObject({ code: '42501' });
    await db.exec("set test.owner='';");
    expect((await db.query('select * from public.food_catalog')).rows).toEqual([]);
    await expect(save(0)).rejects.toMatchObject({ code: '42501' });
    await db.exec('set role anon;');
    await expect(db.query('select * from public.food_catalog')).rejects.toMatchObject({ code: '42501' });
    await expect(save(0)).rejects.toMatchObject({ code: '42501' });
    await db.exec(`reset role; set role authenticated; set test.owner='${a}';`);
    expect((await db.query<{ payload: typeof payload }>('select payload from public.food_catalog where id=$1', [id])).rows[0].payload.name).toBe('Avena integral');
  } finally { await db.close(); }
}, 30000);
