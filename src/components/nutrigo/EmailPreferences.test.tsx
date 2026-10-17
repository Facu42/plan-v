import type { EffectCallback, FormEvent } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NotificationPrefs } from '../../types/outbox';

const mocks = vi.hoisted(() => ({
  get: vi.fn(), save: vi.fn(), otherChannel: vi.fn(),
  forms: [] as Array<{ onSubmit: (event: FormEvent) => Promise<void> }>,
  effects: [] as EffectCallback[], seeds: [] as unknown[], updates: [] as Array<{ index: number; value: unknown }>, cursor: 0,
}));
vi.mock('react', async importOriginal => {
  const original = await importOriginal<typeof import('react')>();
  return { ...original, useState: (initial: unknown) => {
    const index = mocks.cursor++;
    const [state, setState] = original.useState(mocks.seeds.length ? mocks.seeds.shift() : initial);
    return [state, (value: unknown) => { mocks.updates.push({ index, value }); setState(value); }];
  }, useEffect: (effect: EffectCallback, deps?: unknown[]) => { mocks.effects.push(effect); original.useEffect(effect, deps); } };
});
vi.mock('react/jsx-runtime', async importOriginal => {
  const original = await importOriginal<typeof import('react/jsx-runtime')>();
  const collect = (type: unknown, props: unknown) => {
    if (type === 'form') mocks.forms.push(props as { onSubmit: (event: FormEvent) => Promise<void> });
  };
  return { ...original, jsx: (...args: Parameters<typeof original.jsx>) => { collect(args[0], args[1]); return original.jsx(...args); }, jsxs: (...args: Parameters<typeof original.jsxs>) => { collect(args[0], args[1]); return original.jsxs(...args); } };
});
vi.mock('react/jsx-dev-runtime', async importOriginal => {
  const original = await importOriginal<typeof import('react/jsx-dev-runtime')>();
  return { ...original, jsxDEV: (...args: Parameters<typeof original.jsxDEV>) => {
    if (args[0] === 'form') mocks.forms.push(args[1] as { onSubmit: (event: FormEvent) => Promise<void> });
    return original.jsxDEV(...args);
  } };
});
vi.mock('../../api/client', () => ({ api: { getNotificationPrefs: mocks.get, saveNotificationPrefs: mocks.save }, request: mocks.otherChannel }));
import { EmailPreferences } from './EmailPreferences';

const prefs: NotificationPrefs = { in_app: true, email: false, push: false };
const view = (value = prefs) => ({ prefs: value, source: 'memory' });
let cleanups: Array<() => void> = [];
function unmount() { for (const cleanup of cleanups.splice(0)) cleanup(); }
function render(chosen?: boolean, loadError = '') {
  mocks.cursor = 0; mocks.effects.length = 0; mocks.forms.length = 0;
  if (chosen !== undefined || loadError) mocks.seeds.push(chosen === undefined ? null : view(), chosen ?? false, false, loadError, '', 0);
  const html = renderToStaticMarkup(<EmailPreferences patientId="paciente-ficticia" />);
  cleanups.push(...mocks.effects.map(effect => effect()).filter((cleanup): cleanup is () => void => typeof cleanup === 'function'));
  return { html, submit: () => mocks.forms[0].onSubmit({ preventDefault: vi.fn() } as unknown as FormEvent) };
}
async function finishLoad() { await vi.waitFor(() => expect(mocks.get).toHaveBeenCalled()); await Promise.resolve(); mocks.updates.length = 0; }
beforeEach(() => {
  mocks.get.mockReset().mockResolvedValue(view()); mocks.save.mockReset().mockImplementation(async (next: NotificationPrefs) => view(next)); mocks.otherChannel.mockReset();
  mocks.seeds.length = 0; mocks.updates.length = 0;
});
afterEach(unmount);

describe('permiso de correo desde la privacidad de la paciente', () => {
  it('empieza apagado y bloqueado mientras carga; leer no concede permiso ni envía un PUT', async () => {
    const { html } = render();
    expect(html).toContain('Cargando permiso de correo'); expect(html).not.toContain('checked=""'); expect(html).toContain('disabled=""');
    await finishLoad(); expect(mocks.get).toHaveBeenCalledExactlyOnceWith('paciente-ficticia', 'patient'); expect(mocks.save).not.toHaveBeenCalled();
  });
  it('presenta el permiso previamente concedido sin volver a guardarlo automáticamente', async () => {
    mocks.get.mockResolvedValue(view({ ...prefs, email: true })); render();
    await vi.waitFor(() => expect(mocks.updates).toContainEqual({ index: 1, value: true })); expect(mocks.save).not.toHaveBeenCalled();
  });
  it('guarda sólo la elección explícita de correo y preserva in_app/push leídos nuevamente', async () => {
    const form = render(true); await finishLoad();
    mocks.get.mockResolvedValueOnce(view({ in_app: false, email: false, push: true }));
    await form.submit();
    expect(mocks.save).toHaveBeenCalledExactlyOnceWith({ in_app: false, email: true, push: true }, 'paciente-ficticia', 'patient');
    expect(mocks.otherChannel).not.toHaveBeenCalled(); expect(mocks.updates).toContainEqual({ index: 4, value: 'Guardamos tu permiso de correo.' });
  });
  it('retira correo de forma explícita sin retirar avisos internos, push o WhatsApp', async () => {
    const form = render(false); await finishLoad(); mocks.get.mockResolvedValueOnce(view({ in_app: true, email: true, push: true }));
    await form.submit();
    expect(mocks.save).toHaveBeenCalledExactlyOnceWith({ in_app: true, email: false, push: true }, 'paciente-ficticia', 'patient'); expect(mocks.otherChannel).not.toHaveBeenCalled();
    expect(mocks.updates.some(update => update.index === 4 && String(update.value).startsWith('Retiraste tu permiso'))).toBe(true);
  });
  it('si falla la lectura inicial ofrece reintentar sin inventar un permiso ni guardarlo', async () => {
    mocks.get.mockRejectedValueOnce(new Error('Fallo ficticio')); render();
    await vi.waitFor(() => expect(mocks.updates).toContainEqual({ index: 3, value: 'No pudimos leer tu permiso de correo. Podés reintentar.' }));
    expect(mocks.save).not.toHaveBeenCalled(); unmount();
    expect(render(undefined, 'No pudimos leer tu permiso de correo. Podés reintentar.').html).toContain('Reintentar permiso de correo');
  });
  it('una lectura fresca fallida no pisa las otras preferencias ni presenta éxito', async () => {
    const form = render(true); await finishLoad(); mocks.get.mockRejectedValueOnce(new Error('Fallo ficticio'));
    await form.submit(); expect(mocks.save).not.toHaveBeenCalled();
    expect(mocks.updates.some(update => update.index === 3 && String(update.value).includes('Conservamos el cambio'))).toBe(true);
    expect(mocks.updates.some(update => update.index === 4 && String(update.value).includes('Guardamos'))).toBe(false);
  });
  it('un PUT fallido conserva la elección para reintentar y no muestra éxito falso', async () => {
    const form = render(true); await finishLoad(); mocks.save.mockRejectedValueOnce(new Error('Fallo ficticio'));
    await form.submit(); expect(mocks.updates.some(update => update.index === 1)).toBe(false);
    expect(mocks.updates.some(update => update.index === 4 && String(update.value).includes('Guardamos'))).toBe(false);
    await form.submit(); expect(mocks.save).toHaveBeenCalledTimes(2);
    expect(mocks.updates).toContainEqual({ index: 4, value: 'Guardamos tu permiso de correo.' });
  });
  it('dos envíos antes de repintar hacen un solo guardado', async () => {
    const form = render(true); await finishLoad(); await Promise.all([form.submit(), form.submit()]);
    expect(mocks.save).toHaveBeenCalledOnce();
  });
  it('cerrar antes de la lectura fresca impide iniciar un guardado después del cierre', async () => {
    const form = render(true); await finishLoad(); let resolve!: (value: ReturnType<typeof view>) => void;
    mocks.get.mockReturnValueOnce(new Promise(done => { resolve = done; })); const saving = form.submit();
    unmount(); resolve(view()); await saving; expect(mocks.save).not.toHaveBeenCalled();
  });
});
