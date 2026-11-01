import { describe, expect, it } from 'vitest';
import { appointmentReminderEmail, inviteEmail, nutritionistInviteEmail } from './templates.js';

describe('textos de los mails', () => {
  it('la invitación nombra a la nutricionista, lleva el enlace y escapa los nombres', () => {
    const mail = inviteEmail({ patientName: 'Ana <b>Pérez</b>', nutritionistName: 'Verónica', link: 'https://plan-v.test/app/inicio?invite=1&x=2', existing: false });
    expect(mail.subject).toBe('Verónica te invita a Nutridash');
    expect(mail.html).toContain('Hola Ana');
    expect(mail.html).not.toContain('<b>Pérez</b>');
    expect(mail.html).toContain('href="https://plan-v.test/app/inicio?invite=1&amp;x=2"');
    expect(mail.text).toContain('https://plan-v.test/app/inicio?invite=1&x=2');
    expect(inviteEmail({ patientName: 'Ana', nutritionistName: 'Verónica', link: 'https://x.test', existing: true }).html).toContain('Entrar a Nutridash');
  });

  it('la invitación de nutricionista lleva marca Nutridash y escapa el nombre', () => {
    const mail = nutritionistInviteEmail({ name: 'Ana <b>Gómez</b>', link: 'https://plan-v.test/app?x=1' });
    expect(mail.subject).toBe('Tu acceso a Nutridash');
    expect(mail.html).toContain('Hola Ana');
    expect(mail.html).not.toContain('<b>Gómez</b>');
    expect(mail.html).toContain('href="https://plan-v.test/app?x=1"');
    expect(mail.text).toContain('https://plan-v.test/app?x=1');
  });

  it('el recordatorio dice día y hora de Argentina, la modalidad y el enlace de la videollamada', () => {
    const mail = appointmentReminderEmail({ patientName: 'Ana Pérez', nutritionistName: 'Verónica', startsAt: '2026-10-11T13:30:00Z', channel: 'video', meetUrl: 'https://meet.test/abc', site: 'https://plan-v.test' });
    expect(mail.subject).toBe('Recordatorio: tu consulta con Verónica');
    expect(mail.text).toContain('domingo 11 de octubre a las 10:30');
    expect(mail.text).toContain('Videollamada: https://meet.test/abc');
    expect(mail.text).toContain('https://plan-v.test/app/agenda');
    const inPerson = appointmentReminderEmail({ patientName: 'Ana', nutritionistName: 'Verónica', startsAt: '2026-10-11T13:30:00Z', channel: 'presencial', meetUrl: null, site: 'https://plan-v.test' });
    expect(inPerson.text).toContain('Consulta presencial');
    expect(inPerson.text).not.toContain('Videollamada');
  });
});
