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
    expect(html).toContain('>Enviar<');
    expect(html).toContain('Ver mi agenda');
    expect(html).toContain('Adjuntar archivo');
    expect(html).toContain('JPG, PNG, WebP o PDF de hasta 10 MB');
    // Perfil de la nutricionista a la derecha, con datos reales.
    expect(html).toContain('Perfil de la conversación');
    expect(html).toContain('Nutricionista');
    expect(html).toContain('Organizar comidas');
    // Los textos explicativos largos que el archivo no tiene ya no se muestran.
    expect(html).not.toContain('por persona, no por dispositivo');
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
        delivered_at: null,
        read_at: null,
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
    expect(html).toContain('Verónica Trenti');
  });
  it('el panel derecho lista imágenes, documentos y enlaces que de verdad se enviaron', () => {
    const shared = {
      ...patient,
      messages: [
        { id: 'm4', text: 'Mirá https://example.org/guia.', from: 'vero' as const, sent_at: '2026-09-10T15:00:00Z', delivered_at: null, read_at: null },
        { id: 'm5', text: '', from: 'patient' as const, sent_at: '2026-09-10T16:00:00Z', delivered_at: null, read_at: null,
          attachment: { asset_id: 'a2', filename: 'analisis.pdf', mime: 'application/pdf', byte_size: 1_520_000, kind: 'pdf' as const, available: true } },
        { id: 'm6', text: '', from: 'patient' as const, sent_at: '2026-09-10T16:05:00Z', delivered_at: null, read_at: null,
          attachment: { asset_id: 'a3', filename: 'cena.png', mime: 'image/png', byte_size: 900, kind: 'image' as const, available: true } },
      ],
    };
    const html = renderToStaticMarkup(<NutrigoMessages patient={shared} patients={[shared]} role="pro" onSelect={() => {}} onNavigate={() => {}} />);
    expect(html).toContain('Imágenes (1)');
    expect(html).toContain('Documentos (1)');
    expect(html).toContain('1,45 MB');
    expect(html).toContain('Enlaces (1)');
    expect(html).toContain('href="https://example.org/guia"');
    expect(html).toContain('Paciente');
    expect(html).not.toContain('Todavía no se compartieron');
  });
  it('sin adjuntos ni enlaces muestra el vacío real en lugar de secciones inventadas', () => {
    const html = renderToStaticMarkup(<NutrigoMessages patient={patient} patients={[patient]} role="pro" onSelect={() => {}} onNavigate={() => {}} />);
    expect(html).toContain('Todavía no se compartieron imágenes, documentos ni enlaces');
    expect(html).not.toContain('Imágenes (');
    expect(html).toContain('Nuevo mensaje');
    expect(html).toContain('Mostrar solo conversaciones sin leer');
  });
});
