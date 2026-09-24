import { AsyncLocalStorage } from 'node:async_hooks';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { allowsSyntheticDemo } from '../config/runtime.js';

let admin: SupabaseClient | null = null;
const actorDb = new AsyncLocalStorage<SupabaseClient>();

function supabaseUrl(): string | undefined {
  return process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
}

function anonKey(): string | undefined {
  return process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
}

export function getSupabaseAdmin(): SupabaseClient | null {
  if (admin) return admin;
  const url = supabaseUrl();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return admin;
}

export function isSupabaseEnabled(): boolean {
  return Boolean(getSupabaseAdmin());
}

export function createActorClient(accessToken: string | undefined): SupabaseClient | null {
  const url = supabaseUrl();
  const key = anonKey();
  const token = accessToken?.replace(/^Bearer\s+/i, '').trim();
  if (!url || !key || !token) return null;
  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function bindActorClient<T>(client: SupabaseClient, run: () => T): T {
  return actorDb.run(client, run);
}

export function getRequestDb(): SupabaseClient {
  const bound = actorDb.getStore();
  if (bound) return bound;
  if (allowsSyntheticDemo()) {
    const fallback = getSupabaseAdmin();
    if (fallback) return fallback;
  }
  throw new Error('Actor JWT client is required');
}

export function privilegedDb(): SupabaseClient {
  const client = getSupabaseAdmin();
  if (!client) throw new Error('Admin database client is required');
  return client;
}

export async function verifyAuthToken(token: string | undefined): Promise<{ userId: string } | null> {
  if (!token) return null;
  const sb = getSupabaseAdmin();
  if (!sb) return null;
  const { data, error } = await sb.auth.getUser(token.replace(/^Bearer\s+/i, ''));
  if (error || !data.user) return null;
  return { userId: data.user.id };
}

export async function getAuthAccount(userId: string): Promise<{ email: string | null; emailConfirmed: boolean } | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;
  const { data, error } = await sb.auth.admin.getUserById(userId);
  if (error || !data.user) return null;
  return {
    email: data.user.email ?? null,
    emailConfirmed: Boolean(data.user.email_confirmed_at),
  };
}
