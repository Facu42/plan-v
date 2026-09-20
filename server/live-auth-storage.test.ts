import { afterAll, describe, expect, it } from 'vitest';
import { createActorClient } from './db/supabase-client.js';
import {
  applyDiscoveredLiveAuthEnv,
  discoverPlanVSupabase,
  liveActorJwtConfigured,
  supabaseFetch,
} from './test/planv-supabase.js';

const discovered = applyDiscoveredLiveAuthEnv();
const live = process.env.PLANV_LIVE_AUTH === '1';
const actorJwt = liveActorJwtConfigured();

describe.skipIf(!live)('Plan V hosted Auth / Storage (sin migrar SQL)', () => {
  afterAll(() => {
    expect(process.env.DISPOSABLE_DATABASE_URL ?? '').not.toMatch(/supabase\.co/);
  });

  it('descubre el proyecto público del repo y no inventa claves', () => {
    const pub = discoverPlanVSupabase();
    expect(pub.projectId).toMatch(/^[a-z]{20}$/);
    expect(pub.url).toBe(`https://${pub.projectId}.supabase.co`);
    expect(pub.anonKey.length).toBeGreaterThan(80);
    expect(discovered?.projectId).toBe(pub.projectId);
  });

  it('Auth GoTrue responde; el alta no auto-confirma email', async () => {
    const health = await supabaseFetch('/auth/v1/health');
    expect(health.status).toBe(200);
    expect(health.body).toMatchObject({ name: 'GoTrue' });
    const settings = await supabaseFetch('/auth/v1/settings');
    expect(settings.status).toBe(200);
    expect(settings.body).toMatchObject({ disable_signup: false, mailer_autoconfirm: false });
  });

  it('no aplica SQL: public.patients existe y no se puede probar vacío', async () => {
    const patients = await supabaseFetch('/rest/v1/patients?select=id&limit=1');
    expect(patients.status).not.toBe(404);
    const missing = JSON.stringify(patients.body);
    expect(missing).not.toMatch(/PGRST205|Could not find the table 'public.patients'/);
    expect(patients.status).toBeGreaterThanOrEqual(400);
    expect(missing).toMatch(/permission denied|JWT|not authorized|42501/i);
  });

  it('no inventa JWT de Nutri A/B ni id de Paciente B', () => {
    expect(actorJwt).toBe(false);
    expect(process.env.RLS_JWT_NUTRI_A ?? '').toBe('');
    expect(process.env.RLS_JWT_NUTRI_B ?? '').toBe('');
    expect(process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').toBe('');
  });

  it.skipIf(!actorJwt)('RLS-02 live: Nutri A no lee Paciente B', async () => {
    process.env.SUPABASE_URL = discoverPlanVSupabase().url;
    process.env.VITE_SUPABASE_ANON_KEY = discoverPlanVSupabase().anonKey;
    const nutriA = createActorClient(process.env.RLS_JWT_NUTRI_A);
    expect(nutriA).not.toBeNull();
    const { data, error } = await nutriA!.from('patients').select('id').eq('id', process.env.RLS_PATIENT_B_ID);
    expect(error).toBeNull();
    expect(data ?? []).toEqual([]);
  });

  it.skipIf(!actorJwt)('RLS-02 live write: Nutri A no actualiza Paciente B', async () => {
    process.env.SUPABASE_URL = discoverPlanVSupabase().url;
    const nutriA = createActorClient(process.env.RLS_JWT_NUTRI_A);
    const { data } = await nutriA!.from('patients').update({ goal: 'cross-tenant' }).eq('id', process.env.RLS_PATIENT_B_ID).select('id');
    expect(data ?? []).toEqual([]);
  });

  it('Storage: buckets de producto ausentes; no se crean ni se sube un estudio', async () => {
    const buckets = await supabaseFetch('/storage/v1/bucket');
    expect(buckets.status).toBe(200);
    expect(buckets.body).toEqual([]);

    for (const name of ['meal-photos', 'care-documents', 'care-photos']) {
      const one = await supabaseFetch(`/storage/v1/bucket/${name}`);
      expect(one.status).toBeGreaterThanOrEqual(400);
      expect(JSON.stringify(one.body)).toMatch(/Bucket not found|NoSuchBucket/i);
    }

    const upload = await supabaseFetch('/storage/v1/object/care-documents/probe/estudio.txt', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: 'no-subir-si-falta-bucket',
    });
    expect(upload.status).toBeGreaterThanOrEqual(400);
    expect(JSON.stringify(upload.body)).toMatch(/Bucket not found|NoSuchBucket|not found/i);

    const withdraw = await supabaseFetch('/storage/v1/object/care-documents/probe/estudio.txt', { method: 'DELETE' });
    expect(withdraw.status).toBeGreaterThanOrEqual(400);
  });
});
