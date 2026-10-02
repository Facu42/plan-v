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

  const zoom = document.getElementById('zoom');
  const hs = document.getElementById('beneficios');
  const track = hs?.querySelector<HTMLElement>('.pv-hs__track');
  const viewport = hs?.querySelector<HTMLElement>('.pv-hs__viewport');
  let hsMax = 0;

  // La sección horizontal mide tanto como lo que tiene que recorrer la fila de tarjetas
  const measure = () => {
    if (!hs || !track || !viewport) return;
    hsMax = Math.max(0, track.scrollWidth - viewport.clientWidth);
    hs.style.height = `${window.innerHeight + hsMax}px`;
  };

  let ticking = false;
  const update = () => {
    ticking = false;
    const vh = window.innerHeight;
    if (zoom) {
      const r = zoom.getBoundingClientRect();
      const total = r.height - vh;
      zoom.style.setProperty('--p', total > 0 ? clamp01(-r.top / total).toFixed(4) : '0');
    }
    if (hs && hsMax > 0) {
      const r = hs.getBoundingClientRect();
      const p = clamp01(-r.top / (r.height - vh));
      hs.style.setProperty('--x', `${(-p * hsMax).toFixed(1)}px`);
      hs.style.setProperty('--hp', p.toFixed(4));
    }
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  const onResize = () => { measure(); onScroll(); };

  measure();
  update();
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
