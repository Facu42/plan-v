import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import {
  RESOURCE_GUIDES,
  ShowroomResources,
  buildResourceShareUrl,
  filterResourceGuides,
  resourceAssignmentDateLabel,
  resourceGuideIdFromHash,
  shareResourceGuide,
} from './ShowroomResources';

const onNavigate = vi.fn();

describe('ShowroomResources', () => {
  it('publica sólo guías operativas internas con rutas válidas y relaciones resolubles', () => {
    const ids = new Set(RESOURCE_GUIDES.map((guide) => guide.id));
    expect(ids.size).toBe(RESOURCE_GUIDES.length);
    expect(RESOURCE_GUIDES).toHaveLength(6);
    expect(RESOURCE_GUIDES.every((guide) => guide.sections.length >= 2)).toBe(true);
    expect(RESOURCE_GUIDES.every((guide) => guide.related.every((id) => ids.has(id)))).toBe(true);
    expect(RESOURCE_GUIDES.map((guide) => guide.action.page)).toEqual([
      'plan', 'diario', 'compras', 'mensajes', 'progreso', 'ejercicio',
    ]);
    expect(JSON.stringify(RESOURCE_GUIDES)).not.toMatch(/calorías quemadas|diagnóstico|prescripción profesional|tratamiento médico/i);
  });

  it('busca por título, categoría, resumen y etiquetas sin inventar coincidencias', () => {
    expect(filterResourceGuides(RESOURCE_GUIDES, 'compra', 'Todas').map((guide) => guide.id)).toEqual(['compras-desde-plan']);
    expect(filterResourceGuides(RESOURCE_GUIDES, 'actividad', 'Todas').map((guide) => guide.id)).toEqual(['actividad-autodeclarada']);
    expect(filterResourceGuides(RESOURCE_GUIDES, '', 'Seguimiento').map((guide) => guide.id)).toEqual(['progreso-semanal']);
    expect(filterResourceGuides(RESOURCE_GUIDES, 'dato inexistente', 'Todas')).toEqual([]);
  });

  it('muestra fechas de asignación y lectura sin depender de la zona horaria del navegador', () => {
    expect(resourceAssignmentDateLabel('2026-09-15T12:00:00.000Z')).toBe('15 sep');
    expect(resourceAssignmentDateLabel('fecha-inválida')).toBe('fecha no disponible');
  });

  it('renderiza biblioteca, filtros, guardado local explícito y acceso a detalle', () => {
    const html = renderToStaticMarkup(<ShowroomResources patientId="pat-sofia" query="" onNavigate={onNavigate} />);
    expect(html).toContain('Guías para usar Plan V');
    expect(html).toContain('Cómo leer tu plan semanal');
    expect(html).toContain('Guardado sólo en este dispositivo');
    expect(html).toContain('Abrir guía');
    expect(html).not.toContain('Pronto');
  });

  it('distingue recursos asignados por la nutricionista del guardado local', () => {
    const html = renderToStaticMarkup(<ShowroomResources
      patientId="pat-sofia"
      query=""
      assignments={[{
        id: 'assignment-1', patient_id: 'pat-sofia', resource_id: 'leer-plan-semanal',
        assigned_at: '2026-09-15T12:00:00.000Z', read_at: null,
      }]}
      onNavigate={onNavigate}
    />);
    expect(html).toContain('Asignado por tu nutricionista');
    expect(html).toContain('Pendiente de lectura');
    expect(html).toContain('Guardado sólo en este dispositivo');
  });

  it('construye y valida enlaces profundos sin perder el selector de diseño', () => {
    expect(buildResourceShareUrl('leer-plan-semanal', 'http://127.0.0.1:5180/?design=nutrigo')).toBe(
      'http://127.0.0.1:5180/?design=nutrigo#recurso=leer-plan-semanal',
    );
    expect(resourceGuideIdFromHash('#recurso=leer-plan-semanal')).toBe('leer-plan-semanal');
    expect(resourceGuideIdFromHash('#recurso=no-existe')).toBeNull();
    expect(resourceGuideIdFromHash('#otra-cosa')).toBeNull();
  });

  it('comparte con Web Share y degrada a copiar el enlace estable', async () => {
    const guide = RESOURCE_GUIDES[0];
    const share = vi.fn().mockResolvedValue(undefined);
    const writeText = vi.fn().mockResolvedValue(undefined);
    await expect(shareResourceGuide(guide, { href: 'https://planv.test/', share, writeText })).resolves.toBe('shared');
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ title: guide.title, text: guide.summary, url: 'https://planv.test/#recurso=leer-plan-semanal' }));
    expect(writeText).not.toHaveBeenCalled();

    await expect(shareResourceGuide(guide, { href: 'https://planv.test/', writeText })).resolves.toBe('copied');
    expect(writeText).toHaveBeenCalledWith('https://planv.test/#recurso=leer-plan-semanal');
    await expect(shareResourceGuide(guide, { href: 'https://planv.test/' })).resolves.toBe('unavailable');
  });
});
