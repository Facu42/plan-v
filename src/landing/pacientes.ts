import '@fontsource/poppins/400.css';
import '@fontsource/poppins/500.css';
import '@fontsource/poppins/500-italic.css';
import '@fontsource/poppins/600.css';
import './tokens.css';
import './pacientes.css';

const root = document.documentElement;
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

if (!reduce) {
  root.classList.add('pv-motion');

  // Aparecer al bajar, con escalón entre hermanos
  const items = document.querySelectorAll<HTMLElement>('[data-reveal]');
  items.forEach((el) => {
    const siblings = el.parentElement ? [...el.parentElement.children].filter((c) => c.hasAttribute('data-reveal')) : [];
    el.style.setProperty('--d', `${Math.min(5, Math.max(0, siblings.indexOf(el))) * 90}ms`);
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  items.forEach((el) => io.observe(el));

  const hero = document.getElementById('zoom');
  const hs = document.getElementById('beneficios');
  const track = hs?.querySelector<HTMLElement>('.pv-hs__track');
  const viewport = hs?.querySelector<HTMLElement>('.pv-hs__viewport');
  const heroObjs = [...document.querySelectorAll<HTMLElement>('.pv-obj[data-hero]')];
  const sideObjs = [...document.querySelectorAll<HTMLElement>('.pv-obj:not([data-hero])')];
  let hsMax = 0;

  // La sección horizontal mide tanto como lo que tiene que recorrer la fila de tarjetas
  const measure = () => {
    if (!hs || !track || !viewport) return;
    hsMax = Math.max(0, track.scrollWidth - viewport.clientWidth);
    hs.style.height = `${window.innerHeight + hsMax}px`;
  };

  // Progreso de la portada suavizado (se acerca al valor real de a poco, como un resorte)
  let heroTarget = 0;
  let heroNow = 0;
  let pending = false;
  // Cuadro siguiente: requestAnimationFrame, con un respaldo por si el navegador lo frena
  const schedule = () => {
    if (pending) return;
    pending = true;
    const run = () => { if (!pending) return; pending = false; frame(); };
    requestAnimationFrame(run);
    window.setTimeout(run, 40);
  };

  const read = () => {
    const vh = window.innerHeight;
    if (hero) {
      const r = hero.getBoundingClientRect();
      const total = r.height - vh;
      heroTarget = total > 0 ? clamp01(-r.top / total) : 0;
    }
    if (hs && hsMax > 0) {
      const r = hs.getBoundingClientRect();
      const p = clamp01(-r.top / (r.height - vh));
      hs.style.setProperty('--x', `${(-p * hsMax).toFixed(1)}px`);
      hs.style.setProperty('--hp', p.toFixed(4));
    }
    sideObjs.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      const k = Number(el.dataset.depth || 0.6);
      const off = (r.top + r.height / 2 - vh / 2) * k;
      el.style.transform = `translate3d(0, ${(-off * 0.35).toFixed(1)}px, 0) rotate(${(off * 0.04).toFixed(2)}deg)`;
    });
  };

  function frame() {
    heroNow += (heroTarget - heroNow) * 0.12;
    if (Math.abs(heroTarget - heroNow) < 0.0005) heroNow = heroTarget;
    if (hero) {
      hero.style.setProperty('--p', heroNow.toFixed(4));
      const vh = window.innerHeight;
      heroObjs.forEach((el, i) => {
        const k = Number(el.dataset.depth || 1);
        const dir = i % 2 ? 1 : -1;
        el.style.transform = `translate3d(${(dir * heroNow * k * 6).toFixed(2)}vw, ${(-heroNow * k * vh * 0.55).toFixed(1)}px, 0) rotate(${(dir * heroNow * k * 70).toFixed(1)}deg) scale(${(1 + heroNow * k * 0.35).toFixed(3)})`;
      });
    }
    if (heroNow !== heroTarget) schedule();
  }

  const onScroll = () => {
    read();
    schedule();
  };
  const onResize = () => { measure(); onScroll(); };

  measure();
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);
  window.addEventListener('load', onResize);
  track?.querySelectorAll('img').forEach((img) => img.addEventListener('load', onResize, { once: true }));
}

// Barra: se esconde al bajar y vuelve al subir
const nav = document.getElementById('nav');
let lastY = window.scrollY;
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  nav?.classList.toggle('is-hidden', y > lastY && y > 200);
  lastY = y;
}, { passive: true });
