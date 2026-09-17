import { afterEach, describe, expect, it } from 'vitest';
import { createActorClient, getRequestDb, getSupabaseAdmin } from './supabase-client.js';
import {
  PRIVATE_APPOINTMENT_COLUMNS,
  PRIVATE_MEAL_COLUMNS,
  PRIVATE_MESSAGE_COLUMNS,
  PRIVATE_PATIENT_COLUMNS,
  appointmentColumns,
  mealLogColumns,
  messageColumns,
  patientTableColumns,
} from './columns.js';

describe('actor vs admin database clients', () => {
  const previous = {
    APP_MODE: process.env.APP_MODE,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };

  afterEach(() => {
    process.env.APP_MODE = previous.APP_MODE;
    process.env.SUPABASE_URL = previous.SUPABASE_URL;
    process.env.SUPABASE_ANON_KEY = previous.SUPABASE_ANON_KEY;
    process.env.SUPABASE_SERVICE_ROLE_KEY = previous.SUPABASE_SERVICE_ROLE_KEY;
  });

  it('builds the actor client with the anon key, not the service role', () => {
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
    const actor = createActorClient('Bearer user-jwt');
    const admin = getSupabaseAdmin();
    expect(actor).not.toBeNull();
    expect(admin).not.toBeNull();
    expect(actor).not.toBe(admin);
  });

  it('refuses ordinary queries in persistent mode without a bound JWT client', () => {
    process.env.APP_MODE = 'production';
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
    expect(() => getRequestDb()).toThrow('Actor JWT client is required');
  });
});

describe('patient query column lists', () => {
  it('keep professional-only fields off the patient select lists', () => {
    for (const column of PRIVATE_PATIENT_COLUMNS) {
      expect(patientTableColumns.patient.split(',')).not.toContain(column);
    }
    for (const column of PRIVATE_MEAL_COLUMNS) {
      expect(mealLogColumns.patient.split(',')).not.toContain(column);
    }
    for (const column of PRIVATE_MESSAGE_COLUMNS) {
      expect(messageColumns.patient.split(',')).not.toContain(column);
    }
    for (const column of PRIVATE_APPOINTMENT_COLUMNS) {
      expect(appointmentColumns.patient.split(',')).not.toContain(column);
    }
    expect(patientTableColumns.patient).not.toContain('*');
    expect(mealLogColumns.patient).not.toContain('*');
  });
});
