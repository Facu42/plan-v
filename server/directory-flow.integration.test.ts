import { beforeEach, describe, expect, it } from 'vitest';
import { app } from './index.js';
import { resetStore, DEMO_NUTRITIONIST_ID } from './store.js';
import { resetDirectoryMemory, decodeLicenseFile } from './directory/repository.js';
import * as scheduling from './scheduling/repository.js';
import { schedulingDefaultSettings } from '../src/types/scheduling.js';
import { maxBodyBytes } from './ops/readiness.js';
import type { AdminLicenseRow, DirectoryCard, DirectoryListingView } from '../src/types/directory.js';

const pdf = `data:application/pdf;base64,${Buffer.from(`%PDF-1.4\n${'x'.repeat(200)}`).toString('base64')}`;
const png = `data:image/png;base64,${Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(200)]).toString('base64')}`;

function send(path: string, method: string, body?: unknown) {
  return app.request(path, { method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
}
const subir = (extra: Record<string, unknown> = {}) => send('/api/directory/me/license', 'PUT', { license_number: 'MN 4521', license_scope: 'nacional', license_province: '', listed: true, file: pdf, ...extra });

function publicarPagina(enabled = true) {
  const config = schedulingDefaultSettings();
  config.page = { ...config.page, enabled, slug: 'vero-trenti', title: 'Lic. Verónica Trenti', location: 'Belgrano, CABA' };
  config.page_extras = { specialties: ['Celiaquía'], area: 'Belgrano', modality: 'ambas', insurers: [{ name: 'OSDE' }] } as never;
  scheduling.profiles.set(DEMO_NUTRITIONIST_ID, { nutritionist_id: DEMO_NUTRITIONIST_ID, slug: 'vero-trenti', revision: 1, config });
}

describe('directorio de nutris matriculadas (demo)', () => {
  beforeEach(() => { resetStore(); resetDirectoryMemory(); scheduling.profiles.clear(); });

  it('sin matrícula no hay solicitud y no se puede elegir aparecer', async () => {
    const me = await (await send('/api/directory/me', 'GET')).json() as { listing: DirectoryListingView | null };
    expect(me.listing).toBeNull();
    expect((await send('/api/directory/me/listed', 'PUT', { listed: false })).status).toBe(404);
  });

  it('subir la matrícula la deja en revisión y no sale en el directorio hasta que el admin la aprueba', async () => {
    publicarPagina();
    const subida = await subir();
    expect(subida.status).toBe(200);
    const { listing } = await subida.json() as { listing: DirectoryListingView };
    expect(listing).toMatchObject({ status: 'pending', license_number: 'MN 4521', file_kind: 'PDF', listed: true });
    expect(JSON.stringify(listing)).not.toContain('base64');
    expect(((await (await send('/api/public/directory', 'GET')).json()) as { nutris: DirectoryCard[] }).nutris).toEqual([]);

    const { licenses } = await (await send('/api/admin/licenses', 'GET')).json() as { licenses: AdminLicenseRow[] };
    expect(licenses[0]).toMatchObject({ nutritionist_id: DEMO_NUTRITIONIST_ID, status: 'pending' });
    const file = await (await send(`/api/admin/nutritionists/${DEMO_NUTRITIONIST_ID}/license/file`, 'GET')).json() as { url: string };
    expect(file.url).toBe(pdf);

    expect((await send(`/api/admin/nutritionists/${DEMO_NUTRITIONIST_ID}/license/review`, 'POST', { decision: 'verify' })).status).toBe(200);
    const { nutris } = await (await send('/api/public/directory', 'GET')).json() as { nutris: DirectoryCard[] };
    expect(nutris).toEqual([{ slug: 'vero-trenti', title: 'Lic. Verónica Trenti', area: 'Belgrano', location: 'Belgrano, CABA', modality: 'ambas', specialties: ['Celiaquía'], license: 'MN 4521', photo: '' }]);
    // La tarjeta pública no lleva obras sociales, precios internos ni el archivo.
    expect(JSON.stringify(nutris)).not.toMatch(/OSDE|pdf|base64/i);
  });

  it('la página pública muestra el sello solo con la matrícula verificada', async () => {
    publicarPagina();
    await subir();
    const antes = await (await send('/api/public/scheduling/vero-trenti', 'GET')).json() as { verified_license?: string };
    expect(antes.verified_license).toBe('');
    await send(`/api/admin/nutritionists/${DEMO_NUTRITIONIST_ID}/license/review`, 'POST', { decision: 'verify' });
    const despues = await (await send('/api/public/scheduling/vero-trenti', 'GET')).json() as { verified_license?: string };
    expect(despues.verified_license).toBe('MN 4521');
  });

  it('elegir no aparecer o apagar la página la saca del directorio', async () => {
    publicarPagina();
    await subir();
    await send(`/api/admin/nutritionists/${DEMO_NUTRITIONIST_ID}/license/review`, 'POST', { decision: 'verify' });
    expect((await send('/api/directory/me/listed', 'PUT', { listed: false })).status).toBe(200);
    expect(((await (await send('/api/public/directory', 'GET')).json()) as { nutris: DirectoryCard[] }).nutris).toHaveLength(0);
    await send('/api/directory/me/listed', 'PUT', { listed: true });
    publicarPagina(false);
    expect(((await (await send('/api/public/directory', 'GET')).json()) as { nutris: DirectoryCard[] }).nutris).toHaveLength(0);
  });

  it('cambiar la matrícula después de aprobada vuelve a revisión y la saca del directorio', async () => {
    publicarPagina();
    await subir();
    await send(`/api/admin/nutritionists/${DEMO_NUTRITIONIST_ID}/license/review`, 'POST', { decision: 'verify' });
    const { listing } = await (await subir({ license_number: '3310', license_scope: 'provincial', license_province: 'Buenos Aires', file: png })).json() as { listing: DirectoryListingView };
    expect(listing).toMatchObject({ status: 'pending', file_kind: 'Foto', license_province: 'Buenos Aires' });
    expect(((await (await send('/api/public/directory', 'GET')).json()) as { nutris: DirectoryCard[] }).nutris).toHaveLength(0);
  });

  it('rechazar pide motivo y la nutri lo ve', async () => {
    await subir();
    expect((await send(`/api/admin/nutritionists/${DEMO_NUTRITIONIST_ID}/license/review`, 'POST', { decision: 'reject' })).status).toBe(400);
    await send(`/api/admin/nutritionists/${DEMO_NUTRITIONIST_ID}/license/review`, 'POST', { decision: 'reject', reason: 'La foto está borrosa' });
    const { listing } = await (await send('/api/directory/me', 'GET')).json() as { listing: DirectoryListingView };
    expect(listing).toMatchObject({ status: 'rejected', reject_reason: 'La foto está borrosa' });
  });

  it('rechaza archivos que no son PDF, JPG o PNG aunque digan serlo', async () => {
    const falso = `data:application/pdf;base64,${Buffer.from('<html>'.padEnd(300, 'x')).toString('base64')}`;
    expect((await subir({ file: falso })).status).toBe(415);
    expect((await subir({ file: 'data:text/html;base64,PGh0bWw+' })).status).toBe(415);
    expect((await subir({ license_number: '<script>' })).status).toBe(400);
    expect(() => decodeLicenseFile(`data:image/png;base64,${Buffer.alloc(6 * 1024 * 1024).toString('base64')}`)).toThrow(/5 MB/);
  });

  it('la vista de paciente no entra y el archivo cabe en el límite del cuerpo', async () => {
    expect((await send('/api/directory/me?audience=patient', 'GET')).status).toBe(403);
    expect((await send('/api/admin/licenses?audience=patient', 'GET')).status).toBe(403);
    expect(maxBodyBytes('/api/directory/me/license')).toBeGreaterThan(5 * 1024 * 1024 * 4 / 3);
    expect(maxBodyBytes('/api/directory/me/listed')).toBe(1024 * 1024);
  });
});
