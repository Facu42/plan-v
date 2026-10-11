import { describe, expect, it } from 'vitest';
import { parseScaleReport } from './scale-report';

const report = `Informe de composición corporal
Fecha de medición: 08/10/2026
Peso 64,5 kg
Estatura 168 cm
Porcentaje de grasa corporal 27,5 %
Masa grasa 17,7 kg
Masa muscular esquelética 24,1 kg
Agua corporal total 48 %
Grasa visceral 7
Metabolismo basal 1380 kcal
Edad metabólica 41 años`;

const kinds = (text: string, existing: Parameters<typeof parseScaleReport>[1] = []) => Object.fromEntries(parseScaleReport(text, existing).candidates.map((c) => [c.kind, c]));

describe('lectura de informes de balanza', () => {
  it('reconoce la fecha y los valores con su unidad', () => {
    const reading = parseScaleReport(report);
    expect(reading.date).toBe('2026-10-08');
    const byKind = kinds(report);
    expect(byKind.weight.value).toBe(64.5);
    expect(byKind.height.value).toBe(168);
    expect(byKind.body_fat_pct.value).toBe(27.5);
    expect(byKind.fat_mass.value).toBe(17.7);
    expect(byKind.muscle_mass.value).toBe(24.1);
    expect(byKind.body_water_pct.value).toBe(48);
    expect(byKind.visceral_fat.value).toBe(7);
    expect(byKind.bmr.value).toBe(1380);
    expect(byKind.metabolic_age.value).toBe(41);
    expect(Object.values(byKind).every((c) => c.status === 'ready')).toBe(true);
  });

  it('entiende rótulos en inglés y fechas ISO', () => {
    const reading = parseScaleReport('Test Date 2026-10-02\nBody Fat 30.1 %\nSkeletal Muscle Mass 22.0 kg\nVisceral Fat Level 9');
    expect(reading.date).toBe('2026-10-02');
    expect(reading.candidates.map((c) => c.kind)).toEqual(['body_fat_pct', 'muscle_mass', 'visceral_fat']);
  });

  it('marca como inválido lo fuera de rango y lo que viene en otra unidad, sin guardarlo', () => {
    const byKind = kinds('Fecha 01/10/2026\nGrasa corporal 150 %\nPeso 140 lb');
    expect(byKind.body_fat_pct.status).toBe('invalid');
    expect(byKind.weight.status).toBe('invalid');
    expect(byKind.weight.note).toContain('lb');
  });

  it('detecta duplicados contra lo ya cargado con la misma fecha y valor', () => {
    const existing = [{ kind: 'body_fat_pct', value_numeric: 27.5, captured_on: '2026-10-08' }] as const;
    const byKind = kinds(report, existing);
    expect(byKind.body_fat_pct.status).toBe('duplicate');
    expect(byKind.fat_mass.status).toBe('ready');
  });

  it('sin fecha reconocible o con fecha futura, la fecha queda para elegir a mano', () => {
    expect(parseScaleReport('Peso 60 kg').date).toBeNull();
    expect(parseScaleReport('Fecha 01/01/2999\nPeso 60 kg', [], '2026-10-10').date).toBeNull();
  });

  it('no repite una métrica y un texto sin rótulos conocidos no propone nada', () => {
    expect(parseScaleReport('Peso 60 kg\nPeso 61 kg').candidates).toHaveLength(1);
    expect(parseScaleReport('Hola, esto no es un informe').candidates).toEqual([]);
  });
});
