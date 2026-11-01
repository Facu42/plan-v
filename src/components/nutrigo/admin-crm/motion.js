/* ============================================================
   Nutridash — movimiento (GSAP + Flip)
   Todo el movimiento vive acá: entrada de vistas, hover de
   tarjetas, traspaso de tarjetas en el pipeline, gráficos,
   overlays y toasts. Respeta prefers-reduced-motion.
   ============================================================ */
(function () {
  const ND = (window.ND = window.ND || {});
  const gsap = window.gsap;
  const Flip = window.Flip;

  const query = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  let reduced = !!(query && query.matches);
  if (query) {
    if (query.addEventListener) query.addEventListener('change', (ev) => { reduced = ev.matches; });
    else if (query.addListener) query.addListener((ev) => { reduced = ev.matches; });
  }

  const EASE = 'power3.out';
  const HOVER = '.lead-card, .kpi, .conn-card, .agenda-event';
  const SHIFT = '.nd-nav-item, .nd-chip';

  /* Si GSAP no cargó, la app sigue funcionando sin animaciones. */
  if (!gsap) {
    ND.motion = {
      ready: false,
      reduced: () => reduced,
      enterView() {},
      enterOverlay() {},
      boot() {},
      toastIn() {},
      toastOut(el, done) { if (done) done(); },
      captureBoard() { return null; },
      playBoard() {},
      bump() {},
      release() {}
    };
    return;
  }

  gsap.defaults({ ease: EASE, duration: 0.45 });
  if (Flip) gsap.registerPlugin(Flip);

  const M = (ND.motion = { ready: true, reduced: () => reduced });

  function pick(root, selector) {
    return root ? Array.from(root.querySelectorAll(selector)) : [];
  }

  /* ---------------- entrada de vista ----------------
     Anima los bloques de primer nivel, el tablero por
     columnas y las tarjetas del pipeline. */
  M.enterView = function (view) {
    const el = view || document.getElementById('view');
    if (!el || reduced) return;

    const blocks = Array.from(el.children).filter((node) => !node.classList.contains('board-wrap'));
    if (blocks.length) {
      gsap.fromTo(blocks, { y: 16, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.55, stagger: 0.05, overwrite: true,
        clearProps: 'transform,opacity'
      });
    }

    const board = el.querySelector('.board');
    if (board) {
      gsap.fromTo(Array.from(board.children), { y: 18, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.5, stagger: 0.04, delay: 0.04,
        clearProps: 'transform,opacity'
      });
      const cards = pick(board, '.lead-card');
      if (cards.length) {
        gsap.fromTo(cards, { y: 10, opacity: 0, scale: 0.985 }, {
          y: 0, opacity: 1, scale: 1, duration: 0.4, stagger: 0.018, delay: 0.1,
          clearProps: 'transform,opacity'
        });
      }
    }

    M.animateCharts(el);
  };

  /* ---------------- gráficos ---------------- */
  M.animateCharts = function (root) {
    if (reduced) return;
    const svgs = pick(root, 'svg[role="img"], .kpi-spark svg');
    svgs.forEach((svg) => {
      /* donut: los segmentos usan stroke-dasharray propio */
      const donut = svg.querySelector('circle[stroke-dasharray]');
      if (donut) {
        gsap.fromTo(svg, { opacity: 0, scale: 0.94, transformOrigin: '50% 50%' }, {
          opacity: 1, scale: 1, duration: 0.6, ease: 'power2.out', clearProps: 'transform,opacity'
        });
        const rings = Array.from(svg.querySelectorAll('circle'))
          .filter((c) => c.hasAttribute('stroke-dasharray'));
        if (rings.length) {
          gsap.fromTo(rings, { opacity: 0 }, { opacity: 1, duration: 0.5, stagger: 0.06, delay: 0.08 });
        }
        return;
      }

      /* barras */
      const bars = Array.from(svg.querySelectorAll('rect'));
      if (bars.length) {
        gsap.fromTo(bars, { scaleY: 0, transformOrigin: '50% 100%' }, {
          scaleY: 1, duration: 0.62, stagger: 0.05, ease: 'power3.out',
          clearProps: 'transform'
        });
      }

      /* líneas: se dibujan */
      Array.from(svg.querySelectorAll('path[stroke]')).forEach((path, i) => {
        if (path.getAttribute('fill') !== 'none') return;
        if (path.hasAttribute('stroke-dasharray')) return;
        let len = 0;
        try { len = path.getTotalLength(); } catch { len = 0; }
        if (!len) return;
        gsap.fromTo(path, { strokeDasharray: len, strokeDashoffset: len }, {
          strokeDashoffset: 0, duration: 1.05, delay: 0.06 * i, ease: 'power2.inOut',
          clearProps: 'strokeDasharray,strokeDashoffset'
        });
      });

      /* área: aparece */
      const areas = Array.from(svg.querySelectorAll('path[fill^="url("]'));
      if (areas.length) {
        gsap.fromTo(areas, { opacity: 0 }, { opacity: 1, duration: 0.8, delay: 0.15 });
      }

      /* puntos */
      const dots = Array.from(svg.querySelectorAll('circle'));
      if (dots.length && dots.length <= 40) {
        gsap.fromTo(dots, { opacity: 0, scale: 0, transformOrigin: '50% 50%' }, {
          opacity: 1, scale: 1, duration: 0.3, stagger: 0.025, delay: 0.4,
          clearProps: 'transform,opacity'
        });
      }
    });

    /* barras horizontales de canales */
    pick(root, '.channel-bar span').forEach((bar, i) => {
      gsap.fromTo(bar, { scaleX: 0, transformOrigin: '0% 50%' }, {
        scaleX: 1, duration: 0.7, delay: 0.1 + i * 0.05, ease: 'power3.out',
        clearProps: 'transform'
      });
    });
  };

  /* ---------------- overlay ----------------
     Drawer entra desde la derecha; modal y paleta escalan
     con su centrado nativo (xPercent/yPercent). */
  M.enterOverlay = function () {
    const root = document.getElementById('overlay-root');
    if (!root) return;
    const back = root.querySelector('.nd-overlay');
    const panel = root.querySelector('.drawer, .modal, .palette');
    if (reduced) return;

    if (back) {
      gsap.fromTo(back, { opacity: 0 }, { opacity: 1, duration: 0.24, ease: 'power1.out', clearProps: 'opacity' });
    }
    if (!panel) return;

    panel.style.animation = 'none';
    let rows = [];

    if (panel.classList.contains('drawer')) {
      gsap.fromTo(panel, { x: 38, opacity: 0.5 }, {
        x: 0, opacity: 1, duration: 0.42, ease: EASE, clearProps: 'transform,opacity'
      });
      rows = pick(panel, '.drawer-body > *');
    } else if (panel.classList.contains('palette')) {
      gsap.fromTo(panel,
        { xPercent: -50, y: -10, scale: 0.98, opacity: 0 },
        { xPercent: -50, y: 0, scale: 1, opacity: 1, duration: 0.28, ease: EASE, clearProps: 'transform,opacity' });
      rows = pick(panel, '.palette-results > *');
    } else {
      gsap.fromTo(panel,
        { xPercent: -50, yPercent: -50, y: -14, scale: 0.975, opacity: 0 },
        { xPercent: -50, yPercent: -50, y: 0, scale: 1, opacity: 1, duration: 0.32, ease: EASE, clearProps: 'transform,opacity' });
      rows = pick(panel, '.modal-body > *');
    }

    if (rows.length) {
      gsap.fromTo(rows, { y: 9, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.36, stagger: 0.028, delay: 0.07,
        clearProps: 'transform,opacity'
      });
    }
  };

  /* ---------------- shell ---------------- */
  M.boot = function () {
    if (reduced) return;
    const brand = document.querySelector('.nd-brand');
    const nav = document.querySelectorAll('.nd-nav-item');
    const top = document.getElementById('topbar');
    if (brand) gsap.fromTo(brand, { opacity: 0, x: -8 }, { opacity: 1, x: 0, duration: 0.5, clearProps: 'transform,opacity' });
    if (nav.length) {
      gsap.fromTo(nav, { opacity: 0, x: -10 }, {
        opacity: 1, x: 0, duration: 0.4, stagger: 0.03, delay: 0.06,
        clearProps: 'transform,opacity'
      });
    }
    if (top) gsap.fromTo(top, { opacity: 0, y: -6 }, { opacity: 1, y: 0, duration: 0.45, clearProps: 'transform,opacity' });
  };

  /* ---------------- toasts ---------------- */
  M.toastIn = function (el) {
    if (!el) return;
    el.style.animation = 'none';
    if (reduced) return;
    gsap.fromTo(el, { y: 14, opacity: 0, scale: 0.97 }, {
      y: 0, opacity: 1, scale: 1, duration: 0.34, ease: EASE,
      clearProps: 'transform,opacity'
    });
  };

  M.toastOut = function (el, done) {
    if (!el) { if (done) done(); return; }
    if (reduced) { if (done) done(); return; }
    gsap.to(el, {
      y: 8, opacity: 0, scale: 0.98, duration: 0.22, ease: 'power2.in',
      onComplete() { if (done) done(); }
    });
  };

  /* ---------------- pipeline (Flip) ---------------- */
  M.captureBoard = function () {
    if (!Flip || reduced) return null;
    const cards = document.querySelectorAll('#pipeline-board .lead-card');
    if (!cards.length) return null;
    gsap.killTweensOf(cards);
    gsap.set(cards, { clearProps: 'transform' });
    try {
      return Flip.getState(Array.from(cards), { props: 'opacity' });
    } catch (err) {
      return null;
    }
  };

  M.playBoard = function (state) {
    if (!state || !Flip || reduced) return;
    try {
      Flip.from(state, {
        targets: '#pipeline-board .lead-card',
        duration: 0.58,
        ease: 'power3.inOut',
        absolute: false,
        scale: true,
        onEnter(elements) {
          gsap.fromTo(elements, { opacity: 0, y: -8, scale: 0.9 }, {
            opacity: 1, y: 0, scale: 1, duration: 0.4, ease: 'back.out(2)'
          });
        },
        onLeave(elements) {
          gsap.to(elements, { opacity: 0, scale: 0.92, duration: 0.2, ease: 'power1.in' });
        },
        onComplete() {
          gsap.set('#pipeline-board .lead-card', { clearProps: 'transform,opacity' });
        }
      });
    } catch (err) { /* sin animación, el estado ya cambió */ }
  };

  /* Pulso para el contador de la columna destino. */
  M.bump = function (selector) {
    if (reduced) return;
    const els = document.querySelectorAll(selector);
    if (!els.length) return;
    gsap.fromTo(els, { scale: 0.75 }, { scale: 1, duration: 0.5, ease: 'back.out(3)', clearProps: 'transform' });
  };

  /* Suelta una tarjeta antes de arrastrarla (el transform de
     GSAP no debe pelear con .is-dragging). */
  M.release = function (el) {
    if (!el) return;
    gsap.killTweensOf(el);
    gsap.set(el, { clearProps: 'transform' });
  };

  /* ---------------- hover ----------------
     Delegado en el documento: funciona con las vistas que se
     vuelven a renderizar. */
  document.addEventListener('pointerover', (ev) => {
    if (ND.off) return;
    if (reduced) return;
    const target = ev.target instanceof Element ? ev.target : null;
    if (!target) return;

    const card = target.closest(HOVER);
    if (card && !card.contains(ev.relatedTarget) && !card.classList.contains('is-dragging')) {
      gsap.to(card, { y: -3, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
    }
    const item = target.closest(SHIFT);
    if (item && !item.contains(ev.relatedTarget)) {
      gsap.to(item, { x: 2, duration: 0.24, ease: 'power2.out', overwrite: 'auto' });
    }
  });

  document.addEventListener('pointerout', (ev) => {
    if (ND.off) return;
    if (reduced) return;
    const target = ev.target instanceof Element ? ev.target : null;
    if (!target) return;

    const card = target.closest(HOVER);
    if (card && !card.contains(ev.relatedTarget)) {
      gsap.to(card, { y: 0, duration: 0.34, ease: 'power2.out', overwrite: 'auto' });
    }
    const item = target.closest(SHIFT);
    if (item && !item.contains(ev.relatedTarget)) {
      gsap.to(item, { x: 0, duration: 0.28, ease: 'power2.out', overwrite: 'auto' });
    }
  });
})();
