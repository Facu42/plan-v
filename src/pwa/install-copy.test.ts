import { describe, expect, it } from 'vitest';
import { detectInstallPlatform, INSTALL_COPY } from './install-copy';

describe('instrucciones de instalación PWA', () => {
  it('no muestra el flujo de Android en iPhone', () => {
    expect(detectInstallPlatform({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)' })).toBe('ios');
    expect(INSTALL_COPY.ios.body).toContain('Safari');
    expect(INSTALL_COPY.ios.body).toContain('No uses las instrucciones de Android');
    expect(INSTALL_COPY.ios.body).not.toContain('Play');
  });

  it('usa el prompt nativo en Android y omite Safari', () => {
    expect(detectInstallPlatform({ userAgent: 'Mozilla/5.0 (Linux; Android 14)' })).toBe('android');
    expect(INSTALL_COPY.android.body).not.toContain('Safari');
  });

  it('no ofrece instalar si ya está en standalone', () => {
    expect(detectInstallPlatform({ userAgent: 'Mozilla/5.0 (Linux; Android 14)', displayModeStandalone: true })).toBe('standalone');
  });
});
