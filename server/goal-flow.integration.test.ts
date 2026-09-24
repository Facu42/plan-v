import { beforeEach, describe, expect, it } from 'vitest';
import { app } from './index.js';
import { getPatient, resetStore } from './store.js';

function patchGoal(body: unknown) {
  return app.request('/api/patients/pat-sofia/goal', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('goal API flow in memory mode', () => {
  beforeEach(() => {
    resetStore();
  });

  it('updates the goal, progress and status while recording history', async () => {
    const response = await patchGoal({
      goal: 'Organizar cuatro cenas por semana',
      status: 'active',
      progress: 45,
      note: 'Acordado en la consulta semanal.',
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.patient).toMatchObject({
      goal: 'Organizar cuatro cenas por semana',
      goal_status: 'active',
      goal_progress: 45,
    });
    expect(body.patient.goal_updated_at).toEqual(expect.any(String));
    expect(body.patient.goal_history[0]).toMatchObject({
      goal: 'Organizar cuatro cenas por semana',
      status: 'active',
      progress: 45,
      note: 'Acordado en la consulta semanal.',
    });
    expect(body.patient.timeline[0]).toMatchObject({
      kind: 'goal',
      title: 'Objetivo · actualizado',
    });
    expect(getPatient('pat-sofia')!.goal_progress).toBe(45);
  });

  it('keeps the newest goal changes first and supports pausing a goal', async () => {
    await patchGoal({ goal: 'Organizar cuatro cenas por semana', status: 'active', progress: 45 });
    const response = await patchGoal({
      goal: 'Organizar cuatro cenas por semana',
      status: 'paused',
      progress: 50,
      note: 'Pausa por viaje.',
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.patient.goal_status).toBe('paused');
    expect(body.patient.goal_history).toHaveLength(3);
    expect(body.patient.goal_history[0]).toMatchObject({ status: 'paused', progress: 50 });
    expect(body.patient.goal_history[1]).toMatchObject({ status: 'active', progress: 45 });
    expect(body.patient.goal_history[2]).toMatchObject({ id: 'goal-s1', status: 'active', progress: 55 });
  });

  it('rejects invalid or empty goal updates', async () => {
    for (const payload of [
      {},
      { goal: ' ', status: 'active', progress: 50 },
      { goal: 'Objetivo válido', status: 'archived', progress: 50 },
      { goal: 'Objetivo válido', status: 'active', progress: -1 },
      { goal: 'Objetivo válido', status: 'active', progress: 101 },
      { goal: 'Objetivo válido', status: 'active', progress: 12.5 },
      { goal: 'Objetivo válido', status: 'active', progress: 50, note: 'x'.repeat(501) },
    ]) {
      const response = await patchGoal(payload);
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: 'Datos inválidos' });
    }
  });
});
