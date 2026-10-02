import '@fontsource/poppins/400.css';
import '@fontsource/poppins/500.css';
import '@fontsource/poppins/500-italic.css';
import '@fontsource/poppins/600.css';
import './tokens.css';
import './landing.css';

const root = document.documentElement;
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!reduce) {
  root.classList.add('lp-motion');

  // Portada: líneas del título entran una tras otra
  document.querySelectorAll<HTMLElement>('.lp-line').forEach((el, i) => el.style.setProperty('--i', String(i)));
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('lp-ready')));

  // Aparecer al hacer scroll, con escalón entre hermanos
  const items = document.querySelectorAll<HTMLElement>('[data-reveal], [data-reveal-img]');
  items.forEach((el) => {
    const siblings = el.parentElement ? [...el.parentElement.children].filter((c) => c.hasAttribute('data-reveal') || c.hasAttribute('data-reveal-img')) : [];
    el.style.setProperty('--d', `${Math.max(0, siblings.indexOf(el)) * 110}ms`);
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
  items.forEach((el) => io.observe(el));

  // Números que suben
  const counters = document.querySelectorAll<HTMLElement>('[data-count]');
  const co = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      co.unobserve(e.target);
      const el = e.target as HTMLElement;
      const to = Number(el.dataset.count);
      const t0 = performance.now();
      const dur = 1400;
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / dur);
        el.textContent = String(Math.round(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(tick);
      };
      el.textContent = '0';
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.6 });
  counters.forEach((el) => co.observe(el));

  // Parallax suave en fotos
  const par = [...document.querySelectorAll<HTMLElement>('[data-parallax]')];
  let ticking = false;
  const update = () => {
    const vh = window.innerHeight;
    par.forEach((el) => {
      const host = el.parentElement!;
      const r = host.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      const k = Number(el.dataset.parallax);
      const offset = (r.top + r.height / 2 - vh / 2) * k;
      const scale = el.classList.contains('lp-hero__img') ? '' : ' scale(1.12)';
      el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)${scale}`;
    });
    ticking = false;
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
}

// Barra: se esconde al bajar, vuelve al subir (también con movimiento reducido: no anima)
const nav = document.getElementById('nav');
let lastY = window.scrollY;
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  nav?.classList.toggle('is-hidden', y > lastY && y > 160);
  lastY = y;
}, { passive: true });
