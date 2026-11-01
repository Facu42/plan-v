import type { Hono } from 'hono';
import { supportEmailFromEnv } from '../../src/lib/support-email.js';

export function registerSupportRoutes(app: Hono) {
  app.get('/api/public/support', (c) => c.json({
    email: supportEmailFromEnv({
      VITE_SUPPORT_EMAIL: process.env.VITE_SUPPORT_EMAIL,
      SUPPORT_EMAIL: process.env.SUPPORT_EMAIL,
    }),
  }));
}
