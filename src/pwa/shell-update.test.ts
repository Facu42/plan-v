import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { applyWaitingShell, emitShellUpdate, getShellUpdateState, resetShellUpdateState } from './shell-update';

describe('actualización de shell PWA', () => {
  it('expone waiting y updated sin guardar datos clínicos', () => {
    resetShellUpdateState();
    emitShellUpdate({ waiting: true });
    expect(getShellUpdateState()).toEqual({ waiting: true, updated: false });
    emitShellUpdate({ updated: true, waiting: false });
    expect(getShellUpdateState()).toEqual({ waiting: false, updated: true });
    const worker = { posted: '' as string, postMessage(value: string) { this.posted = value; } };
    applyWaitingShell(worker);
    expect(worker.posted).toBe('SKIP_WAITING');
    resetShellUpdateState();
  });

  it('el HTML y el manifest cubren iPhone y Android', () => {
    const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
    expect(html).toContain('apple-touch-icon');
    expect(html).toContain('apple-mobile-web-app-capable');
    expect(html).toContain('mobile-web-app-capable');
    expect(html).toContain('manifest.webmanifest');
    const manifest = JSON.parse(readFileSync(new URL('../../public/manifest.webmanifest', import.meta.url), 'utf8')) as {
      display: string;
      start_url: string;
      icons: Array<{ src: string; purpose?: string; sizes: string }>;
    };
    expect(manifest.display).toBe('standalone');
    expect(manifest.start_url).toBe('/app/inicio');
    expect(manifest.icons.some((icon) => icon.sizes === '192x192')).toBe(true);
    expect(manifest.icons.some((icon) => icon.sizes === '512x512' && (icon.purpose ?? '').includes('maskable'))).toBe(true);
  });

  it('los avisos PWA cubren login, Nutrigo y el shell legado', () => {
    const source = readFileSync(new URL('../components/PlanVExperience.tsx', import.meta.url), 'utf8');
    expect(source).toContain('PwaChrome');
    expect(source.match(/<PwaChrome \/>/g)?.length).toBeGreaterThanOrEqual(5);
  });
});
