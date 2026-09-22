import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export type PlanVSupabasePublic = {
  projectId: string;
  url: string;
  anonKey: string;
};

export function discoverPlanVSupabase(): PlanVSupabasePublic {
  const infoPath = fileURLToPath(new URL('../../src/utils/supabase/info.tsx', import.meta.url));
  const info = readFileSync(infoPath, 'utf8');
  const projectId = info.match(/projectId = "([^"]+)"/)?.[1];
  const anonKey = info.match(/publicAnonKey = "([^"]+)"/)?.[1];
  if (!projectId || !anonKey) {
    throw new Error('Plan V public Supabase project id/anon key are missing from src/utils/supabase/info.tsx');
  }
  return { projectId, url: `https://${projectId}.supabase.co`, anonKey };
}

export function applyDiscoveredLiveAuthEnv() {
  if (process.env.PLANV_LIVE_AUTH !== '1') return null;
  const discovered = discoverPlanVSupabase();
  process.env.DISPOSABLE_SUPABASE_URL ??= discovered.url;
  process.env.VITE_SUPABASE_ANON_KEY ??= discovered.anonKey;
  process.env.SUPABASE_URL ??= discovered.url;
  process.env.SUPABASE_ANON_KEY ??= discovered.anonKey;
  return discovered;
}

export async function supabaseFetch(path: string, init: RequestInit = {}, accessToken?: string) {
  const { url, anonKey } = discoverPlanVSupabase();
  const token = accessToken || anonKey;
  const headers = new Headers(init.headers);
  headers.set('apikey', anonKey);
  if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(`${url}${path}`, { ...init, headers });
  const text = await res.text();
  let body: unknown = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text.slice(0, 500);
  }
  return { status: res.status, body, contentRange: res.headers.get('content-range') };
}

export function liveActorJwtConfigured() {
  return Boolean(
    process.env.RLS_JWT_NUTRI_A
    && process.env.RLS_JWT_NUTRI_B
    && process.env.RLS_PATIENT_B_ID,
  );
}
