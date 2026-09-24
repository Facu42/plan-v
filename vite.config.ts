import { defineConfig } from 'vitest/config';

export default defineConfig({
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
      ...(process.env.DISPOSABLE_DATABASE_URL ? [] : ['server/cut1.disposable.test.ts']),
      ...(process.env.PLANV_LIVE_AUTH === '1' ? [] : ['server/live-auth-storage.test.ts']),
    ],
  },
});
