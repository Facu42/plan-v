import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { MealLog, Patient } from '../../types';
import { MEAL_KEPT_COPY, MealLogModal, mealLogWasKept } from './MealLogModal';
import {
  MEAL_SLOTS, analyzingMessages, base64Payload, captureProblem, remainingNotice, confidenceLevel, countAt, macroShares, messageAt,
  photoProblem, resolveInitialSlot, stepProgress, suggestSlot,
} from './meal-log-helpers';
import { StepIndicator } from './MealLogStepper';
import { CaptureView, ConsentGroup, ModeToggle, PhotoDrop, SlotChips } from './MealLogCapture';
import { prefersReducedMotion } from './meal-log-motion';
import { AnalyzingView, MacroPanel, ReviewView, SuccessView } from './MealLogResult';

const noop = () => undefined;
const MACROS = { kcal: 500, protein_g: 30, carbs_g: 50, fat_g: 20 };
const GOOD_LOG: MealLog = {
  id: 'm1', patient_id: 'p1', slot: 'Almuerzo', photo_url: null, description: 'pollo con arroz',
  foods: [{ name: 'Pollo grillado', portion_est: 120, portion_unit: 'g', confidence: 0.7 }, { name: 'Arroz', portion_est: 80, portion_unit: 'g', confidence: 0.6 }],
  macros: MACROS, confidence: 0.72, note_for_nutri: 'dato interno', status: 'pending_review' as MealLog['status'],
  logged_at: '2026-10-07T12:00:00Z', analysis_status: 'succeeded',
};
const KEPT_LOG: MealLog = { ...GOOD_LOG, foods: [], macros: null, analysis_status: 'failed' };

describe('PV-22 diario UI', () => {
  it('muestra que el registro no se perdió cuando la estimación falla', () => {
    expect(mealLogWasKept({ foods: [], macros: null, analysis_status: 'failed' })).toBe(true);
    expect(mealLogWasKept({
      foods: [{ name: 'pollo', portion_est: 120, portion_unit: 'g', confidence: 0.7 }],
      macros: { kcal: 400, protein_g: 30, carbs_g: 20, fat_g: 12 },
      analysis_status: 'succeeded',
    })).toBe(false);
    const html = renderToStaticMarkup(<p className="modal-note">{MEAL_KEPT_COPY}</p>);
    expect(html).toContain('Tu registro no se perdió');
    expect(html).not.toContain('note_for_nutri');
  });
});

describe('momento de la comida sugerido por la hora', () => {
  it.each([
    [2, 'Extra'], [5, 'Desayuno'], [9, 'Desayuno'], [10, 'Colación'], [11, 'Colación'],
    [12, 'Almuerzo'], [15, 'Almuerzo'], [16, 'Merienda'], [18, 'Merienda'], [19, 'Cena'], [23, 'Cena'], [0, 'Extra'],
  ])('a las %i horas sugiere %s', (hour, slot) => {
    expect(suggestSlot(hour)).toBe(slot);
  });

  it('respeta el momento explícito y sugiere solo cuando no viene o no se reconoce', () => {
    expect(resolveInitialSlot('Cena', 9)).toBe('Cena');
    expect(resolveInitialSlot('merienda', 9)).toBe('Merienda');
    expect(resolveInitialSlot(undefined, 9)).toBe('Desayuno');
    expect(resolveInitialSlot('Tomar agua', 13)).toBe('Almuerzo');
    expect(MEAL_SLOTS).toHaveLength(6);
  });
});

describe('pasos y validaciones puras', () => {
  it('calcula el avance de cada paso', () => {
    expect(stepProgress('capture')).toMatchObject({ index: 0, total: 4, percent: 25 });
    expect(stepProgress('analyzing').percent).toBe(50);
    expect(stepProgress('review').percent).toBe(75);
    expect(stepProgress('success')).toMatchObject({ index: 3, percent: 100, label: 'Listo' });
  });

  it('valida formato y peso de la foto', () => {
    expect(photoProblem({ type: 'image/jpeg', size: 1000 })).toBeNull();
    expect(photoProblem({ type: 'image/webp', size: 5 * 1024 * 1024 })).toBeNull();
    expect(photoProblem({ type: 'image/gif', size: 1000 })).toBe('Elegí una foto JPG, PNG o WebP de hasta 5 MB.');
    expect(photoProblem({ type: 'image/png', size: 5 * 1024 * 1024 + 1 })).toBe('Elegí una foto JPG, PNG o WebP de hasta 5 MB.');
  });

  it('rota los mensajes de análisis sin salirse de la lista', () => {
    const photo = analyzingMessages('photo', true);
    expect(photo[0]).toBe('Mirando tu plato…');
    expect(photo).toContain('Estimando porciones…');
    expect(analyzingMessages('text', false)[0]).toBe('Leyendo tu descripción…');
    expect(messageAt(photo, 0)).toBe(photo[0]);
    expect(messageAt(photo, photo.length)).toBe(photo[0]);
    expect(messageAt(photo, photo.length + 1)).toBe(photo[1]);
  });

  it('reparte las calorías entre proteínas, carbohidratos y grasas', () => {
    expect(macroShares(MACROS)).toEqual({ protein: 24, carbs: 40, fat: 36 });
    expect(macroShares({ kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 })).toEqual({ protein: 0, carbs: 0, fat: 0 });
  });

  it('cuenta de 0 al valor final con una curva que frena', () => {
    expect(countAt(412, 0)).toBe(0);
    expect(countAt(412, 1)).toBe(412);
    expect(countAt(412, 0.5)).toBeGreaterThan(206);
    expect(countAt(412, 2)).toBe(412);
  });

  it('explica por qué falta algo antes de analizar', () => {
    const base = { mode: 'photo' as const, text: '', hasImage: true, consented: ['ai_meal_analysis', 'meal_photo'] };
    expect(captureProblem(base)).toBeNull();
    expect(captureProblem({ ...base, consented: [] })).toBe('Activá el permiso de análisis con IA para continuar.');
    expect(captureProblem({ ...base, consented: ['ai_meal_analysis'] })).toBe('Activá el permiso de fotos de comidas para subir una imagen.');
    expect(captureProblem({ ...base, hasImage: false })).toBe('Subí una foto o contanos qué comiste en texto.');
    expect(captureProblem({ ...base, mode: 'text' })).toBe('Describí qué comiste.');
    expect(captureProblem({ ...base, mode: 'text', text: 'arroz', consented: null })).toBeNull();
  });

  it('clasifica la confianza', () => {
    expect(confidenceLevel(0.8)).toBe('high');
    expect(confidenceLevel(0.5)).toBe('medium');
    expect(confidenceLevel(0.1)).toBe('low');
  });
});

describe('indicador de pasos', () => {
  it('marca el paso actual y es legible con lector de pantalla', () => {
    const html = renderToStaticMarkup(<StepIndicator step="analyzing" />);
    expect(html).toContain('aria-label="Progreso del registro"');
    expect(html).toContain('Paso 2 de 4');
    expect(html).toContain('Análisis');
    expect(html.match(/aria-current="step"/g)).toHaveLength(1);
    expect(html).toContain('--mlm-progress:50%');
  });
});

describe('captura', () => {
  it('muestra los seis momentos con el elegido marcado', () => {
    const html = renderToStaticMarkup(<SlotChips value="Cena" onChange={noop} />);
    expect(html).toContain('Momento de la comida');
    for (const slot of MEAL_SLOTS) expect(html).toContain(slot);
    expect(html).toMatch(/value="Cena"[^>]*checked=""|checked=""[^>]*value="Cena"/);
    expect(html).not.toMatch(/value="Almuerzo"[^>]*checked=""|checked=""[^>]*value="Almuerzo"/);
    expect(html).toContain('--mlm-col:1');
    expect(html).toContain('--mlm-row:1');
  });

  it('alterna Foto y Describir con el indicador deslizante', () => {
    const html = renderToStaticMarkup(<ModeToggle value="text" onChange={noop} />);
    expect(html).toContain('Foto');
    expect(html).toContain('Describir');
    expect(html).toContain('data-mode="text"');
  });

  it('zona de foto vacía, con vista previa y bloqueada por permiso', () => {
    const empty = renderToStaticMarkup(<PhotoDrop preview={null} blocked={false} onFile={noop} onClear={noop} />);
    expect(empty).toContain('Arrastrá una foto o tocá para subirla');
    expect(empty).toContain('Sacar foto');
    expect(empty).toContain('Elegir foto');
    const withPhoto = renderToStaticMarkup(<PhotoDrop preview="data:image/png;base64,AAAA" blocked={false} onFile={noop} onClear={noop} />);
    expect(withPhoto).toContain('alt="Vista previa de tu comida"');
    expect(withPhoto).toContain('Cambiar foto');
    expect(withPhoto).toContain('aria-label="Quitar foto"');
    const blocked = renderToStaticMarkup(<PhotoDrop preview={null} blocked onFile={noop} onClear={noop} />);
    expect(blocked).toContain('permiso de fotos');
    expect(blocked).toContain('disabled=""');
  });
});

describe('análisis, revisión y éxito', () => {
  it('anuncia el análisis y arranca con el primer mensaje', () => {
    const html = renderToStaticMarkup(<AnalyzingView mode="photo" preview="data:image/png;base64,AAAA" description="" />);
    expect(html).toContain('role="status"');
    expect(html).toContain('Analizando tu comida…');
    expect(html).toContain('Mirando tu plato…');
    expect(html).toContain('Verónica confirma antes de que cuente');
  });

  it('macros con texto accesible y barras proporcionales', () => {
    const html = renderToStaticMarkup(<MacroPanel macros={MACROS} />);
    expect(html).toContain('500 kilocalorías');
    expect(html).toContain('30 gramos de proteínas');
    expect(html).toContain('50 gramos de carbohidratos');
    expect(html).toContain('20 gramos de grasas');
    expect(html).toContain('--mlm-fill:24%');
    expect(html).toContain('--mlm-fill:40%');
    expect(html).toContain('--mlm-fill:36%');
  });

  it('revisión con alimentos en tarjetas, macros y confianza', () => {
    const html = renderToStaticMarkup(<ReviewView result={GOOD_LOG} slot="Almuerzo" preview={null} description="pollo con arroz" onConfirm={noop} />);
    expect(html).toContain('Esto es lo que vemos');
    expect(html).toContain('Lectura asistida · Almuerzo');
    expect(html).toContain('Pollo grillado');
    expect(html).toContain('~120g');
    expect(html).toContain('--mlm-i:1');
    expect(html).toContain('confianza 72%');
    expect(html).toContain('pendiente de Verónica');
    expect(html).toContain('Guardar comida');
    expect(html).not.toContain('dato interno');
  });

  it('revisión cuando no se pudo estimar conserva el mensaje de registro guardado', () => {
    const html = renderToStaticMarkup(<ReviewView result={KEPT_LOG} slot="Cena" preview={null} description="algo" onConfirm={noop} />);
    expect(html).toContain('Registramos tu comida');
    expect(html).toContain('Registro guardado · Cena');
    expect(html).toContain('Tu registro no se perdió');
    expect(html).not.toContain('Pollo grillado');
  });

  it('confirmación final con check animado y botón para volver', () => {
    const html = renderToStaticMarkup(<SuccessView name="Ana Pérez" macros={MACROS} onClose={noop} />);
    expect(html).toContain('¡Listo, Ana!');
    expect(html).toContain('Comida registrada');
    expect(html).toContain('mlm-check');
    expect(html).toContain('Volver a mi día');
    expect(html).toContain('Quedó como estimación');
  });
});

describe('diálogo completo', () => {
  afterEach(() => vi.useRealTimers());
  const patient = { id: 'p1', name: 'Ana Pérez' } as unknown as Patient;

  it('abre en captura con nombre accesible, paso 1 y campos de siempre', () => {
    const html = renderToStaticMarkup(<MealLogModal patient={patient} defaultSlot="Merienda" close={noop} />);
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('aria-label="Registrar comida"');
    expect(html).toContain('Paso 1 de 4');
    expect(html).toContain('Detalle opcional de la comida');
    expect(html).toContain('Analizar con IA');
    expect(html).toContain('aria-label="Cerrar"');
    expect(html).toMatch(/value="Merienda"[^>]*checked=""|checked=""[^>]*value="Merienda"/);
  });

  it('sin momento explícito sugiere el de la hora', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-07T21:30:00-03:00'));
    const html = renderToStaticMarkup(<MealLogModal patient={patient} close={noop} />);
    expect(html).toMatch(/value="Cena"[^>]*checked=""|checked=""[^>]*value="Cena"/);
  });
});

const DRAFT = { mode: 'text' as const, slot: 'Cena', description: '', photoPreview: null };
const captureProps = { error: null, photoBlocked: false, aiBlocked: false, consent: null, onChange: noop, onFile: noop, onAnalyze: noop };

describe('revisión del code-reviewer (M, L)', () => {
  it('M3: el grupo de permisos abre solo si falta algo y dice qué pasa', () => {
    const blocked = renderToStaticMarkup(<ConsentGroup blocked><i>x</i></ConsentGroup>);
    expect(blocked).toContain('falta activar');
    expect(blocked).toMatch(/<details[^>]*\sopen=""/);
    const ready = renderToStaticMarkup(<ConsentGroup blocked={false}><i>x</i></ConsentGroup>);
    expect(ready).toContain('listos');
    expect(ready).not.toMatch(/<details[^>]*\sopen=""/);
  });

  it('M3: en modo texto el permiso de fotos no cuenta para el resumen', () => {
    const consent = <p>permisos</p>;
    const text = renderToStaticMarkup(<CaptureView {...captureProps} draft={DRAFT} consent={consent} photoBlocked />);
    expect(text).toContain('listos');
    const photo = renderToStaticMarkup(<CaptureView {...captureProps} draft={{ ...DRAFT, mode: 'photo' }} consent={consent} photoBlocked />);
    expect(photo).toContain('falta activar');
  });

  it('M2: la región que anuncia errores es estable en el diálogo y el aviso visible no la duplica', () => {
    const modal = renderToStaticMarkup(<MealLogModal patient={{ id: 'p1', name: 'Ana Pérez' } as unknown as Patient} close={noop} />);
    expect(modal).toContain('aria-live="assertive"');
    const withError = renderToStaticMarkup(<CaptureView {...captureProps} draft={DRAFT} error="Describí qué comiste." />);
    expect(withError).toContain('Describí qué comiste.');
    expect(withError.match(/<div class="mlm-feedback">[\s\S]*?<\/div>/)?.[0]).not.toContain('aria-live');
  });

  it('L5: el contador de caracteres queda fuera del nombre de la etiqueta', () => {
    const html = renderToStaticMarkup(<CaptureView {...captureProps} draft={{ ...DRAFT, description: 'a'.repeat(900) }} />);
    expect(html).toContain('900/1000');
    const label = html.match(/<label><span>Contanos[\s\S]*?<\/label>/)?.[0] ?? '';
    expect(label).not.toContain('900/1000');
    expect(label).toContain('Contanos qué comiste');
  });

  it('L5: avisa cuánto falta solo en umbrales, no en cada letra', () => {
    expect(remainingNotice(500, 1000)).toBe('');
    expect(remainingNotice(900, 1000)).toBe('Te quedan 100 caracteres.');
    expect(remainingNotice(990, 1000)).toBe('Te quedan 10 caracteres.');
    expect(remainingNotice(1000, 1000)).toBe('Llegaste al límite de caracteres.');
    expect(remainingNotice(901, 1000)).toBe('');
  });

  it('L2: saca el contenido base64 de la foto sin partir el texto entero', () => {
    expect(base64Payload('data:image/png;base64,AAAA,BB')).toBe('AAAA,BB');
    expect(base64Payload(null)).toBeUndefined();
    expect(base64Payload('sin-coma')).toBeUndefined();
  });

  it('L7: el stepper anuncia los pasos completados', () => {
    const html = renderToStaticMarkup(<StepIndicator step="review" />);
    expect(html.match(/ completado/g)).toHaveLength(2);
  });

  it('L7: sin alimentos no hay lista vacía y el éxito redondea las kcal', () => {
    const noFoods = renderToStaticMarkup(<ReviewView result={{ ...GOOD_LOG, foods: [] }} slot="Cena" preview={null} description="x" onConfirm={noop} />);
    expect(noFoods).not.toContain('Alimentos que vemos');
    const html = renderToStaticMarkup(<SuccessView name="Ana" macros={{ kcal: 612.4, protein_g: 37.6, carbs_g: 58, fat_g: 24 }} onClose={noop} />);
    expect(html).toContain('<strong>612</strong>');
    expect(html).toContain('<strong>38g</strong>');
    expect(html).not.toContain('612.4');
    const macros = renderToStaticMarkup(<MacroPanel macros={{ kcal: 612.4, protein_g: 37.6, carbs_g: 58, fat_g: 24 }} />);
    expect(macros).toContain('612 kilocalorías');
    expect(macros).toContain('38 gramos de proteínas');
  });

  it('L10: lee la preferencia de movimiento reducido sin romper si no hay matchMedia', () => {
    expect(prefersReducedMotion(undefined)).toBe(false);
    expect(prefersReducedMotion({ matchMedia: () => ({ matches: true }) as MediaQueryList })).toBe(true);
    expect(prefersReducedMotion({ matchMedia: () => ({ matches: false }) as MediaQueryList })).toBe(false);
  });

  it('M1/M5/L6: el CSS gana a los campos del modo oscuro, evita gris claro para texto y tiene respaldo de vh', () => {
    const css = readFileSync(new URL('./meal-log-modal.css', import.meta.url), 'utf8');
    expect(css).toContain('.mlm-backdrop .mlm-sheet :is(.mlm-input, .mlm-textarea textarea)');
    expect(css).not.toMatch(/(?<![-\w])color: var\(--mlm-muted\)/);
    expect(css.indexOf('92vh')).toBeGreaterThan(-1);
    expect(css.indexOf('92vh')).toBeLessThan(css.indexOf('92dvh'));
  });
});
