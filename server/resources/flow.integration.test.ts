import { beforeEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { app } from '../index.js';
import { getPatient, resetStore } from '../store.js';
import { CareError, resourceDbError } from './repository.js';
import { declareKnownHealth } from '../test/declare-health.js';
import type { PatientLibraryView } from '../../src/types/resources.js';

const patient = 'pat-sofia';
const other = 'pat-marina';

function post(path: string, body: unknown, method = 'POST') {
  return app.request(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function library(id = patient, professional = false, query = '') {
  const qs = new URLSearchParams();
  if (professional) qs.set('audience', 'pro');
  if (query) qs.set('q', query);
  const suffix = qs.toString() ? `?${qs}` : '';
  const response = await app.request(`/api/patients/${id}/library${suffix}`);
  return { status: response.status, body: await response.json() as { library: PatientLibraryView; source: string } };
}

describe('PV-36 recursos editoriales y favoritos unificados', () => {
  beforeEach(() => resetStore());

  it('muestra guías operativas, oculta artículos clínicos sin asignar y aísla a la otra paciente', async () => {
    const mine = await library();
    expect(mine.status).toBe(200);
    expect(mine.body.library.resources).toHaveLength(6);
    expect(mine.body.library.articles).toEqual([]);
    expect(mine.body.library.hits.some((hit) => hit.kind === 'article')).toBe(false);
    expect(JSON.stringify(mine.body.library)).not.toMatch(/diagnóstico|prescripción|kcal/i);

    const assigned = await post('/api/resources/assign', {
      resource_id: 'hidratacion-cotidiana',
      patient_ids: [patient],
    });
    expect(assigned.status).toBe(200);
    const after = await library();
    expect(after.body.library.articles.map((entry) => entry.slug)).toEqual(['hidratacion-cotidiana']);
    expect(after.body.library.articles[0].author_name).toBe('Equipo editorial Plan V');
    expect(after.body.library.articles[0].reviewed_at).toBeTruthy();
    expect(after.body.library.articles[0].cover_url).toBeNull();

    const marina = await library(other);
    expect(marina.body.library.articles).toEqual([]);
    expect(getPatient(other)?.resource_assignments ?? []).toEqual([]);
  });

  it('persiste favoritos de guía, artículo y receta; Plan B sólo aparece en búsqueda profesional', async () => {
    await declareKnownHealth(patient);
    await post('/api/resources/assign', { resource_id: 'hidratacion-cotidiana', patient_ids: [patient] });
    const savedGuide = await post(`/api/patients/${patient}/favorites`, { item_kind: 'resource', item_id: 'leer-plan-semanal' });
    expect(savedGuide.status).toBe(200);
    const guideBody = await savedGuide.json() as { library: PatientLibraryView };
    expect(guideBody.library.favorites[0]).toMatchObject({ item_kind: 'resource', item_id: 'leer-plan-semanal' });

    const savedArticle = await post(`/api/patients/${patient}/favorites`, { item_kind: 'article', item_id: 'hidratacion-cotidiana' });
    expect(savedArticle.status).toBe(200);

    const hidden = await post(`/api/patients/${patient}/favorites`, { item_kind: 'article', item_id: 'comidas-fuera-de-casa' });
    expect(hidden.status).toBe(403);

    const recipeId = randomUUID();
    expect((await post('/api/recipes', {
      id: recipeId,
      title: 'Bowl de lentejas',
      yield_portions: 2,
      steps: ['Lavar.', 'Cocinar.'],
      nutrient_source: 'Tabla del consultorio',
      items: [{ name: 'Lentejas', quantity: 80, unit: 'g' }],
    })).status).toBe(200);
    expect((await post(`/api/recipes/${recipeId}/publish`, { expected_version: 1 })).status).toBe(200);
    expect((await post(`/api/recipes/${recipeId}/assign`, { patient_id: patient, expected_version: 1 })).status).toBe(200);
    expect((await post(`/api/patients/${patient}/favorites`, { item_kind: 'recipe', item_id: recipeId })).status).toBe(200);

    const mine = await library(patient, false, 'lentejas');
    expect(mine.body.library.hits.some((hit) => hit.kind === 'recipe' && hit.title === 'Bowl de lentejas')).toBe(true);
    expect(mine.body.library.plan_b).toBeNull();
    expect(mine.body.library.hits.some((hit) => hit.kind === 'plan_b')).toBe(false);

    const pro = await library(patient, true, 'tostada');
    expect(pro.body.library.plan_b?.title.toLocaleLowerCase('es-AR')).toContain('tostada');
    expect(pro.body.library.hits.some((hit) => hit.kind === 'plan_b')).toBe(true);

    expect((await post(`/api/patients/${patient}/favorites`, { item_kind: 'plan_b', item_id: patient })).status).toBe(400);
    expect((await post(`/api/patients/${other}/favorites`, { item_kind: 'resource', item_id: 'leer-plan-semanal' })).status).toBe(200);
    expect((await library(other)).body.library.favorites).toHaveLength(1);
    expect((await library()).body.library.favorites.some((row) => row.item_id === 'leer-plan-semanal')).toBe(true);
  });

  it('no publica un borrador clínico hasta la revisión explícita', async () => {
    const created = await post('/api/resources?audience=pro', {
      slug: 'nota-borrador-demo',
      title: 'Borrador de lectura',
      summary: 'Todavía no está revisado ni asignado.',
      category: 'Hábitos',
      sections: [{ title: 'Pendiente', body: 'Este texto no debe verse como publicado.' }],
    });
    expect(created.status).toBe(201);
    const body = await created.json() as { resource: { id: string; published: boolean; slug: string } };
    expect(body.resource.published).toBe(false);
    expect((await library()).body.library.articles.some((entry) => entry.slug === 'nota-borrador-demo')).toBe(false);

    const published = await post(`/api/resources/${body.resource.id}/publish?audience=pro`, {});
    expect(published.status).toBe(200);
    const after = await published.json() as { resource: { published: boolean; reviewed_at: string | null } };
    expect(after.resource.published).toBe(true);
    expect(after.resource.reviewed_at).toBeTruthy();
    expect((await post('/api/resources/assign', { resource_id: 'nota-borrador-demo', patient_ids: [patient] })).status).toBe(200);
    expect((await library()).body.library.articles.some((entry) => entry.slug === 'nota-borrador-demo')).toBe(true);
    expect((await post('/api/resources?audience=patient', {
      slug: 'no-paciente',
      title: 'No corresponde',
      summary: 'El paciente no publica artículos.',
      category: 'Hábitos',
      sections: [{ title: 'No', body: 'No.' }],
    })).status).toBe(403);
  });

  it('cierra en 501 si falta el schema persistente', () => {
    expect(() => resourceDbError({ code: '42P01' })).toThrow(CareError);
    for (const code of ['42883', 'PGRST202', 'PGRST205']) {
      try {
        resourceDbError({ code });
        throw new Error('expected CareError');
      } catch (error) {
        expect(error).toMatchObject({ status: 501 });
      }
    }
  });
});
