export type RuntimeConfig = {
  mode: 'demo' | 'test' | 'staging' | 'production';
  dataMode: 'memory' | 'supabase';
  aiMode: 'demo' | 'disabled' | 'live';
};

export function readRuntimeConfig(env: Record<string, string | undefined>): RuntimeConfig {
  const mode = env.APP_MODE;
  if (mode !== 'demo' && mode !== 'test' && mode !== 'staging' && mode !== 'production') {
    throw new Error('APP_MODE is required');
  }
  if (env.NODE_ENV === 'production' && (mode === 'demo' || mode === 'test')) {
    throw new Error('Synthetic mode is forbidden in production');
  }
  const persistent = mode === 'staging' || mode === 'production';
  if (persistent && (!(env.SUPABASE_URL ?? env.VITE_SUPABASE_URL) || !env.SUPABASE_SERVICE_ROLE_KEY)) {
    throw new Error('Supabase configuration is required');
  }
  const aiMode = env.AI_MODE ?? 'disabled';
  if (aiMode !== 'demo' && aiMode !== 'disabled' && aiMode !== 'live') throw new Error('Invalid AI_MODE');
  if (persistent && aiMode === 'demo') throw new Error('Simulated AI is forbidden with persistent data');
  if (aiMode === 'live' && !env.OPENAI_API_KEY) throw new Error('AI provider configuration is required');
  return { mode, dataMode: persistent ? 'supabase' : 'memory', aiMode };
}

export function allowsSyntheticDemo(env: Record<string, string | undefined> = process.env): boolean {
  const mode = env.APP_MODE;
  return mode === 'demo' || mode === 'test';
}
