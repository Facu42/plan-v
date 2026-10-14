import { describe, expect, it } from 'vitest';
import { parseCsv, mapImportRows, validateImportFile, parseImportDate, parseImportNumber } from './patient-import';

describe('importación local revisable', () => {
  it('conserva la fila física de CSV vacío y de registros que contienen saltos de línea',()=>{
    const origin={file:'a.csv',fingerprint:'a'.repeat(64),sheet:'CSV'};
    const rows=parseCsv('Nombre;Antecedentes\r\n\r\nAna;Antecedente revisado\r\n');
    const result=mapImportRows(rows.slice(1),{name:0,history:1},origin);
    expect(result).toHaveLength(1);expect(result[0].history[0]).toEqual({category:'history',text:'Antecedente revisado',origin:{...origin,row:3}});
    const multiline=mapImportRows(parseCsv('Nombre;Antecedentes\nAna;"Primera\nconsulta"\n\nBerta;Antecedente B').slice(1),{name:0,history:1},origin);
    expect(multiline.map(row=>row.origins[0].row)).toEqual([2,5]);expect(multiline[0].history[0].text).toBe('Primera\nconsulta');
  });
  it('respeta comillas, separadores argentinos y saltos dentro de celdas', () => {
    expect(parseCsv('Nombre;Email;Notas\r\n"Ana; Pérez";ANA@EXAMPLE.TEST;"Primera\nconsulta"')).toEqual([
      ['Nombre', 'Email', 'Notas'], ['Ana; Pérez', 'ANA@EXAMPLE.TEST', 'Primera\nconsulta'],
    ]);
  });
  it('rechaza CSV incompleto y archivos antiguos, excesivos o vacíos', () => {
    expect(() => parseCsv('nombre,email\n"Ana,x')).toThrow();
    for (const file of [{ name: 'a.xls', size: 1 }, { name: 'a.xlsx', size: 21 * 1024 * 1024 }, { name: 'a.csv', size: 0 }]) expect(() => validateImportFile(file)).toThrow();
  });
  it('agrupa filas por email sin convertir nombres similares en coincidencias seguras', () => {
    const rows = [['Ana', 'ANA@example.test', '65,2', '11/10/2026'], ['Ana', 'ana@example.test', '66', '10/10/2026'], ['Ana', '', '', '']];
    const result = mapImportRows(rows, { name: 0, email: 1, weight: 2, date: 3 }, { file: 'archivo.csv', fingerprint: 'a'.repeat(64), sheet: 'CSV' });
    expect(result).toHaveLength(2);
    expect(result[0].email).toBe('ana@example.test');
    expect(result[0].measurements).toHaveLength(2);
    expect(result[0].origins.map(o => o.row)).toEqual([2, 3]);
    expect(result[1].email).toBe('');
  });
  it('no inventa fechas ni unidades y detecta filas contradictorias', () => {
    expect(parseImportDate('31/02/2026')).toBeNull();
    expect(parseImportDate('11/10/2026')).toBe('2026-10-11');
    expect(parseImportNumber('1.234,5')).toBe(1234.5);
    expect(parseImportNumber('65 kg')).toBeNull();
    const result = mapImportRows([['Ana', 'a@example.test'], ['Berta', 'a@example.test']], { name: 0, email: 1 }, { file: 'a.csv', fingerprint: 'a'.repeat(64) });
    expect(result[0].warnings.join(' ')).toContain('nombres');
  });
});
