import { beforeEach, describe, expect, it } from 'vitest';
import { app } from './index.js';
import { getPatient, resetStore } from './store.js';

function jsonRequest(method: string, body: unknown) {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

describe('weekly menu API flow in memory mode', () => {
  beforeEach(() => {
    resetStore();
  });

  it('updates an existing menu slot and records a timeline event', async () => {
    const response = await app.request(
      '/api/patients/pat-sofia/menu',
      jsonRequest('PATCH', { day: 'Lunes', slot: 'Almuerzo', title: 'Bowl de lentejas y arroz' }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    const lunes = body.patient.weekPlan.find((d: { day: string }) => d.day === 'Lunes');
    expect(lunes.meals.find((m: { slot: string }) => m.slot === 'Almuerzo').title).toBe('Bowl de lentejas y arroz');
    expect(body.patient.timeline[0].title).toBe('Menú · Lunes Almuerzo');
    expect(body.patient.timeline[0].body).toBe('Bowl de lentejas y arroz');
  });

  it('creates missing days and keeps canonical order', async () => {
    const response = await app.request(
      '/api/patients/pat-sofia/menu',
      jsonRequest('PATCH', { day: 'Sábado', slot: 'Cena', title: 'Pizza casera + ensalada' }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    const days = body.patient.weekPlan.map((d: { day: string }) => d.day);
    expect(days).toEqual(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']);
    const sabado = body.patient.weekPlan.find((d: { day: string }) => d.day === 'Sábado');
    expect(sabado.meals).toEqual([{ slot: 'Cena', title: 'Pizza casera + ensalada' }]);

    const patient = getPatient('pat-sofia')!;
    expect(patient.weekPlan.map((d) => d.day)).toEqual(days);
  });

  it('rejects invalid menu updates with 400', async () => {
    for (const payload of [
      { day: 'Feriado', slot: 'Cena', title: 'Algo' },
      { day: 'Lunes', slot: 'Brunch', title: 'Algo' },
      { day: 'Lunes', slot: 'Cena', title: '   ' },
    ]) {
      const response = await app.request('/api/patients/pat-sofia/menu', jsonRequest('PATCH', payload));
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: 'Datos inválidos' });
    }
  });

  it('adds a new slot to an existing day and recomputes adherence', async () => {
    const response = await app.request(
      '/api/patients/pat-sofia/menu',
      jsonRequest('PATCH', { day: 'Lunes', slot: 'Desayuno', title: 'Avena con fruta' }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    const lunes = body.patient.weekPlan.find((d: { day: string }) => d.day === 'Lunes');
    expect(lunes.meals.map((m: { slot: string }) => m.slot)).toEqual(['Desayuno', 'Almuerzo', 'Cena']);
    expect(body.patient.adherence_why).toContain('comidas revisadas esta semana');
  });

  it('removes a menu slot and records the removal in the timeline', async () => {
    const before = getPatient('pat-sofia')!;
    const plannedBefore = before.weekPlan.find((d) => d.day === 'Lunes')!.meals.length;

    const response = await app.request(`/api/patients/pat-sofia/menu/Lunes/${encodeURIComponent('Cena')}`, { method: 'DELETE' });
    const body = await response.json();

    expect(response.status).toBe(200);
    const lunes = body.patient.weekPlan.find((d: { day: string }) => d.day === 'Lunes');
    expect(lunes.meals).toHaveLength(plannedBefore - 1);
    expect(lunes.meals.some((m: { slot: string }) => m.slot === 'Cena')).toBe(false);
    expect(body.patient.timeline[0].title).toBe('Menú · quitado Lunes Cena');
    expect(body.patient.timeline[0].body).toBe('Ensalada tibia');
  });

  it('returns 404 when removing a slot that does not exist and 400 for invalid params', async () => {
    const missing = await app.request(`/api/patients/pat-sofia/menu/${encodeURIComponent('Sábado')}/Cena`, { method: 'DELETE' });
    expect(missing.status).toBe(404);

    const badDay = await app.request('/api/patients/pat-sofia/menu/Feriado/Cena', { method: 'DELETE' });
    expect(badDay.status).toBe(400);

    const badSlot = await app.request('/api/patients/pat-sofia/menu/Lunes/Brunch', { method: 'DELETE' });
    expect(badSlot.status).toBe(400);
  });
});
