import { describe, expect, it } from 'vitest';
import { parseSupportEmail, supportEmailFromEnv, supportMailto } from './support-email';

describe('mail de soporte', () => {
  it('acepta un mail limpio y rechaza vacío, salto de línea o un Gmail inventado en el código', () => {
    expect(parseSupportEmail('  ayuda@nutridash.example  ')).toBe('ayuda@nutridash.example');
    expect(parseSupportEmail('')).toBeNull();
    expect(parseSupportEmail('hola\nmalo@x.com')).toBeNull();
    expect(parseSupportEmail('no-es-mail')).toBeNull();
    expect(supportEmailFromEnv({})).toBeNull();
    expect(supportEmailFromEnv({ VITE_SUPPORT_EMAIL: 'panel@nutridash.example' })).toBe('panel@nutridash.example');
    expect(supportEmailFromEnv({ SUPPORT_EMAIL: 'ops@nutridash.example' })).toBe('ops@nutridash.example');
  });

  it('arma un mailto sin hardcodear destinatario', () => {
    expect(supportMailto('panel@nutridash.example', 'Ayuda del panel', 'No veo la invitación')).toBe(
      'mailto:panel@nutridash.example?subject=Ayuda+del+panel&body=No+veo+la+invitaci%C3%B3n',
    );
  });
});
