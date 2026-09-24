import { beforeEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { app } from '../index.js';
import { resetStore } from '../store.js';
import { CareError, progressDbError } from './repository.js';
import { CONSENT_CATALOG } from '../intake/consent.js';
import { argentinaToday, progressWindows, shiftIsoDate } from './derive.js';
import type { PatientProgressView } from '../../src/types/progress.js';

const patient = 'pat-sofia';
const other = 'pat-marina';
const post = (path: string, body: unknown, method = 'POST') => app.request(path, {
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

async function consent() {
  const text = CONSENT_CATALOG.find((entry) => entry.purpose === 'measurement')!;
  return post(`/api/patients/${patient}/consents`, {
    purpose: text.purpose,
    text_version: text.text_version,
    text_hash: text.text_hash,
    decision: 'granted',
  });
}

async function readProgress(id = patient, days = 7) {
  const response = await app.request(`/api/patients/${id}/progress?days=${days}`);
  return { status: response.status, body: await response.json() as { progress: PatientProgressView; source: string } };
}

describe('PV-34 progreso por períodos', () => {
  beforeEach(() => {
    resetStore();
  });

  it('compara este período con el anterior del mismo paciente, con fuente y sin ranking', async () => {
    const windows = progressWindows(7);
    expect((await consent()).status).toBe(201);
    const currentWeight = {
      id: randomUUID(),
      recorded_on: windows.current.end,
      data: { kind: 'weight' as const, value: 64.5, unit: 'kg' as const, source: 'patient' as const, note: '' },
    };
    const previousWeight = {
      id: randomUUID(),
      recorded_on: windows.previous.end,
      data: { kind: 'weight' as const, value: 65, unit: 'kg' as const, source: 'professional' as const, note: '' },
    };
    const pounds = {
      id: randomUUID(),
      recorded_on: windows.current.start,
      data: { kind: 'weight' as const, value: 140, unit: 'lb' as const, source: 'patient' as const, note: '' },
    };
    expect((await post(`/api/patients/${patient}/care/records`, currentWeight)).status).toBe(200);
    expect((await post(`/api/patients/${patient}/care/records`, previousWeight)).status).toBe(200);
    expect((await post(`/api/patients/${patient}/care/records`, pounds)).status).toBe(200);

    const logged = await post(`/api/patients/${patient}/meals/analyze`, {
      slot: 'Almuerzo',
      description: 'ensalada',
      client_id: randomUUID(),
    });
    expect(logged.status).toBe(200);

    const mine = await readProgress();
    expect(mine.status).toBe(200);
    expect(mine.body.source).toBe('memory');
    expect(mine.body.progress.timezone).toBe('America/Argentina/Buenos_Aires');
    const kg = mine.body.progress.series.find((row) => row.kind === 'weight' && row.unit === 'kg');
    const lb = mine.body.progress.series.find((row) => row.kind === 'weight' && row.unit === 'lb');
    expect(kg?.declared_delta).toBe(-0.5);
    expect(kg?.current_last?.source).toBe('patient');
    expect(kg?.previous_last?.source).toBe('professional');
    expect(lb?.declared_delta).toBeNull();
    expect(mine.body.progress.meals.current.logged).toBeGreaterThanOrEqual(1);
    expect(JSON.stringify(mine.body)).not.toMatch(/mejoró|empeoró|ranking|leaderboard|IMC/i);

    const marina = await readProgress(other);
    expect(marina.status).toBe(200);
    expect(marina.body.progress.series).toEqual([]);
    expect((await app.request(`/api/patients/${patient}/progress?days=14`)).status).toBe(400);
    expect((await app.request('/api/patients/missing/progress')).status).toBe(404);
  });

  it('omite medidas si no hay consentimiento y no rellena un período vacío', async () => {
    const windows = progressWindows(7);
    expect((await consent()).status).toBe(201);
    expect((await post(`/api/patients/${patient}/care/records`, {
      id: randomUUID(),
      recorded_on: windows.current.end,
      data: { kind: 'weight', value: 64.5, unit: 'kg', source: 'patient', note: '' },
    })).status).toBe(200);
    const text = CONSENT_CATALOG.find((entry) => entry.purpose === 'measurement')!;
    expect((await post(`/api/patients/${patient}/consents`, {
      purpose: text.purpose,
      text_version: text.text_version,
      text_hash: text.text_hash,
      decision: 'withdrawn',
    })).status).toBe(201);
    const body = (await readProgress()).body.progress;
    expect(body.measurements_included).toBe(false);
    expect(body.series).toEqual([]);
    expect(body.current.end).toBe(argentinaToday());
    expect(body.previous.end).toBe(shiftIsoDate(body.current.start, -1));
  });

  it('cierra en 501 si falta el schema persistente', () => {
    expect(() => progressDbError({ code: '42P01' })).toThrow(CareError);
    for (const code of ['42883', 'PGRST202', 'PGRST205']) {
      try {
        progressDbError({ code });
        throw new Error('expected CareError');
      } catch (error) {
        expect(error).toMatchObject({ status: 501 });
      }
    }
    try {
      progressDbError({ code: '42501' });
      throw new Error('expected CareError');
    } catch (error) {
      expect(error).toMatchObject({ status: 403 });
    }
  });
});
