import { useEffect, type RefObject } from 'react';
import gsap from 'gsap';

/**
 * Movimiento de /slug: la portada entra en cascada y las tarjetas aparecen al llegar a la pantalla.
 * Breve (≤ 0,6 s). Con «reducir movimiento» no se anima nada y todo queda visible.
 */
export function usePublicMotion(raiz: RefObject<HTMLElement | null>, listo: boolean) {
  useEffect(() => {
    const el = raiz.current;
    if (!listo || !el) return;
    if (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      gsap.from('.pub-hero-txt > *', { y: 18, opacity: 0, duration: 0.55, stagger: 0.07, ease: 'power3.out', clearProps: 'all' });
      gsap.from('.pub-stack > *', { y: 40, opacity: 0, scale: 0.94, duration: 0.7, stagger: 0.12, ease: 'power3.out', delay: 0.15, clearProps: 'opacity,scale,y' });
      const tarjetas = gsap.utils.toArray<HTMLElement>('.pub-card');
      if (typeof IntersectionObserver === 'undefined') return;
      gsap.set(tarjetas, { y: 24, opacity: 0 });
      const io = new IntersectionObserver(entradas => entradas.forEach(e => {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        gsap.to(e.target, { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out', clearProps: 'all' });
      }), { threshold: 0.15 });
      tarjetas.forEach(t => io.observe(t));
      return () => io.disconnect();
    }, el);
    return () => ctx.revert();
  }, [raiz, listo]);
}
