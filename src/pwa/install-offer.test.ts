import { afterEach, describe, expect, it, vi } from 'vitest';
import { captureInstallPrompt, installOffer, promptInstall, resetInstallPrompt, hasInstallPrompt } from './install-offer';

afterEach(() => resetInstallPrompt());

describe('oferta de instalación', () => {
  it('en iPhone explica Safari aunque no haya aviso del navegador', () => {
    expect(installOffer({ platform: 'ios', hasPrompt: false, dismissed: false })?.action).toBe('Entendido');
  });

  it('en computadora o Android solo se ofrece si el navegador permite instalar', () => {
    expect(installOffer({ platform: 'desktop', hasPrompt: false, dismissed: false })).toBeNull();
    expect(installOffer({ platform: 'android', hasPrompt: true, dismissed: false })?.action).toBe('Instalar');
  });

  it('no se ofrece si ya está instalada o si la paciente dijo «Ahora no»', () => {
    expect(installOffer({ platform: 'standalone', hasPrompt: true, dismissed: false })).toBeNull();
    expect(installOffer({ platform: 'desktop', hasPrompt: true, dismissed: true })).toBeNull();
  });

  it('guarda el aviso del navegador aunque llegue antes de abrir la pantalla', async () => {
    const target = new EventTarget() as unknown as Window;
    captureInstallPrompt(target);
    const prompt = vi.fn().mockResolvedValue(undefined);
    const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), { prompt });
    target.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(hasInstallPrompt()).toBe(true);
    await promptInstall();
    expect(prompt).toHaveBeenCalledOnce();
    expect(hasInstallPrompt()).toBe(false);
  });
});
