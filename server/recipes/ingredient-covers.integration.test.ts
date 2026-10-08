import { randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ generate: vi.fn(), dish: vi.fn() }));
vi.mock('../ai/recipe-cover.js', async importOriginal => ({
  ...await importOriginal<typeof import('../ai/recipe-cover.js')>(), recipeCoverEnabled: () => true, generateRecipeCoverImage: mocks.dish,
}));
vi.mock('../ai/ingredient-cover.js', async importOriginal => ({
  ...await importOriginal<typeof import('../ai/ingredient-cover.js')>(), generateIngredientCoverImage: mocks.generate,
}));
import { planReviewSnapshot } from '../../src/types/plans.js';
import { app } from '../index.js';
import { handleProcessingJob } from '../jobs/handlers.js';
import { drain, processQueue } from '../jobs/queue.js';
import { resetStore } from '../store.js';
import { declareKnownHealth } from '../test/declare-health.js';

const patient = 'pat-sofia';
const image = { status: 'ready', bytes: Buffer.from('synthetic-only'), mime: 'image/png', alt: 'Ilustración IA' };
const call = (path: string, method = 'GET', body?: unknown) => app.request(path, {
  method, headers: { 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}),
});
const ingredientJobs = async () => (await processQueue.snapshot()).filter(job => job.kind === 'ingredient_cover');
const keys = async () => (await ingredientJobs()).map(job => job.payload.key).sort();

async function publishPlan(planId: string, recipeId: string) {
  const proposal = { title: 'Arroz con arvejas', yield_portions: 2, steps: ['Cocinar el arroz y servir.'], nutrition: null,
    ingredients: [{ name: 'Arroz integral', quantity: 100, unit: 'g' }, { name: 'Arvejas', quantity: 50, unit: 'g' }] };
  expect((await call(`/api/patients/${patient}/plans`, 'POST', { id: planId, period_start: '2026-10-05', period_end: '2026-10-11', items: [
    { for_date: '2026-10-05', slot: 'Almuerzo', recipe_id: recipeId, recipe_version: 1, portions: 1 },
    { for_date: '2026-10-06', slot: 'Cena', free_text: proposal.title, recipe_proposal: proposal, portions: 2 },
  ] })).status).toBe(200);
  const saved = await (await call(`/api/patients/${patient}/plans?audience=pro`)).json();
  return call(`/api/plans/${planId}/publish`, 'POST', { expected_version: 1, expected_snapshot: planReviewSnapshot(saved.plan.current) });
}

describe('fotos de ingredientes: del plan publicado al detalle de la receta', () => {
  let recipeId: string, planId: string;
  beforeEach(async () => {
    vi.resetAllMocks(); resetStore(); await declareKnownHealth(patient);
    mocks.generate.mockResolvedValue(image); mocks.dish.mockResolvedValue({ status: 'failed' });
    recipeId = randomUUID(); planId = randomUUID();
    expect((await call('/api/recipes', 'POST', { id: recipeId, title: 'Ensalada de tomate', yield_portions: 2, steps: ['Cortar y servir.'], nutrient_source: 'Tabla',
      items: [{ name: 'Tomates', quantity: 200, unit: 'g' }, { name: 'Cebolla', quantity: 50, unit: 'g' }] })).status).toBe(200);
    expect((await call(`/api/recipes/${recipeId}/publish`, 'POST', { expected_version: 1 })).status).toBe(200);
    expect((await call(`/api/recipes/${recipeId}/assign`, 'POST', { patient_id: patient, expected_version: 1 })).status).toBe(200);
  });

  it('publicar la receta sola no inicia ninguna foto de ingrediente', async () => {
    expect(await ingredientJobs()).toHaveLength(0);
  });

  it('publicar el plan encola los ingredientes únicos sin bloquear ni cambiar el plan de la paciente', async () => {
    expect((await publishPlan(planId, recipeId)).status).toBe(200);
    expect(await keys()).toEqual(['arroz-integral', 'arveja', 'cebolla', 'tomate']);
    const mine = (await (await call(`/api/patients/${patient}/plans`)).json()).plan;
    expect(mine.items).toHaveLength(2);
    expect(mine.items[0].recipe.ingredients.map((i: { name: string }) => i.name)).toEqual(['Cebolla', 'Tomates']);
    expect(mine.items[0].recipe.ingredients[0].ingredient_cover_url).toBeUndefined();
  });

  it('con las fotos listas, la paciente recibe la dirección en cada ingrediente de recetas y de platos del plan', async () => {
    await publishPlan(planId, recipeId);
    await drain(processQueue, 'test-worker', handleProcessingJob, 40);
    expect(mocks.generate.mock.calls.map(([key]) => key).sort()).toEqual(['arroz-integral', 'arveja', 'cebolla', 'tomate']);
    const dataUrl = `data:image/png;base64,${image.bytes.toString('base64')}`;
    const plan = (await (await call(`/api/patients/${patient}/plans`)).json()).plan;
    const fromRecipe = plan.items.find((i: { recipe: unknown }) => i.recipe).recipe.ingredients;
    const fromProposal = plan.items.find((i: { recipe_proposal: unknown }) => i.recipe_proposal).recipe_proposal.ingredients;
    for (const ingredient of [...fromRecipe, ...fromProposal]) expect(ingredient).toMatchObject({ ingredient_cover_url: dataUrl, ingredient_cover_alt: 'Ilustración IA' });
    expect(fromRecipe[1]).toMatchObject({ name: 'Tomates', quantity: 200, unit: 'g' });
    const assigned = (await (await call(`/api/patients/${patient}/recipes`)).json()).recipes[0].ingredients;
    expect(assigned.every((i: { ingredient_cover_url: string }) => i.ingredient_cover_url === dataUrl)).toBe(true);
  });

  it('la vista de la profesional y la copia a revisar no cambian por las fotos', async () => {
    await publishPlan(planId, recipeId);
    const before = await (await call(`/api/patients/${patient}/plans?audience=pro`)).json();
    await drain(processQueue, 'test-worker', handleProcessingJob, 40);
    const after = await (await call(`/api/patients/${patient}/plans?audience=pro`)).json();
    const clinical = (plan: { current: { items: Array<{ recipe_proposal?: unknown; free_text: string | null; recipe_id: string | null }> } }) =>
      plan.current.items.map(({ recipe_proposal, free_text, recipe_id }) => ({ recipe_proposal, free_text, recipe_id }));
    expect(JSON.stringify(after)).not.toContain('ingredient_cover');
    expect(clinical(after.plan)).toEqual(clinical(before.plan));
    expect(planReviewSnapshot(after.plan.current)).toEqual(planReviewSnapshot(before.plan.current));
  });

  it('«Preparar fotos pendientes» vuelve a encolar los ingredientes que quedaron sin foto', async () => {
    mocks.generate.mockResolvedValue({ status: 'failed', retry_after_ms: 60_000 });
    await publishPlan(planId, recipeId);
    for (let i = 0; i < 3; i += 1) {
      await processQueue.replaceAll((await processQueue.snapshot()).map(job => ({ ...job, run_after: new Date(0).toISOString() })));
      await drain(processQueue, 'test-worker', handleProcessingJob, 40);
    }
    expect((await ingredientJobs()).every(job => job.status === 'dead')).toBe(true);
    mocks.generate.mockResolvedValue(image);
    expect((await call(`/api/plans/${planId}/covers`, 'POST', { expected_version: 1 })).status).toBe(200);
    expect((await ingredientJobs()).filter(job => job.status === 'queued')).toHaveLength(4);
    await drain(processQueue, 'test-worker', handleProcessingJob, 40);
    const plan = (await (await call(`/api/patients/${patient}/plans`)).json()).plan;
    expect(plan.items[0].recipe.ingredients.every((i: { ingredient_cover_url?: string }) => i.ingredient_cover_url?.startsWith('data:image/png'))).toBe(true);
  });

  it('un ingrediente fuera del vocabulario (texto libre) no se encola, no llega al proveedor y queda sin foto', async () => {
    const proposal = { title: 'Plato raro', yield_portions: 1, steps: ['Servir.'], nutrition: null,
      ingredients: [{ name: 'Tomate', quantity: 100, unit: 'g' }, { name: 'Receta secreta de Sofía', quantity: 10, unit: 'g' }] };
    const id = randomUUID();
    expect((await call(`/api/patients/${patient}/plans`, 'POST', { id, period_start: '2026-10-05', period_end: '2026-10-11',
      items: [{ for_date: '2026-10-05', slot: 'Cena', free_text: proposal.title, recipe_proposal: proposal, portions: 1 }] })).status).toBe(200);
    const saved = await (await call(`/api/patients/${patient}/plans?audience=pro`)).json();
    expect((await call(`/api/plans/${id}/publish`, 'POST', { expected_version: 1, expected_snapshot: planReviewSnapshot(saved.plan.current) })).status).toBe(200);
    expect(await keys()).toEqual(['tomate']);
    await drain(processQueue, 'test-worker', handleProcessingJob, 40);
    expect(mocks.generate.mock.calls.map(([key]) => key)).toEqual(['tomate']);
    const [withPhoto, without] = (await (await call(`/api/patients/${patient}/plans`)).json()).plan.items[0].recipe_proposal.ingredients;
    expect(withPhoto.ingredient_cover_url).toMatch(/^data:image/);
    expect(without).toEqual({ name: 'Receta secreta de Sofía', quantity: 10, unit: 'g' });
  });

  it('pedir la foto de una receta publicada también reserva sus ingredientes', async () => {
    expect((await call(`/api/recipes/${recipeId}/cover`, 'POST', { expected_version: 1 })).status).toBe(200);
    expect(await keys()).toEqual(['cebolla', 'tomate']);
  });

  it('las tareas de ingredientes sólo llevan la clave: ni pacientes ni cantidades ni notas', async () => {
    await publishPlan(planId, recipeId);
    for (const job of await ingredientJobs()) expect(job.payload).toEqual({ key: expect.stringMatching(/^[a-z0-9-]+$/) });
    expect(JSON.stringify(await ingredientJobs())).not.toMatch(/pat-sofia|Sofía|quantity/);
  });
});
