import { beforeEach, describe, expect, it, vi } from 'vitest';

const sbMocks = vi.hoisted(() => ({
  sbGetActor: vi.fn(),
  sbGetPatientResource: vi.fn(),
  sbGetProfileRole: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock('./db/supabase-repo.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./db/supabase-repo.js')>();
  return { ...actual, ...sbMocks };
});

vi.mock('./db/supabase-client.js', () => ({
  isSupabaseEnabled: () => true,
  verifyAuthToken: async (token?: string) => (token ? { userId: 'user-1' } : null),
  getSupabaseAdmin: () => ({}),
  createActorClient: () => null,
  bindActorClient: (_client: unknown, run: () => unknown) => run(),
  getAuthAccount: async () => ({ email: 'ana@example.com', emailConfirmed: true }),
  getRequestDb: () => ({ rpc: sbMocks.rpc }),
}));

import { app } from './index.js';

describe('PV-12 API y adaptador RPC', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sbMocks.rpc.mockReset().mockResolvedValue({ data: null, error: { code: 'PGRST202', message: 'function not found' } });
    sbMocks.sbGetActor.mockResolvedValue({ role: 'paciente', userId: 'user-1', patientId: 'pat-1' });
    sbMocks.sbGetPatientResource.mockResolvedValue({
      id: 'pat-1',
      nutritionistId: 'nutri-1',
      billing_status: 'pending',
      billing_until: null,
    });
    sbMocks.sbGetProfileRole.mockResolvedValue('paciente');
  });

  it('persiste el borrador con la revisión enviada y mantiene la respuesta paciente acotada', async () => {
    sbMocks.rpc.mockResolvedValue({ error: null, data: {
      intake: { id:'i1',patient_id:'pat-1',schema_version:'intake.v1',revision:3,status:'draft',step:'profile',payload:{preferred_name:'Ana'},submitted_at:null,updated_at:'2026-09-17T20:00:00Z',reviewed_by:'private-author',reviewed_at:null },
      consents: [], clinical_notes:[{body:'Nunca al paciente'}],
    } });
    const response = await app.request('/api/patients/pat-1/intake', {method:'PATCH',headers:{Authorization:'Bearer test-token','Content-Type':'application/json'},body:JSON.stringify({expected_revision:2,step:'profile',payload:{preferred_name:'Ana'}})});
    expect(response.status).toBe(200);
    expect(sbMocks.rpc).toHaveBeenCalledWith('save_patient_intake',{target:'pat-1',expected_revision:2,next_step:'profile',patch:{preferred_name:'Ana'}});
    const body = await response.json();
    expect(body).toMatchObject({source:'supabase',intake:{revision:3,payload:{preferred_name:'Ana'}}});
    expect(JSON.stringify(body)).not.toContain('private-author');
    expect(body).not.toHaveProperty('clinical_notes');
    const readBack = await app.request('/api/patients/pat-1/intake',{headers:{Authorization:'Bearer test-token'}});
    const patientBody = await readBack.json();
    expect(patientBody).not.toHaveProperty('clinical_notes');
    expect(patientBody).not.toHaveProperty('review');
    expect(JSON.stringify(patientBody)).not.toContain('private-author');
  });

  it('rechaza acceso profesional y escrituras cruzadas antes de llamar al RPC', async () => {
    const headers = {Authorization:'Bearer test-token','Content-Type':'application/json'};
    expect((await app.request('/api/patients/pat-1/intake/professional',{headers})).status).toBe(403);
    sbMocks.sbGetPatientResource.mockResolvedValue({id:'pat-2',nutritionistId:'nutri-2',billing_status:'pending',billing_until:null});
    expect((await app.request('/api/patients/pat-2/intake',{method:'PATCH',headers,body:JSON.stringify({expected_revision:1,payload:{preferred_name:'Otra'}})})).status).toBe(403);
    expect(sbMocks.rpc).not.toHaveBeenCalled();
  });

  it.each([['PT409',409],['42501',403],['22023',400],['08006',503]])('conserva el error %s sin devolver éxito simulado', async (code, status) => {
    sbMocks.rpc.mockResolvedValue({data:null,error:{code,message:'detalle interno sensible'}});
    const response = await app.request('/api/patients/pat-1/intake/submit',{method:'POST',headers:{Authorization:'Bearer test-token','Content-Type':'application/json'},body:JSON.stringify({expected_revision:2})});
    expect(response.status).toBe(status);
    const body = await response.json();
    expect(JSON.stringify(body)).not.toContain('detalle interno sensible');
    expect(body).not.toHaveProperty('source');
  });

  it('maps a missing intake schema to an explicit 501', async () => {
    const response = await app.request('/api/patients/pat-1/intake', {
      headers: { Authorization: 'Bearer test-token' },
    });
    expect(response.status).toBe(501);
    expect(await response.json()).toEqual({ error: 'El ingreso todavía no está habilitado en este entorno.' });
  });

  it('still serves the versioned consent catalog from code', async () => {
    const response = await app.request('/api/consents/catalog', {
      headers: { Authorization: 'Bearer test-token' },
    });
    expect(response.status).toBe(200);
    const body = await response.json() as { consents: Array<{ purpose: string; text_hash: string }> };
    expect(body.consents.some((entry) => entry.purpose === 'care_relationship' && entry.text_hash.length === 64)).toBe(true);
  });
});
