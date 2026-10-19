import { describe, expect, it } from 'vitest';
import {
  DIRECTORY_COLUMNS, DEFAULT_DIRECTORY_LAYOUT, directoryGridTemplate, loadDirectoryLayout, parseDirectoryLayout, saveDirectoryLayout, toggleDirectoryColumn,
} from './directory-columns';

describe('columnas del directorio de pacientes', () => {
  it('por defecto muestra las ocho columnas del boceto', () => {
    expect(directoryGridTemplate(DEFAULT_DIRECTORY_LAYOUT).split(') ')).toHaveLength(8);
  });

  it('ocultar una columna saca su ancho y volver a elegirla la devuelve', () => {
    const hidden = toggleDirectoryColumn(DEFAULT_DIRECTORY_LAYOUT, 'focus');
    expect(hidden.hidden).toEqual(['weekly', 'lastVisit', 'focus']);
    expect(directoryGridTemplate(DEFAULT_DIRECTORY_LAYOUT)).toContain('125px');
    expect(directoryGridTemplate(hidden)).not.toContain('125px');
    expect(directoryGridTemplate(toggleDirectoryColumn(hidden, 'focus'))).toBe(directoryGridTemplate(DEFAULT_DIRECTORY_LAYOUT));
  });

  it('Paciente y Acciones quedan aunque se oculte todo lo demás', () => {
    const layout = {...DEFAULT_DIRECTORY_LAYOUT,hidden:DIRECTORY_COLUMNS.map(c=>c.id)};
    expect(directoryGridTemplate(layout).split(') ')).toHaveLength(2);
  });

  it('lo guardado con datos raros vuelve a lo de siempre', () => {
    expect(parseDirectoryLayout(null)).toEqual(DEFAULT_DIRECTORY_LAYOUT);
    expect(parseDirectoryLayout('no es json')).toEqual(DEFAULT_DIRECTORY_LAYOUT);
    expect(parseDirectoryLayout('[1]')).toEqual(DEFAULT_DIRECTORY_LAYOUT);
    expect(parseDirectoryLayout('{"hidden":["x","focus","focus"],"density":"enorme"}')).toEqual({ hidden: ['focus'], density: 'comfortable' });
  });

  it('guarda y recupera la elección; si el navegador no deja guardar, no falla', () => {
    const data = new Map<string, string>();
    const storage = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); } };
    saveDirectoryLayout({ hidden: ['weekly'], density: 'compact' }, storage);
    expect(loadDirectoryLayout(storage)).toEqual({ hidden: ['weekly'], density: 'compact' });
    const broken = { getItem: () => { throw new Error('bloqueado'); }, setItem: () => { throw new Error('bloqueado'); } };
    expect(() => saveDirectoryLayout(DEFAULT_DIRECTORY_LAYOUT, broken)).not.toThrow();
    expect(loadDirectoryLayout(broken)).toEqual(DEFAULT_DIRECTORY_LAYOUT);
  });
});

describe('columnas opcionales del directorio', () => {
  it('Registro semanal y Última consulta siguen disponibles como columnas adicionales', () => {
    expect(DEFAULT_DIRECTORY_LAYOUT.hidden).toEqual(['weekly', 'lastVisit']);
    const shown = toggleDirectoryColumn(toggleDirectoryColumn(DEFAULT_DIRECTORY_LAYOUT, 'lastVisit'), 'weekly');
    expect(directoryGridTemplate(shown).split(') ')).toHaveLength(10);
  });
});
