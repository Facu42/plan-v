import { beforeEach, expect, it } from 'vitest';
import { app } from '../index.js';
import { DEMO_NUTRITIONIST_ID } from '../store.js';
import {
  getProfessionalMealPlan,
  resetMealPlanMemory,
  saveMealPlanDraft,
} from '../plans/repository.js';
import { modelAction, resetModelsMemory, saveModel } from './repository.js';
import { modelSaveSchema } from '../../src/types/models.js';

const input = () =>
  modelSaveSchema.parse({
    id: crypto.randomUUID(),
    expected_revision: null,
    kind: 'recommendations',
    title: 'Antes de cocinar',
    description: '',
    lines: ['Organizar los ingredientes.'],
  });
const post = (path: string, data: unknown) =>
  app.request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
beforeEach(() => {
  resetModelsMemory();
  resetMealPlanMemory();
});
it('publicar exige revisión y editar conserva la copia publicada; archivar retira el catálogo', async () => {
  const first = await post('/api/models', input());
  expect(first.status).toBe(200);
  const { model } = await first.json();
  expect(
    (
      await post(`/api/models/${model.id}/publish`, {
        expected_revision: model.revision,
      })
    ).status,
  ).toBe(400);
  const response = await post(`/api/models/${model.id}/publish`, {
    expected_revision: model.revision,
    reviewed: true,
  });
  expect(response.status).toBe(200);
  const published = (await response.json()).model;
  const edit = await post('/api/models', {
    ...input(),
    id: model.id,
    expected_revision: published.revision,
    title: 'Nueva edición',
    lines: ['Nueva indicación.'],
  });
  expect(edit.status).toBe(200);
  const changed = (await edit.json()).model;
  expect(changed.current).toMatchObject({
    version: 2,
    title: 'Nueva edición',
    published_at: null,
  });
  expect(changed.published).toMatchObject({
    version: 1,
    title: 'Antes de cocinar',
    lines: ['Organizar los ingredientes.'],
  });
  expect(
    (
      await post(`/api/models/${changed.id}/archive`, {
        expected_revision: published.revision,
        reviewed: true,
      })
    ).status,
  ).toBe(409);
  expect(
    (
      await post(`/api/models/${changed.id}/archive`, {
        expected_revision: changed.revision,
        reviewed: true,
      })
    ).status,
  ).toBe(200);
  expect((await (await app.request('/api/models')).json()).models).toEqual([]);
});
it('copia sólo contenido de un plan propio, con días relativos y fuente vigente; no modifica el plan', async () => {
  const source = await saveMealPlanDraft(
    DEMO_NUTRITIONIST_ID,
    'pat-sofia',
    {
      id: crypto.randomUUID(),
      period_start: '2026-10-07',
      period_end: '2026-10-13',
      timezone: 'America/Argentina/Buenos_Aires',
      items: [
        {
          for_date: '2026-10-09',
          slot: 'Almuerzo',
          free_text: 'Indicación original',
          public_note: 'Nota original',
        },
      ],
    },
    false,
  );
  const data = modelSaveSchema.parse({
    ...input(),
    kind: 'plan',
    lines: [],
    source: {
      patient_id: 'pat-sofia',
      version: source.current.version,
      revision: source.current.revision,
    },
    overrides: [{ index: 0, public_note: 'Nota modelo' }],
  });
  const copied = await saveModel(DEMO_NUTRITIONIST_ID, data, false);
  expect(copied.current.plan).toMatchObject({
    days: 7,
    items: [{ day: 3, public_note: 'Nota modelo' }],
  });
  expect(JSON.stringify(copied)).not.toContain('pat-sofia');
  expect(copied.current.plan!.items[0]).not.toHaveProperty('for_date');
  expect(copied.current).not.toHaveProperty('nutrition_target');
  expect(
    (await getProfessionalMealPlan(DEMO_NUTRITIONIST_ID, 'pat-sofia', false))!
      .current.items[0].public_note,
  ).toBe('Nota original');
  await expect(
    saveModel('another-owner', { ...data, id: crypto.randomUUID() }, false),
  ).rejects.toMatchObject({ status: 409 });
  await expect(
    saveModel(
      DEMO_NUTRITIONIST_ID,
      {
        ...data,
        id: crypto.randomUUID(),
        source: { ...data.source!, revision: crypto.randomUUID() },
      },
      false,
    ),
  ).rejects.toMatchObject({ status: 409 });
});
it('rechaza cambios antiguos, propietarios distintos, snapshots inventados y modelos vacíos al publicar', async () => {
  const data = input(),
    saved = await saveModel(DEMO_NUTRITIONIST_ID, data, false);
  await expect(
    saveModel(
      'foreign-owner',
      { ...data, expected_revision: saved.revision },
      false,
    ),
  ).rejects.toMatchObject({ status: 403 });
  await expect(
    saveModel(DEMO_NUTRITIONIST_ID, data, false),
  ).rejects.toMatchObject({ status: 409 });
  expect(
    (await post('/api/models', { ...input(), plan: { items: [] } })).status,
  ).toBe(400);
  const empty = await saveModel(
    DEMO_NUTRITIONIST_ID,
    modelSaveSchema.parse({ ...input(), kind: 'plan', lines: [] }),
    false,
  );
  await expect(
    modelAction(
      DEMO_NUTRITIONIST_ID,
      empty.id,
      empty.revision,
      'publish',
      false,
    ),
  ).rejects.toMatchObject({ status: 400 });
});
