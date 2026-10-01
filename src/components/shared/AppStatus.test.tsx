import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AppErrorBoundary, ErrorScreen, LoadingScreen } from './AppStatus';

const css = readFileSync(new URL('./app-status.css', import.meta.url), 'utf8');

describe('pantallas de carga y de error', () => {
  it('la carga avisa a quien usa lector de pantalla', () => {
    const html = renderToStaticMarkup(<LoadingScreen label="Cargando tu espacio…" />);
    expect(html).toContain('role="status"');
    expect(html).toContain('Cargando tu espacio…');
  });

  it('el error está en español, se anuncia y ofrece volver a cargar', () => {
    const html = renderToStaticMarkup(<ErrorScreen onReload={() => undefined} />);
    expect(html).toContain('role="alert"');
    expect(html).toContain('Algo salió mal');
    expect(html).toContain('Volver a cargar');
  });

  it('la protección pasa a error cuando algo falla y no toca lo que anda', () => {
    expect(AppErrorBoundary.getDerivedStateFromError()).toEqual({ failed: true });
    expect(renderToStaticMarkup(<AppErrorBoundary><p>todo bien</p></AppErrorBoundary>)).toContain('todo bien');
  });

  it('el giro de la carga se apaga con "reducir movimiento"', () => {
    const outside = css.replace(/@media \(prefers-reduced-motion: no-preference\) \{[\s\S]*?\n\}\n/, '');
    expect(outside).not.toMatch(/\banimation\s*:/);
    expect(css).toMatch(/no-preference[\s\S]*app-status-spin/);
  });
});
