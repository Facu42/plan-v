import type { Hono } from 'hono';
import { alcanceOutOfScope, evaluateAlcance } from './decisions.js';

export function registerAlcanceRoutes(app: Hono) {
  app.get('/api/alcance', (c) => c.json(evaluateAlcance()));

  app.post('/api/patients/:id/shopping/budget', () => alcanceOutOfScope());
  app.post('/api/patients/:id/activity/import', () => alcanceOutOfScope());
  app.post('/api/appointments/:id/video-room', () => alcanceOutOfScope());
  app.post('/api/video/rooms', () => alcanceOutOfScope());
}
