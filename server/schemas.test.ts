import { describe, expect, it } from 'vitest';
import {
  analyzeMealInputSchema,
  appointmentUpdateSchema,
  billingUpdateInputSchema,
  goalUpdateInputSchema,
  habitUpdateInputSchema,
  mealReviewInputSchema,
  menuSlotUpdateSchema,
  messageInputSchema,
  nutritionistSetupInputSchema,
  patientArchiveInputSchema,
  patientCreateInputSchema,
  patientProfileUpdateInputSchema,
} from './schemas.js';

describe('API input schemas', () => {
  it('requires a supported slot and either a description or an image', () => {
    expect(analyzeMealInputSchema.safeParse({ slot: 'Almuerzo', description: 'Bowl de pollo' }).success).toBe(true);
    expect(analyzeMealInputSchema.safeParse({
      slot: 'Almuerzo',
      description: 'Bowl de pollo',
      client_id: '11111111-1111-4111-8111-111111111111',
    }).success).toBe(true);
    expect(analyzeMealInputSchema.safeParse({ slot: 'Almuerzo', description: 'Bowl', client_id: 'no-uuid' }).success).toBe(false);
    expect(analyzeMealInputSchema.safeParse({ slot: 'Almuerzo', imageBase64: 'YWJjZA==' }).success).toBe(true);
    expect(analyzeMealInputSchema.safeParse({ slot: 'Media noche', description: 'Algo' }).success).toBe(false);
    expect(analyzeMealInputSchema.safeParse({ slot: 'Almuerzo' }).success).toBe(false);
  });

  it('rejects oversized meal descriptions and image payloads', () => {
    expect(analyzeMealInputSchema.safeParse({ slot: 'Cena', description: 'a'.repeat(1001) }).success).toBe(false);
    expect(analyzeMealInputSchema.safeParse({ slot: 'Cena', imageBase64: 'a'.repeat(8_000_001) }).success).toBe(false);
  });

  it('only accepts professional review states', () => {
    expect(mealReviewInputSchema.safeParse({ status: 'confirmed' }).success).toBe(true);
    expect(mealReviewInputSchema.safeParse({
      status: 'adjusted',
      foods: [{ name: ' Pollo al horno ', portion_est: 140, portion_unit: 'g', confidence: 0.9 }],
      macros: { kcal: 410, protein_g: 38, carbs_g: 35, fat_g: 12 },
    }).success).toBe(true);
    expect(mealReviewInputSchema.safeParse({ status: 'pending_review' }).success).toBe(false);
  });

  it('requires bounded food or macro changes for an adjusted review', () => {
    expect(mealReviewInputSchema.safeParse({ status: 'adjusted' }).success).toBe(false);
    expect(mealReviewInputSchema.safeParse({ status: 'adjusted', foods: [] }).success).toBe(false);
    expect(mealReviewInputSchema.safeParse({
      status: 'adjusted',
      foods: [{ name: '   ', portion_est: 100, portion_unit: 'g', confidence: 0.8 }],
    }).success).toBe(false);
    expect(mealReviewInputSchema.safeParse({
      status: 'adjusted',
      macros: { kcal: -1, protein_g: 20, carbs_g: 20, fat_g: 10 },
    }).success).toBe(false);
  });

  it('trims messages and rejects empty or oversized text', () => {
    const parsed = messageInputSchema.safeParse({ text: '  Hola  ', from: 'vero' });
    expect(parsed.success && parsed.data.text).toBe('Hola');
    expect(messageInputSchema.safeParse({ text: '   ' }).success).toBe(false);
    expect(messageInputSchema.safeParse({ text: 'Hola', from: 'patient', client_id: '11111111-1111-4111-8111-111111111111' }).success).toBe(true);
    expect(messageInputSchema.safeParse({ text: 'Hola', from: 'patient', client_id: 'no-uuid' }).success).toBe(false);
  });

  it('normalizes patient onboarding fields and rejects invalid contact data', () => {
    const parsed = patientCreateInputSchema.safeParse({
      name: '  Ana Pérez  ',
      email: '  ANA@EXAMPLE.COM ',
      goal: '  Organizar horarios  ',
    });

    expect(parsed.success && parsed.data).toEqual({
      name: 'Ana Pérez',
      email: 'ana@example.com',
      goal: 'Organizar horarios',
    });
    expect(patientCreateInputSchema.safeParse({ name: 'A', email: 'ana@example.com', goal: 'Objetivo' }).success).toBe(false);
    expect(patientCreateInputSchema.safeParse({ name: 'Ana Pérez', email: 'no-es-email', goal: 'Objetivo' }).success).toBe(false);
    expect(patientCreateInputSchema.safeParse({ name: 'Ana Pérez', email: 'ana@example.com', goal: ' ' }).success).toBe(false);
  });

  it('validates patient profile edits and archive state', () => {
    expect(patientProfileUpdateInputSchema.safeParse({ name: '  Ana López  ', stage: 'seguimiento', plan_b: '' }).success).toBe(true);
    expect(patientProfileUpdateInputSchema.safeParse({}).success).toBe(false);
    expect(patientProfileUpdateInputSchema.safeParse({ name: 'A' }).success).toBe(false);
    expect(patientProfileUpdateInputSchema.safeParse({ stage: 'archivado' }).success).toBe(false);
    expect(patientArchiveInputSchema.safeParse({ archived: true }).success).toBe(true);
    expect(patientArchiveInputSchema.safeParse({ archived: 'sí' }).success).toBe(false);
  });

  it('bounds habit and nutritionist setup values', () => {
    expect(habitUpdateInputSchema.safeParse({ hydration: 8, energy: 'Con energía', sleep_minutes: 450 }).success).toBe(true);
    expect(habitUpdateInputSchema.safeParse({ hydration: 9 }).success).toBe(false);
    expect(habitUpdateInputSchema.safeParse({ sleep_minutes: -1 }).success).toBe(false);
    expect(habitUpdateInputSchema.safeParse({ sleep_minutes: 1441 }).success).toBe(false);
    expect(habitUpdateInputSchema.safeParse({ sleep_minutes: 450.5 }).success).toBe(false);
    expect(habitUpdateInputSchema.safeParse({}).success).toBe(false);
    expect(nutritionistSetupInputSchema.safeParse({ display_name: ' Vero ' }).success).toBe(true);
    expect(nutritionistSetupInputSchema.safeParse({ display_name: ' ' }).success).toBe(false);
  });

  it('validates weekly menu slot updates', () => {
    expect(menuSlotUpdateSchema.safeParse({ day: 'Lunes', slot: 'Almuerzo', title: 'Bowl de lentejas' }).success).toBe(true);
    expect(menuSlotUpdateSchema.safeParse({ day: 'Sábado', slot: 'Cena', title: '  Pizza casera  ' }).success).toBe(true);
    expect(menuSlotUpdateSchema.safeParse({ day: 'Feridado', slot: 'Cena', title: 'Algo' }).success).toBe(false);
    expect(menuSlotUpdateSchema.safeParse({ day: 'Lunes', slot: 'Brunch', title: 'Algo' }).success).toBe(false);
    expect(menuSlotUpdateSchema.safeParse({ day: 'Lunes', slot: 'Cena', title: '   ' }).success).toBe(false);
    expect(menuSlotUpdateSchema.safeParse({ day: 'Lunes', slot: 'Cena', title: 'a'.repeat(201) }).success).toBe(false);
  });

  it('validates appointment scheduling and cancellation', () => {
    expect(appointmentUpdateSchema.safeParse({
      appointment: { day: 'Jueves', time: '14:30', duration: 45, channel: 'video' },
    }).success).toBe(true);
    expect(appointmentUpdateSchema.safeParse({ appointment: null }).success).toBe(true);
    expect(appointmentUpdateSchema.safeParse({
      appointment: { day: 'Jueves', time: '25:30', duration: 45, channel: 'video' },
    }).success).toBe(false);
    expect(appointmentUpdateSchema.safeParse({
      appointment: { day: 'Jueves', time: '2:30', duration: 45, channel: 'video' },
    }).success).toBe(false);
    expect(appointmentUpdateSchema.safeParse({
      appointment: { day: 'Jueves', time: '14:30', duration: 5, channel: 'video' },
    }).success).toBe(false);
    expect(appointmentUpdateSchema.safeParse({
      appointment: { day: 'Feriado', time: '14:30', duration: 45, channel: 'video' },
    }).success).toBe(false);
    expect(appointmentUpdateSchema.safeParse({
      appointment: { day: 'Jueves', time: '14:30', duration: 45, channel: 'paloma-mensajera' },
    }).success).toBe(false);
  });

  it('validates patient appointment confirmation replies', async () => {
    const { appointmentConfirmSchema } = await import('./schemas.js');
    expect(appointmentConfirmSchema.safeParse({ reply: 'attending' }).success).toBe(true);
    expect(appointmentConfirmSchema.safeParse({ reply: 'needs_change' }).success).toBe(true);
    expect(appointmentConfirmSchema.safeParse({ reply: 'pending' }).success).toBe(false);
  });

  it('accepts only HTTPS meeting links when present', () => {
    expect(appointmentUpdateSchema.safeParse({
      appointment: { day: 'Jueves', time: '14:30', duration: 45, channel: 'video', meet_url: 'https://meet.example.com/abc' },
    }).success).toBe(true);
    expect(appointmentUpdateSchema.safeParse({
      appointment: { day: 'Jueves', time: '14:30', duration: 45, channel: 'presencial', meet_url: 'https://meet.example.com/abc' },
    }).success).toBe(true);
    for (const meet_url of ['http://meet.example.com', 'javascript:alert(1)', 'meet.example.com/abc', 'a'.repeat(501)]) {
      expect(appointmentUpdateSchema.safeParse({
        appointment: { day: 'Jueves', time: '14:30', duration: 45, channel: 'video', meet_url },
      }).success).toBe(false);
    }
  });

  it('requires an inclusive end date only when billing is active', () => {
    expect(billingUpdateInputSchema.safeParse({ status: 'pending' }).success).toBe(true);
    expect(billingUpdateInputSchema.safeParse({ status: 'waived' }).success).toBe(true);
    expect(billingUpdateInputSchema.safeParse({ status: 'active', billing_until: '2026-10-06' }).success).toBe(true);
    expect(billingUpdateInputSchema.safeParse({ status: 'active' }).success).toBe(false);
    expect(billingUpdateInputSchema.safeParse({ status: 'active', billing_until: '06/10/2026' }).success).toBe(false);
    expect(billingUpdateInputSchema.safeParse({ status: 'past_due' }).success).toBe(false);
  });

  it('validates complete goal updates', () => {
    expect(goalUpdateInputSchema.safeParse({
      goal: '  Organizar cuatro cenas por semana  ',
      status: 'active',
      progress: 45,
      note: '  Acordado en consulta  ',
    }).success).toBe(true);
    expect(goalUpdateInputSchema.safeParse({ goal: 'Objetivo', status: 'paused', progress: 0 }).success).toBe(true);
    expect(goalUpdateInputSchema.safeParse({ goal: ' ', status: 'active', progress: 50 }).success).toBe(false);
    expect(goalUpdateInputSchema.safeParse({ goal: 'Objetivo', status: 'archived', progress: 50 }).success).toBe(false);
    expect(goalUpdateInputSchema.safeParse({ goal: 'Objetivo', status: 'active', progress: 101 }).success).toBe(false);
  });

});
