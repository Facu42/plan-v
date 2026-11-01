import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Patient } from '../types';
import { embeddedCallPlan, embeddedVideoEnabled } from './embedded-video';
import { EmbeddedVideoCall } from '../components/nutrigo/EmbeddedVideoCall';
import { ShowroomConsultations } from '../components/nutrigo/ShowroomConsultations';

const patient = {
  id: 'ana', name: 'Ana Ruiz', initials: 'AR', tone: 'mint', status: 'En ritmo', archived_at: null,
  billing_status: 'active', billing_until: null, stage: 'seguimiento', goal: '', sensitive_hours: '',
  plan_b: '', next_focus: '', adherence_score: 1, adherence_why: '', time: 'hoy', hydration: 1, energy: 'Media',
  sleep_minutes: 400, appointment: { when: 'Jueves · 14:30', duration: 45, channel: 'video', meet_url: 'https://meet.example.com/ana' },
  habit_logs: [], todayPlan: [], weekPlan: [], brief: null, timeline: [], meal_logs: [], messages: [],
} as Patient;

describe('videollamada embebida', () => {
  it('queda apagada si la bandera no es exactamente true', () => {
    expect(embeddedVideoEnabled({})).toBe(false);
    expect(embeddedVideoEnabled({ VITE_EMBEDDED_VIDEO_CALL: '1' })).toBe(false);
    expect(embeddedVideoEnabled({ VITE_EMBEDDED_VIDEO_CALL: 'true' })).toBe(true);
    expect(embeddedCallPlan(false)).toEqual({ enabled: false, provider: 'livekit', connected: false, recording: 'consultation-consent', fallback: 'meet' });
  });

  it('con la bandera apagada el turno sigue en Meet y no hay sala', () => {
    const html = renderToStaticMarkup(<ShowroomConsultations patient={patient} now={new Date(2026, 8, 13)} onSelect={vi.fn()} />);
    expect(html).toContain('https://meet.example.com/ana');
    expect(html).toContain('Abrir videollamada');
    expect(html).not.toContain('data-embedded-video');
    expect(html).not.toContain('Probar cámara');
    expect(html).not.toContain('meet.jit.si');
    expect(html).not.toContain('daily.co');
    expect(html).not.toContain('livekit');
  });

  it('con la bandera prendida el turno abre la sala y no se conecta a un proveedor', () => {
    const html = renderToStaticMarkup(<EmbeddedVideoCall enabled patientId="p1" label="AR" />);
    expect(html).toContain('Abrir sala');
    expect(html).toContain('data-open-call="true"');
    expect(html).not.toContain('wss://');
    expect(html).not.toContain('meet.jit.si');
    expect(html).not.toContain('daily.co');
    expect(html).not.toContain('Ana Ruiz');
  });
});
