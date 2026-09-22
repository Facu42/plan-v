import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Patient } from '../../types';
import { NvState } from './primitives';
import { AssignedRecipes } from './RecipeCatalog';
import { PatientOverview } from './PatientOverview';
import { NutrigoMessages } from './NutrigoMessages';
import { ShowroomHealthyMenu } from './ShowroomHealthyMenu';
import { ShowroomPatientPlan } from './ShowroomPatientPlan';
import { ShowroomGrocery } from './ShowroomGrocery';
import { ShowroomPatientDiary } from './ShowroomPatientDiary';
import { ShowroomProgress } from './ShowroomProgress';
import { ShowroomExercise } from './ShowroomExercise';
import { ShowroomResources } from './ShowroomResources';
import { ShowroomPatientAgenda } from './ShowroomPatientAgenda';
import { buildShowroomPatient } from './showroom-model';
import {
  NUTRIGO_PARITY_NOT_VISUAL_APPROVAL,
  NUTRIGO_SURFACES,
  NUTRIGO_VIEWPORTS,
} from './nutrigo-surfaces';

const now = new Date(2026, 8, 21, 12, 0, 0);
const seed: Patient = {
  id: 'p1', name: 'Ana', initials: 'A', tone: 'mint', status: 'En ritmo', archived_at: null,
  billing_status: 'active', billing_until: null, stage: 'seguimiento', goal: '',
  sensitive_hours: '', plan_b: '', next_focus: '', adherence_score: 0, adherence_why: '',
  time: '', hydration: 0, energy: null, sleep_minutes: null, appointment: null,
  habit_logs: [], todayPlan: [], weekPlan: [], brief: null, timeline: [], messages: [], meal_logs: [],
};
const empty = buildShowroomPatient(seed, now);
const cssDir = new URL('./', import.meta.url);

function cssOf(file: string) {
  return readFileSync(new URL(file, cssDir), 'utf8');
}

function luminance(hex: string) {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
}

function contrast(a: string, b: string) {
  const x = luminance(a);
  const y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

describe('PV-37 paridad de layout/estado Nutrigo', () => {
  it('fija 1440/800/390/320 y las doce superficies, sin aprobación visual', () => {
    expect(NUTRIGO_VIEWPORTS).toEqual({ desktop: 1440, tablet: 800, mobile: 390, narrow: 320 });
    expect(NUTRIGO_SURFACES).toHaveLength(12);
    expect(new Set(NUTRIGO_SURFACES.map((surface) => surface.frame)).size).toBe(12);
    expect(NUTRIGO_PARITY_NOT_VISUAL_APPROVAL).toMatch(/not Facu visual approval/i);
  });

  it('cada CSS de superficie reorganiza 800/390/320 en lugar de encoger el escritorio', () => {
    const files = [...new Set(NUTRIGO_SURFACES.flatMap((surface) => [...surface.css]))];
    expect(files.length).toBeGreaterThanOrEqual(10);
    for (const file of files) {
      const css = cssOf(file);
      expect(css, file).toMatch(/max-width:\s*800px/);
      expect(css, file).toMatch(/max-width:\s*390px/);
      expect(css, file).toMatch(/max-width:\s*320px/);
    }
    const progress = cssOf('showroom-progress.css');
    expect(progress).not.toMatch(/min-width:\s*650px/);
    const diary = cssOf('showroom-patient-diary.css');
    expect(diary).not.toMatch(/min-width:\s*650px/);
  });

  it('declara claro/oscuro, vacío/error/carga y focus-visible como contratos', () => {
    const root = cssOf('nutrigo.css');
    const parity = cssOf('nutrigo-parity.css');
    expect(root).toMatch(/\.nv-app\.nv-dark/);
    expect(root).toMatch(/--nv-danger:#8e3f38/);
    expect(root).toMatch(/--nv-danger:#f5b4a8/);
    expect(parity).toMatch(/data-kind=error/);
    expect(parity).toMatch(/data-kind=loading/);
    expect(parity).toMatch(/:focus-visible/);
    expect(parity).toMatch(/Not Facu visual approval/);
    const lightMuted = root.match(/--nv-muted:(#[a-f0-9]{6})/)![1];
    const lightBg = root.match(/--nv-bg:(#[a-f0-9]{6})/)![1];
    const lightDanger = root.match(/--nv-danger:(#[a-f0-9]{6})/)![1];
    expect(contrast(lightMuted, lightBg)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(lightDanger, lightBg)).toBeGreaterThanOrEqual(4.5);
    const darkBlock = root.split('.nv-app.nv-dark')[1];
    const darkMuted = darkBlock.match(/--nv-muted:(#[a-f0-9]{6})/)![1];
    const darkBg = darkBlock.match(/--nv-bg:(#[a-f0-9]{6})/)![1];
    const darkDanger = darkBlock.match(/--nv-danger:(#[a-f0-9]{6})/)![1];
    expect(contrast(darkMuted, darkBg)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(darkDanger, darkBg)).toBeGreaterThanOrEqual(4.5);
  });

  it('NvState distingue vacío, error y carga sin controles falsos', () => {
    const empty = renderToStaticMarkup(<NvState title="Sin comidas" description="Todavía no hay plan." />);
    const error = renderToStaticMarkup(<NvState kind="error" title="No se pudo cargar" description="Reintentá." />);
    const loading = renderToStaticMarkup(<NvState kind="loading" title="Cargando períodos…" description="Sin rankings." />);
    expect(empty).toContain('role="status"');
    expect(empty).toContain('data-kind="empty"');
    expect(error).toContain('role="alert"');
    expect(error).toContain('data-kind="error"');
    expect(loading).toContain('role="status"');
    expect(loading).toContain('data-kind="loading"');
    expect(empty + error + loading).not.toContain('<button');
  });

  it('las doce superficies anuncian vacío honesto en SSR', () => {
    const html = {
      dashboard: renderToStaticMarkup(<PatientOverview patient={empty} onNavigate={() => {}} />),
      calendar: renderToStaticMarkup(<ShowroomPatientAgenda patient={empty} now={now} onMessage={() => {}} storage={null} />),
      messages: renderToStaticMarkup(<NutrigoMessages patient={empty} patients={[empty]} role="patient" onSelect={() => {}} onNavigate={() => {}} />),
      'healthy-menu': renderToStaticMarkup(<ShowroomHealthyMenu patient={empty} query="" onNavigate={() => {}} />),
      'recipe-details': renderToStaticMarkup(<AssignedRecipes patientId="p1" />),
      'meal-plan': renderToStaticMarkup(<ShowroomPatientPlan patient={empty} now={now} query="" />),
      grocery: renderToStaticMarkup(<ShowroomGrocery patient={empty} />),
      'food-diary': renderToStaticMarkup(<ShowroomPatientDiary patient={empty} query="" now={now} onLogMeal={() => {}} />),
      progress: renderToStaticMarkup(<ShowroomProgress patient={empty} />),
      exercise: renderToStaticMarkup(<ShowroomExercise patient={empty} now={now} />),
      insights: renderToStaticMarkup(<ShowroomResources patientId="p1" query="dato inexistente" onNavigate={() => {}} />),
      'insight-details': renderToStaticMarkup(<ShowroomResources patientId="p1" query="dato inexistente" onNavigate={() => {}} />),
    } as const;
    for (const surface of NUTRIGO_SURFACES) {
      expect(html[surface.id], surface.id).toContain(surface.emptyTitle);
      expect(html[surface.id], surface.id).not.toMatch(/undefined|NaN/);
    }
    expect(html.progress).toContain('Cargando períodos…');
    expect(html.progress).toContain('data-kind="loading"');
    expect(html.exercise).toContain('Cargando biblioteca…');
    expect(html['recipe-details']).toContain('Todavía no hay recetas publicadas para vos');
  });
});
