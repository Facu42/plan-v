import { serve } from '@hono/node-server';
import { setBrief } from '../server/store.js';
import { app } from '../server/index.js';

setBrief('pat-sofia', {
  suggested_action: 'turno',
  up_next_title: 'Agendar turno',
  up_next_body: 'Necesita coordinar revisión.',
  draft_message: null,
  source_ids: [],
  adherence_why: '4 de 7',
});
console.log('QA brief turno injected');
serve({ fetch: app.fetch, port: 3001 });
setInterval(() => {}, 60_000);
