/** Textos de los mails, en castellano con voseo. Todo dato de personas se escapa antes de ir al HTML. */
export type MailContent = { subject: string; html: string; text: string };

const escape = (value: string) => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? '';

function layout(paragraphs: string[], action?: { label: string; href: string }) {
  const button = action ? `<p style="margin:24px 0"><a href="${escape(action.href)}" style="background:#c5e46d;color:#272932;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:600">${escape(action.label)}</a></p>` : '';
  return `<div style="font-family:Poppins,Arial,sans-serif;color:#272932;font-size:15px;line-height:1.5;max-width:520px">${paragraphs.map((p) => `<p>${p}</p>`).join('')}${button}<p style="color:#6b6d75;font-size:12px">Plan V · Este mail se mandó automáticamente; si no esperabas recibirlo, podés ignorarlo.</p></div>`;
}

export function inviteEmail(input: { patientName: string; nutritionistName: string; link: string; existing: boolean }): MailContent {
  const name = firstName(input.patientName);
  const pro = input.nutritionistName.trim() || 'Tu nutricionista';
  const lead = `${pro} te invita a Plan V para seguir tu plan de alimentación.`;
  const how = input.existing ? 'Ya tenés una cuenta: entrá con este enlace y tu cuenta queda vinculada a su consultorio.' : 'Creá tu cuenta con este enlace y queda vinculada a su consultorio.';
  const label = input.existing ? 'Entrar a Plan V' : 'Aceptar la invitación';
  return {
    subject: `${pro} te invita a Plan V`,
    html: layout([`Hola ${escape(name)},`, escape(lead), escape(how)], { label, href: input.link }),
    text: `Hola ${name},\n\n${lead}\n${how}\n\n${input.link}\n`,
  };
}

function argentinaDate(iso: string) {
  const date = new Date(iso);
  const day = date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Argentina/Buenos_Aires' }).replace(',', '');
  const time = date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Argentina/Buenos_Aires' });
  return `${day} a las ${time}`;
}

export function appointmentReminderEmail(input: { patientName: string; nutritionistName: string; startsAt: string; channel: 'video' | 'presencial'; meetUrl: string | null; site: string }): MailContent {
  const name = firstName(input.patientName);
  const pro = input.nutritionistName.trim() || 'tu nutricionista';
  const when = `Tu consulta con ${pro} es el ${argentinaDate(input.startsAt)} (hora de Argentina).`;
  const where = input.channel === 'video' && input.meetUrl ? `Videollamada: ${input.meetUrl}` : input.channel === 'video' ? 'Videollamada: el enlace aparece en tu Agenda de Plan V.' : 'Consulta presencial.';
  const change = 'Si necesitás cambiarla, avisale desde tu Agenda en Plan V.';
  const agenda = `${input.site}/app/agenda`;
  return {
    subject: `Recordatorio: tu consulta con ${pro}`,
    html: layout([`Hola ${escape(name)},`, escape(when), escape(where), escape(change)], { label: 'Ver mi Agenda', href: agenda }),
    text: `Hola ${name},\n\n${when}\n${where}\n${change}\n\n${agenda}\n`,
  };
}
