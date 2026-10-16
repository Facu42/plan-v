import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { keyBytes } from '../../pwa/push';
import { PushRow, pushRowText } from './push-row';

describe('avisos al teléfono en la hoja de avisos', () => {
  it('cada estado tiene su texto en español y sin soporte no se muestra', () => {
    expect(pushRowText('unsupported', false)).toBeNull();
    expect(pushRowText('off', false)?.title).toBe('Recibir avisos en este teléfono');
    expect(pushRowText('on', false)?.title).toBe('Avisos activados en este teléfono');
    expect(pushRowText('blocked', false)?.note).toMatch(/ajustes del teléfono/);
    expect(pushRowText('off', true)?.title).toBe('No pudimos activar los avisos');
  });

  it('en un navegador sin avisos la fila no aparece', () => {
    expect(renderToStaticMarkup(<PushRow />)).toBe('');
  });

  it('convierte la clave pública a bytes', () => {
    expect(Array.from(keyBytes('AQID-_8'))).toEqual([1, 2, 3, 251, 255]);
  });
});
