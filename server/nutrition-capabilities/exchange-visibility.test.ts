import { Hono } from 'hono';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CareError } from '../care/errors.js';
import { DEMO_NUTRITIONIST_ID } from '../store.js';
import { resetNutritionCapabilities, saveNutritionExchange } from './repository.js';
import { resetFoodsMemory, saveFood } from '../foods/repository.js';
import { foodInputSchema } from '../../src/types/foods.js';
import { registerExchangeVisibilityRoutes, getExchangeVisibility, saveExchangeVisibility, resetExchangeVisibilityMemory } from './exchange-visibility.js';
const mocks = vi.hoisted(() => ({ enabled: false, actor: vi.fn(), patient: vi.fn(), rpc: vi.fn() }));
vi.mock('../db/supabase-client.js', () => ({ isSupabaseEnabled: () => mocks.enabled, getRequestDb: () => ({ rpc: mocks.rpc }) }));
vi.mock('../db/supabase-repo.js', async original => ({ ...await original<typeof import('../db/supabase-repo.js')>(), sbGetActor: mocks.actor, sbGetPatientResource: mocks.patient }));
function app(persistent = false) {
  const api = new Hono(); api.use('*', async (c,next) => { c.set('auth', persistent ? { userId: 'user-a' } : { demo: true }); await next(); });
  api.onError((e,c) => e instanceof CareError ? c.json({ error: e.message }, e.status) : c.json({ error: String(e) }, 500)); registerExchangeVisibilityRoutes(api); return api;
}
const send = (api: Hono, value: unknown) => api.request('/api/nutrition/exchange-visibility', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value) });
beforeEach(() => { resetExchangeVisibilityMemory(); resetNutritionCapabilities(); resetFoodsMemory(); mocks.enabled = false; mocks.actor.mockReset(); mocks.patient.mockReset(); mocks.rpc.mockReset(); });
async function group(owner = DEMO_NUTRITIONIST_ID) {
  const ids = ['d0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000002'];
  for (const [i,id] of ids.entries()) await saveFood(owner, foodInputSchema.parse({ id, expected_revision: 0, name: `Alimento ${i}`, source: 'Fuente revisada', reference: 'Nota profesional privada', kind: 'food', nutrients: { kcal: 50 }, portions: [{ name: 'Taza', grams: 150 }] }), false);
  return saveNutritionExchange(owner, { id: 'e0000000-0000-4000-8000-000000000001', expected_revision: 0, name: 'Frutas', reference: 'Referencia profesional privada', reviewed: true, items: ids.map(id => ({ food_id: id, food_revision: 1, quantity: 150, unit: 'g' })) }, false);
}
describe('visibilidad persistible de equivalencias', () => {
  it('inicia apagada y CAS en memoria no pierde actualizaciones ni cambia otro consultorio', async () => {
    expect(await getExchangeVisibility('a', false)).toEqual({ enabled: false, revision: 0 });
    const results = await Promise.allSettled([saveExchangeVisibility('a', { enabled: true, expected_revision: 0 }, false), saveExchangeVisibility('a', { enabled: false, expected_revision: 0 }, false)]);
    expect(results.map(r => r.status).sort()).toEqual(['fulfilled','rejected']);
    expect(await getExchangeVisibility('a', false)).toEqual({ enabled: true, revision: 1 });
    expect(await getExchangeVisibility('b', false)).toEqual({ enabled: false, revision: 0 });
  });
  it('publica solo grupos revisados del titular, sin UUID propietario ni notas, y se retiran al apagar', async () => {
    await group(); const api = app();
    expect(await (await api.request('/api/patients/pat-sofia/nutrition/exchanges')).json()).toEqual({ enabled: false, groups: [] });
    expect((await send(api, { enabled: true, expected_revision: 0 })).status).toBe(200);
    const visible = await (await api.request('/api/patients/pat-sofia/nutrition/exchanges')).json();
    expect(visible.enabled).toBe(true); expect(visible.groups).toHaveLength(1);
    expect(visible.groups[0].items[0]).toMatchObject({ quantity: 150, unit: 'g', food: { name: 'Alimento 0', nutrients: { kcal: 50 }, portions: [{ name: 'Taza', grams: 150 }] } });
    for (const privateValue of [DEMO_NUTRITIONIST_ID, 'owner_id', 'reference', 'Nota profesional privada', 'Referencia profesional privada']) expect(JSON.stringify(visible)).not.toContain(privateValue);
    expect((await send(api, { enabled: false, expected_revision: 1 })).status).toBe(200);
    expect(await (await api.request('/api/patients/pat-sofia/nutrition/exchanges')).json()).toEqual({ enabled: false, groups: [] });
  });
  it('rechaza propietario arbitrario, versión vieja, campos extra y tipos no booleanos', async () => {
    const api = app();
    for (const input of [{ enabled: 'true', expected_revision: 0 }, { enabled: true, expected_revision: -1 }, { enabled: true, expected_revision: 0.5 }, { enabled: true, expected_revision: 0, owner_id: 'b' }]) expect((await send(api, input)).status).toBe(400);
    expect((await api.request('/api/patients/pat-sofia/nutrition/exchanges?owner_id=b')).status).toBe(400);
    expect((await send(api, { enabled: true, expected_revision: 9 })).status).toBe(409);
  });
  it('niega paciente, recepción, administrador y profesional ajena antes de la lectura clínica', async () => {
    mocks.enabled = true; const api = app(true);
    mocks.patient.mockResolvedValue({ id: 'patient-a', nutritionistId: 'clinic-a', billing_status: 'waived', billing_until: null });
    for (const actor of [{ role: 'admin', userId: 'u' }, { role: 'recepcion', userId: 'u' }, { role: 'paciente', userId: 'u', patientId: 'patient-b' }, { role: 'nutri', userId: 'u', nutritionistId: 'clinic-b' }]) {
      mocks.actor.mockResolvedValue(actor); expect((await api.request('/api/patients/patient-a/nutrition/exchanges')).status).toBe(403);
    }
    for (const role of ['admin','recepcion','paciente']) { mocks.actor.mockResolvedValue({ role, userId: 'u', patientId: 'patient-a' }); expect((await api.request('/api/nutrition/exchange-visibility')).status).toBe(403); }
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('usa RPC del actor sin owner enviado por cliente y falla cerrado si falta migración', async () => {
    mocks.enabled = true; mocks.actor.mockResolvedValue({ role: 'nutri', userId: 'u', nutritionistId: 'clinic-a' });
    mocks.rpc.mockResolvedValue({ data: { enabled: true, revision: 2 }, error: null }); const api = app(true);
    expect((await send(api, { enabled: true, expected_revision: 1 })).status).toBe(200);
    expect(mocks.rpc).toHaveBeenLastCalledWith('save_nutrition_exchange_visibility', { expected_revision: 1, visibility_enabled: true });
    mocks.rpc.mockResolvedValue({ data: null, error: { code: 'PGRST202' } }); expect((await api.request('/api/nutrition/exchange-visibility')).status).toBe(501);
    mocks.rpc.mockResolvedValue({ data: null, error: { code: '42501' } }); expect((await api.request('/api/nutrition/exchange-visibility')).status).toBe(403);
    mocks.rpc.mockResolvedValue({ data: null, error: { code: 'PT409' } }); expect((await send(api, { enabled: false, expected_revision: 2 })).status).toBe(409);
  });
});
