import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import { productionContentSecurityPolicy } from './src/lib/content-security-policy';

export default defineConfig(({ mode }) => ({
  plugins: [{
    name: 'plan-v-production-security',
    apply: 'build',
    transformIndexHtml() {
      const env = loadEnv(mode, process.cwd(), 'VITE_');
      return [
        { tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: productionContentSecurityPolicy(env.VITE_SUPABASE_URL) }, injectTo: 'head-prepend' as const },
        { tag: 'meta', attrs: { name: 'referrer', content: 'no-referrer' }, injectTo: 'head-prepend' as const },
      ];
    },
  }],
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
  },
}));
