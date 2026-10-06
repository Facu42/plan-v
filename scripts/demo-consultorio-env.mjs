/** La simulación local nunca hereda conexiones ni credenciales de otra app. */
export function demoConsultorioEnv(base, stateFile) {
  const env = { ...base };
  for (const name of Object.keys(env)) {
    if (/^(?:VITE_)?SUPABASE_/i.test(name)) env[name] = '';
  }
  return { ...env, APP_MODE: 'demo', AI_MODE: 'demo', WORKER_SEPARATE: '0',
    SUPABASE_URL: '', SUPABASE_ANON_KEY: '', SUPABASE_SERVICE_ROLE_KEY: '',
    VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '',
    VITE_ALLOW_DEMO: 'true', VITE_API_URL: '', PORT: '5607',
    CORS_ORIGINS: 'http://127.0.0.1:5606', VITE_API_PROXY: 'http://127.0.0.1:5607',
    DEMO_STATE_FILE: stateFile };
}
