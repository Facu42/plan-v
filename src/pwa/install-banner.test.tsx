import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { InstallBanner } from './InstallBanner';
import { OfflineNotice } from './OfflineNotice';
import { ShellUpdateNotice } from './ShellUpdateNotice';
import { emitShellUpdate, resetShellUpdateState } from './shell-update';
import { INSTALL_COPY } from './install-copy';

describe('avisos PWA iPhone/Android', () => {
  it('en iPhone pide Safari y no el flujo de Android', () => {
    const html = renderToStaticMarkup(<InstallBanner platform="ios" />);
    expect(html).toContain(INSTALL_COPY.ios.title);
    expect(html).toContain('Safari');
    expect(html).toContain('No uses las instrucciones de Android');
    expect(html).not.toContain(INSTALL_COPY.android.action);
    expect(html).not.toContain('Play');
  });

  it('en Android omite Safari y ofrece instalar', () => {
    const html = renderToStaticMarkup(<InstallBanner platform="android" />);
    expect(html).toContain(INSTALL_COPY.android.title);
    expect(html).toContain('no se guardan sin conexión');
    expect(html).not.toContain('Safari');
    expect(html).toContain('Ahora no');
  });

  it('el aviso de actualización de shell no implica cache clínico', () => {
    resetShellUpdateState();
    emitShellUpdate({ updated: true });
    const html = renderToStaticMarkup(<ShellUpdateNotice />);
    expect(html).toContain('El shell de la app se actualizó');
    expect(html).toContain('no se guardan en este dispositivo');
    expect(html).toContain('Recargar');
    resetShellUpdateState();
    expect(renderToStaticMarkup(<ShellUpdateNotice />)).toBe('');
  });

  it('el aviso offline no promete un diario local', () => {
    const html = renderToStaticMarkup(<OfflineNotice />);
    expect(html === '' || html.includes('Sin conexión') || html.includes('Todavía no se guardó')).toBe(true);
  });
});
