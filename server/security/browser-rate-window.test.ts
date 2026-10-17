import { describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { createRateLimits } from './http.js';
// @ts-expect-error Local test-runner helper; never loaded by the application.
import { waitForBrowserRateWindow, createBrowserRatePacer } from '../../scripts/browser-rate-window.mjs';

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

describe('El recorrido respeta todas las ventanas de la API local', () => {
  it('atraviesa 600 lecturas con ráfagas de navegación sin recibir 429 del limitador real', async () => {
    let clock = 0; const pauses: number[] = [];
    const pacer = createBrowserRatePacer({ now: () => clock, pause: async (ms: number) => { pauses.push(ms); clock += ms; } });
    pacer.start();
    const app = new Hono();
    app.use('*', createRateLimits({ enabled: () => true, clock: () => clock, clientAddress: () => 'local-runner' }).public);
    app.get('/api/fixture', c => { pacer.observeHttpLine(JSON.stringify({ event: 'http' })); return c.json({ ok: true }); });
    const statuses: number[] = [];
    for (let navigation = 0; navigation < 30; navigation++) {
      await pacer.beforeAction();
      for (let request = 0; request < 20; request++) statuses.push((await app.request('/api/fixture')).status);
    }
    expect(statuses).toHaveLength(600);
    expect(new Set(statuses)).toEqual(new Set([200]));
    expect(clock).toBeGreaterThanOrEqual(5 * 61_000);
    expect(pauses.every(ms => ms > 0 && ms <= 1000)).toBe(true);
  });

  it('cuenta el tráfico de fondo durante la pausa y conserva margen para la siguiente ráfaga', async () => {
    let clock = 0; let background = 0;
    const pacer = createBrowserRatePacer({ now: () => clock, pause: async (ms: number) => { clock += ms; background++; pacer.observeHttpLine('{"event":"http"}'); } });
    pacer.start();
    for (let i = 0; i < 100; i++) pacer.observeHttpLine('{"event":"http"}');
    await pacer.beforeAction();
    expect(background).toBe(61);
    expect(clock).toBe(61_000);
    expect(pacer.activeNow()).toBe(0);
    await pacer.beforeAction();
    expect(clock).toBe(61_000);
    clock += 250;
    expect(pacer.activeNow()).toBe(250);
  });

  it('no espera con poco tráfico, ignora líneas ajenas y reinicia al cambiar la API local', async () => {
    let clock = 1000; const pauses: number[] = [];
    const pacer = createBrowserRatePacer({ now: () => clock, pause: async (ms: number) => { pauses.push(ms); clock += ms; } });
    pacer.start();
    for (let i = 0; i < 500; i++) pacer.observeHttpLine(i % 2 ? 'not-json' : '{"event":"startup"}');
    for (let i = 0; i < 99; i++) pacer.observeHttpLine('{"event":"http"}');
    await pacer.beforeAction();
    expect(pauses).toEqual([]);
    pacer.observeHttpLine('{"event":"http"}');
    pacer.start();
    await pacer.beforeAction();
    expect(pauses).toEqual([]);
    clock += 70_000;
    await pacer.beforeAction();
    expect(pauses).toEqual([]);
  });

  it('el comando real del runner obtiene presupuesto antes de operar el navegador', async () => {
    const source = readFileSync(new URL('../../scripts/product-browser.local.mjs', import.meta.url), 'utf8');
    const declaration = source.match(/async function B\(\.\.\.args\) \{[^\n]+\}/)?.[0];
    expect(declaration).toBeTruthy();
    const calls: string[] = [];
    const command = runInNewContext(`(${declaration})`, {
      ratePacer: { beforeAction: async () => { calls.push('budget'); } },
      run: async () => { calls.push('browse'); return { stdout: 'true' }; }, browse: 'local-browser', env: {}, lastAction: '',
    }) as (...args: string[]) => Promise<string>;
    await command('click', 'button');
    expect(calls).toEqual(['budget', 'browse']);
    calls.length = 0;
    await command('stop');
    expect(calls).toEqual(['browse']);
  });

  it('el timeout real de interfaz conserva sus veinte segundos útiles después de una pausa de un minuto', async () => {
    const source = readFileSync(new URL('../../scripts/product-browser.local.mjs', import.meta.url), 'utf8');
    const declaration = source.match(/async function until\(expression\) \{[\s\S]*?\n\}/)?.[0];
    expect(declaration).toBeTruthy();
    let clock = 0; let reads = 0;
    const pacer = createBrowserRatePacer({ now: () => clock, pause: async (ms: number) => { clock += ms; } });
    for (let i = 0; i < 100; i++) pacer.observeHttpLine('{"event":"http"}');
    const until = runInNewContext(`(${declaration})`, {
      ratePacer: pacer, Date: { now: () => clock },
      B: async () => { await pacer.beforeAction(); return ++reads === 1 ? 'false' : 'true'; },
      setTimeout: (callback: () => void, ms: number) => { clock += ms; callback(); },
    }) as (expression: string) => Promise<void>;
    await until('visible-state');
    expect(reads).toBe(2);
    expect(clock).toBe(61_250);
  });
});
