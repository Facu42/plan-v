// Compatibility exports for the old design bundle; public config comes from the environment.
const url = import.meta.env.VITE_SUPABASE_URL;
export const projectId = url ? new URL(url).hostname.split('.')[0] : '';
export const publicAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';
