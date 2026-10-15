import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { ShowroomPatient } from '../nutrigo/showroom-model';
import { FigmaPatientIdentity } from './FigmaPatientIdentity';
import { FigmaMessagesProvider } from './FigmaMessages';
import Messages from './screens/Messages';
import MessagesTablet from './screens/MessagesTablet';
import MessagesMobile from './screens/MessagesMobile';

const patient = {
  id: 'patient-messages', name: 'Lucía Gómez', initials: 'LG', goal: 'Más energía', appointment: null,
  messages: [
    { id: 'message-1', text: 'Hola, ¿cómo venís con el plan?', from: 'vero', sent_at: '2026-09-25T14:00:00.000Z', delivered_at: '2026-09-25T14:00:01.000Z', read_at: null },
    { id: 'message-2', text: 'Bien, gracias. Quería consultar por el desayuno.', from: 'patient', sent_at: '2026-09-25T14:05:00.000Z', delivered_at: '2026-09-25T14:05:01.000Z', read_at: null },
  ],
} as unknown as ShowroomPatient;

const render = (Screen: typeof Messages, value = patient) => renderToStaticMarkup(<FigmaPatientIdentity patient={value}>
  <FigmaMessagesProvider patient={value} onNavigate={() => {}}><Screen /></FigmaMessagesProvider>
</FigmaPatientIdentity>);

describe('Figma patient messages', () => {
  it.each([['escritorio', Messages], ['tablet', MessagesTablet], ['móvil', MessagesMobile]])('shows the real patient thread in %s', (_, Screen) => {
    const html = render(Screen);
    expect(html).toContain('Verónica Trenti');
    expect(html).toContain('Hola, ¿cómo venís con el plan?');
    expect(html).toContain('Bien, gracias. Quería consultar por el desayuno.');
    expect(html).toContain('Entregado');
    expect(html).toContain('Escribí un mensaje');
    expect(html).toContain('Todavía no hay adjuntos');
    expect(html).not.toContain('Alex Foster');
    expect(html).not.toContain('Mia Johnson');
    expect(html).not.toContain('Customized workout plan.pdf');
  });

  it('shows an honest empty conversation', () => {
    const html = render(MessagesMobile, { ...patient, messages: [] } as ShowroomPatient);
    expect(html).toContain('Empezá la conversación');
    expect(html).toContain('Iniciá la conversación');
    expect(html).not.toContain('Hey Adam');
  });
});
