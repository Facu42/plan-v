import { describe, expect, it } from 'vitest';
import { normalizeSymptoms, symptomFrequency, symptomLabel, SYMPTOM_KEYS } from './symptoms';

describe('síntomas', () => {
  it('deja solo claves conocidas, sin repetir y en el orden de la lista', () => {
    expect(normalizeSymptoms(['cansancio', 'acidez', 'acidez', 'otro', 3])).toEqual(['acidez', 'cansancio']);
    expect(normalizeSymptoms(null)).toEqual([]);
  });

  it('cuenta los días de cada síntoma, de más a menos frecuente', () => {
    expect(symptomFrequency([{ symptoms: ['acidez'] }, { symptoms: ['acidez', 'hinchazon'] }, {}])).toEqual([
      { key: 'acidez', label: 'Acidez', days: 2 },
      { key: 'hinchazon', label: 'Hinchazón', days: 1 },
    ]);
    expect(symptomFrequency([{ symptoms: [] }])).toEqual([]);
  });

  it('cada clave tiene su texto en español', () => {
    for (const key of SYMPTOM_KEYS) expect(symptomLabel(key)).not.toBe(key);
  });

  it('las claves coinciden con la restricción de la migración', async () => {
    const { readFile } = await import('node:fs/promises');
    const sql = await readFile(new URL('../../supabase/migrations/20261015100000_habit_symptoms.sql', import.meta.url), 'utf8');
    const listed = sql.match(/array\[([^\]]+)\]/)?.[1].split(',').map(item => item.trim().replace(/'/g, ''));
    expect(listed).toEqual([...SYMPTOM_KEYS]);
  });
});
