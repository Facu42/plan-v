import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { NutrigoMessages } from './NutrigoMessages';
import type { ShowroomPatient } from './showroom-model';

const patient = { id: 'p1', name: 'Ana', initials: 'A', goal: 'Organizar comidas', appointment: null,
  messages: [{ id: 'm1', text: 'Hola Ana', from: 'vero', sent_at: '2026-09-10T15:00:00Z', delivered_at: '2026-09-10T15:00:00Z' }] } as ShowroomPatient;

describe('mensajería dentro del diseño Nutrigo', () => {
  it('el paciente ve a su nutricionista y un compositor, no un aviso de solo lectura', () => {
    const html = renderToStaticMarkup(<NutrigoMessages patient={patient} patients={[patient]} role="patient" onSelect={() => {}} onNavigate={() => {}} />);
    expect(html).toContain('Conversación con Verónica Trenti');
    expect(html).toContain('Escribí un mensaje');
    expect(html).toContain('Enviar mensaje');
    expect(html).toContain('Ver mi agenda');
    expect(html).toContain('por persona, no por dispositivo');
    expect(html).toContain('Adjuntar archivo');
    expect(html).toContain('archivos autorizados');
    expect(html).not.toContain('todavía no están disponibles');
    expect(html).not.toContain('entrega es inmediata');
    expect(html).not.toContain('Abrir ficha');
    expect(html).not.toContain('Solo lectura');
  });
  it('la profesional ve las conversaciones y el contexto de la persona seleccionada', () => {
    const html = renderToStaticMarkup(<NutrigoMessages patient={patient} patients={[patient]} role="pro" onSelect={() => {}} onNavigate={() => {}} />);
    expect(html).toContain('Buscar conversaciones');
    expect(html).toContain('Conversación con Ana');
    expect(html).toContain('Organizar comidas');
    expect(html).toContain('Abrir ficha');
    expect(html).toContain('Ver consultas');
  });
  it('muestra no leídos y el estado de entrega en los mensajes propios', () => {
    const unread = {
      ...patient,
      messages: [
        { id: 'm1', text: 'Hola Ana', from: 'vero' as const, sent_at: '2026-09-10T15:00:00Z', delivered_at: '2026-09-10T15:00:00Z', read_at: null },
        { id: 'm2', text: 'Llego un poco más tarde', from: 'patient' as const, sent_at: '2026-09-10T16:00:00Z', delivered_at: '2026-09-10T16:00:00Z', read_at: null },
      ],
    };
    const html = renderToStaticMarkup(<NutrigoMessages patient={unread} patients={[unread]} role="pro" onSelect={() => {}} onNavigate={() => {}} />);
    expect(html).toContain('1 sin leer');
    expect(html).toContain('Entregado');
    expect(html).toContain('Hola Ana');
  });
  it('muestra el adjunto autorizado sin URL viva y deja abrir el preview', () => {
    const withFile = {
      ...patient,
      messages: [{
        id: 'm3',
        text: '',
        from: 'patient' as const,
        sent_at: '2026-09-10T17:00:00Z',
        attachment: { asset_id: 'a1', filename: 'merienda.png', mime: 'image/png', byte_size: 80, kind: 'image' as const, available: true },
      }],
    };
    const html = renderToStaticMarkup(<NutrigoMessages patient={withFile} patients={[withFile]} role="patient" onSelect={() => {}} onNavigate={() => {}} />);
    expect(html).toContain('merienda.png');
    expect(html).toContain('Ver adjunto');
    expect(html).not.toContain('https://');
    expect(html).not.toContain('Los archivos adjuntos todavía no están disponibles.');
  });
  it('no muestra otras personas en el modo paciente aunque se pasen a la lista', () => {
    const html = renderToStaticMarkup(<NutrigoMessages patient={patient} patients={[patient, { ...patient, id: 'p2', name: 'OTRA PERSONA' }]} role="patient" onSelect={() => {}} onNavigate={() => {}} />);
    expect(html).not.toContain('OTRA PERSONA');
    expect(html).not.toContain('Buscar conversaciones');
  });
});
