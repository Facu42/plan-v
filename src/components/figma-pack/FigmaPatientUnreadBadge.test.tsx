import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { ShowroomPatient } from '../nutrigo/showroom-model';
import { FigmaPatientIdentity } from './FigmaPatientIdentity';
import { FigmaPatientUnreadBadge } from './FigmaPatientUnreadBadge';

const patient = {
  id: 'patient-1',
  messages: [
    { id: '1', from: 'vero', text: 'Hola', sent_at: '2026-09-25T12:00:00Z', read_at: null },
    { id: '2', from: 'vero', text: '¿Cómo estás?', sent_at: '2026-09-25T13:00:00Z', read_at: null },
    { id: '3', from: 'patient', text: 'Bien', sent_at: '2026-09-25T13:30:00Z', read_at: null },
    { id: '4', from: 'vero', text: 'Recibido', sent_at: '2026-09-25T14:00:00Z', read_at: '2026-09-25T14:01:00Z' },
  ],
} as unknown as ShowroomPatient;

function render(value: ShowroomPatient, variant: 'nav' | 'dot') {
  return renderToStaticMarkup(<FigmaPatientIdentity patient={value}><FigmaPatientUnreadBadge variant={variant} className="badge" nodeId="figma-badge" /></FigmaPatientIdentity>);
}

describe('Figma patient unread badge', () => {
  it('shows the real unread message count in the sidebar', () => {
    const html = render(patient, 'nav');
    expect(html).toContain('2 mensajes sin leer');
    expect(html).toContain('>2</span>');
  });

  it('shows a notification dot only for unread messages', () => {
    expect(render(patient, 'dot')).toContain('2 mensajes sin leer');
    expect(render({ ...patient, messages: [] }, 'dot')).toBe('');
    expect(render({ ...patient, messages: [] }, 'nav')).toBe('');
  });
});
