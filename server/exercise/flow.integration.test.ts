import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../index.js';
import { getPatient, resetStore } from '../store.js';
import { CareError, exerciseDbError } from './repository.js';
import { setExerciseHabilitation } from './memory.js';
import { SEEDED_EXERCISES } from '../../src/types/exercise.js';
import type { PatientExerciseView } from '../../src/types/exercise.js';

const patient = 'pat-sofia';
const other = 'pat-marina';
const walk = SEEDED_EXERCISES[3];

function post(path: string, body: unknown, method = 'POST') {
  return app.request(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function readExercise(id = patient, professional = false) {
  const response = await app.request(`/api/patients/${id}/exercise${professional ? '?audience=pro' : ''}`);
  return { status: response.status, body: await response.json() as { exercise: PatientExerciseView; source: string } };
}

describe('PV-35 biblioteca de ejercicio y actividad persistida', () => {
  beforeEach(() => {
    resetStore();
  });

  it('persiste actividad autodeclarada y aísla a la otra paciente', async () => {
    const beforeOther = getPatient(other)?.activity_logs?.length ?? 0;
    const response = await post(`/api/patients/${patient}/activities`, {
      activity: '  Caminata al aire libre  ',
      duration_minutes: 35,
      intensity: 'moderada',
      note: '  Me sentí bien  ',
    });
    const body = await response.json() as { patient: { activity_logs: Array<Record<string, unknown>> }; exercise: PatientExerciseView };
    expect(response.status).toBe(200);
    expect(body.patient).not.toHaveProperty('adherence_why');
    expect(body.patient.activity_logs[0]).toMatchObject({
      patient_id: patient, activity: 'Caminata al aire libre', duration_minutes: 35, intensity: 'moderada', note: 'Me sentí bien',
    });
    expect(body.exercise.activities[0].activity).toBe('Caminata al aire libre');
    expect(JSON.stringify(body.exercise)).not.toMatch(/kcal|calorías quemadas|rutina recomendada/i);
    expect(getPatient(other)?.activity_logs?.length ?? 0).toBe(beforeOther);
    const otherView = await readExercise(other);
    expect(otherView.body.exercise.activities).toEqual([]);
  });

  it('no deja asignar una rutina por ser nutricionista: hace falta habilitación verificada', async () => {
    const payload = {
      title: 'Movilidad suave',
      items: [{ exercise_id: walk.id, sets: 1, reps: 1, rest_seconds: 0 }],
    };
    expect((await post(`/api/patients/${patient}/routines`, payload)).status).toBe(403);
    setExerciseHabilitation('nutri-demo', false);
    const blocked = await post(`/api/patients/${patient}/routines?audience=pro`, payload);
    expect(blocked.status).toBe(403);
    expect(JSON.stringify(await blocked.json())).toMatch(/habilitación verificada/i);

    setExerciseHabilitation('nutri-demo', true);
    const assigned = await post(`/api/patients/${patient}/routines?audience=pro`, payload);
    expect(assigned.status).toBe(201);
    const body = await assigned.json() as { exercise: PatientExerciseView };
    expect(body.exercise.can_assign).toBe(true);
    expect(body.exercise.assignments[0].title).toBe('Movilidad suave');
    expect(body.exercise.assignments[0].items[0].name).toBe(walk.name);
    expect(body.exercise.assignments[0].items[0].sets).toBe(1);
    expect(body.exercise.library.length).toBe(SEEDED_EXERCISES.length);

    const mine = await readExercise();
    expect(mine.body.exercise.assignments[0].title).toBe('Movilidad suave');
    expect(mine.body.exercise.can_assign).toBe(false);
    const marina = await readExercise(other, true);
    expect(marina.body.exercise.assignments).toEqual([]);

    const feedback = await post(`/api/patients/${patient}/routines/${body.exercise.assignments[0].id}/feedback`, {
      sets_completed: 1, reps_completed: 1, note: 'Pude completarla',
    });
    expect(feedback.status).toBe(200);
    const after = await feedback.json() as { exercise: PatientExerciseView };
    expect(after.exercise.assignments[0].feedback?.note).toBe('Pude completarla');
    expect((await post(`/api/patients/${other}/routines/${body.exercise.assignments[0].id}/feedback`, {
      sets_completed: 1, reps_completed: 1,
    })).status).toBe(404);
  });

  it('cierra en 501 si falta el schema persistente', () => {
    expect(() => exerciseDbError({ code: '42P01' })).toThrow(CareError);
    for (const code of ['42883', 'PGRST202', 'PGRST205']) {
      try {
        exerciseDbError({ code });
        throw new Error('expected CareError');
      } catch (error) {
        expect(error).toMatchObject({ status: 501 });
      }
    }
    try {
      exerciseDbError({ code: '42501', message: 'exercise_habilitation' });
      throw new Error('expected CareError');
    } catch (error) {
      expect(error).toMatchObject({ status: 403 });
    }
  });
});
