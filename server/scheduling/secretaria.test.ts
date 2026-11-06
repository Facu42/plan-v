import { describe, expect, it, vi } from 'vitest';
import { enlaceDeInvitacion, mandarInvitacion } from './secretaria.js';
import { secretaryInviteEmail } from '../mail/templates.js';

const config = { provider: 'resend' as const, config: { apiKey: 're_x', senderEmail: 'hola@nutridash.net', senderName: 'Nutridash' } };

describe('invitación de la secretaria', () => {
  it('arma el enlace a /equipo con el código', () => {
    expect(enlaceDeInvitacion('https://nutridash.net', 'abc_DEF-123')).toBe('https://nutridash.net/equipo?codigo=abc_DEF-123');
    expect(enlaceDeInvitacion(undefined, 'abc')).toBeNull();
  });

  it('manda el mail con el enlace y sin datos de pacientes', async () => {
    const send = vi.fn().mockResolvedValue({ providerId: '1' });
    const r = await mandarInvitacion({ email: 'sec@mail.com', clinic: 'Consultorio de Vero', link: 'https://nutridash.net/equipo?codigo=x', token: 'x'.repeat(43) }, send, config);
    expect(r).toBe('enviado');
    const message = send.mock.calls[0][1];
    expect(message.to.email).toBe('sec@mail.com');
    expect(message.subject).toBe('Consultorio de Vero te invita a Nutridash');
    expect(message.text).toContain('https://nutridash.net/equipo?codigo=x');
    expect(message.text).toContain('sin las fichas clínicas');
  });

  it('sin correo configurado o si falla, la invitación sigue y lo dice', async () => {
    const send = vi.fn().mockRejectedValue(new Error('caído'));
    expect(await mandarInvitacion({ email: 'a@b.com', clinic: '', link: 'https://x.y/equipo?codigo=1', token: 't' }, send, null)).toBe('apagado');
    expect(await mandarInvitacion({ email: 'a@b.com', clinic: '', link: null, token: 't' }, send, config)).toBe('apagado');
    expect(await mandarInvitacion({ email: 'a@b.com', clinic: '', link: 'https://x.y/equipo?codigo=1', token: 't' }, send, config)).toBe('fallo');
  });

  it('escapa el nombre del consultorio en el HTML', () => {
    expect(secretaryInviteEmail({ clinic: '<b>Vero</b>', link: 'https://x.y', days: 7 }).html).not.toContain('<b>Vero</b>');
  });
});
