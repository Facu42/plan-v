import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { pageExtrasSchema, schedulingDefaultSettings } from '../types/scheduling';
import { etiquetaModalidad, fotoAlElegir, fotoParaSlug, fotoPublica, huellaFoto, precioConsulta, publicPageProfile } from './public-page-profile';

describe('perfil público de la nutri', () => {
  it('acepta modalidad, precio, reserva y colores y rechaza un color inventado', () => {
    const ok = pageExtrasSchema.safeParse({
      area: 'Belgrano', specialties: ['Celiaquía'], modality: 'ambas', consult_price_minor: 3500000,
      booking_url: 'https://cal.example/turno', color: '#112233', accent: '#C2E66E',
    });
    expect(ok.success).toBe(true);
    expect(pageExtrasSchema.safeParse({ color: 'verde' }).success).toBe(false);
    expect(pageExtrasSchema.safeParse({ booking_url: 'http://inseguro.example' }).success).toBe(false);
  });

  it('arma el recorte público sin obras ni avisos y formatea precio y modalidad', () => {
    const extras = pageExtrasSchema.parse({
      license: 'MN 1', area: 'Palermo', specialties: ['Embarazo'], modality: 'presencial',
      consult_price_minor: 4000000, booking_url: 'https://turno.example', color: '#010203',
      insurers: [{ name: 'OSDE', mode: 'copago', note: '$8.000' }], notices: { review: true },
      photo_sha256: 'ab'.repeat(32),
    });
    const perfil = publicPageProfile(extras, 'data:image/png;base64,xx');
    expect(perfil).toEqual({
      specialties: ['Embarazo'], area: 'Palermo', license: 'MN 1', modality: 'presencial',
      consult_price_minor: 4000000, booking_url: 'https://turno.example', color: '#010203',
      photo: 'data:image/png;base64,xx',
    });
    expect(perfil).not.toHaveProperty('insurers');
    expect(perfil).not.toHaveProperty('photo_sha256');
    expect(etiquetaModalidad('ambas')).toBe('Presencial y online');
    expect(precioConsulta(4000000)).toBe('$40.000');
    expect(precioConsulta(0)).toBe('');
  });

  it('usa el enlace https o, si falta, el logo de la marca; si no hay nada, queda vacío', () => {
    const page = schedulingDefaultSettings().page;
    expect(fotoPublica({ ...page, logo_url: 'https://cdn.example/foto.jpg' }, 'data:image/png;base64,aa')).toBe('https://cdn.example/foto.jpg');
    expect(fotoPublica(page, 'data:image/png;base64,aa')).toBe('data:image/png;base64,aa');
    expect(fotoPublica(page, 'https://otro.example/no')).toBe('');
  });

  it('en /slug la foto subida no se ve hasta que la huella publicada coincide', async () => {
    const page = schedulingDefaultSettings().page;
    const nueva = 'data:image/png;base64,TkVX';
    const vieja = 'data:image/jpeg;base64,T0xE';
    const huellaNueva = await huellaFoto(nueva);
    const huellaVieja = await huellaFoto(vieja);
    expect(huellaNueva).not.toBe(huellaVieja);
    expect(fotoParaSlug(page, nueva, undefined, huellaNueva)).toBe('');
    expect(fotoParaSlug(page, nueva, huellaVieja, huellaNueva)).toBe('');
    expect(fotoParaSlug(page, vieja, huellaVieja, huellaVieja)).toBe(vieja);
    expect(fotoParaSlug({ ...page, logo_url: 'https://cdn.example/foto.jpg' }, nueva, huellaVieja, huellaNueva)).toBe('https://cdn.example/foto.jpg');
    expect(fotoAlElegir(nueva).persistirAhora).toBe(false);
  });

  it('subir la foto no la guarda en la marca antes de publicar', () => {
    const source = readFileSync(new URL('../components/nutrigo/PanelPublicaCajones.tsx', import.meta.url), 'utf8');
    const body = source.slice(source.indexOf('async function subirFoto'), source.indexOf('const guardar'));
    expect(body).toContain('fotoAlElegir');
    expect(body).not.toMatch(/saveSettings|nutritionCapabilityApi/);
    expect(source.slice(source.indexOf('async function subirFoto'), source.indexOf('export function CajonLugar'))).not.toMatch(/saveSettings/);
  });
});
