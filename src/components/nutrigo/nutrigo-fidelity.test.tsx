import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { RecipeMacroGrid } from './RecipePlate';
import {
  NUTRIGO_FIDELITY_NOT_VISUAL_APPROVAL,
  NUTRIGO_FIDELITY_RAILS,
  NUTRIGO_FRAME,
  NUTRIGO_FIDELITY_SURFACES,
  NUTRIGO_NO_GLOBAL_RAIL,
  NUTRIGO_REFERENCE_PNG_MISSING,
  NUTRIGO_REFERENCE_PNGS,
  NV_VISUAL_LAW,
} from './nutrigo-fidelity';

const css = readFileSync(new URL('./nutrigo-fidelity.css', import.meta.url), 'utf8');
const law = readFileSync(new URL('../../../design/nutrigo-fidelity.md', import.meta.url), 'utf8');

describe('NV-FIDELITY shell vs inventario', () => {
  it('fija sidebar 223 y rails 325/325/345/305 sin aprobación visual', () => {
    expect(NUTRIGO_FIDELITY_RAILS).toEqual({
      dashboard: 325,
      calendar: 325,
      'healthy-menu': 345,
      insights: 305,
    });
    expect(css).toMatch(/--nv-sidebar-width:\s*223px/);
    expect(css).toMatch(/--nv-rail-dashboard:\s*325px/);
    expect(css).toMatch(/--nv-rail-calendar:\s*325px/);
    expect(css).toMatch(/--nv-rail-menu:\s*345px/);
    expect(css).toMatch(/--nv-rail-insights:\s*305px/);
    expect(css).toMatch(/--nv-content-pad:\s*28px/);
    expect(css).toMatch(/font-family:\s*Poppins/);
    // Valores leídos del archivo por el MCP de Figma, no muestreados.
    expect(css).toMatch(/--nv-accent:\s*#C2E66E/);
    expect(css).toMatch(/--nv-accent-soft:\s*#DFF9A2/);
    expect(css).toMatch(/--nv-gold:\s*#FFCB65/);
    expect(css).toMatch(/--nv-gold-soft:\s*#FFE6B5/);
    expect(css).toMatch(/--nv-coral:\s*#FFA257/);
    expect(css).toMatch(/--nv-coral-soft:\s*#FFE1C9/);
    expect(css).toMatch(/--nv-ink:\s*#272932/);
    expect(css).toMatch(/--nv-muted:\s*#8A8C90/);
    expect(css).toMatch(/--nv-line:\s*#E1E1E2/);
    // Leidos en los detalles de receta y de recurso (nodos 84:3145, 279:9301).
    expect(css).toMatch(/--nv-leaf:\s*#73A107/);
    expect(css).toMatch(/--nv-heading:\s*#212738/);
    // El parrafo largo del archivo es 14 a 1.4, no el 14 a 1.25 de las etiquetas.
    expect(css).toMatch(/--nv-fs-p14:\s*14px;\s*--nv-lh-p14:\s*1\.4/);
    expect(css).toMatch(/--nv-bg:\s*#F9F4F2/);
    expect(css).toMatch(/--nv-shadow:\s*0 4px 12px rgba\(176, 176, 176, 0\.14\)/);
    expect(css).toMatch(/--nv-fs-h3:\s*26px/);
    // La lima Plan V y el dorado del isotipo no pintan esta superficie
    // (los comentarios sí pueden nombrarlos para dejar asentada la desviación retirada).
    const rules = css.replace(/\/\*[\s\S]*?\*\//g, '');
    expect(rules).not.toMatch(/#EAFF78/i);
    expect(rules).not.toMatch(/#f9b343/i);
    // El nav del archivo es radio 14, no cápsula (nodo 12:793).
    expect(css).toMatch(/border-radius:\s*14px/);
    expect(css).toMatch(/padding:\s*28px 20px/);
    // La card de estadística es radio 16, no 20, y su gráfico mide 24 (nodo 74:2016).
    expect(css).toMatch(/--nv-r-card:\s*16px/);
    expect(css).toMatch(/--nv-r-chart:\s*6px/);
    expect(css).toMatch(/--nv-h-chart:\s*24px/);
    expect(rules).not.toMatch(/--nv-r-card:\s*20px/);
    // Geometría del cuerpo del Dashboard (nodos 84:1489, 57:1509, 62:1513).
    expect(css).toMatch(/grid-template-columns:\s*265px minmax\(0, 1fr\)/);
    expect(css).toMatch(/grid-template-columns:\s*minmax\(0, 1fr\) 260px/);
    expect(css).toMatch(/grid-template-columns:\s*228px minmax\(0, 1fr\)/);
    expect(css).toMatch(/width:\s*204px/);
    // Detalle de recurso (nodo 279:9301): 800 + 36 + 325, cada columna una card de padding 36.
    expect(css).toMatch(/grid-template-columns:\s*minmax\(0, 1fr\) 325px/);
    expect(css).toMatch(/aspect-ratio:\s*728 \/ 408/);
    // Movil: un solo bloque de 799 con la barra de 64 y la guarda de 16.
    expect(css).toMatch(/@media \(max-width: 799px\)/);
    expect(css).toMatch(/min-height:\s*64px/);
    expect(css).toMatch(/padding:\s*24px var\(--nv-card-pad\)/);
    // El cajon reemplaza a la barra inferior: menu de 32 y panel de 223.
    expect(css).toMatch(/\.nv-app \.nv-tabbar \{ display: none; \}/);
    expect(css).toMatch(/\.nv-app \.nv-button\.nv-menu-toggle/);
    expect(css).toMatch(/width:\s*var\(--nv-sidebar-width\)/);
    expect(css).toMatch(/\.nv-drawer-scrim/);
    // La barra superior de escritorio no es del archivo: no puede quedar
    // angosta al ancho del sidebar ni hacer que sus controles se salgan.
    expect(rules).not.toMatch(/\.nv-topbar\s*\{[^}]*width:\s*var\(--nv-sidebar-width\)/);
    expect(css).toMatch(/width:\s*30px;\s*height:\s*30px;\s*min-height:\s*0;\s*border:\s*0;\s*border-radius:\s*10px;/);
    // Detalle de receta (nodo 84:3145): las cuatro fichas de macro son Green,
    // asi que la piel pisa los azules y rojos que inventaba recipe-plate.css.
    expect(css).toMatch(/\.nv-app \.recipe-macros \[data-macro\] dd/);
    expect(css).toMatch(/\.nv-app \.recipe-plate-badge/);
    expect(css).toMatch(/Not Facu visual approval/);
    expect(css).not.toMatch(/PLANV_NUTRIGO_VISUAL\s*=\s*1/);
    expect(NV_VISUAL_LAW.type).toBe('Poppins');
    expect(NV_VISUAL_LAW.notType).toEqual(['Inter', 'Fraunces']);
    expect(NV_VISUAL_LAW.copyLanguage).toBe('es');
    expect(NV_VISUAL_LAW.source).toBe('figma-mcp');
    // Cada color del CSS tiene que ser una variable declarada en el archivo.
    for (const value of Object.values(NV_VISUAL_LAW.colors)) {
      expect(value).toMatch(/^#[0-9A-F]{6}$/);
    }
    expect(NV_VISUAL_LAW.colors.Green).toBe('#C2E66E');
    expect(NV_VISUAL_LAW.colors['Gray-20']).toBe('#8A8C90');
    expect(NUTRIGO_FRAME).toEqual({
      width: 1440, sidebar: 223, content: 892, rail: 325,
      contentPad: 28, cardPad: 16, sectionGap: 20,
    });
    // El ancho del frame cierra: 223 + 892 + 325 = 1440.
    expect(NUTRIGO_FRAME.sidebar + NUTRIGO_FRAME.content + NUTRIGO_FRAME.rail).toBe(NUTRIGO_FRAME.width);
    expect(NV_VISUAL_LAW.qaDir).toBe('design/nutrigo-exports');
    expect(NV_VISUAL_LAW.law).toBe('design/nutrigo-fidelity.md');
    expect(NV_VISUAL_LAW.figmaFileKey).toBe('OTolnKfsxUFjaZOhhdb04i');
    expect(css).toMatch(/\.nv-app\.nv-patient-diary \.photo-modal/);
    expect(css).toMatch(/\.nv-app \.nv-macro-dot\.nv-gold/);
    expect(css).toMatch(/\.nv-app \.nv-alerts-urgency\.soon/);
    expect(css).toMatch(/\.nv-app \.nv-button:not\(\.nv-ghost\):not\(\.nv-soft\)/);
    expect(css).toMatch(/\.nv-app \.nvr-cover-check/);
    expect(NUTRIGO_FIDELITY_NOT_VISUAL_APPROVAL).toMatch(/not Facu visual approval/i);
  });

  it('las ocho superficies sin rail global no reservan columna derecha', () => {
    expect(NUTRIGO_NO_GLOBAL_RAIL).toEqual([
      'messages',
      'recipe-details',
      'meal-plan',
      'grocery',
      'food-diary',
      'progress',
      'exercise',
      'insight-details',
    ]);
    for (const token of ['.nv-messaging', '.nv-grocery-page', '.nv-progress-page', '.nv-patient-diary', '.nv-patient-plan', '.nv-exercise-page', '.nv-resources-page', '.nv-meal-plan', '.nv-food-diary']) {
      expect(css).toContain(token);
    }
    expect(css).toMatch(/grid-template-columns:\s*minmax\(0,\s*1fr\)\s*!important/);
  });

  it('lista once superficies de fidelidad, sin Ejercicio, con los PNG de escritorio', () => {
    expect(NUTRIGO_FIDELITY_SURFACES.map((surface) => surface.id)).toEqual([
      'dashboard', 'calendar', 'messages', 'healthy-menu', 'recipe-details',
      'meal-plan', 'grocery', 'food-diary', 'progress', 'insights', 'insight-details',
    ]);
    expect(NUTRIGO_FIDELITY_SURFACES.some((surface) => surface.id === 'exercise')).toBe(false);
    expect(NUTRIGO_REFERENCE_PNG_MISSING).toEqual([]);
    expect(Object.keys(NUTRIGO_REFERENCE_PNGS)).toEqual(NUTRIGO_FIDELITY_SURFACES.map((surface) => surface.id));
    for (const file of Object.values(NUTRIGO_REFERENCE_PNGS)) {
      expect(existsSync(new URL(`../../../${file}`, import.meta.url))).toBe(true);
    }
    expect(law).toContain('OTolnKfsxUFjaZOhhdb04i');
    expect(law).toMatch(/Poppins/);
    expect(law).toMatch(/Gray-20|Cream-BG/);
    expect(law).toMatch(/exacta al archivo \.fig|exacta al \.fig|exacto al archivo \.fig/);
    expect(law).toMatch(/copy en espa\u00f1ol|La interfaz va en espa\u00f1ol/);
    expect(law).toMatch(/Ejercicio no entra/);
    expect(law).toMatch(/OAuth 403/);
    expect(law).toMatch(/74:2016/);
    expect(law).toMatch(/12:793/);
    for (const node of [
      '33:1574', '84:1489', '57:1509', '62:1513',
      '84:1666', '84:2565', '84:2716', '84:2994', '105:2472', '105:2649', '105:2790',
      '263:6588', '84:3145', '279:9301',
      // Frames moviles de 390.
      '427:14405', '433:17250', '433:19982', '445:10499', '457:13264', '470:15300',
      '492:11324', '492:14886', '498:18237', '504:15334', '507:17412',
    ]) expect(law).toContain(node);
    expect(law).toMatch(/## Móvil \(390\)/);
    expect(law).toMatch(/design\/nutrigo-exports/);
    expect(law).not.toMatch(/PLANV_NUTRIGO_VISUAL\s*=\s*1/);
  });

  it('los macros declarados se leen como KCAL/PROT/CARBS/GRASAS', () => {
    const html = renderToStaticMarkup(<RecipeMacroGrid macros={{ kcal: 420, protein_g: 32, carbs_g: 28, fat_g: 14 }} />);
    expect(html).toContain('KCAL');
    expect(html).toContain('PROT');
    expect(html).toContain('CARBS');
    expect(html).toContain('GRASAS');
    expect(html).toContain('420');
    expect(html).not.toContain('http');
  });
});
