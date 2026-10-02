import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

// Página pública aparte: /pacientes (pacientes.html), sin sesión ni app.
const PUBLIC_ROUTES: Record<string, string> = { '/pacientes': '/pacientes.html' };
const publicRoutes = {
  name: 'plan-v-public-routes',
  configureServer(server: { middlewares: { use: (fn: (req: { url?: string }, res: unknown, next: () => void) => void) => void } }) {
    server.middlewares.use((req, _res, next) => {
      const path = req.url?.split('?')[0] ?? '';
      if (PUBLIC_ROUTES[path]) req.url = PUBLIC_ROUTES[path];
      next();
    });
  },
};

export default defineConfig({
  plugins: [publicRoutes],
  build: {
    rollupOptions: {
      input: { main: resolve(__dirname, 'index.html'), pacientes: resolve(__dirname, 'pacientes.html') },
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
