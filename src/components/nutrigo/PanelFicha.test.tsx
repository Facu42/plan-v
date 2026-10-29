import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { Patient } from '../../types';
import { FichaSolapas, PanelFichaCabecera } from './PanelFichaCabecera';
import { PanelFichaPlan } from './PanelFichaPlan';
import { PanelFichaConsultas } from './PanelFichaConsultas';
import { FichaEtiquetas } from './FichaEtiquetas';
import { PanelFichaResumen } from './PanelFichaResumen';
import { PanelFichaMediciones } from './PanelFichaMediciones';
import { PanelFichaObjetivos } from './PanelFichaObjetivos';
import { PanelFichaPedirRegistro } from './PanelFichaPedirRegistro';
import type { FichaData } from './use-ficha-data';

const ahora = new Date('2026-10-27T12:00:00-03:00');
const paciente = {
  id: 'p1', name: 'Sofía Gómez', initials: 'SG', tone: 'mint', goal: 'Bajar a 66,5 kg', goal_progress: 40, adherence_score: 86, created_at: '2026-03-12T10:00:00Z', has_account: true,
  appointment: null, appointment_history: [], meal_logs: [], habit_logs: [], todayPlan: [], timeline: [], messages: [],
} as unknown as Patient;
const medida = (id: string, kind: string, captured_on: string, value_numeric: number, unit: string) => ({ id, patient_id: 'p1', kind, captured_on, created_at: `${captured_on}T10:00:00Z`, value_numeric, unit, source: 'professional' });
const datos = (extra: Partial<FichaData> = {}) => ({
  care: { consented: ['care_relationship', 'measurement'], records: [], measurements: [medida('a', 'weight', '2026-09-01', 74, 'kg'), medida('b', 'weight', '2026-10-14', 68.4, 'kg'), medida('c', 'waist', '2026-10-14', 80, 'cm')] },
  careError: null, reload: vi.fn(), canCare: true, canDocs: false, current: null, refetch: vi.fn(), ...extra,
}) as unknown as FichaData;
const ir = vi.fn();

describe('Ficha v29', () => {
  it('dibuja las diez solapas con el contador que se conoce y marca la activa', () => {
    const html = renderToStaticMarkup(<FichaSolapas activa="mediciones" conteo={{ alimentario: { n: 3, hot: false }, laboratorio: { n: 2, hot: true } }} onChange={vi.fn()} />);
    for (const solapa of ['Resumen', 'Historia clínica', 'Consultas y notas', 'Mediciones', 'Objetivos y hábitos', 'Plan', 'Registro alimentario', 'Laboratorio y estudios', 'Archivos', 'Cobros']) expect(html).toContain(solapa);
    expect(html).toContain('class="on" aria-current="page">Mediciones');
    expect(html).toContain('<span class="n hot">2</span>');
    expect(html).toContain('<span class="n">3</span>');
  });

  it('el encabezado dice que falta saber, sin inventar etiquetas ni estado de la app', () => {
    const html = renderToStaticMarkup(<PanelFichaCabecera patient={paciente} now={ahora} datos={datos()} onBack={vi.fn()} onChat={vi.fn()} onAgendar={vi.fn()} onEdit={vi.fn()} onConsulta={vi.fn()} />);
    for (const texto of ['Sofía Gómez', 'Pacientes', 'Paciente desde marzo', 'Consultando antecedentes…', 'Chat', 'Agendar', 'Iniciar consulta', 'App conectada', 'atención autorizada']) expect(html).toContain(texto);
    expect(html).not.toContain('Celíaca');
    expect(html).not.toContain('WhatsApp');
  });

  it('sin vincular no ofrece el chat', () => {
    const html = renderToStaticMarkup(<PanelFichaCabecera patient={{ ...paciente, has_account: false }} now={ahora} datos={datos()} onBack={vi.fn()} onChat={vi.fn()} onAgendar={vi.fn()} onEdit={vi.fn()} onConsulta={vi.fn()} />);
    expect(html).toContain('Sin vincular');
    expect(html).not.toContain('>Chat<');
  });

  it('el Resumen conserva todos sus bloques aunque no haya datos y muestra los números reales', () => {
    const html = renderToStaticMarkup(<PanelFichaResumen patient={paciente} now={ahora} datos={datos()} ir={ir} />);
    for (const bloque of ['Evolución del peso', 'Qué cambió desde la última consulta', 'Avance al objetivo', 'Alertas', 'Para hacer hoy', 'Próximo turno', 'Plan vigente', 'Anamnesis', 'Acuerdos de la última consulta']) expect(html).toContain(bloque);
    expect(html).toContain('68,4');
    expect(html).toContain('Grasa');
    expect(html).toContain('Sin dato');
    expect(html).toContain('Sin acuerdos cargados');
    expect(html).toContain('data-mk="1"');
  });

  it('sin permiso de medidas lo dice en vez de dibujar una curva vacía', () => {
    const html = renderToStaticMarkup(<PanelFichaResumen patient={paciente} now={ahora} datos={datos({ care: { consented: ['care_relationship'], measurements: [] } as never })} ir={ir} />);
    expect(html).toContain('Permiso de medidas pendiente');
  });

  it('cuando no pudo consultar una fuente lo avisa con un reintento', () => {
    const current = { key: 'k', intake: null, clinical: null, notes: null, meals: null, feed: null, vista: null, errors: ['comidas'] };
    const html = renderToStaticMarkup(<PanelFichaResumen patient={paciente} now={ahora} datos={datos({ current } as never)} ir={ir} />);
    expect(html).toContain('No pudimos actualizar comidas');
    expect(html).toContain('Reintentar');
  });

  it('muestra las etiquetas propias y el botón «+ etiqueta» solo cuando se pueden guardar', () => {
    const props = { patient: paciente, now: ahora, datos: datos(), onBack: vi.fn(), onChat: vi.fn(), onAgendar: vi.fn(), onEdit: vi.fn(), onConsulta: vi.fn() };
    const con = renderToStaticMarkup(<PanelFichaCabecera {...props} etiquetasPropias={[{ id: 't1', label: 'Deportista', tone: 'a' }, { id: 't2', label: 'Running', tone: 'n' }]} onGuardarEtiquetas={vi.fn()} />);
    expect(con).toContain('<span class="tg2">Deportista</span>');
    expect(con).toContain('<span class="tg2 n">Running</span>');
    expect(con).toContain('+ etiqueta');
    const sin = renderToStaticMarkup(<PanelFichaCabecera {...props} />);
    expect(sin).not.toContain('+ etiqueta');
  });

  it('el cajón de etiquetas marca las actuales y ofrece las sugeridas', () => {
    const html = renderToStaticMarkup(<FichaEtiquetas nombre="Sofía" actuales={['Running']} onGuardar={vi.fn()} onClose={vi.fn()} />);
    expect(html).toContain('Etiquetas de Sofía');
    expect(html).toContain('aria-pressed="true">Running');
    expect(html).toContain('aria-pressed="false">Celíaca');
    expect(html).toContain('Nueva etiqueta');
  });

  it('Mediciones dibuja los medidores, las solapas y no inventa pliegues ni fórmula', () => {
    const html = renderToStaticMarkup(<PanelFichaMediciones patient={paciente} now={ahora} datos={datos()} ir={ir} />);
    for (const texto of ['Mediciones', 'Importar balanza', 'Nueva medición', 'IMC', 'Grasa', 'Músculo', 'Cintura', 'Evolución', 'Kerr · 5 componentes', 'Sin fórmula validada', 'Pliegues', 'Perímetros', 'Composición', 'Segmental']) expect(html).toContain(texto);
    expect(html).toContain('Los pliegues todavía no se cargan en Nutridash');
    expect(html).toContain('data-mk="1"');
  });

  it('Mediciones sin permiso de medidas lo dice y apaga los botones de carga', () => {
    const html = renderToStaticMarkup(<PanelFichaMediciones patient={paciente} now={ahora} datos={datos({ care: { consented: ['care_relationship'], measurements: [] } as never })} ir={ir} />);
    expect(html).toContain('Permiso de medidas pendiente');
    expect(html).toContain('disabled');
  });

  it('Objetivos y hábitos dibuja los cuatro bloques con el objetivo real y avisa lo que no hay', () => {
    const html = renderToStaticMarkup(<PanelFichaObjetivos patient={paciente} now={ahora} datos={datos()} onChanged={vi.fn()} />);
    for (const texto of ['Objetivos', 'Bajar a 66,5 kg', 'Actualizar', 'Hábitos de la semana', 'cargados por Sofía', 'Agua', 'Sueño', 'Actividad', 'Energía', 'Síntomas', 'Sin síntomas marcados']) expect(html).toContain(texto);
    expect(html).toContain('todavía no registró su energía');
    expect(html).toContain('data-mk="1"');
  });

  it('Objetivos sin objetivo definido ofrece agregarlo', () => {
    const html = renderToStaticMarkup(<PanelFichaObjetivos patient={{ ...paciente, goal: '' }} now={ahora} datos={datos()} onChanged={vi.fn()} />);
    expect(html).toContain('Todavía sin objetivo definido');
    expect(html).toContain('Agregar');
  });

  it('el cajón de pedir registro avisa que va por la app y deja elegir días y comidas', () => {
    const html = renderToStaticMarkup(<PanelFichaPedirRegistro patient={paciente} onClose={vi.fn()} onSent={vi.fn()} />);
    expect(html).toContain('Pedir registro a Sofía');
    expect(html).toContain('Le llega por la app. No se usa otro canal.');
    for (const texto of ['7 días', '14 días', 'Desayuno', 'Almuerzo', 'Merienda', 'Cena']) expect(html).toContain(texto);
    expect(html).not.toContain('vincule la app');
    expect(renderToStaticMarkup(<PanelFichaPedirRegistro patient={{ ...paciente, has_account: false }} onClose={vi.fn()} onSent={vi.fn()} />)).toContain('vincule la app');
  });

  it('el Plan dibuja los bloques del boceto con sus botones y avisa mientras consulta', () => {
    const html = renderToStaticMarkup(<PanelFichaPlan patient={paciente} now={ahora} onChanged={vi.fn()} onSection={vi.fn()} />);
    for (const texto of ['Plan vigente', 'Requerimiento', 'Calorías por comida', 'Lista de compras', 'Hoy', 'Semana', 'Vista de Sofía', 'Abrir en el editor', 'Editar', 'Enviar a Sofía', 'Consultando el plan vigente…']) expect(html).toContain(texto);
    expect(html).not.toContain('WhatsApp');
    expect(html).toContain('data-mk="1"');
  });

  it('Consultas y notas muestra que consulta turnos y notas mientras carga y no usa otro canal que la app', () => {
    const html = renderToStaticMarkup(<PanelFichaConsultas patient={paciente} now={ahora} datos={datos()} onSection={vi.fn()} onOpenHref={vi.fn()} onChanged={vi.fn()} />);
    expect(html).toContain('Consultando turnos y notas…');
    expect(html).not.toContain('WhatsApp');
  });
});
