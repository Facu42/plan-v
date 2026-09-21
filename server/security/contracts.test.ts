import { describe, expect, it } from 'vitest';
import type { Patient } from '../../src/types/index.js';
import {
  canAccessPatient,
  canManagePatients,
  resolveRequestAuth,
  toPatientMealAnalysis,
  toPatientSelfMealLog,
  toPatientSelfView,
  type Actor,
  type PatientAction,
} from './contracts.js';

const patient: Patient = {
  id: 'patient-1',
  name: 'Sofía',
  initials: 'SR',
  tone: 'peach',
  status: 'Atención',
  billing_status: 'active',
  billing_until: '2026-10-06',
  stage: 'seguimiento',
  goal: 'Comer con regularidad',
  goal_status: 'active',
  goal_progress: 55,
  goal_updated_at: '2026-09-05T00:00:00.000Z',
  goal_history: [{
    id: 'goal-1',
    goal: 'Comer con regularidad',
    status: 'active',
    progress: 55,
    note: 'Nota interna sobre el objetivo',
    updated_at: '2026-09-05T00:00:00.000Z',
  }],
  sensitive_hours: '20:30',
  plan_b: 'Tostada y huevo',
  next_focus: 'Organización',
  adherence_score: 62,
  adherence_why: 'Detalle interno para la nutricionista',
  time: 'hoy',
  hydration: 3,
  energy: 'Baja',
  sleep_minutes: null,
  appointment: null,
  habit_logs: [],
  activity_logs: [{ id: 'activity-1', patient_id: 'patient-1', activity: 'Caminata', duration_minutes: 35, intensity: 'moderada', note: 'Me sentí bien', logged_at: '2026-09-05T18:00:00.000Z' }],
  todayPlan: [],
  weekPlan: [],
  brief: {
    suggested_action: 'mensaje',
    up_next_title: 'Mandar mensaje',
    up_next_body: 'Borrador interno',
    draft_message: 'Mensaje todavía no enviado',
    source_ids: ['meal-1'],
    adherence_why: 'Explicación privada',
  },
  timeline: [],
  meal_logs: [{
    id: 'meal-1',
    patient_id: 'patient-1',
    slot: 'Cena',
    photo_url: null,
    description: 'Pasta',
    foods: [],
    macros: null,
    confidence: 0.4,
    note_for_nutri: 'Foto oscura; revisar porción',
    status: 'pending_review',
    logged_at: '2026-09-05T00:00:00.000Z',
  }],
  messages: [
    {
      id: 'sent-message',
      patient_id: 'patient-1',
      from: 'vero',
      text: 'Mensaje enviado',
      suggested_by_ai: false,
      sent_at: '2026-09-05T00:00:00.000Z',
    },
    {
      id: 'draft-message',
      patient_id: 'patient-1',
      from: 'vero',
      text: 'Borrador privado',
      suggested_by_ai: true,
      sent_at: null,
    } as unknown as Patient['messages'][number],
  ],
};

describe('resolveRequestAuth', () => {
  it('keeps local demo mode available when Supabase is disabled and demo is allowed', () => {
    expect(resolveRequestAuth({ supabaseEnabled: false, path: '/api/patients', verifiedUserId: null, allowDemo: true }))
      .toEqual({ kind: 'demo' });
  });

  it('does not infer demo from a missing database', () => {
    expect(resolveRequestAuth({ supabaseEnabled: false, path: '/api/patients', verifiedUserId: null, allowDemo: false }))
      .toEqual({ kind: 'unavailable' });
  });

  it('rejects unauthenticated protected requests when Supabase is enabled', () => {
    expect(resolveRequestAuth({ supabaseEnabled: true, path: '/api/patients', verifiedUserId: null, allowDemo: false }))
      .toEqual({ kind: 'unauthorized' });
  });

  it('keeps health and readiness public when Supabase is enabled', () => {
    expect(resolveRequestAuth({ supabaseEnabled: true, path: '/api/health', verifiedUserId: null, allowDemo: false }))
      .toEqual({ kind: 'public' });
    expect(resolveRequestAuth({ supabaseEnabled: true, path: '/api/ready', verifiedUserId: null, allowDemo: false }))
      .toEqual({ kind: 'public' });
  });

  it('keeps recovery and ops provisioning reachable without a user JWT', () => {
    expect(resolveRequestAuth({ supabaseEnabled: true, path: '/api/auth/recover', verifiedUserId: null, allowDemo: false }))
      .toEqual({ kind: 'public' });
    expect(resolveRequestAuth({ supabaseEnabled: true, path: '/api/ops/nutritionists', verifiedUserId: null, allowDemo: false }))
      .toEqual({ kind: 'public' });
  });

  it('accepts a verified Supabase user', () => {
    expect(resolveRequestAuth({ supabaseEnabled: true, path: '/api/patients', verifiedUserId: 'user-1', allowDemo: false }))
      .toEqual({ kind: 'user', userId: 'user-1' });
  });
});

describe('canAccessPatient', () => {
  const patientOwner = { id: 'patient-1', nutritionistId: 'nutri-1', billing_status: 'active' as const, billing_until: '2099-10-06' };

  it.each<PatientAction>(['read_self', 'read_patient', 'analyze_meal', 'update_habits', 'log_activity', 'read_resource', 'manage_favorites', 'send_message', 'reschedule_appointment', 'confirm_appointment', 'read_intake', 'edit_intake', 'submit_intake', 'grant_consent', 'read_consent', 'request_privacy', 'read_privacy'])(
    'allows a patient to perform %s only on their own record',
    (action) => {
      const actor: Actor = { role: 'paciente', userId: 'user-patient', patientId: 'patient-1' };
      expect(canAccessPatient(actor, patientOwner, action)).toBe(true);
      expect(canAccessPatient(actor, { ...patientOwner, id: 'patient-2' }, action)).toBe(false);
    },
  );

  it.each<PatientAction>(['read_clinical', 'review_meal', 'generate_copilot', 'generate_ai_job', 'edit_patient', 'archive_patient', 'edit_menu', 'edit_appointment', 'edit_goal', 'edit_billing', 'assign_resource', 'assign_routine', 'review_intake', 'write_clinical_note'])(
    'does not allow a patient to perform the professional action %s',
    (action) => {
      const actor: Actor = { role: 'paciente', userId: 'user-patient', patientId: 'patient-1' };
      expect(canAccessPatient(actor, patientOwner, action)).toBe(false);
    },
  );

  it('allows a nutritionist to access only their assigned patients', () => {
    const actor: Actor = { role: 'nutri', userId: 'user-nutri', nutritionistId: 'nutri-1' };
    expect(canAccessPatient(actor, patientOwner, 'read_patient')).toBe(true);
    expect(canAccessPatient(actor, patientOwner, 'read_clinical')).toBe(true);
    expect(canAccessPatient(actor, patientOwner, 'edit_patient')).toBe(true);
    expect(canAccessPatient(actor, patientOwner, 'archive_patient')).toBe(true);
    expect(canAccessPatient(actor, patientOwner, 'edit_menu')).toBe(true);
    expect(canAccessPatient(actor, patientOwner, 'edit_appointment')).toBe(true);
    expect(canAccessPatient(actor, patientOwner, 'edit_goal')).toBe(true);
    expect(canAccessPatient(actor, patientOwner, 'edit_billing')).toBe(true);
    expect(canAccessPatient(actor, patientOwner, 'assign_resource')).toBe(true);
    expect(canAccessPatient(actor, patientOwner, 'assign_routine')).toBe(true);
    expect(canAccessPatient(actor, patientOwner, 'read_intake')).toBe(true);
    expect(canAccessPatient(actor, patientOwner, 'review_intake')).toBe(true);
    expect(canAccessPatient(actor, patientOwner, 'write_clinical_note')).toBe(true);
    expect(canAccessPatient(actor, patientOwner, 'generate_ai_job')).toBe(true);
    expect(canAccessPatient(actor, { ...patientOwner, nutritionistId: 'nutri-2' }, 'read_clinical')).toBe(false);
    expect(canAccessPatient(actor, { ...patientOwner, nutritionistId: 'nutri-2' }, 'edit_patient')).toBe(false);
    expect(canAccessPatient(actor, { ...patientOwner, nutritionistId: 'nutri-2' }, 'archive_patient')).toBe(false);
    expect(canAccessPatient(actor, { ...patientOwner, nutritionistId: 'nutri-2' }, 'edit_menu')).toBe(false);
    expect(canAccessPatient(actor, { ...patientOwner, nutritionistId: 'nutri-2' }, 'edit_appointment')).toBe(false);
    expect(canAccessPatient(actor, { ...patientOwner, nutritionistId: 'nutri-2' }, 'edit_goal')).toBe(false);
    expect(canAccessPatient(actor, { ...patientOwner, nutritionistId: 'nutri-2' }, 'edit_billing')).toBe(false);
    expect(canAccessPatient(actor, { ...patientOwner, nutritionistId: 'nutri-2' }, 'assign_resource')).toBe(false);
    expect(canAccessPatient(actor, { ...patientOwner, nutritionistId: 'nutri-2' }, 'assign_routine')).toBe(false);
  });

  it('only lets nutritionists create patients', () => {
    expect(canManagePatients({ role: 'nutri', userId: 'user-nutri', nutritionistId: 'nutri-1' }, 'create_patient')).toBe(true);
    expect(canManagePatients({ role: 'paciente', userId: 'user-patient', patientId: 'patient-1' }, 'create_patient')).toBe(false);
    expect(canManagePatients(null, 'create_patient')).toBe(false);
  });

  it('lets a locked patient read their minimal view and messages but blocks health mutations', () => {
    const actor: Actor = { role: 'paciente', userId: 'user-patient', patientId: 'patient-1' };
    const locked = { ...patientOwner, billing_status: 'pending' as const, billing_until: null };

    expect(canAccessPatient(actor, locked, 'read_self')).toBe(true);
    expect(canAccessPatient(actor, locked, 'read_patient')).toBe(true);
    expect(canAccessPatient(actor, locked, 'send_message')).toBe(true);
    expect(canAccessPatient(actor, locked, 'read_resource')).toBe(true);
    expect(canAccessPatient(actor, locked, 'read_intake')).toBe(true);
    expect(canAccessPatient(actor, locked, 'edit_intake')).toBe(true);
    expect(canAccessPatient(actor, locked, 'grant_consent')).toBe(true);
    expect(canAccessPatient(actor, locked, 'request_privacy')).toBe(true);
    expect(canAccessPatient(actor, locked, 'read_privacy')).toBe(true);
    expect(canAccessPatient(actor, locked, 'analyze_meal')).toBe(false);
    expect(canAccessPatient(actor, locked, 'update_habits')).toBe(false);
    expect(canAccessPatient(actor, locked, 'log_activity')).toBe(false);
    expect(canAccessPatient(actor, locked, 'reschedule_appointment')).toBe(false);
    expect(canAccessPatient(actor, locked, 'confirm_appointment')).toBe(false);
  });
});

describe('toPatientSelfView', () => {
  it('removes professional-only fields and unsent messages', () => {
    const view = toPatientSelfView(patient);
    const serialized = JSON.parse(JSON.stringify(view));

    expect(serialized).not.toHaveProperty('adherence_why');
    expect(serialized).not.toHaveProperty('brief');
    expect(serialized).not.toHaveProperty('goal_history');
    expect(serialized.meal_logs[0]).not.toHaveProperty('note_for_nutri');
    expect(serialized.activity_logs).toEqual(patient.activity_logs);
    expect(serialized.messages).toEqual([{
      id: 'sent-message',
      patient_id: 'patient-1',
      from: 'vero',
      text: 'Mensaje enviado',
      sent_at: '2026-09-05T00:00:00.000Z',
    }]);
  });

  it('removes professional notes from direct meal-analysis responses', () => {
    const log = toPatientSelfMealLog(patient.meal_logs[0]);
    const analysis = toPatientMealAnalysis({
      foods: [],
      macros: null,
      confidence: 0.4,
      note_for_nutri: 'Revisar porción',
    });

    expect(log).not.toHaveProperty('note_for_nutri');
    expect(analysis).not.toHaveProperty('note_for_nutri');
    expect(analysis.confidence).toBe(0.4);
  });

  it('does not mutate the internal patient record', () => {
    toPatientSelfView(patient);
    expect(patient.adherence_why).toBe('Detalle interno para la nutricionista');
    expect(patient.meal_logs[0].note_for_nutri).toBe('Foto oscura; revisar porción');
    expect(patient.messages).toHaveLength(2);
  });

  it('returns only identity, billing state and sent messages when access is locked', () => {
    const view = toPatientSelfView({ ...patient, billing_status: 'pending', billing_until: null });

    expect(view.todayPlan).toEqual([]);
    expect(view.weekPlan).toEqual([]);
    expect(view.meal_logs).toEqual([]);
    expect(view.habit_logs).toEqual([]);
    expect(view.activity_logs).toEqual([]);
    expect(view.timeline).toEqual([]);
    expect(view.appointment).toBeNull();
    expect(view.messages).toHaveLength(1);
    expect(view.billing_status).toBe('pending');
  });

  it('excludes unknown internal fields and unclassified timeline from patient JSON', () => {
    const sentinel = 'PRIVATE_AUDIT_SENTINEL';
    const input = {
      ...patient,
      billing_status: 'waived' as const,
      plan_b: sentinel,
      next_focus: sentinel,
      sensitive_hours: sentinel,
      internalFutureField: sentinel,
      timeline: [{ id: 'private', kind: 'goal' as const, atLabel: 'HOY', title: sentinel, body: sentinel }],
      appointment: {
        when: 'Mañana 10:00',
        duration: 45,
        channel: 'Meet',
        prep_note: sentinel,
      },
      weekPlan: [{ day: 'Lunes', meals: [{ slot: 'Almuerzo', title: 'Ensalada', internalNote: sentinel }] }],
    };
    const output = toPatientSelfView(input as typeof patient);
    expect(JSON.stringify(output)).not.toContain(sentinel);
    expect(output.id).toBe(patient.id);
    expect(output.messages.every((message) => Boolean(message.sent_at))).toBe(true);
  });
});
