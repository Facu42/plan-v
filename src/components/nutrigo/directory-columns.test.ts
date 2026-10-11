import { describe, expect, it } from 'vitest';
import {
  DEFAULT_DIRECTORY_LAYOUT, directoryGridTemplate, loadDirectoryLayout, parseDirectoryLayout, saveDirectoryLayout, toggleDirectoryColumn,
} from './directory-columns';

describe('columnas del directorio de pacientes', () => {
  it('por defecto muestra las cinco columnas de siempre', () => {
    expect(directoryGridTemplate(DEFAULT_DIRECTORY_LAYOUT).split(') ')).toHaveLength(5);
  });

  it('ocultar una columna saca su ancho y volver a elegirla la devuelve', () => {
    const hidden = toggleDirectoryColumn(DEFAULT_DIRECTORY_LAYOUT, 'focus');
    expect(hidden.hidden).toEqual(['lastVisit', 'connection', 'focus']);
    expect(directoryGridTemplate(hidden)).not.toContain('140px');
    expect(directoryGridTemplate(toggleDirectoryColumn(hidden, 'focus'))).toBe(directoryGridTemplate(DEFAULT_DIRECTORY_LAYOUT));
  });

  it('Paciente y Acciones quedan aunque se oculte todo lo demás', () => {
    const all = ['status', 'focus', 'weekly'] as const;
    const layout = all.reduce(toggleDirectoryColumn, DEFAULT_DIRECTORY_LAYOUT);
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
  it('Última consulta y Conexión arrancan ocultas y al activarlas suman su ancho', () => {
    expect(DEFAULT_DIRECTORY_LAYOUT.hidden).toEqual(['lastVisit', 'connection']);
    const shown = toggleDirectoryColumn(toggleDirectoryColumn(DEFAULT_DIRECTORY_LAYOUT, 'lastVisit'), 'connection');
    expect(directoryGridTemplate(shown).split(') ')).toHaveLength(7);
  });
});
