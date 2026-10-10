import { describe, expect, it, vi } from 'vitest';
import { emailPatientInvite, emailPatientInviteWithBrevo, type InviteMailer } from './invite-email.js';

const invite = { id: '11111111-1111-4111-8111-111111111111', email: 'ana@example.com' };
const site = 'https://plan-v.test';
const link = `${site}/app/inicio?invite=${invite.id}`;
function mailer(invite: InviteMailer['invite'], magicLink: InviteMailer['magicLink'] = vi.fn(async () => ({ error: null }))): InviteMailer {
  return { invite, magicLink };
}

describe('invitación por mail con Supabase', () => {
  it('a una persona sin cuenta le manda la invitación de Supabase con el enlace de su ficha y el rol de paciente', async () => {
    const send = vi.fn(async () => ({ error: null }));
    await expect(emailPatientInvite(invite, site, mailer(send))).resolves.toEqual({ delivery: 'invite' });
    expect(send).toHaveBeenCalledWith('ana@example.com', { redirectTo: link, data: { role: 'paciente' } });
  });

  it('si ya tiene cuenta le manda un enlace para entrar, sin crear otra', async () => {
    const magic = vi.fn(async () => ({ error: null }));
    const result = await emailPatientInvite(invite, site, mailer(async () => ({ error: { code: 'email_exists', status: 422 } }), magic));
    expect(result).toEqual({ delivery: 'magic_link' });
    expect(magic).toHaveBeenCalledWith('ana@example.com', link);
  });

  it('explica en castellano los límites del envío de Supabase', async () => {
    await expect(emailPatientInvite(invite, site, mailer(async () => ({ error: { code: 'over_email_send_rate_limit', status: 429 } }))))
      .rejects.toMatchObject({ status: 429, message: expect.stringMatching(/límite de mails/) });
    await expect(emailPatientInvite(invite, site, mailer(async () => ({ error: { code: 'email_address_not_authorized', status: 400 } }))))
      .rejects.toMatchObject({ status: 503, message: expect.stringMatching(/Copiá el enlace/) });
    await expect(emailPatientInvite(invite, undefined, mailer(vi.fn()))).rejects.toMatchObject({ status: 503 });
  });

  it('con Brevo arma el enlace en Supabase y manda un mail propio en castellano', async () => {
    const generate = vi.fn(async (type: 'invite' | 'magiclink') => type === 'invite' ? { link: null, error: { code: 'email_exists', status: 422 } } : { link: 'https://supabase.test/verify?token=x', error: null });
    const send = vi.fn(async () => ({ status: 'sent' as const }));
    const result = await emailPatientInviteWithBrevo({ ...invite, patientName: 'Ana Pérez', nutritionistName: 'Verónica' }, site, { generate, send });
    expect(result).toEqual({ delivery: 'magic_link' });
    expect(generate).toHaveBeenNthCalledWith(1, 'invite', 'ana@example.com', link);
    expect(generate).toHaveBeenNthCalledWith(2, 'magiclink', 'ana@example.com', link);
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ to: { email: 'ana@example.com', name: 'Ana Pérez' }, subject: 'Verónica te invita a Plan V', text: expect.stringContaining('https://supabase.test/verify?token=x') }));
  });

  it('si Brevo falla, avisa que copie el enlace', async () => {
    const generate = vi.fn(async () => ({ link: 'https://supabase.test/verify', error: null }));
    await expect(emailPatientInviteWithBrevo({ ...invite, patientName: 'Ana', nutritionistName: 'Verónica' }, site, { generate, send: async () => { throw new Error('Brevo 401'); } }))
      .rejects.toMatchObject({ status: 503, message: expect.stringMatching(/Copiá el enlace/) });
  });
});
