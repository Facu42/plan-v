import { beforeEach, describe, expect, it } from 'vitest';
import { CareError } from '../care/errors.js';
import { app } from '../index.js';
import { resetStore } from '../store.js';
import { resolveRequestAuth } from '../security/contracts.js';
import {
  ALCANCE_OUT_MESSAGE,
  ALCANCE_UNINSTALLED_MESSAGE,
  alcanceDbError,
  evaluateAlcance,
} from './decisions.js';
import { ALCANCE_DECISIONS, ALCANCE_VERSION } from '../../src/types/alcance.js';

function collectKeys(value: unknown, acc = new Set<string>()): Set<string> {
  if (Array.isArray(value)) {
    for (const item of value) collectKeys(item, acc);
    return acc;
  }
  if (value && typeof value === 'object') {
    for (const [key, nested] of Object.entries(value)) {
      acc.add(key);
      collectKeys(nested, acc);
    }
  }
  return acc;
}

async function asJson<T>(response: Response) {
  return { status: response.status, body: await response.json() as T };
}

describe('PV-39 alcance de producto', () => {
  beforeEach(() => resetStore());

  it('GET /api/alcance publica grocery_budget, activity_import y native_video como OUT', async () => {
    const { status, body } = await asJson<ReturnType<typeof evaluateAlcance>>(await app.request('/api/alcance'));
    expect(status).toBe(200);
    expect(body.version).toBe(ALCANCE_VERSION);
    expect(body.last_ticket).toBe('PV-39');
    expect(body.numbered_plan).toBe('PV-01…PV-39');
    expect(body.nutrigo_visual_approved).toBe(false);
    expect(body.decisions.map((row) => [row.feature, row.status])).toEqual(
      ALCANCE_DECISIONS.map((row) => [row.feature, 'out']),
    );
    expect(JSON.stringify(body)).not.toMatch(/mercadopago|OPENAI_API_KEY|Fitbit|WebRTC/i);
  });

  it('el snapshot nunca afirma aprobación visual aunque PLANV_NUTRIGO_VISUAL=1', () => {
    const snapshot = evaluateAlcance({ PLANV_NUTRIGO_VISUAL: '1' });
    expect(snapshot.nutrigo_visual_approved).toBe(false);
  });

  it('mantiene /api/alcance público sin JWT de usuario', () => {
    expect(resolveRequestAuth({
      supabaseEnabled: true,
      path: '/api/alcance',
      verifiedUserId: null,
      allowDemo: false,
    })).toEqual({ kind: 'public' });
  });

  it('rechaza presupuesto, importación de actividad y sala nativa con 501', async () => {
    for (const path of [
      '/api/patients/pat-sofia/shopping/budget',
      '/api/patients/pat-sofia/activity/import',
      '/api/appointments/appt-1/video-room',
      '/api/video/rooms',
    ]) {
      const { status, body } = await asJson<{ error: string }>(await app.request(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 12000, currency: 'ARS', provider: 'fitbit' }),
      }));
      expect(status).toBe(501);
      expect(body.error).toBe(ALCANCE_OUT_MESSAGE);
    }
  });

  it('una bandera de producto no abre presupuesto ni wearables', async () => {
    const previous = process.env.PLANV_GROCERY_BUDGET;
    process.env.PLANV_GROCERY_BUDGET = '1';
    try {
      const { status, body } = await asJson<{ error: string }>(await app.request('/api/patients/pat-sofia/shopping/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      }));
      expect(status).toBe(501);
      expect(body.error).toBe(ALCANCE_OUT_MESSAGE);
    } finally {
      if (previous === undefined) delete process.env.PLANV_GROCERY_BUDGET;
      else process.env.PLANV_GROCERY_BUDGET = previous;
    }
  });

  it('la lista de compras no lleva presupuesto, precio ni moneda', async () => {
    const { status, body } = await asJson<{ list: Record<string, unknown> }>(
      await app.request('/api/patients/pat-sofia/shopping'),
    );
    expect(status).toBe(200);
    const keys = [...collectKeys(body)];
    expect(keys).not.toEqual(expect.arrayContaining([
      'budget',
      'precio',
      'price',
      'currency',
      'presupuesto',
      'gastos',
      'supermercado',
    ]));
    expect(JSON.stringify(body)).not.toMatch(/presupuesto|supermercado|mercadopago/i);
  });

  it('sin schema o fuera de alcance falla cerrado 501', () => {
    expect(() => alcanceDbError({ code: '42P01' })).toThrow(CareError);
    try {
      alcanceDbError({ code: '42883' });
    } catch (error) {
      expect(error).toBeInstanceOf(CareError);
      expect((error as CareError).status).toBe(501);
      expect((error as CareError).message).toBe(ALCANCE_UNINSTALLED_MESSAGE);
    }
    try {
      alcanceDbError(null);
    } catch (error) {
      expect(error).toBeInstanceOf(CareError);
      expect((error as CareError).status).toBe(501);
      expect((error as CareError).message).toBe(ALCANCE_OUT_MESSAGE);
    }
  });
});
