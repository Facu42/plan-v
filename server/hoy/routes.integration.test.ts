import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../index.js';
import { getPatient, resetStore } from '../store.js';

const post = (id: string, body: unknown) => app.request(`/api/patients/${id}/hoy/hecho`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
});

describe('hechos de Hoy', () => {
  beforeEach(() => resetStore());

  it('anota la acción sin mandar un mensaje y no la cuenta dos veces', async () => {
    const antes = getPatient('pat-sofia')?.messages.length ?? 0;
    const primero = await post('pat-sofia', { action: 'mensaje', source_key: 'fotos:1:a' });
    const cuerpo = await primero.json();
    expect(primero.status).toBe(200);
    expect(cuerpo.hecho).toMatchObject({ patientId: 'pat-sofia', action: 'mensaje', sourceKey: 'fotos:1:a' });
    expect(cuerpo.hechos_7d).toBe(1);
    expect(getPatient('pat-sofia')?.messages.length).toBe(antes);

    const segundo = await post('pat-sofia', { action: 'mensaje', source_key: 'fotos:1:a' });
    const repetido = await segundo.json();
    expect(segundo.status).toBe(200);
    expect(repetido.hechos_7d).toBe(1);
    expect(repetido.hecho.doneAt).toBe(cuerpo.hecho.doneAt);

    const lista = await app.request('/api/crm/hoy-hechos');
    const hechos = await lista.json();
    expect(lista.status).toBe(200);
    expect(hechos.hechos).toHaveLength(1);
  });

  it('rechaza una paciente desconocida, una acción inválida y un done_at armado por el cliente', async () => {
    expect((await post('no-existe', { action: 'turno', source_key: 'turno:sin-proximo' })).status).toBe(404);
    expect((await post('pat-sofia', { action: 'mail', source_key: 'x' })).status).toBe(400);
    expect((await post('pat-sofia', { action: 'mensaje', source_key: 'a', done_at: '2000-01-01T00:00:00Z' })).status).toBe(400);
    expect(getPatient('pat-sofia')?.messages.length).toBeGreaterThanOrEqual(0);
  });

  it('el módulo no programa ni envía mensajes', () => {
    const fuente = ['routes.ts', 'persist.ts', 'memory.ts'].map(nombre => readFileSync(new URL(`./${nombre}`, import.meta.url), 'utf8')).join('\n');
    expect(fuente).not.toMatch(/sendMessage|addMessage|setInterval|cron/);
  });
});
