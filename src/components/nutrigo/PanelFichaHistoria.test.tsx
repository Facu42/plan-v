import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Patient } from '../../types';
import type { HistoryEntry } from '../../api/patient-history';
import type { FichaData } from './use-ficha-data';
import { PanelFichaHistoria } from './PanelFichaHistoria';

const estado = vi.hoisted(() => ({ entries: null as HistoryEntry[] | null, error: '' }));
vi.mock('./use-patient-history', () => ({ usePatientHistory: () => ({ entries: estado.entries, error: estado.error, reintentar: vi.fn(), agregar: vi.fn(), editar: vi.fn(), darDeBaja: vi.fn() }) }));

const ahora = new Date('2026-10-27T12:00:00-03:00');
const paciente = { id: 'p1', name: 'Sofía Gómez' } as unknown as Patient;
const datos = (consented: string[] = ['care_relationship']) => ({ care: { consented, measurements: [] }, careError: null }) as unknown as FichaData;
const dato = (id: string, topic: HistoryEntry['topic'], text: string, recorded_on: string, extra: Partial<HistoryEntry> = {}): HistoryEntry => ({ id, topic, text, since: '', source: 'professional', recorded_on, edited_on: null, ended_on: null, ended_reason: '', ...extra });

describe('Historia clínica de la Ficha v29', () => {
  beforeEach(() => { estado.entries = []; estado.error = ''; });

  it('dibuja los catorce temas aunque no haya datos y dice que falta completar', () => {
    const html = renderToStaticMarkup(<PanelFichaHistoria patient={paciente} now={ahora} datos={datos()} />);
    for (const tema of ['Motivo y objetivo', 'Diagnósticos', 'Medicación y suplementos', 'Alergias e intolerancias', 'Antecedentes familiares', 'Historia alimentaria', 'Recordatorio de 24 h', 'Hábitos', 'Actividad física', 'Sueño y estrés', 'Digestión', 'Ciclo menstrual', 'Embarazo y lactancia', 'Preferencias y rechazos']) expect(html).toContain(tema);
    expect(html).toContain('0 de 14 temas');
    expect(html).toContain('Falta completar');
    expect(html).toContain('Todavía no hay datos');
    expect(html).toContain('De la consulta grabada');
    expect(html).toContain('Datos que cambian el plan');
    expect(html).toContain('data-mk="1"');
  });

  it('muestra cada dato editable con su origen y fecha, y lo dado de baja en «Antes»', () => {
    estado.entries = [
      dato('1', 'med', 'Bajar grasa y tener más energía.', '2026-03-12', { since: 'desde marzo' }),
      dato('2', 'med', 'Bajar de peso', '2025-06-10', { source: 'import', ended_on: '2026-03-12', ended_reason: 'cambió el objetivo' }),
    ];
    const html = renderToStaticMarkup(<PanelFichaHistoria patient={paciente} now={ahora} datos={datos()} />);
    expect(html).toContain('contentEditable="true"');
    expect(html).toContain('Bajar grasa y tener más energía.');
    expect(html).toContain('Vos · 12/03/26');
    expect(html).toContain('desde marzo');
    expect(html).toContain('Dar de baja');
    expect(html).toContain('Antes');
    expect(html).toContain('10/06/25 → 12/03/26 · cambió el objetivo');
    expect(html).toContain('1 de 14 temas');
  });

  it('sin el permiso de atención lo dice y no ofrece cargar datos', () => {
    estado.entries = null;
    const html = renderToStaticMarkup(<PanelFichaHistoria patient={paciente} now={ahora} datos={datos(['measurement'])} />);
    expect(html).toContain('Permiso de atención pendiente.');
    expect(html).not.toContain('Agregar dato');
    expect(html).toContain('Historia clínica');
  });

  it('si no se pudo leer avisa y ofrece reintentar', () => {
    estado.entries = null;
    estado.error = 'No pudimos leer la historia clínica. Probá de nuevo.';
    const html = renderToStaticMarkup(<PanelFichaHistoria patient={paciente} now={ahora} datos={datos()} />);
    expect(html).toContain('No pudimos leer la historia clínica.');
    expect(html).toContain('Reintentar');
  });
});
