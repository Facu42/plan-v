import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error helper operator MJS, without runtime secrets in source
import { buildAuthSmtpConfig, configureAuthSmtp } from '../../scripts/auth-smtp-config.mjs';
const env = { BREVO_SMTP_LOGIN: 'operator', BREVO_SMTP_KEY: 'fake-key', BREVO_SENDER_VERIFIED: '1' };
describe('configuración de SMTP revisable y comprobación por defecto', () => {
  it('no modifica configuración al comprobar y exige remitente verificado', async () => {
    const fetchImpl = vi.fn();
    const result = await configureAuthSmtp(env, { fetchImpl });
    expect(result.ready).toBe(true);
    expect(JSON.stringify(result)).not.toContain('fake-key');
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(() => buildAuthSmtpConfig({ ...env, BREVO_SENDER_VERIFIED: '0' })).toThrow();
  });
  it('preserva destinos Google y no deshabilita confirmación de correo', async () => {
    const config = buildAuthSmtpConfig(env);
    const fetchImpl = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ uri_allow_list: 'https://plan-v-eight.vercel.app/admin' }))).mockResolvedValueOnce(new Response('{}')).mockResolvedValueOnce(new Response(JSON.stringify(config)));
    await configureAuthSmtp({ ...env, SUPABASE_ACCESS_TOKEN: 'fake-access' }, { apply: true, fetchImpl });
    const saved = JSON.parse(fetchImpl.mock.calls[1][1].body);
    expect(saved.uri_allow_list).toContain('/admin');
    expect(saved.mailer_autoconfirm).toBe(false);
    expect(saved.mailer_templates_recovery_content).toContain('{{ .ConfirmationURL }}');
  });
});
