import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { schedulingDefaultSettings } from '../../types/scheduling';
import { publicPageProfile } from '../../lib/public-page-profile';
import { licenseLabel, type DirectoryCard, type DirectoryListingView } from '../../types/directory';
import { isPublicSlug, publicSlugFromPath } from '../../types/public-slug';
import { PublicProfessionalHeader } from './PublicProfessionalHeader';
import { filtrarDirectorio } from './PublicDirectory';
import { textoDirectorio, validarMatricula } from './PanelDirectorio';

const card = (extra: Partial<DirectoryCard>): DirectoryCard => ({ slug: 'ana', title: 'Lic. Ana Pérez', area: 'Belgrano', location: 'CABA', modality: 'presencial', specialties: ['Celiaquía'], license: 'MN 12', photo: '', ...extra });
const listing = (extra: Partial<DirectoryListingView>): DirectoryListingView => ({ license_number: '4521', license_scope: 'nacional', license_province: '', status: 'pending', listed: true, reject_reason: '', submitted_at: '2026-11-05T10:00:00Z', reviewed_at: null, file_kind: 'PDF', ...extra });

describe('directorio de nutris matriculadas', () => {
  it('arma la matrícula como se lee en Argentina', () => {
    expect(licenseLabel('nacional', 'MN 4521')).toBe('MN 4521');
    expect(licenseLabel('provincial', '3310', 'Buenos Aires')).toBe('MP 3310 · Buenos Aires');
    expect(licenseLabel('nacional', '  ')).toBe('');
  });

  it('busca sin tildes por zona o especialidad y «ambas» entra en las dos modalidades', () => {
    const lista = [card({}), card({ slug: 'bea', title: 'Lic. Bea Ríos', area: 'Córdoba', modality: 'ambas', specialties: ['Deporte'] }), card({ slug: 'caro', title: 'Caro', modality: 'online', specialties: [] })];
    expect(filtrarDirectorio(lista, 'cordoba', '').map(n => n.slug)).toEqual(['bea']);
    expect(filtrarDirectorio(lista, 'celiaquia', '').map(n => n.slug)).toEqual(['ana']);
    expect(filtrarDirectorio(lista, '', 'online').map(n => n.slug)).toEqual(['bea', 'caro']);
    expect(filtrarDirectorio(lista, '', 'presencial').map(n => n.slug)).toEqual(['ana', 'bea']);
  });

  it('le explica a la nutri en qué está su matrícula', () => {
    expect(textoDirectorio(null, true)).toMatch(/Gratis para nutris matriculadas/);
    expect(textoDirectorio(listing({}), true)).toMatch(/revisando/);
    expect(textoDirectorio(listing({ status: 'rejected', reject_reason: 'Foto borrosa' }), true)).toContain('Foto borrosa');
    expect(textoDirectorio(listing({ status: 'verified' }), false)).toMatch(/Publicá tu página/);
    expect(textoDirectorio(listing({ status: 'verified' }), true)).toMatch(/Salís en el directorio/);
    expect(textoDirectorio(listing({ status: 'verified', listed: false }), true)).toMatch(/no salir/);
  });

  it('solo acepta PDF, JPG o PNG de hasta 5 MB', () => {
    expect(validarMatricula(new File(['x'], 'm.pdf', { type: 'application/pdf' }))).toBe('');
    expect(validarMatricula(new File(['x'], 'm.gif', { type: 'image/gif' }))).toMatch(/PDF, JPG o PNG/);
    expect(validarMatricula(new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'm.png', { type: 'image/png' }))).toMatch(/5 MB/);
  });

  it('/profesionales es el directorio y no la página de una nutri', () => {
    expect(isPublicSlug('profesionales')).toBe(false);
    expect(publicSlugFromPath('/profesionales')).toBeNull();
  });

  it('la página de la nutri muestra el sello solo si la matrícula está verificada', () => {
    const base = { page: { ...schedulingDefaultSettings().page, title: 'Lic. Ana' }, profile: publicPageProfile(undefined), calendars: [], types: [], timezone: 'America/Argentina/Buenos_Aires' as const, transfer_alias: '', mercado_pago_connected: false };
    expect(renderToStaticMarkup(<PublicProfessionalHeader page={base} />)).not.toContain('verificada');
    expect(renderToStaticMarkup(<PublicProfessionalHeader page={{ ...base, verified_license: 'MN 4521' }} />)).toContain('Matrícula verificada por Nutridash · MN 4521');
  });
});
