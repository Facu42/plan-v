import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { ShowroomPatient } from '../nutrigo/showroom-model';
import { FigmaPatientIdentity } from './FigmaPatientIdentity';
import { FigmaMealPlanProvider } from './FigmaMealPlan';
import { FigmaGroceryBody } from './FigmaGroceryBody';
import { FigmaDashboardMetric, FigmaDashboardProvider, useFigmaDashboardValues } from './FigmaDashboardMetrics';
import MealPlanMobile from './screens/MealPlanMobile';
import DashboardMobile from './screens/DashboardMobile';

const patient = {
  id: 'patient-1',
  name: 'Lucía Gómez',
  weekPlan: [{ day: 'Lunes', meals: [
    { slot: 'Desayuno', title: 'Avena con yogur' },
    { slot: 'Merienda', title: 'Fruta fresca' },
  ] }],
  todayPlan: [],
  activities: [],
  logs: [],
  messages: [],
} as unknown as ShowroomPatient;

describe('Figma patient data binding', () => {
  it('renders the mobile meal plan from the patient instead of Figma sample meals', () => {
    const html = renderToStaticMarkup(<FigmaPatientIdentity patient={patient}>
      <FigmaMealPlanProvider patient={patient} onShopping={() => {}}><MealPlanMobile /></FigmaMealPlanProvider>
    </FigmaPatientIdentity>);
    expect(html).toContain('Avena con yogur');
    expect(html).toContain('Fruta fresca');
    expect(html).toContain('Sin indicación');
    expect(html).not.toContain('Huevos revueltos con espinaca');
    expect(html).not.toContain('2028');
  });

  it('derives groceries and does not show Figma sample prices or calories', () => {
    const html = renderToStaticMarkup(<FigmaPatientIdentity patient={patient}><FigmaGroceryBody /></FigmaPatientIdentity>);
    expect(html).toContain('Avena');
    expect(html).toContain('Yogur');
    expect(html).toContain('Sin dato');
    expect(html).not.toContain('$157');
    expect(html).not.toContain('21,615');
  });

  it('uses recorded dashboard data and leaves unavailable statistics empty', () => {
    const dashboardPatient = {
      ...patient,
      sleepMinutes: 420,
      hydration: 5,
      journey: { days: [{ sleepMinutes: 420 }] },
      nutritionLogCount: 1,
      kcal: 370,
      macros: { kcal: 370, carbs_g: 40, protein_g: 30, fat_g: 10 },
    } as unknown as ShowroomPatient;
    const html = renderToStaticMarkup(<FigmaDashboardProvider patient={dashboardPatient} onNavigate={() => {}}>
      <FigmaDashboardMetric kind="weight" assetPathPrefix="/figma/screens/Dashboard" />
      <FigmaDashboardMetric kind="steps" assetPathPrefix="/figma/screens/Dashboard" />
      <FigmaDashboardMetric kind="sleep" assetPathPrefix="/figma/screens/Dashboard" />
      <FigmaDashboardMetric kind="water" assetPathPrefix="/figma/screens/Dashboard" />
    </FigmaDashboardProvider>);
    expect(html).toContain('7 h');
    expect(html).toContain('5 vasos');
    expect(html).toContain('Sin registro');
    expect(html).not.toContain('8050');
    expect(html).not.toContain('6.5');
    expect(html).not.toContain('0.7');
  });

  it('keeps the Figma dashboard widgets while showing reviewed nutrients and no invented goal', () => {
    const dashboardPatient = {
      ...patient,
      sleepMinutes: null,
      hydration: 0,
      journey: { days: [] },
      nutritionLogCount: 1,
      kcal: 370,
      macros: { kcal: 370, carbs_g: 40, protein_g: 30, fat_g: 10 },
    } as unknown as ShowroomPatient;
    const html = renderToStaticMarkup(<FigmaPatientIdentity patient={dashboardPatient}>
      <FigmaDashboardProvider patient={dashboardPatient} onNavigate={() => {}}><DashboardMobile /></FigmaDashboardProvider>
    </FigmaPatientIdentity>);
    expect(html).toContain('data-name="Widget Weight Data"');
    expect(html).toContain('data-name="Widget Calories Intake"');
    expect(html).toContain('Sin meta de peso');
    expect(html).toContain('Registradas hoy');
    expect(html).toContain('40');
    expect(html).toContain('Carbohidratos');
    expect(html).not.toContain('Faltan 13 kg');
    expect(html).not.toContain('Calorías restantes');
    expect(html).not.toContain('Donut Progress');
  });

  it('shows an empty nutrient state when no meal has reviewed nutrition', () => {
    const emptyPatient = {
      ...patient,
      sleepMinutes: null,
      hydration: 0,
      journey: { days: [] },
      nutritionLogCount: 0,
      kcal: 0,
      macros: { kcal: 0, carbs_g: 0, protein_g: 0, fat_g: 0 },
    } as unknown as ShowroomPatient;
    function NutritionState() {
      const values = useFigmaDashboardValues();
      return <output>{values.calories}|{values.macros.map((macro) => `${macro.amount}:${macro.share}`).join('|')}</output>;
    }
    const html = renderToStaticMarkup(<FigmaDashboardProvider patient={emptyPatient} onNavigate={() => {}}><NutritionState /></FigmaDashboardProvider>);
    expect(html).toContain('—|—:0|—:0|—:0');
  });

  it('shows recorded activities instead of Figma workout targets', () => {
    const activePatient = {
      ...patient,
      sleepMinutes: null,
      hydration: 0,
      journey: { days: [] },
      nutritionLogCount: 0,
      kcal: 0,
      macros: { kcal: 0, carbs_g: 0, protein_g: 0, fat_g: 0 },
      activities: [{ id: 'walk-1', patient_id: patient.id, activity: 'Caminata', duration_minutes: 35, intensity: 'moderada', note: null, logged_at: new Date().toISOString() }],
    } as unknown as ShowroomPatient;
    const html = renderToStaticMarkup(<FigmaPatientIdentity patient={activePatient}>
      <FigmaDashboardProvider patient={activePatient} onNavigate={() => {}}><DashboardMobile /></FigmaDashboardProvider>
    </FigmaPatientIdentity>);
    expect(html).toContain('Actividad registrada');
    expect(html).toContain('Caminata');
    expect(html).toContain('35 min');
    expect(html).toContain('moderada');
    expect(html).not.toContain('Correr 10 km');
    expect(html).not.toContain('Sentadillas con 50 kg');
    expect(html).not.toContain('(7/10)');
  });

  it('shows planned meals, the current week, and real recent activity', () => {
    const now = new Date().toISOString();
    const dashboardPatient = {
      ...patient,
      weekPlan: [],
      todayPlan: [
        { slot: 'Desayuno', title: 'Avena con yogur' },
        { slot: 'Almuerzo', title: 'Pollo con verduras' },
      ],
      sleepMinutes: null,
      hydration: 0,
      journey: { days: [] },
      nutritionLogCount: 0,
      kcal: 0,
      macros: { kcal: 0, carbs_g: 0, protein_g: 0, fat_g: 0 },
      logs: [{ id: 'meal-1', slot: 'Desayuno', description: 'Avena casera', logged_at: now }],
      activities: [{ id: 'walk-1', activity: 'Caminata', duration_minutes: 35, intensity: 'moderada', logged_at: now }],
      messages: [{ id: 'message-1', from: 'professional', text: 'Revisé tu plan', sent_at: now }],
    } as unknown as ShowroomPatient;
    const html = renderToStaticMarkup(<FigmaPatientIdentity patient={dashboardPatient}>
      <FigmaDashboardProvider patient={dashboardPatient} onNavigate={() => {}}><DashboardMobile /></FigmaDashboardProvider>
    </FigmaPatientIdentity>);
    expect(html).toContain('Comidas del plan');
    expect(html).toContain('Avena con yogur');
    expect(html).toContain('Pollo con verduras');
    expect(html).toContain('Sin ejercicio indicado');
    expect(html).toContain('aria-label="Semana anterior"');
    expect(html).toContain('aria-label="Semana siguiente"');
    expect(html).toContain('Actividad reciente');
    expect(html).toContain('Registraste desayuno: Avena casera.');
    expect(html).toContain('Registraste Caminata durante 35 min.');
    expect(html).toContain('Mensaje de tu nutricionista: Revisé tu plan');
    expect(html).not.toContain('Ladya Mortimov');
    expect(html).not.toContain('Progreso cardiovascular: completaste');
    expect(html).not.toMatch(/>2028</);
  });

  it('starts the compact calendar on Monday and marks the current date', () => {
    const dashboardPatient = {
      ...patient,
      sleepMinutes: null,
      hydration: 0,
      journey: { days: [] },
      nutritionLogCount: 0,
      kcal: 0,
      macros: { kcal: 0, carbs_g: 0, protein_g: 0, fat_g: 0 },
    } as unknown as ShowroomPatient;
    function CalendarState() {
      const values = useFigmaDashboardValues();
      return <output>{values.weekDays[0].day}|{values.weekDays.slice(0, 7).filter((day) => day.active).length}</output>;
    }
    const html = renderToStaticMarkup(<FigmaDashboardProvider patient={dashboardPatient} onNavigate={() => {}}><CalendarState /></FigmaDashboardProvider>);
    expect(html).toContain('<output>lun|1</output>');
  });
});
