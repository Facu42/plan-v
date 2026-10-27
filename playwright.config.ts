import { defineConfig, devices } from '@playwright/test';

// Recorridos de punta a punta en modo demo: API y web locales, datos en memoria, nunca la base real.
const API_PORT = 3101;
const WEB_PORT = 5273;
// Las claves de Supabase van vacías a propósito: así ni la API ni la web pueden llegar a la base real.
const demoEnv = {
  APP_MODE: 'demo',
  AI_MODE: 'demo',
  VITE_ALLOW_DEMO: 'true',
  SUPABASE_URL: '',
  SUPABASE_ANON_KEY: '',
  SUPABASE_SERVICE_ROLE_KEY: '',
  VITE_SUPABASE_URL: '',
  VITE_SUPABASE_ANON_KEY: '',
  DEMO_STATE_FILE: '',
};

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: Boolean(process.env.CI),
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    launchOptions: process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
    baseURL: `http://127.0.0.1:${WEB_PORT}`,
    locale: 'es-AR',
    timezoneId: 'America/Argentina/Buenos_Aires',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'escritorio', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } }],
  webServer: [
    {
      command: 'npx tsx server/index.ts',
      url: `http://127.0.0.1:${API_PORT}/api/health`,
      env: { ...demoEnv, PORT: String(API_PORT), CORS_ORIGINS: `http://127.0.0.1:${WEB_PORT}` },
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      // Las tipografías del PDF no están en git: se generan antes de servir, igual que en `npm run build`.
      command: `node scripts/prepare-clinical-pdf.mjs && npx vite --host 127.0.0.1 --port ${WEB_PORT} --strictPort`,
      url: `http://127.0.0.1:${WEB_PORT}/`,
      env: { ...demoEnv, VITE_API_PROXY: `http://127.0.0.1:${API_PORT}` },
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
});
