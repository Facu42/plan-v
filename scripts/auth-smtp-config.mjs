import { pathToFileURL } from 'node:url';

export function buildAuthSmtpConfig(env) {
  const provider = env.SMTP_PROVIDER ?? 'brevo';
  if (!['brevo', 'gmail'].includes(provider)) throw new Error('Proveedor SMTP no admitido.');
  const gmail = provider === 'gmail';
  const login = gmail ? env.SMTP_USER?.trim() : env.BREVO_SMTP_LOGIN?.trim();
  const sender = gmail ? login : env.BREVO_SENDER_EMAIL?.trim() || 'planv.nutricion@gmail.com';
  const password = gmail ? env.SMTP_PASSWORD?.replace(/\s/g, '') : env.BREVO_SMTP_KEY?.trim();
  if (!sender || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sender) || !login || !password) throw new Error('Faltan el remitente, usuario o clave SMTP.');
  if (gmail && !/^[a-z]{16}$/i.test(password)) throw new Error('Usá la contraseña de aplicación de Google de 16 letras.');
  if (!gmail && env.BREVO_SENDER_VERIFIED !== '1') throw new Error('Primero verificá el remitente en Brevo.');
  return {
    smtp_host: gmail ? 'smtp.gmail.com' : 'smtp-relay.brevo.com', smtp_port: '587', smtp_user: login, smtp_pass: password,
    smtp_admin_email: sender, smtp_sender_name: 'Plan V',
    external_email_enabled: true, mailer_autoconfirm: false,
    site_url: 'https://plan-v-eight.vercel.app',
    uri_allow_list: 'https://plan-v-eight.vercel.app/,https://plan-v-eight.vercel.app/app/inicio?invite=*',
    mailer_subjects_confirmation: 'Confirmá tu cuenta de Plan V',
    mailer_subjects_invite: 'Tu acceso a Plan V',
    mailer_subjects_recovery: 'Restablecé tu contraseña de Plan V',
    mailer_subjects_magic_link: 'Entrá a Plan V',
    mailer_templates_confirmation_content: '<h2>Confirmá tu cuenta</h2><p>Para empezar, <a href="{{ .ConfirmationURL }}">confirmá tu correo</a>.</p><p>Si no creaste una cuenta en Plan V, ignorá este mensaje.</p>',
    mailer_templates_invite_content: '<h2>Tu acceso a Plan V</h2><p><a href="{{ .ConfirmationURL }}">Abrí tu invitación</a> para entrar con el correo invitado y vincular tu cuenta.</p>',
    mailer_templates_recovery_content: '<h2>Restablecé tu contraseña</h2><p><a href="{{ .ConfirmationURL }}">Elegí una nueva contraseña</a>.</p><p>Si no pediste este cambio, ignorá el mensaje.</p>',
    mailer_templates_magic_link_content: '<h2>Entrá a Plan V</h2><p><a href="{{ .ConfirmationURL }}">Abrí tu enlace de acceso</a>.</p><p>Si no lo pediste, ignorá este mensaje.</p>',
  };
}

export async function configureAuthSmtp(env, { apply = false, fetchImpl = fetch } = {}) {
  const settings = buildAuthSmtpConfig(env);
  if (!apply) return { mode: 'check', ready: true, sender: settings.smtp_admin_email, project: 'plan-v-app' };
  if (!env.SUPABASE_ACCESS_TOKEN) throw new Error('Falta el permiso de administración de Supabase.');
  const endpoint = 'https://api.supabase.com/v1/projects/wvosvlxpfytokwfbcero/config/auth';
  const headers = { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, 'Content-Type': 'application/json' };
  const before = await fetchImpl(endpoint, { headers, redirect: 'error' });
  if (!before.ok) throw new Error(`No pudimos leer la configuración (${before.status}).`);
  const current = await before.json();
  // Conservar todos los destinos existentes, incluidos Google y las pruebas autorizadas.
  settings.uri_allow_list = [...new Set([...String(current.uri_allow_list ?? '').split(','), ...settings.uri_allow_list.split(',')].map(v => v.trim()).filter(Boolean))].join(',');
  const changed = await fetchImpl(endpoint, { method: 'PATCH', headers, body: JSON.stringify(settings), redirect: 'error' });
  if (!changed.ok) throw new Error(`Supabase no aceptó la configuración (${changed.status}).`);
  const verify = await fetchImpl(endpoint, { headers, redirect: 'error' });
  if (!verify.ok) throw new Error('No pudimos verificar la configuración guardada.');
  const read = await verify.json();
  if (read.smtp_host !== settings.smtp_host || read.smtp_admin_email !== settings.smtp_admin_email || read.mailer_autoconfirm !== false) throw new Error('La configuración guardada no coincide.');
  return { mode: 'applied', configured: true, sender: settings.smtp_admin_email, deliveryVerified: false };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  configureAuthSmtp(process.env, { apply: process.argv.includes('--apply') }).then(result => console.log(JSON.stringify(result))).catch(error => { console.error(error.message); process.exitCode = 1; });
}
