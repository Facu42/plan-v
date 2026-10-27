import { describe, expect, it } from 'vitest';
import {
  CERRAR_PANEL_MS, ESTIRAR_MS, LIMPIAR_MS, SEGUIR_PLEGADO_MS, TOAST_MS, TRANSICION_ESTIRAR, TRANSICION_SOLTAR,
  UMBRAL_PASTILLA_PX, aplicarPastilla, pasoPastilla,
} from './panel-v29-motion';

function pastilla() {
  const clases = new Set<string>();
  const estilo = { transition: '', transform: '', height: '' };
  return {
    classList: { add: (nombre: string) => clases.add(nombre), remove: (nombre: string) => clases.delete(nombre), contains: (nombre: string) => clases.has(nombre) },
    style: estilo,
  } as unknown as HTMLElement;
}

describe('pastilla del menú, mismos tiempos que el boceto', () => {
  it('un salto menor a 1 px no se anima', () => {
    expect(pasoPastilla({ y: 10, h: 38 }, 10.4, 38.2, false)).toEqual({ tipo: 'igual' });
  });

  it('sin posición previa o en instantáneo va directo', () => {
    expect(pasoPastilla(null, 20, 38, false)).toEqual({ tipo: 'directo', y: 20, h: 38 });
    expect(pasoPastilla({ y: 0, h: 38 }, 80, 40, true)).toEqual({ tipo: 'directo', y: 80, h: 40 });
  });

  it('se estira desde la punta de atrás hasta la opción nueva', () => {
    expect(pasoPastilla({ y: 10, h: 38 }, 100, 38, false)).toEqual({ tipo: 'estirar', top: 10, alto: 128, y: 100, h: 38 });
    expect(UMBRAL_PASTILLA_PX).toBe(1);
  });

  it('el estirado dura 180 ms y después suelta con la curva del boceto', () => {
    const pill = pastilla();
    const pendiente = { id: null as number | null };
    const cola: Array<{ fn: () => void; ms: number }> = [];
    const cur = aplicarPastilla(
      pill, { y: 10, h: 38 }, 100, 38, false, pendiente,
      (fn, ms) => { cola.push({ fn, ms }); return cola.length; },
      () => {},
    );
    expect(cur).toEqual({ y: 100, h: 38 });
    expect(pill.classList.contains('go')).toBe(true);
    expect(pill.style.transition).toBe(TRANSICION_ESTIRAR);
    expect(pill.style.transform).toBe('translateY(10px)');
    expect(pill.style.height).toBe('128px');
    expect(cola[0]?.ms).toBe(ESTIRAR_MS);
    cola[0]?.fn();
    expect(pill.style.transition).toBe(TRANSICION_SOLTAR);
    expect(pill.style.transform).toBe('translateY(100px)');
    expect(pill.style.height).toBe('38px');
    expect(pill.classList.contains('go')).toBe(false);
    expect(cola[1]?.ms).toBe(LIMPIAR_MS);
    cola[1]?.fn();
    expect(pill.style.transition).toBe('');
    expect(pendiente.id).toBeNull();
  });

  it('el camino directo corta un estirado que todavía no soltó', () => {
    const pill = pastilla();
    pill.classList.add('go');
    const pendiente = { id: 7 as number | null };
    const cancelados: number[] = [];
    aplicarPastilla(pill, { y: 0, h: 38 }, 40, 38, true, pendiente, () => 0, id => { cancelados.push(id); });
    expect(cancelados).toEqual([7]);
    expect(pendiente.id).toBeNull();
    expect(pill.style.transform).toBe('translateY(40px)');
    expect(pill.classList.contains('go')).toBe(false);
  });

  it('el cierre del panel y el aviso usan los milisegundos del boceto', () => {
    expect(CERRAR_PANEL_MS).toBe(220);
    expect(TOAST_MS).toBe(3600);
    expect(SEGUIR_PLEGADO_MS).toBe(450);
    expect(LIMPIAR_MS).toBe(320);
  });
});
