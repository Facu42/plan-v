import { beforeEach, describe, expect, it } from 'vitest';
import { app } from './index.js';
import { resetStore } from './store.js';
describe('contacto telefónico de la ficha', () => {
  beforeEach(() => resetStore());
  const save = (phone: string | null) => app.request('/api/patients/pat-sofia/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone }) });
  it('guarda, recarga y permite retirar un número', async () => {
    expect((await save('+54 11 1234 5678')).status).toBe(200);
    const read = await app.request('/api/patients/pat-sofia');
    expect((await read.json()).patient.phone).toBe('+54 11 1234 5678');
    expect((await save(null)).status).toBe(200);
    expect((await (await app.request('/api/patients/pat-sofia')).json()).patient.phone).toBeNull();
  });
  it('rechaza más de cuarenta caracteres', async () => { expect((await save('1'.repeat(41))).status).toBe(400); });
});
