#!/usr/bin/env node
const mode = process.env.APP_MODE;

for (const [key, value] of Object.entries(process.env)) {
  if (!value) continue;
  if (key.startsWith('VITE_') && /SERVICE_ROLE|SECRET|PASSWORD|PRIVATE_KEY/i.test(key)) {
    console.error(`Refusing to expose a server secret via ${key}`);
    process.exit(1);
  }
}

if (mode === 'staging' || mode === 'production') {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anon = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const required = {
    runtime_supabase_url: url,
    runtime_anon_key: anon,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    CORS_ORIGINS: process.env.CORS_ORIGINS,
    PROVISION_SECRET: process.env.PROVISION_SECRET,
    AI_MODE: process.env.AI_MODE,
  };
  const missing = Object.entries(required).filter(([, value]) => !String(value || '').trim()).map(([name]) => name);
  if (process.env.AI_MODE === 'demo') missing.push('AI_MODE');
  if (missing.length) {
    console.error(`Incomplete ${mode} secrets: ${missing.join(', ')}`);
    process.exit(1);
  }
}

console.log(`Secret boundary ok (${mode || 'unset'}).`);
