import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

// La landing para nutricionistas es una página aparte (landing.html) que se sirve en /nutricionistas.
const landingDevRoute = {
  name: 'plan-v-landing-route',
  configureServer(server: { middlewares: { use: (fn: (req: { url?: string }, res: unknown, next: () => void) => void) => void } }) {
    server.middlewares.use((req, _res, next) => {
      if (req.url === '/nutricionistas' || req.url?.startsWith('/nutricionistas?')) req.url = '/landing.html';
      next();
    });
  },
};

export default defineConfig({
  plugins: [landingDevRoute],
  build: {
    rollupOptions: {
      input: { main: resolve(__dirname, 'index.html'), landing: resolve(__dirname, 'landing.html') },
    },
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY ?? 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
    },
  },
  test: {
    env: {
      APP_MODE: 'test',
      AI_MODE: 'demo',
      TZ: 'America/Argentina/Buenos_Aires',
    },
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      'server/security/signed-auth.local.test.ts',
      ...(process.env.DISPOSABLE_DATABASE_URL ? [] : ['server/cut1.disposable.test.ts']),
      ...(process.env.PLANV_LIVE_AUTH === '1' ? [] : ['server/live-auth-storage.test.ts']),
    ],
  },
});
