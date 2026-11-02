import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseLabDraft } from './draft.js';

const fixture = readFileSync(new URL('./fixtures/informe-anonimo.txt', import.meta.url), 'utf8');

describe('borrador local de laboratorio', () => {
  it('lee el informe anonimizado y descarta texto con identidad', () => {
    expect(parseLabDraft(fixture).map(row => row.name)).toEqual(['Glucemia', 'Hemoglobina', 'Colesterol total', 'Trigliceridos', 'Ferritina']);
    expect(parseLabDraft(fixture).every(row => !('reviewed' in row))).toBe(true);
    expect(parseLabDraft('Paciente: Ana\nGlucemia: 91 mg/dL | 70-99')).toEqual([]);
    expect(parseLabDraft('Glucemia: 91 mg/dL | ana@example.test')).toEqual([]);
  });
});
