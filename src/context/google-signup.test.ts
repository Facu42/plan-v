import { describe, expect, it } from 'vitest';
import { LEGAL_VERSION, hasCurrentLegalAcceptance } from '../legal';
import { googleSignupMetadata, PENDING_GOOGLE_SIGNUP_KEY, rememberGoogleSignup, takeGoogleSignup } from './google-signup';

function memoryStore() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => { map.set(k, v); },
    removeItem: (k: string) => { map.delete(k); },
    map,
  };
}

const now = new Date('2026-09-29T18:00:00Z');

describe('ingreso con Google: lo elegido antes de salir', () => {
  it('guarda la elección y la lee una sola vez', () => {
    const store = memoryStore();
    rememberGoogleSignup(store, { professional: true, acceptedLegal: true }, now);
    const pending = takeGoogleSignup(store, new Date(now.getTime() + 60_000));
    expect(pending).toMatchObject({ professional: true, legalAcceptedAt: now.toISOString() });
    expect(store.map.has(PENDING_GOOGLE_SIGNUP_KEY)).toBe(false);
    expect(takeGoogleSignup(store, now)).toBeNull();
  });

  it('descarta lo viejo o roto', () => {
    const store = memoryStore();
    rememberGoogleSignup(store, { professional: true, acceptedLegal: true }, now);
    expect(takeGoogleSignup(store, new Date(now.getTime() + 31 * 60_000))).toBeNull();
    store.setItem(PENDING_GOOGLE_SIGNUP_KEY, '{no es json');
    expect(takeGoogleSignup(store, now)).toBeNull();
  });

  it('sin casilla marcada no deja constancia de aceptación', () => {
    const store = memoryStore();
    rememberGoogleSignup(store, { professional: false, acceptedLegal: false }, now);
    const pending = takeGoogleSignup(store, now)!;
    expect(googleSignupMetadata(pending, { created_at: now.toISOString(), user_metadata: {} }, now)).toBeNull();
  });

  it('cuenta nueva: marca nutricionista y la aceptación', () => {
    const pending = { professional: true, legalAcceptedAt: now.toISOString(), savedAt: now.toISOString() };
    const data = googleSignupMetadata(pending, { created_at: now.toISOString(), user_metadata: { full_name: 'Ana' } }, now);
    expect(data).toEqual({ professional_signup: true, legal_version: LEGAL_VERSION, legal_accepted_at: now.toISOString() });
    expect(hasCurrentLegalAcceptance(data)).toBe(true);
  });

  it('una cuenta que ya existía no pasa a nutricionista por tocar el botón', () => {
    const pending = { professional: true, legalAcceptedAt: null, savedAt: now.toISOString() };
    const created = new Date(now.getTime() - 3 * 24 * 3600_000).toISOString();
    expect(googleSignupMetadata(pending, { created_at: created, user_metadata: {} }, now)).toBeNull();
  });
});

describe('aceptación de términos vigente', () => {
  it('pide aceptar si falta o si cambió la versión', () => {
    expect(hasCurrentLegalAcceptance({})).toBe(false);
    expect(hasCurrentLegalAcceptance(null)).toBe(false);
    expect(hasCurrentLegalAcceptance({ legal_version: '2020-01-01' })).toBe(false);
    expect(hasCurrentLegalAcceptance({ legal_version: LEGAL_VERSION })).toBe(true);
  });
});
