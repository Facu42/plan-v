import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { money, num } from './centro-format';

gsap.registerPlugin(useGSAP);

/** Entrada de la vista, tarjetas en escalera y conteo de los números. Solo opacidad y desplazamiento. */
export function useHubMotion(signature: string) {
  const ref = useRef<HTMLElement>(null);
  useGSAP(() => {
    const root = ref.current;
    if (!root) return;
    const reduce = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    gsap.fromTo(root, { autoAlpha: 0, y: 8 }, {
      autoAlpha: 1,
      y: 0,
      duration: 0.32,
      ease: 'power2.out',
      clearProps: 'transform',
    });
    const cards = root.querySelectorAll<HTMLElement>('[data-motion="card"]');
    if (cards.length) {
      gsap.from(cards, {
        autoAlpha: 0,
        y: 12,
        duration: 0.4,
        stagger: 0.04,
        ease: 'power2.out',
        delay: 0.04,
        clearProps: 'transform',
      });
    }
    root.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
      const target = Number(el.dataset.count);
      if (!Number.isFinite(target)) return;
      const format = el.dataset.format === 'money'
        ? (value: number) => money(Math.round(value))
        : (value: number) => num(Math.round(value));
      const proxy = { n: 0 };
      gsap.to(proxy, {
        n: target,
        duration: 0.7,
        ease: 'power1.out',
        onUpdate: () => { el.textContent = format(proxy.n); },
      });
    });
  }, { scope: ref, dependencies: [signature], revertOnUpdate: true });
  return ref;
}
