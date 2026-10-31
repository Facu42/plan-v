/* ============================================================
   Nutridash — UI helpers (icons, formatting, toasts)
   ============================================================ */
(function () {
  const ND = (window.ND = window.ND || {});

  const P = {
    home: '<path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/>',
    pipeline: '<rect x="3" y="4" width="5" height="16" rx="1.6"/><rect x="10" y="4" width="5" height="10" rx="1.6"/><rect x="17" y="4" width="4" height="13" rx="1.6"/>',
    inbox: '<path d="M4 13h4l2 3h4l2-3h4"/><path d="M6.5 4h11l2.5 9v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5Z"/>',
    users: '<path d="M16 21v-1.5a4.5 4.5 0 0 0-4.5-4.5h-3A4.5 4.5 0 0 0 4 19.5V21"/><circle cx="10" cy="7" r="3.5"/><path d="M17 11.2a3.5 3.5 0 0 0 0-6.4M20 21v-1.5a4.5 4.5 0 0 0-2.6-4.1"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4M17 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01"/>',
    chart: '<path d="M4 20V11M10 20V5M16 20v-6M22 20H2"/>',
    bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>',
    plug: '<path d="M9 2v6M15 2v6"/><path d="M6 8h12v3a6 6 0 0 1-12 0Z"/><path d="M12 17v5"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
    'arrow-right': '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
    'arrow-up-right': '<path d="M7 17 17 7"/><path d="M8 7h9v9"/>',
    'arrow-left': '<path d="M19 12H5"/><path d="m11 18-6-6 6-6"/>',
    'chevron-down': '<path d="m6 9 6 6 6-6"/>',
    'chevron-right': '<path d="m9 18 6-6-6-6"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    check: '<path d="m5 12 4.2 4.2L19 6.5"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.5 2"/>',
    tag: '<path d="M20 12.5 12.5 20a2 2 0 0 1-2.8 0L3 13.3V4h9.3l7.7 7.7a2 2 0 0 1 0 .8Z"/><path d="M7.5 7.5h.01"/>',
    peso: '<circle cx="12" cy="12" r="9"/><path d="M12 6v12M15.5 9.5c0-1.3-1.5-1.9-3.5-1.9s-3.5.7-3.5 2.1c0 2.9 7 1.5 7 4.6 0 1.4-1.6 2.1-3.5 2.1s-3.5-.7-3.5-2"/>',
    sparkle: '<path d="m12 2 1.6 6.4L20 10l-6.4 1.6L12 18l-1.6-6.4L4 10l6.4-1.6L12 2Z"/><path d="m19 16 .6 2.4L22 19l-2.4.6L19 22l-.6-2.4L16 19l2.4-.6L19 16Z"/>',
    send: '<path d="m22 2-8 20-4-8-8-4Z"/><path d="M22 2 11 13"/>',
    more: '<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15"/><path d="M10 11v6M14 11v6"/>',
    filter: '<path d="M3 5h18l-7 8v6l-4 2v-8Z"/>',
    download: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/>',
    instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m3.5 7 7.2 5.2a2.2 2.2 0 0 0 2.6 0L20.5 7"/>',
    whatsapp: '<path d="M21 11.6a8.6 8.6 0 0 1-12.8 7.6L3 21l1.9-5A8.6 8.6 0 1 1 21 11.6Z"/><path d="M8.6 8.4c.3-.6.7-.6 1-.6h.6c.2 0 .4 0 .6.5l.7 1.7c0 .2 0 .4-.2.6l-.5.6c-.2.2-.2.4-.1.6.5.9 1.6 1.9 2.6 2.4.2.1.4.1.6-.1l.6-.7c.2-.2.4-.2.6-.1l1.7.8c.3.1.4.3.4.5 0 .3 0 1-.5 1.4-.5.5-1.3.7-2.2.4-1-.3-2.5-1-3.9-2.3-1.4-1.4-2.1-2.9-2.4-3.9-.3-.9-.1-1.7.3-2.2Z" fill="currentColor" stroke="none"/>',
    web: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.4 3.8 5.5 3.8 9S14.5 18.6 12 21c-2.5-2.4-3.8-5.5-3.8-9S9.5 5.4 12 3Z"/>',
    referral: '<circle cx="9" cy="8" r="3"/><path d="M3 20v-1.5A4.5 4.5 0 0 1 7.5 14h3A4.5 4.5 0 0 1 15 18.5V20"/><path d="M17 8h4M19 6v4"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
    moon: '<path d="M20 15.4A8.3 8.3 0 0 1 8.6 4 8.3 8.3 0 1 0 20 15.4Z"/>',
    grid: '<rect x="4" y="4" width="6" height="6" rx="1.4"/><rect x="14" y="4" width="6" height="6" rx="1.4"/><rect x="4" y="14" width="6" height="6" rx="1.4"/><rect x="14" y="14" width="6" height="6" rx="1.4"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
    video: '<rect x="3" y="6" width="12" height="12" rx="3"/><path d="m15 10 6-3v10l-6-3"/>',
    check_circle: '<circle cx="12" cy="12" r="9"/><path d="m8 12 2.6 2.6L16 9"/>',
    alert: '<path d="M12 3 2.5 20h19L12 3Z"/><path d="M12 9v5M12 17h.01"/>',
    user: '<circle cx="12" cy="8" r="3.5"/><path d="M5 21v-1.5A5.5 5.5 0 0 1 10.5 14h3a5.5 5.5 0 0 1 5.5 5.5V21"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="m15 9 5-5M16 4h4v4"/>',
    trend: '<path d="M4 17 10 11l4 4 6-7"/><path d="M15 8h5v5"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
    eye: '<path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z"/><circle cx="12" cy="12" r="2.7"/>',
    pause: '<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>'
  };

  ND.iconPaths = P;
  ND.icon = function (name, size, cls) {
    const d = P[name] || P.sparkle;
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"${size ? ` width="${size}" height="${size}"` : ''}${cls ? ` class="${cls}"` : ''} aria-hidden="true">${d}</svg>`;
  };

  ND.esc = function (value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };

  ND.money = function (n, compact) {
    if (n == null || Number.isNaN(n)) return '—';
    if (compact && Math.abs(n) >= 1e6) return '$ ' + (n / 1e6).toFixed(n % 1e6 === 0 ? 0 : 1).replace('.', ',') + ' M';
    if (compact && Math.abs(n) >= 1000) return '$ ' + Math.round(n / 1000) + 'k';
    return '$ ' + new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(n);
  };

  ND.num = function (n) {
    return new Intl.NumberFormat('es-AR').format(n == null ? 0 : n);
  };

  const PALETTE = ['#1d7a51', '#5b8fa8', '#b3588f', '#d18b3f', '#6b7f74', '#8a7bb8', '#c05f43', '#3f7d6b'];
  ND.avatarColor = function (name) {
    let h = 0;
    for (let i = 0; i < String(name).length; i++) h = (h * 31 + String(name).charCodeAt(i)) % 997;
    return PALETTE[h % PALETTE.length];
  };
  ND.initials = function (name) {
    return String(name || '?').trim().split(/\s+/).slice(0, 2).map((p) => p[0] || '').join('').toUpperCase();
  };
  ND.avatar = function (name, cls) {
    return `<span class="nd-avatar ${cls || ''}" style="background:${ND.avatarColor(name)}" aria-hidden="true">${ND.esc(ND.initials(name))}</span>`;
  };

  ND.timeAgo = function (iso) {
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return '—';
    const diff = Math.max(0, Date.now() - then);
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'ahora';
    if (m < 60) return `hace ${m} min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `hace ${h} h`;
    const d = Math.floor(h / 24);
    if (d === 1) return 'ayer';
    if (d < 7) return `hace ${d} días`;
    const w = Math.floor(d / 7);
    if (w < 5) return `hace ${w} sem.`;
    return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
  };

  ND.dateShort = function (iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
  };
  ND.dateLong = function (iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  };
  ND.timeOf = function (iso) {
    const d = new Date(iso);
    return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
  };
  ND.isSameDay = function (a, b) {
    const da = new Date(a), db = new Date(b);
    return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
  };

  ND.sourceMeta = {
    instagram: { label: 'Instagram', icon: 'instagram', cls: 'is-instagram' },
    email: { label: 'Email', icon: 'mail', cls: 'is-email' },
    whatsapp: { label: 'WhatsApp', icon: 'whatsapp', cls: 'is-whatsapp' },
    web: { label: 'Web', icon: 'web', cls: 'is-web' },
    referral: { label: 'Recomendación', icon: 'referral', cls: 'is-referral' }
  };
  ND.srcIcon = function (source, size) {
    const m = ND.sourceMeta[source] || ND.sourceMeta.web;
    return `<span class="nd-src ${m.cls}" title="${m.label}"${size ? ` style="width:${size}px;height:${size}px"` : ''}>${ND.icon(m.icon)}</span>`;
  };

  ND.stageMeta = {
    nuevo: { label: 'Nuevas', color: '#eeb04a', badge: 'is-gold' },
    contactado: { label: 'Contactadas', color: '#f0a26d', badge: 'is-gold' },
    conversando: { label: 'Conversando', color: '#c2e66e', badge: 'is-green' },
    consulta: { label: 'Consulta agendada', color: '#5b8fa8', badge: 'is-sky' },
    propuesta: { label: 'Plan propuesto', color: '#8a7bb8', badge: 'is-violet' },
    ganada: { label: 'Clientas', color: '#23955d', badge: 'is-green' },
    pausa: { label: 'En pausa', color: '#a9b1aa', badge: '' }
  };
  ND.stageOrder = ['nuevo', 'contactado', 'conversando', 'consulta', 'propuesta', 'ganada', 'pausa'];

  ND.toast = function (message, icon) {
    const root = document.getElementById('toast-root');
    if (!root) return;
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `${ND.icon(icon || 'check_circle')}<span>${ND.esc(message)}</span>`;
    root.appendChild(el);
    if (ND.motion) ND.motion.toastIn(el);
    setTimeout(() => {
      if (ND.motion) {
        ND.motion.toastOut(el, () => el.remove());
      } else {
        el.classList.add('is-out');
        setTimeout(() => el.remove(), 260);
      }
    }, 3200);
  };

  ND.optionList = function (map, selected) {
    return Object.keys(map).map((k) => `<option value="${k}"${k === selected ? ' selected' : ''}>${ND.esc(map[k].label || map[k])}</option>`).join('');
  };
})();
