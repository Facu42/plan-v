import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { ShowroomPatient } from '../nutrigo/showroom-model';
import { FigmaPatientIdentity } from './FigmaPatientIdentity';
import { FigmaCalendarActivityDialog, FigmaCalendarAppointmentActions, FigmaCalendarProvider, buildFigmaMonthCells } from './FigmaCalendar';
import Calendar from './screens/Calendar';
import CalendarTablet from './screens/CalendarTablet';
import CalendarMobile from './screens/CalendarMobile';

const today = new Date();
const weekday = today.toLocaleDateString('es-AR', { weekday: 'long' });
const day = weekday[0].toLocaleUpperCase('es-AR') + weekday.slice(1);
const patient = {
  id: 'patient-calendar', name: 'Lucía Gómez',
  appointment: null,
  weekPlan: [{ day, meals: [{ slot: 'Desayuno', title: 'Avena con yogur' }] }],
  todayPlan: [{ slot: 'Desayuno', title: 'Avena con yogur', time: '08:00' }],
  logs: [{ id: 'meal-1', slot: 'Desayuno', description: 'Avena casera', logged_at: today.toISOString() }],
  activities: [{ id: 'walk-1', activity: 'Caminata', duration_minutes: 35, intensity: 'moderada', logged_at: today.toISOString() }],
  messages: [],
} as unknown as ShowroomPatient;

describe('Figma patient calendar', () => {
  it.each([['escritorio', Calendar], ['tablet', CalendarTablet], ['móvil', CalendarMobile]])('binds real events in %s', (_, Screen) => {
    const html = renderToStaticMarkup(<FigmaPatientIdentity patient={patient}>
      <FigmaCalendarProvider patient={patient} onNavigate={() => {}}><Screen /></FigmaCalendarProvider>
    </FigmaPatientIdentity>);
    expect(html).toContain('Avena con yogur');
    expect(html).toContain('Caminata');
    expect(html).toContain('35 min');
    expect(html).toContain('Planificación de comidas');
    expect(html).toContain('Cargando plan de comidas');
    expect(html).toContain('data-name="Cell-Calendar-Body"');
    expect(html).toContain('Elegir mes');
    expect(html).not.toMatch(/>\s*2028\s*</);
    expect(html).not.toContain('Morning Yoga Session');
  });

  it('adds a sixth week when the month needs it', () => {
    const cells = buildFigmaMonthCells(new Date(2026, 7, 1, 12), new Date(2026, 7, 15, 12));
    expect(cells).toHaveLength(42);
    expect(cells[0].date.getDay()).toBe(0);
    expect(cells[41].day).toBe(5);
  });

  it('shows an empty day without sample consultations or activities', () => {
    const emptyPatient = { ...patient, weekPlan: [], todayPlan: [], logs: [], activities: [] } as unknown as ShowroomPatient;
    const html = renderToStaticMarkup(<FigmaPatientIdentity patient={emptyPatient}>
      <FigmaCalendarProvider patient={emptyPatient} onNavigate={() => {}}><CalendarMobile /></FigmaCalendarProvider>
    </FigmaPatientIdentity>);
    expect(html).toContain('Sin actividades para esta fecha.');
    expect(html).not.toContain('Avena con yogur');
    expect(html).not.toContain('Morning Yoga Session');
  });

  it('offers confirmation and rescheduling for the patient appointment', () => {
    const withAppointment = { ...patient, appointment: {
      when: 'Lunes · 14:30', duration: 45, channel: 'video', meet_url: 'https://meet.example/consulta', confirmation: null,
    } } as ShowroomPatient;
    const html = renderToStaticMarkup(<FigmaCalendarProvider patient={withAppointment} onNavigate={() => {}} onConfirmAppointment={() => {}} onRescheduleAppointment={() => {}}>
      <FigmaCalendarAppointmentActions />
    </FigmaCalendarProvider>);
    expect(html).toContain('Confirmar asistencia');
    expect(html).toContain('Solicitar cambio');
    expect(html).toContain('Reprogramar horario');
    expect(html).toContain('https://meet.example/consulta');
  });

  it('renders a real activity registration form for the Figma new activity action', () => {
    const html = renderToStaticMarkup(<FigmaCalendarActivityDialog onClose={() => {}} onSave={() => {}} />);
    expect(html).toContain('Registrar actividad');
    expect(html).toContain('Duración (min)');
    expect(html).toContain('Intensidad');
    expect(html).toContain('Guardar actividad');
  });
});
