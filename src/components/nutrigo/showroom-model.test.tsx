import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Patient } from '../../types';
import { buildShowroomPatient, filterShowroomPatients } from './showroom-model';
import { NvButton, NvProgress, NvState } from './primitives';

const patient: Patient = {
  id: 'p1', name: 'Ana', initials: 'A', tone: 'mint', status: 'En ritmo',
  billing_status: 'active', billing_until: null, stage: 'seguimiento', goal: 'Organizar comidas',
  sensitive_hours: 'SECRETO', plan_b: '', next_focus: 'SECRETO', adherence_score: 70,
  adherence_why: 'SECRETO', time: '', hydration: 4, energy: null, sleep_minutes: null,
  appointment: null, habit_logs: [], todayPlan: [], weekPlan: [], brief: null,
  goal_history: [{ id: 'g', goal: 'G', status: 'active', progress: 20, note: 'SECRETO', updated_at: '' }],
  timeline: [], messages: [], meal_logs: [],
};
const now = new Date(2026, 8, 9, 12);

describe('modelo seguro del showroom', () => {
  it('excluye campos profesionales y no inventa un objetivo calórico', () => {
    const model = buildShowroomPatient(patient, now);
    expect(JSON.stringify(model)).not.toContain('SECRETO');
    expect(model.kcal).toBe(0);
    expect(model.nutritionLogCount).toBe(0);
    expect(model.sleep).toBe('Sin registro');
    expect(model).not.toHaveProperty('calorieTarget');
  });
  it('suma únicamente comidas revisadas del día y del paciente elegido', () => {
    const base = { id: 'm', patient_id: 'p1', slot: 'Almuerzo', photo_url: null, description: '', foods: [], macros: { kcal: 400, protein_g: 20, carbs_g: 40, fat_g: 10 }, confidence: 1, note_for_nutri: 'SECRETO', status: 'confirmed' as const, logged_at: now.toISOString() };
    const model = buildShowroomPatient({ ...patient, meal_logs: [base, { ...base, id: 'other', patient_id: 'p2' }, { ...base, id: 'pending', status: 'pending_review' }, { ...base, id: 'old', logged_at: new Date(2026, 8, 8, 12).toISOString() }] }, now);
    expect(model.kcal).toBe(400);
    expect(model.nutritionLogCount).toBe(1);
    expect(model.macros.protein_g).toBe(20);
    expect(model.logs).toHaveLength(3);
    expect(JSON.stringify(model)).not.toContain('SECRETO');
  });
  it('distingue macros ausentes de un valor cero efectivamente registrado', () => {
    const base = { id: 'm', patient_id: 'p1', slot: 'Almuerzo', photo_url: null, description: '', foods: [], confidence: 1, note_for_nutri: '', status: 'confirmed' as const, logged_at: now.toISOString() };
    const withoutMacros = buildShowroomPatient({ ...patient, meal_logs: [{ ...base, macros: null }] }, now);
    expect(withoutMacros.nutritionLogCount).toBe(0);
    const zero = buildShowroomPatient({ ...patient, meal_logs: [{ ...base, macros: { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 } }] }, now);
    expect(zero.nutritionLogCount).toBe(1);
    expect(zero.kcal).toBe(0);
  });
  it('solo muestra mensajes enviados de la persona elegida', () => {
    const m = { id: 'msg', patient_id: 'p1', from: 'vero' as const, text: 'Hola', sent_at: now.toISOString(), suggested_by_ai: true };
    const model = buildShowroomPatient({ ...patient, messages: [m, { ...m, id: 'draft', text: 'SECRETO', sent_at: '' }, { ...m, id: 'other', patient_id: 'p2', text: 'SECRETO' }] }, now);
    expect(model.messages).toHaveLength(1);
    expect(model.messages[0]).toMatchObject({ delivered_at: null, read_at: null });
    expect(JSON.stringify(model.messages)).not.toContain('suggested_by_ai');
    expect(JSON.stringify(model.messages)).not.toContain('SECRETO');
  });
  it('expone metadatos de adjunto sin URL viva', () => {
    const m = {
      id: 'msg',
      patient_id: 'p1',
      from: 'vero' as const,
      text: '',
      sent_at: now.toISOString(),
      suggested_by_ai: false,
      attachment: { asset_id: 'a1', filename: 'merienda.png', mime: 'image/png', byte_size: 80, kind: 'image' as const, available: true },
    };
    const model = buildShowroomPatient({ ...patient, messages: [m] }, now);
    expect(model.messages[0].attachment).toMatchObject({ filename: 'merienda.png', kind: 'image' });
    expect(JSON.stringify(model.messages)).not.toContain('https://');
  });
  it('expone al paciente sólo los datos operativos seguros de su consulta', () => {
    const model = buildShowroomPatient({ ...patient, appointment: { when: 'Jueves · 14:30', duration: 45, channel: 'video', meet_url: 'https://meet.example.com/ana' } }, now);
    expect(model.appointment).toEqual({ when: 'Jueves · 14:30', duration: 45, channel: 'video', meet_url: 'https://meet.example.com/ana' });
    expect(model.appointment).not.toHaveProperty('prep_note');
  });
  it('busca sin acentos y excluye archivados', () => {
    expect(filterShowroomPatients([{ ...patient, name: 'Sofía' }, { ...patient, id: 'arch', archived_at: '2026-09-01' }], 'sofia')).toHaveLength(1);
    expect(filterShowroomPatients([patient], 'inexistente')).toEqual([]);
  });
});

describe('componentes visuales Nutrigo / Plan V', () => {
  it('mantiene contraste AA del texto secundario en todas las superficies claras', () => {
    const css = readFileSync(new URL('./nutrigo.css', import.meta.url), 'utf8').split('.nv-app.nv-dark')[0];
    const token = (name: string) => css.match(new RegExp(`--nv-${name}:(#[a-f0-9]{6})`))![1];
    const luminance = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((v) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
      .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
    for (const surface of ['bg', 'green', 'gold', 'coral']) {
      const a = luminance(token('muted'));
      const b = luminance(token(surface));
      expect((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05), surface).toBeGreaterThanOrEqual(4.5);
    }
  });
  it('evita submit implícito en botones de navegación', () => {
    expect(renderToStaticMarkup(<NvButton>Ver plan</NvButton>)).toContain('type="button"');
  });
  it('limita progreso y anuncia valor accesible', () => {
    const html = renderToStaticMarkup(<NvProgress value={140} label="Objetivo" />);
    expect(html).toContain('aria-valuenow="100"');
    expect(html).toContain('aria-label="Objetivo"');
    expect(renderToStaticMarkup(<NvProgress value={NaN} label="Objetivo" />)).toContain('aria-valuenow="0"');
  });
  it('anuncia estados vacíos sin dibujar controles falsos', () => {
    const html = renderToStaticMarkup(<NvState title="Sin comidas" description="Tu nutricionista todavía no publicó el plan." />);
    expect(html).toContain('role="status"');
    expect(html).not.toContain('<button');
  });
});
