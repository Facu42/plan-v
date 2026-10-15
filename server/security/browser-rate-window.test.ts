import { describe, expect, it } from 'vitest';
// @ts-expect-error Local test-runner helper; never loaded by the application.
import { waitForBrowserRateWindow } from '../../scripts/browser-rate-window.mjs';

describe('Pausa del recorrido real sin desactivar límites del servidor', () => {
  it('espera sólo lo que falta de la primera ventana y usa pausas cortas', async () => {
    let clock = 50_000; const pauses: number[] = [];
    await waitForBrowserRateWindow(0, { now: () => clock, pause: async (ms: number) => { pauses.push(ms); clock += ms; } });
    expect(clock).toBe(61_000);
    expect(pauses.every(ms => ms > 0 && ms <= 1000)).toBe(true);
  });
  it('no demora un recorrido que ya atravesó la ventana natural', async () => {
    const pauses: number[] = [];
    await waitForBrowserRateWindow(0, { now: () => 70_000, pause: async (ms: number) => { pauses.push(ms); } });
    expect(pauses).toEqual([]);
  });
  it('no agrega un segundo completo si sólo faltan cien milisegundos', async () => {
    let clock = 60_900; const pauses: number[] = [];
    await waitForBrowserRateWindow(0, { now: () => clock, pause: async (ms: number) => { pauses.push(ms); clock += ms; } });
    expect(pauses).toEqual([100]);
  });
});
