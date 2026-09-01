import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../utils/supabase/info';

const url = import.meta.env.VITE_SUPABASE_URL ?? `https://${projectId}.supabase.co`;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? publicAnonKey;

export const supabaseConfigured = Boolean(url && anonKey);

export const supabase = supabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

export type Profile = {
  id: string;
  role: 'nutri' | 'paciente';
  full_name: string;
  avatar_url: string | null;
};

export async function getProfile(userId: string): Promise<Profile | null> {
  if (!supabase) return null;
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  return data as Profile | null;
}

export async function getSessionToken(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}
