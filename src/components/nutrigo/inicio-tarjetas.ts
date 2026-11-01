import { useEffect, type RefObject } from 'react';
import gsap from 'gsap';

/** Entrada de las tarjetas de Inicio: suben un poco, una después de la otra. */
export const ENTRADA_TARJETAS = { y: 16, opacity: 0, duration: 0.5, stagger: 0.07, ease: 'power2.out' };
/** Hover suave, solo un desliz hacia arriba. */
export const HOVER_TARJETA = -4;

export function movimientoPermitido(reducido: boolean) {
  return !reducido;
}

/** Anima las tarjetas de números y suelta todo al desmontar. Con «reducir movimiento» no hace nada. */
export function useTarjetasInicio(raiz: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const nodo = raiz.current;
    const reducido = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!nodo || !movimientoPermitido(reducido)) return undefined;
    const tarjetas = Array.from(nodo.querySelectorAll<HTMLElement>('.kpis .kpi'));
    if (!tarjetas.length) return undefined;
    const ctx = gsap.context(() => {
      gsap.from(tarjetas, { ...ENTRADA_TARJETAS, clearProps: 'transform,opacity' });
    }, nodo);
    const soltar = tarjetas.map((tarjeta) => {
      const entrar = (evento: PointerEvent) => {
        if (evento.pointerType === 'touch') return;
        gsap.to(tarjeta, { y: HOVER_TARJETA, duration: 0.28, ease: 'power2.out' });
      };
      const salir = () => { gsap.to(tarjeta, { y: 0, duration: 0.28, ease: 'power2.out' }); };
      tarjeta.addEventListener('pointerenter', entrar);
      tarjeta.addEventListener('pointerleave', salir);
      return () => {
        tarjeta.removeEventListener('pointerenter', entrar);
        tarjeta.removeEventListener('pointerleave', salir);
        gsap.killTweensOf(tarjeta);
      };
    });
    return () => {
      soltar.forEach((fn) => fn());
      ctx.revert();
    };
  }, [raiz]);
}
