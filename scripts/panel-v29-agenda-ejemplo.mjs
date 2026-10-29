// Datos de ejemplo para ver la Agenda con turnos, pedidos y horarios cuando la app corre en modo demo
// (el demo no guarda horarios ni reservas). Solo se usa en las pruebas de fidelidad y en las capturas.
const ZONA = 'America/Argentina/Buenos_Aires';
const CALENDARIO = '00000000-0000-4000-a000-000000000001';

function lunesDeEstaSemana(ahora = new Date()) {
  const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: ZONA }).format(ahora);
  const fecha = new Date(`${hoy}T15:00:00Z`);
  fecha.setUTCDate(fecha.getUTCDate() - ((fecha.getUTCDay() + 6) % 7));
  return fecha;
}

const dia = (lunes, desplazo) => { const f = new Date(lunes); f.setUTCDate(f.getUTCDate() + desplazo); return f.toISOString().slice(0, 10); };

/** Martes a las 10:10 de la semana actual: conserva hechos, próxima, consultorio y video. */
export function fechaAgendaContrato(ahora = new Date()) {
  const martes = lunesDeEstaSemana(ahora);
  martes.setUTCDate(martes.getUTCDate() + 1);
  martes.setUTCHours(13, 10, 0, 0);
  return martes;
}

export function snapshotAgendaEjemplo(ahora = new Date()) {
  const lunes = lunesDeEstaSemana(ahora);
  const tipos = [
    { id: '00000000-0000-4000-a000-0000000000a1', name: 'Seguimiento', calendar_id: CALENDARIO, duration_min: 45, channel: 'presencial', price_minor: 3000000, deposit_minor: 0 },
    { id: '00000000-0000-4000-a000-0000000000a2', name: 'Primera consulta', calendar_id: CALENDARIO, duration_min: 60, channel: 'presencial', price_minor: 4000000, deposit_minor: 0 },
    { id: '00000000-0000-4000-a000-0000000000a3', name: 'Videollamada', calendar_id: CALENDARIO, duration_min: 45, channel: 'video', price_minor: 3000000, deposit_minor: 0 },
  ];
  const reserva = (n, desplazo, hora, tipo, estado, nombre) => ({
    id: `00000000-0000-4000-a000-00000000b${String(n).padStart(3, '0')}`, nutritionist_id: 'nutri-demo', type_id: tipo.id, calendar_id: CALENDARIO,
    starts_at: `${dia(lunes, desplazo)}T${hora}:00-03:00`, duration_min: tipo.duration_min, status: estado, revision: 1, total_minor: tipo.price_minor, deposit_minor: 0, paid_minor: 0,
    currency: 'ARS', appointment_id: null, patient_id: null, contact_name: nombre, contact_email: 'a@example.com', contact_phone: '1155551234', google_sync_status: 'not_connected', meet_url: null, created_at: '2026-10-20T12:00:00Z',
  });
  const [seguimiento, primera, video] = tipos;
  return {
    profile: { nutritionist_id: 'nutri-demo', slug: 'demo-consultorio', revision: 1, config: {
      timezone: ZONA, calendars: [{ id: CALENDARIO, name: 'Consultorio' }], types: tipos,
      weekly: [1, 2, 3, 4, 5, 6].map(weekday => ({ calendar_id: CALENDARIO, weekday, start: '08:00', end: '19:00' })),
      blocks: [], page: { slug: 'demo-consultorio', enabled: true, title: 'Consultorio', bio: '', location: '', contact: '', logo_url: '' },
      google_calendar_id: 'primary', google_enabled: false, create_meet: false, transfer_alias: '',
      page_extras: {
        license: 'MN 4521', area: 'Belgrano, CABA', specialties: ['Celiaquía', 'Descenso de peso'],
        insurers: [{ name: 'OSDE', mode: 'reintegro', note: '' }, { name: 'Swiss Medical', mode: 'copago', note: '$8.000' }, { name: 'Particular', mode: 'completo', note: '' }],
        discounts: { transfer: 10, cash: 10, card: 0 },
        service_notes: { [tipos[0].id]: { instructions: 'Cargá en la app lo que comiste esta semana.', who: 'patients', insurer: true } },
      } } },
    connections: { google: false, mercadopago: false }, available: { google: false, mercadopago: false },
    bookings: [
      reserva(1, 0, '08:30', seguimiento, 'confirmed', 'Ana López'),
      reserva(2, 2, '09:00', seguimiento, 'confirmed', 'Romina Benítez'),
      reserva(3, 2, '10:00', video, 'confirmed', 'Clara Funes'),
      reserva(4, 3, '09:00', seguimiento, 'confirmed', 'Camila Méndez'),
      reserva(5, 3, '17:00', primera, 'requested', 'Carolina Ríos'),
      reserva(6, 4, '09:00', seguimiento, 'requested', 'Julia Sosa'),
    ],
    transfers: [], has_more: false,
  };
}

/** Responde el panel de agenda con datos de ejemplo. Llamar antes de abrir la pantalla. */
export async function usarAgendaDeEjemplo(pagina) {
  await pagina.route(/\/api\/scheduling(\?.*)?$/, ruta => ruta.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(snapshotAgendaEjemplo()) }));
}
