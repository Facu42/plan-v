import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { schedulingDefaultSettings, type SchedulingBooking } from '../../types/scheduling';
import { horariosPorDia, PanelPublicaV29, type VistaPublica } from './PanelPublicaV29';

const base = schedulingDefaultSettings();
const config = {
  ...base,
  page: { ...base.page, title: 'Lic. Vero Trenti', bio: 'Acompaño a mujeres.', location: 'Av. Cabildo 2040', enabled: true },
  types: [{ id: '00000000-0000-4000-a000-0000000000a1', name: 'Primera consulta', calendar_id: base.calendars[0].id, duration_min: 60, channel: 'presencial' as const, price_minor: 4000000, deposit_minor: 0 }],
  weekly: [{ calendar_id: base.calendars[0].id, weekday: 1, start: '09:00', end: '13:00' }, { calendar_id: base.calendars[0].id, weekday: 1, start: '15:00', end: '19:30' }],
};
const reserva = { id: 'b1', type_id: config.types[0].id, starts_at: '2026-10-30T14:00:00.000Z', status: 'requested', contact_name: 'Agustina Díaz', revision: 1, patient_id: null } as unknown as SchedulingBooking;
const props = (vista: VistaPublica) => ({
  config, reservas: [reserva], publicada: true, sinPublicar: false, link: 'https://x.test/consultorio/mi-consultorio', planes: null, mercadoPago: false,
  vista, servicio: 0, cargando: false, error: '', estado: '', onServicio: vi.fn(), onEditarPerfil: vi.fn(), onEditarServicio: vi.fn(), onQuitarServicio: vi.fn(),
  onCopiar: vi.fn(), onRecordatorios: vi.fn(), onReservar: vi.fn(), onReintentar: vi.fn(), onConfirmar: vi.fn(),
});

describe('Página pública con el HTML del boceto v29', () => {
  it('Mi página arma perfil, celular y compartir con datos reales', () => {
    const html = renderToStaticMarkup(<PanelPublicaV29 {...props(0)} />);
    for (const clase of ['id="s-publica"', 'id="pubwrap"', 'pubpf', 'pubph', 'pubsh']) expect(html).toContain(clase);
    for (const texto of ['Lic. Vero Trenti', 'Primera consulta', 'Av. Cabildo 2040', 'x.test/consultorio/mi-consultorio', 'Todavía no hay opiniones de pacientes.']) expect(html).toContain(texto);
    expect(html).not.toContain('Verónica');
  });

  it('Servicios y Reservas muestran lo cargado y no inventan nada', () => {
    const servicios = renderToStaticMarkup(<PanelPublicaV29 {...props(1)} />);
    expect(servicios).toContain('class="pubt"');
    expect(servicios).toContain('$40.000');
    const reservas = renderToStaticMarkup(<PanelPublicaV29 {...props(2)} />);
    expect(reservas).toContain('Agustina Díaz');
    expect(reservas).toContain('Aceptar');
    expect(reservas).toContain('9 a 13 · 15 a 19:30');
    expect(renderToStaticMarkup(<PanelPublicaV29 {...props(2)} reservas={[]} />)).toContain('Todavía no hay reservas desde la página.');
  });

  it('agrupa los horarios por día y marca los días sin atención', () => {
    const dias = horariosPorDia(config.weekly);
    expect(dias[0]).toEqual(['Lunes', '9 a 13 · 15 a 19:30']);
    expect(dias[6]).toEqual(['Domingo', null]);
  });
});
