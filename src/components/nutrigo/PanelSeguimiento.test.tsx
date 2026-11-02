import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { HabitLog, Patient } from '../../types';
import { PanelSeguimientoVista } from './PanelSeguimiento';
import { animoDe, aguaDe, antiguedadDe, diasEtiqueta, fotoVisible, kcalLabel, mealWhen, ordenarColaFotos, sentimientoDe, sintomasDe, textoPedido } from './seguimiento-presentacion';

const comida = {
  id: 'ml-1', patientId: 'p1', name: 'Sofía Gómez', initials: 'SG', tone: 'mint' as const,
  slot: 'Desayuno', when: 'Hoy 8:10', age: 'hace 2 h', kcal: '420 kcal', title: 'Tostadas con palta', meta: 'Sofía Gómez · Desayuno · hace 2 h · 420 kcal',
  photoUrl: null, href: '/crm/ficha?paciente=p1', log: null,
};

describe('seguimiento, el dibujo', () => {
  const vista = (tab: 'pend' | 'ok' = 'pend') => renderToStaticMarkup(<PanelSeguimientoVista
    tab={tab} comidas={[comida]} sentimientos={[{ id: 'p1', name: 'Sofía Gómez', initials: 'SG', tone: 'mint', line: 'Agua 2 vasos · sueño 6,2 h · Sin síntomas nuevos', animo: 'Bien', pill: 'p-conf', detail: 'Ánimo: Bien.', href: '/crm/ficha?paciente=p1&seccion=evolucion' }]}
    dias={[{ id: 'p1', name: 'Sofía Gómez', initials: 'SG', tone: 'mint', text: '6 de 7', on: 6 }]}
    pendientes={1} estado="ready" mas={false} dialog={tab === 'ok' ? { kind: 'pedir' } : null} toast=""
    pedir={{ pacientes: [{ id: 'p1', name: 'Sofía Gómez', has_account: false } as Patient], aviso: true, dias: 7, comidas: ['Desayuno', 'Almuerzo', 'Merienda', 'Cena'], pacienteId: 'p1' }}
    onConfirm={vi.fn()} onAdjust={vi.fn()} onComment={vi.fn()} onVer={vi.fn()} onSentir={vi.fn()} onClose={vi.fn()} onGuardarComentario={vi.fn()} onPedir={vi.fn()} onAbrir={vi.fn()}
  />);

  it('por revisar muestra Confirmar y Comentar, y no nombra WhatsApp', () => {
    const html = vista('pend');
    expect(html).toContain('id="s-seguimiento"');
    expect(html).toContain('Comidas con foto');
    expect(html).toContain('Cómo se sienten');
    expect(html).toContain('Días registrados');
    expect(html).toContain('class="fxp g cola-fxp"');
    expect(html).toContain('class="cola-fila"');
    expect(html).toContain('class="sxpic cola-foto"');
    expect(html).toContain('class="cola-pri"');
    expect(html).toContain('class="cola-sec"');
    expect(html).toContain('aria-label="Confirmar la comida de Sofía Gómez"');
    expect(html).toContain('aria-label="Ajustar la comida de Sofía Gómez"');
    expect(html).toContain('hace 2 h');
    expect(html).toContain('Confirmar');
    expect(html).toContain('Ajustar');
    expect(html).toContain('Cola fotos');
    expect(html).toContain('Comentar');
    expect(html).not.toContain('WhatsApp');
    expect(html).not.toContain('Confianza');
    expect(html).not.toContain('Nota IA');
    expect(html).not.toContain('%');
    expect(html).toContain('sxdays');
    expect(html).toContain('class="on"');
  });

  it('la cola usa el tema del panel y no pinta una superficie clara fija', () => {
    const css = readFileSync(new URL('./panel-v29-app.css', import.meta.url), 'utf8');
    const bloque = css.slice(css.indexOf('Cola de fotos y editor'));
    expect(bloque.length).toBeGreaterThan(200);
    expect(bloque).toContain('var(--card)');
    expect(bloque).toContain('var(--lima)');
    expect(bloque).toContain('var(--ink)');
    expect(bloque).not.toMatch(/#F7FAF9|#DCEFE7|#fff\b|color-scheme:\s*light/i);
  });

  it('sin platos dice que está todo al día y al cargar muestra el esqueleto menta', () => {
    const vacio = renderToStaticMarkup(<PanelSeguimientoVista
      tab="pend" comidas={[]} sentimientos={[]} dias={[]}
      pendientes={0} estado="ready" mas={false} dialog={null} toast=""
      pedir={{ pacientes: [], aviso: true, dias: 7, comidas: [], pacienteId: '' }}
      onConfirm={vi.fn()} onAdjust={vi.fn()} onComment={vi.fn()} onVer={vi.fn()} onSentir={vi.fn()} onClose={vi.fn()} onGuardarComentario={vi.fn()} onPedir={vi.fn()} onAbrir={vi.fn()}
    />);
    expect(vacio).toContain('Todo al día');
    expect(vacio).toContain('No hay platos por revisar');
    const cargando = renderToStaticMarkup(<PanelSeguimientoVista
      tab="pend" comidas={[]} sentimientos={[]} dias={[]}
      pendientes={0} estado="loading" mas={false} dialog={null} toast=""
      pedir={{ pacientes: [], aviso: true, dias: 7, comidas: [], pacienteId: '' }}
      onConfirm={vi.fn()} onAdjust={vi.fn()} onComment={vi.fn()} onVer={vi.fn()} onSentir={vi.fn()} onClose={vi.fn()} onGuardarComentario={vi.fn()} onPedir={vi.fn()} onAbrir={vi.fn()}
    />);
    expect(cargando).toContain('cola-skel');
    expect(cargando).toContain('aria-busy="true"');
    expect(cargando).not.toContain('Estamos trayendo');
  });

  it('pedir registro avisa solo por la app', () => {
    const html = vista('ok');
    expect(html).toContain('Pedir registro');
    expect(html).toContain('Avisarle por la app');
    expect(html).toContain('hasta que vincule la app');
    expect(html).not.toContain('WhatsApp');
  });
});

describe('seguimiento, los datos', () => {
  it('ordena la cola de fotos de la más vieja a la más nueva, de todas las pacientes', () => {
    const orden = ordenarColaFotos([
      { id: 'b', at: '2026-11-02T12:00:00Z', patient: 'b' },
      { id: 'a2', at: '2026-11-01T12:00:00Z', patient: 'a' },
      { id: 'a1', at: '2026-11-01T12:00:00Z', patient: 'c' },
    ]);
    expect(orden.map(item => item.id)).toEqual(['a1', 'a2', 'b']);
  });

  it('arma el horario del consultorio y no inventa calorías ni fotos', () => {
    expect(antiguedadDe('2026-10-25T13:00:00.000Z', new Date('2026-10-25T15:00:00.000Z'))).toBe('hace 2 h');
    expect(antiguedadDe('2026-10-25T14:40:00.000Z', new Date('2026-10-25T15:00:00.000Z'))).toBe('hace 20 min');
    expect(mealWhen('2026-10-25T11:10:00.000Z', new Date('2026-10-25T15:00:00.000Z'))).toMatch(/^Hoy /);
    expect(mealWhen('2026-10-24T21:00:00.000Z', new Date('2026-10-25T15:00:00.000Z'))).toMatch(/^Ayer /);
    expect(kcalLabel(null)).toBeNull();
    expect(kcalLabel({ kcal: 420, protein_g: 1, carbs_g: 1, fat_g: 1 })).toBe('420 kcal');
    expect(fotoVisible(null)).toBeNull();
    expect(fotoVisible('patients/p1/foto.jpg')).toBeNull();
    expect(fotoVisible('https://cdn.ejemplo/foto.jpg')).toBe('https://cdn.ejemplo/foto.jpg');
  });

  it('el ánimo usa el texto guardado y un día sin resumen no es un cero', () => {
    const logs = [{ id: 'h', patient_id: 'p', date: '2026-10-25', hydration: 2, energy: 'Con energía', sleep_minutes: 372, symptoms: [] }] as HabitLog[];
    expect(animoDe(logs)).toEqual({ text: 'Con energía', className: 'p-conf' });
    expect(animoDe([{ ...logs[0], energy: 'Baja' }])).toEqual({ text: 'Baja', className: 'p-bad' });
    expect(animoDe([])).toEqual({ text: 'Sin registros', className: 'p-wait' });
    expect(diasEtiqueta(null)).toEqual({ text: 'Resumen no disponible', on: null });
    expect(diasEtiqueta(0)).toEqual({ text: '0 de 7 · sin registros', on: 0 });
    expect(diasEtiqueta(6).on).toBe(6);
    expect(aguaDe(1.5)).toBe('1,5 vasos');
    expect(sintomasDe(undefined)).toBe('en la ficha');
    expect(sintomasDe(logs)).toBe('Sin síntomas nuevos');
  });

  it('sin hábitos en la lista manda a la ficha y el pedido no sale de la app', () => {
    const fila = sentimientoDe({ id: 'p', name: 'Laura Ruiz', initials: 'LR', tone: 'peach', habit_logs: [], weekly_registration: null });
    expect(fila.line).toContain('en la ficha');
    expect(fila.animo).toBe('Sin registros');
    expect(textoPedido('Laura Ruiz', 7, ['Cena'])).toContain('la app');
    expect(textoPedido('Laura Ruiz', 7, ['Cena'])).not.toContain('WhatsApp');
  });
});
