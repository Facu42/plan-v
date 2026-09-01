import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let admin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient | null {
  if (admin) return admin;
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return admin;
}

export function isSupabaseEnabled(): boolean {
  return Boolean(getSupabaseAdmin());
}

export async function verifyAuthToken(token: string | undefined): Promise<{ userId: string } | null> {
  if (!token) return null;
  const sb = getSupabaseAdmin();
  if (!sb) return null;
  const { data, error } = await sb.auth.getUser(token.replace(/^Bearer\s+/i, ''));
  if (error || !data.user) return null;
  return { userId: data.user.id };
}
