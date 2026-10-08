import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { expect, it } from 'vitest';
import type { ProfessionalModel } from '../../src/types/models.js';
const a = 'a0000000-0000-4000-8000-000000000001',
  b = 'b0000000-0000-4000-8000-000000000002',
  id = 'f0000000-0000-4000-8000-000000000001';
it('ejecuta almacenamiento con RLS, sólo RPC, revisión, publicación y copia desde fuente propia', async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon;create role authenticated;create table public.nutritionists(id uuid primary key);insert into public.nutritionists values('${a}'),('${b}');
   create function public.my_nutritionist_id() returns uuid language sql stable as $$select nullif(current_setting('test.owner',true),'')::uuid$$;
   create function public.recipe_assert_nutri() returns uuid language plpgsql as $$declare n uuid:=public.my_nutritionist_id();begin if n is null then raise exception using errcode='42501';end if;return n;end$$;
   create table public.meal_plans(id uuid primary key,nutritionist_id uuid,patient_id uuid);
   create table public.meal_plan_versions(id uuid primary key,meal_plan_id uuid,version int,payload jsonb);
   create function public.meal_plan_version_json(v uuid) returns jsonb language sql as $$select payload from public.meal_plan_versions where id=v$$;
   create function public.intake_assert_access(p uuid,professional boolean) returns void language plpgsql as $$begin if not exists(select 1 from public.meal_plans where patient_id=p and nutritionist_id=public.my_nutritionist_id()) then raise exception using errcode='42501';end if;end$$;`);
    const sql = await readFile(
      new URL(
        '../../supabase/migrations/20261008013013_professional_models.sql',
        import.meta.url,
      ),
      'utf8',
    );
    try {
      await db.exec(sql);
    } catch (e) {
      console.error(JSON.stringify(e));
      throw e;
    }
    await db.exec(`set role authenticated;set test.owner='${a}';`);
    const save = async (data: unknown) =>
      (
        await db.query<{ model: ProfessionalModel }>(
          'select public.save_professional_model($1::jsonb) as model',
          [JSON.stringify(data)],
        )
      ).rows[0].model;
    const act = async (m: ProfessionalModel, action: string) =>
      (
        await db.query<{ model: ProfessionalModel }>(
          'select public.act_professional_model($1,$2,$3) as model',
          [m.id, m.revision, action],
        )
      ).rows[0].model;
    const data = {
      id,
      expected_revision: null,
      kind: 'recommendations',
      title: 'Modelo',
      description: '',
      lines: ['Indicación original'],
      overrides: [],
    };
    const first = await save(data);
    const published = await act(first, 'publish');
    const edited = await save({
      ...data,
      expected_revision: published.revision,
      title: 'Edición',
    });
    expect(edited.current).toMatchObject({
      version: 2,
      title: 'Edición',
      published_at: null,
    });
    expect(edited.published).toMatchObject({ version: 1, title: 'Modelo' });
    await expect(
      save({ ...data, expected_revision: first.revision }),
    ).rejects.toMatchObject({ code: 'PT409' });
    await expect(
      save({ ...data, id: crypto.randomUUID(), plan: { days: 7, items: [] } }),
    ).rejects.toMatchObject({ code: '22023' });
    const planId = crypto.randomUUID(),
      patientId = crypto.randomUUID(),
      versionId = crypto.randomUUID(),
      revision = crypto.randomUUID(),
      componentId = crypto.randomUUID();
    const snapshot = {
      revision,
      period_start: '2026-10-07',
      period_end: '2026-10-13',
      nutrition_target: { private: true },
      items: [
        {
          id: crypto.randomUUID(),
          for_date: '2026-10-09',
          slot: 'Almuerzo',
          public_note: 'Original',
          dish_card: { private: true },
          components: [
            {
              id: componentId,
              kind: 'food',
              quantity: 1,
              measure: 'Taza',
              food_revision: 2,
              food_snapshot: { portions: [{ name: 'Taza', grams: 200 }] },
              public_note: 'Nota específica',
            },
          ],
        },
      ],
    };
    await db.exec('reset role;');
    await db.query('insert into public.meal_plans values($1,$2,$3)', [
      planId,
      a,
      patientId,
    ]);
    await db.query('insert into public.meal_plan_versions values($1,$2,1,$3)', [
      versionId,
      planId,
      JSON.stringify(snapshot),
    ]);
    await db.exec(`set role authenticated;set test.owner='${a}';`);
    const capture = {
      ...data,
      id: crypto.randomUUID(),
      kind: 'plan',
      lines: [],
      source: { patient_id: patientId, version: 1, revision },
      overrides: [
        {
          index: 0,
          public_note: 'Modelo',
          amounts: [{ id: componentId, quantity: 2 }],
          notes: [{ id: componentId, public_note: '' }],
        },
      ],
    };
    const copied = await save(capture);
    expect(copied.current.plan).toMatchObject({
      days: 7,
      items: [
        {
          day: 3,
          public_note: 'Modelo',
          components: [{ quantity: 2, public_note: '' }],
        },
      ],
    });
    expect(copied.current.plan!.items[0]).not.toHaveProperty('dish_card');
    expect(copied.current).not.toHaveProperty('nutrition_target');
    expect(copied.current.plan!.items[0]).not.toHaveProperty('for_date');
    await expect(
      save({
        ...capture,
        id: crypto.randomUUID(),
        overrides: [
          {
            index: 0,
            public_note: '',
            amounts: [{ id: componentId, quantity: 501 }],
          },
        ],
      }),
    ).rejects.toMatchObject({ code: '22023' });
    await expect(
      save({
        ...capture,
        id: crypto.randomUUID(),
        source: { ...capture.source, revision: crypto.randomUUID() },
      }),
    ).rejects.toMatchObject({ code: 'PT409' });
    await db.exec(`set test.owner='${b}';`);
    expect(
      (await db.query('select * from public.professional_models')).rows,
    ).toEqual([]);
    await expect(
      save({ ...capture, id: crypto.randomUUID() }),
    ).rejects.toMatchObject({ code: '42501' });
    await expect(act(edited, 'archive')).rejects.toMatchObject({
      code: '42501',
    });
    await expect(
      db.query('update public.professional_models set current=$1 where id=$2', [
        '{}',
        id,
      ]),
    ).rejects.toMatchObject({ code: '42501' });
    await db.exec("set test.owner='';");
    expect(
      (await db.query('select * from public.professional_models')).rows,
    ).toEqual([]);
    await expect(save(data)).rejects.toMatchObject({ code: '42501' });
    await db.exec('set role anon;');
    await expect(save(data)).rejects.toMatchObject({ code: '42501' });
    await db.exec(`reset role;set role authenticated;set test.owner='${a}';`);
    await act(edited, 'archive');
    await act(copied, 'archive');
    expect(
      (
        await db.query(
          'select * from public.professional_models where archived_at is null',
        )
      ).rows,
    ).toHaveLength(0);
  } finally {
    await db.close();
  }
}, 30000);
