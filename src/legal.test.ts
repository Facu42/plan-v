import { describe, expect, it } from 'vitest';
import { legalAcceptance, LEGAL_VERSION } from './legal';

describe('constancia de aceptación', () => {
  it('guarda la versión vigente y el momento', () => {
    expect(legalAcceptance(new Date('2026-09-29T12:00:00Z'))).toEqual({ legal_version: LEGAL_VERSION, legal_accepted_at: '2026-09-29T12:00:00.000Z' });
  });
});
