/* ============================================================
   Nutridash — shell, router, interacciones
   ============================================================ */
(function () {
  const ND = window.ND;
  const V = ND.views;
  const ui = ND.ui;
  const I = ND.icon;
  const e = ND.esc;

  const NAV = [
    { group: 'Trabajo', items: [
      { id: 'resumen', label: 'Resumen', icon: 'home' },
      { id: 'pipeline', label: 'Pipeline', icon: 'pipeline', count: () => ND.state.leads.filter((l) => !['ganada', 'pausa'].includes(l.stage)).length },
      { id: 'bandeja', label: 'Bandeja', icon: 'inbox', count: () => ND.metrics().unread, hot: () => ND.metrics().unread > 0 }
    ] },
    { group: 'Clientas', items: [
      { id: 'clientas', label: 'Clientas', icon: 'users', count: () => ND.metrics().active },
      { id: 'agenda', label: 'Agenda', icon: 'calendar', count: () => ND.state.appointments.filter((a) => ND.isSameDay(a.time, new Date())).length }
    ] },
    { group: 'Crecimiento', items: [
      { id: 'analitica', label: 'Analítica', icon: 'chart' },
      { id: 'automatizaciones', label: 'Automatizaciones', icon: 'bolt' }
    ] },
    { group: 'Sistema', items: [
      { id: 'servicio', label: 'Panel del servicio', icon: 'users' },
      { id: 'conexiones', label: 'Conexiones', icon: 'plug' }
    ] }
  ];

  const TITLES = {
    resumen: ['Centro de mando', 'Resumen'],
    pipeline: ['Comercial', 'Pipeline'],
    bandeja: ['Conversaciones', 'Bandeja'],
    clientas: ['Cartera', 'Clientas'],
    agenda: ['Turnos', 'Agenda'],
    analitica: ['Crecimiento', 'Analítica'],
    automatizaciones: ['Productividad', 'Automatizaciones'],
    conexiones: ['Integraciones', 'Conexiones'],
    servicio: ['Administración', 'Panel del servicio']
  };

  const conns = () => Object.keys(ND.state.connections).map((k) => ND.state.connections[k]);

  /* ---------------- shell ---------------- */
  function renderSidebar() {
    if (ND.off || !document.getElementById('sidebar')) return;
    const m = ND.metrics();
    const who = (ND.who = ND.who || { name: 'Verónica Trenti', role: 'Nutricionista · Plan V' });
    const html = `
      <div class="nd-brand">
        <img class="nd-brand-logo" src="/nutridash-logo.png" alt="Logo Nutridash" width="42" height="42">
        <div class="nd-brand-text">
          <div class="nd-brand-name">Nutri<em>dash</em></div>
          <div class="nd-brand-sub">Plan V · Centro de mando</div>
        </div>
      </div>
      <nav class="nd-nav">
        ${NAV.map((g) => `<div class="nd-nav-label">${g.group}</div>${g.items.map((it) => {
          const count = it.count ? it.count() : 0;
          return `<button class="nd-nav-item ${ui.view === it.id ? 'is-active' : ''}" data-view="${it.id}" ${ui.view === it.id ? 'aria-current="page"' : ''}>
            ${I(it.icon)}<span>${it.label}</span>${count ? `<span class="nd-nav-count ${it.hot && it.hot() ? 'is-hot' : ''}">${count}</span>` : ''}
          </button>`;
        }).join('')}`).join('')}
      </nav>
      <div class="nd-side-foot">
        <div class="nd-conn-mini">
          <div class="nd-conn-mini-head"><span>Canales</span><span class="nd-conn-dots">${conns().map((c) => `<span class="nd-conn-dot ${c.connected ? '' : 'is-off'}" title="${c.name}: ${c.connected ? 'conectado' : 'sin conectar'}"></span>`).join('')}</span></div>
          <div class="nd-conn-mini-row">${I('plug')}<span>${conns().filter((c) => c.connected).length} de ${conns().length} conectados</span><button class="nd-tiny" data-view="conexiones" style="margin-left:auto;color:var(--lime);font-weight:600">Ver</button></div>
        </div>
        <div class="nd-user">
          <span class="nd-avatar" aria-hidden="true">${e(ND.initials(who.name))}</span>
          <div class="nd-grow"><div class="nd-user-name">${e(who.name)}</div><div class="nd-user-role">${e(who.role)}</div></div>
          <button class="nd-user-more" data-action="user-menu" aria-label="Opciones de cuenta">${I('more', 16)}</button>
        </div>
      </div>`;
    document.getElementById('sidebar').innerHTML = html;
  }

  function renderTopbar() {
    const [kicker, title] = TITLES[ui.view] || TITLES.resumen;
    const m = ND.metrics();
    const who = (ND.who = ND.who || { name: 'Verónica Trenti', role: 'Nutricionista · Plan V' });
    const topbarEl = document.getElementById('topbar');
    if (!topbarEl) return;

    topbarEl.innerHTML = `
      <button class="nd-icon-btn nd-menu-btn" data-action="toggle-sidebar" aria-label="Abrir menú">${I('menu')}</button>
      <div class="nd-crumb">
        <span class="nd-crumb-kicker">${kicker}</span>
        <span class="nd-crumb-title">${title}</span>
        ${ui.view === 'servicio' ? '<span class="nd-badge" title="Datos reales del servicio">Datos reales</span>' : '<span class="nd-badge is-gold" title="Las personas y cifras de esta pantalla vienen de la demo">Datos de ejemplo</span>'}
      </div>
      <div class="nd-top-actions">
        <button class="nd-search" data-action="open-palette" aria-label="Buscar">${I('search')}<span>Buscar en Nutridash…</span><kbd>⌘K</kbd></button>
        <button class="nd-icon-btn" data-action="notifications" aria-label="Notificaciones">${I('bell')}${m.unread ? '<span class="nd-dot-badge"></span>' : ''}</button>
        <button class="nd-btn is-primary" data-action="new-lead">${I('plus')}<span class="nd-only-wide">Nueva consulta</span></button>
        <button class="nd-avatar" data-action="user-menu" style="width:38px;height:38px;border:0;background:var(--deep);color:var(--cream);font-size:12px" aria-label="Cuenta">${e(ND.initials(who.name))}</button>
      </div>`;
  }

  /* ---------------- router ---------------- */
  function render(opts) {
    if (ND.off) return;
    if (!V[ui.view]) ui.view = 'resumen';
    renderSidebar();
    renderTopbar();
    const el = document.getElementById('view');
    el.innerHTML = V[ui.view]();
    if (!opts || opts.animate !== false) ND.motion.enterView(el);
    document.getElementById('sidebar').classList.remove('is-open');
    if (ui.view === 'bandeja') {
      const body = document.getElementById('thread-body');
      if (body) body.scrollTop = body.scrollHeight;
    }
    try {
      const hash = '#/' + ui.view;
      if (window.location.hash !== hash) window.history.replaceState(null, '', hash);
    } catch (err) { /* file:// */ }
  }

  ND.go = function (view, opts) {
    opts = opts || {};
    if (opts.conv) ui.inboxConv = opts.conv;
    ui.view = view;
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ---------------- overlays ---------------- */
  ND.overlay = null;

  function overlayHtml() {
    const o = ND.overlay;
    if (!o) return '';
    if (o.type === 'lead') return V.drawerLead(o.id);
    if (o.type === 'client') return V.drawerClient(o.id);
    if (o.type === 'new-lead') return V.modalNewLead();
    if (o.type === 'new-client') return V.modalNewClient();
    if (o.type === 'appointment') return V.modalAppointment(o.preset);
    if (o.type === 'connect') return V.modalConnect(o.id);
    if (o.type === 'whatsapp') return V.modalWhatsApp();
    if (o.type === 'new-automation') return V.modalNewAutomation();
    if (o.type === 'palette') return V.palette(ui.paletteQuery || '');
    return '';
  }

  function renderOverlay(animate) {
    const root = document.getElementById('overlay-root');
    if (!ND.overlay) {
      root.innerHTML = '';
      document.body.style.overflow = '';
      return;
    }
    root.innerHTML = `<div class="nd-overlay"></div>${overlayHtml()}`;
    document.body.style.overflow = 'hidden';
    if (ND.overlay.type === 'palette') {
      const input = document.getElementById('palette-input');
      if (input) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    }
    if (animate && ND.motion) ND.motion.enterOverlay();
    if (ND.overlay.type === 'whatsapp' && ND.wa) {
      ND.wa.paint();
      ND.wa.startPolling();
    }
  }

  ND.rerenderOverlay = renderOverlay;
  ND.refreshChrome = () => { renderSidebar(); renderTopbar(); };

  function openOverlay(desc) {
    ND.overlay = desc;
    renderOverlay(true);
  }
  function closeOverlay() {
    ND.overlay = null;
    renderOverlay();
  }
  ND.closeOverlay = closeOverlay;

  /* WhatsApp real vía OpenWA: al abrir, se consulta el gateway y se
     crea/arranca la sesión si hace falta. */
  ND.openWhatsApp = function () {
    openOverlay({ type: 'whatsapp' });
    if (!ND.wa) return;
    ND.wa.refresh().then(async () => {
      renderOverlay();
      if (ND.wa.state.gateway !== 'online') return;
      try {
        if (!ND.wa.state.session || (!ND.wa.isReady() && !ND.wa.needsQr())) await ND.wa.connect();
        if (ND.wa.needsQr() && !ND.wa.state.qr) await ND.wa.loadQr();
      } catch (err) {
        ND.toast('OpenWA: ' + err.message, 'alert');
      }
      renderOverlay();
    }).catch(() => {});
  };

  /* ---------------- inline handlers ---------------- */
  ND.setPipeQuery = (v) => { ui.pipeQuery = v; render(); focusById('pipe-search'); };
  ND.setInboxQuery = (v) => { ui.inboxQuery = v; render(); focusById('inbox-search'); };
  ND.setClientQuery = (v) => { ui.clientQuery = v; render(); focusById('client-search'); };
  ND.setPalette = (v) => { ui.paletteQuery = v; renderOverlay(); };

  function focusById(id) {
    const el = document.getElementById(id);
    if (el) { el.focus(); el.setSelectionRange && el.setSelectionRange(el.value.length, el.value.length); }
  }

  ND.changeStage = function (leadId, stage) {
    if (ND.moveLead(leadId, stage)) {
      ND.toast('Consulta movida a ' + ND.stageMeta[stage].label, 'check_circle');
      renderOverlay();
      render();
    }
  };

  ND.completeTask = function (leadId, taskId) {
    ND.toggleTask(leadId, taskId);
    renderOverlay();
  };

  ND.addTaskTo = function (leadId, text) {
    if (!text || !text.trim()) return;
    ND.addTask(leadId, text);
    renderOverlay();
    ND.toast('Tarea agregada', 'check_circle');
  };

  ND.addClientNote = function (clientId, text) {
    if (!text || !text.trim()) return;
    const c = ND.client(clientId);
    if (!c) return;
    c.notes = c.notes || [];
    c.notes.push(text.trim());
    ND.save();
    renderOverlay();
    ND.toast('Nota guardada', 'edit');
  };

  ND.openLead = (id) => openOverlay({ type: 'lead', id });
  ND.openClient = (id) => openOverlay({ type: 'client', id });

  /* ---------------- actions ---------------- */
  const actions = {
    'focus-pipe': () => focusById('pipe-search'),
    'toggle-sidebar': () => document.getElementById('sidebar').classList.toggle('is-open'),
    'open-palette': () => { ui.paletteQuery = ''; openOverlay({ type: 'palette' }); },
    'close-overlay': closeOverlay,
    'new-lead': () => openOverlay({ type: 'new-lead' }),
    'new-client': () => openOverlay({ type: 'new-client' }),
    'new-appointment': (el) => openOverlay({ type: 'appointment', preset: { name: el.dataset.name, clientId: el.dataset.client, leadId: el.dataset.lead } }),
    'new-automation': () => openOverlay({ type: 'new-automation' }),
    'open-lead': (el) => ND.openLead(el.dataset.lead),
    'open-client': (el) => ND.openClient(el.dataset.client),
    'open-conv': (el) => {
      ND.markRead(el.dataset.conv);
      closeOverlay();
      ND.go('bandeja', { conv: el.dataset.conv });
    },
    'pipe-source': (el) => { ui.pipeSource = el.dataset.source; render(); },
    'client-filter': (el) => { ui.clientFilter = el.dataset.filter; render(); },
    'period': (el) => { ui.analyticsPeriod = el.dataset.period; render(); },
    'inbox-channel': (el) => {
      ui.inboxChannel = el.dataset.channel;
      const first = ND.state.conversations.filter((c) => ui.inboxChannel === 'all' || c.channel === ui.inboxChannel)[0];
      if (first) ui.inboxConv = first.id;
      render();
    },
    'agenda-prev': () => { ui.agendaOffset -= 1; render(); },
    'agenda-next': () => { ui.agendaOffset += 1; render(); },
    'agenda-today': () => { ui.agendaOffset = 0; render(); },
    'open-appt': (el) => {
      const a = ND.state.appointments.find((x) => x.id === el.dataset.appt);
      if (a) ND.toast(`${a.name} · ${ND.dateShort(a.time)} ${ND.timeOf(a.time)} · ${a.type}`, 'calendar');
    },
    'toggle-automation': (el) => {
      ND.toggleAutomation(el.dataset.rule);
      const rule = ND.state.automations.find((a) => a.id === el.dataset.rule);
      ND.toast(rule.on ? 'Regla activada' : 'Regla pausada', rule.on ? 'bolt' : 'pause');
      render();
    },
    'convert-lead': (el) => {
      const client = ND.convertLead(el.dataset.lead);
      closeOverlay();
      render();
      if (client) ND.toast('¡Se convirtió en clienta!', 'check_circle');
    },
    'add-note': (el) => {
      const input = document.getElementById('note-input');
      ND.addNote(el.dataset.lead, input ? input.value : '');
      if (input) input.value = '';
      renderOverlay();
      ND.toast('Nota agregada a la ficha', 'edit');
    },
    'quick-reply': (el) => {
      const input = document.getElementById('composer-input');
      if (input) { input.value = el.dataset.text; input.focus(); autoGrow(input); }
    },
    'send-message': () => {
      const input = document.getElementById('composer-input');
      if (!input || !input.value.trim()) return;
      const conv = ND.conversation(ui.inboxConv);
      ND.sendMessage(ui.inboxConv, input.value);
      render();
      if (conv) ND.toast('Mensaje enviado a ' + conv.name, 'send');
    },
    'sync-all': async () => {
      conns().filter((c) => c.connected).forEach((c) => ND.syncConnection(c.id));
      if (ND.wa && ND.wa.isReady()) {
        try { await ND.wa.sync(); } catch (err) { /* se avisa abajo */ }
      }
      render();
      ND.toast('Canales sincronizados', 'refresh');
    },
    'sync-one': (el) => {
      ND.syncConnection(el.dataset.conn);
      render();
      ND.toast(ND.state.connections[el.dataset.conn].name + ' sincronizado', 'refresh');
    },
    'connect': (el) => {
      if (el.dataset.conn === 'whatsapp' && ND.wa) { ND.openWhatsApp(); return; }
      openOverlay({ type: 'connect', id: el.dataset.conn });
    },
    'confirm-connect': (el) => {
      ND.setConnection(el.dataset.conn, true);
      closeOverlay();
      render();
      ND.toast(ND.state.connections[el.dataset.conn].name + ' conectado', 'plug');
    },
    'disconnect': (el) => {
      const c = ND.state.connections[el.dataset.conn];
      ND.setConnection(el.dataset.conn, false);
      render();
      ND.toast(c.name + ' desconectado', 'x');
    },
    'wa-refresh': async () => {
      if (!ND.wa) return;
      await ND.wa.refresh();
      if (ND.wa.state.gateway === 'online' && !ND.wa.isReady() && !ND.wa.needsQr()) {
        try { await ND.wa.connect(); } catch (err) { ND.toast('OpenWA: ' + err.message, 'alert'); }
      }
      renderOverlay();
    },
    'wa-connect': async () => {
      if (!ND.wa) return;
      try {
        await ND.wa.connect();
        if (ND.wa.needsQr()) await ND.wa.loadQr();
        renderOverlay();
        ND.toast('Sesión de OpenWA iniciada', 'whatsapp');
      } catch (err) {
        ND.toast('OpenWA: ' + err.message, 'alert');
        renderOverlay();
      }
    },
    'wa-qr': async () => {
      if (!ND.wa) return;
      await ND.wa.loadQr();
      ND.wa.paint();
    },
    'wa-sync': async () => {
      if (!ND.wa) return;
      try {
        const data = await ND.wa.sync();
        render();
        renderOverlay();
        ND.toast(`WhatsApp: ${data.synced} chats · ${data.unread} sin leer`, 'refresh');
      } catch (err) {
        ND.toast('OpenWA: ' + err.message, 'alert');
      }
    },
    'wa-disconnect': async () => {
      if (!ND.wa) return;
      try {
        await ND.wa.disconnect();
        renderOverlay();
        render();
        ND.toast('WhatsApp desconectado de OpenWA', 'x');
      } catch (err) {
        ND.toast('OpenWA: ' + err.message, 'alert');
      }
    },
    'wa-demo': () => {
      if (ND.wa) ND.wa.useDemo();
      ND.setConnection('whatsapp', true);
      closeOverlay();
      render();
      ND.toast('WhatsApp en modo demo (sin OpenWA)', 'plug');
    },
    'copy-cmd': (el) => {
      const text = el.dataset.text || '';
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
          .then(() => ND.toast('Comando copiado', 'copy'))
          .catch(() => ND.toast('Copiá el comando a mano', 'alert'));
      } else {
        ND.toast('Copiá el comando a mano', 'alert');
      }
    },
    'reset-demo': () => {
      if (!window.confirm('¿Reiniciar los datos demo? Se pierden los cambios de este navegador.')) return;
      ND.resetDemo();
      render();
      ND.toast('Demo reiniciada', 'refresh');
    },
    'export': () => ND.toast('Exportación simulada: en producción genera un CSV.', 'download'),
    'notifications': () => {
      ND.toast(ND.metrics().unread + ' mensajes sin responder y 2 propuestas por vencer', 'bell');
      ND.go('bandeja');
    },
    'user-menu': () => ND.toast('Sesión demo de ' + ND.who.name, 'user'),
    'conv-more': () => ND.toast('Más acciones: archivar, etiquetar, asignar.', 'more'),
    'copy-template': (el) => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(el.dataset.text).then(() => ND.toast('Plantilla copiada', 'copy')).catch(() => ND.toast('No se pudo copiar', 'alert'));
      } else {
        ND.toast('Plantilla copiada', 'copy');
      }
    },
    'msg-client': (el) => {
      const conv = ND.state.conversations.find((c) => c.name === el.dataset.name);
      if (conv) { closeOverlay(); ND.go('bandeja', { conv: conv.id }); }
      else ND.toast('Abrí la bandeja para escribirle a ' + el.dataset.name, 'send');
    },
    'edit-client': () => ND.toast('La edición completa llega en la próxima versión.', 'edit'),
    'create-lead': () => {
      const name = val('nl-name');
      if (!name) return ND.toast('Necesitamos el nombre', 'alert');
      const lead = ND.addLead({
        name,
        handle: val('nl-handle'),
        source: val('nl-source'),
        headline: val('nl-headline') || 'Consulta nueva',
        value: val('nl-value'),
        tags: val('nl-tag') ? [val('nl-tag')] : []
      });
      closeOverlay();
      ND.go('pipeline');
      ND.toast('Consulta creada: ' + lead.name, 'check_circle');
    },
    'create-client': () => {
      const name = val('nc-name');
      if (!name) return ND.toast('Necesitamos el nombre', 'alert');
      ND.state.clients.unshift({
        id: 'K' + Date.now().toString(36), name,
        email: val('nc-email'), phone: val('nc-phone'),
        plan: val('nc-plan'), status: 'Activa', since: new Date().toISOString(),
        mrr: Number(val('nc-mrr')) || 42000, adherence: 0, source: val('nc-source'),
        nextAt: null, notes: [], tags: []
      });
      ND.save();
      closeOverlay();
      render();
      ND.toast('Clienta agregada', 'check_circle');
    },
    'create-appointment': () => {
      const person = val('na-person');
      const date = val('na-date');
      const time = val('na-time') || '10:00';
      if (!date) return ND.toast('Elegí una fecha', 'alert');
      const when = new Date(date + 'T' + time + ':00').toISOString();
      const isClient = person && person.indexOf('client:') === 0;
      const id = person ? person.split(':')[1] : '';
      const name = isClient ? (ND.client(id) || {}).name : (ND.lead(id) || {}).name;
      ND.addAppointment({
        name: name || 'Sin nombre', clientId: isClient ? id : null, leadId: isClient ? null : id,
        type: val('na-type'), channel: val('na-channel'), time: when
      });
      if (!isClient && id) ND.log(id, 'stage', 'Turno agendado para el ' + ND.dateShort(when) + ' a las ' + ND.timeOf(when) + '.');
      closeOverlay();
      if (ui.view === 'agenda' || ui.view === 'resumen') render(); else ND.go('agenda');
      ND.toast('Turno agendado', 'calendar');
    },
    'create-automation': () => {
      const title = val('nr-title');
      if (!title) return ND.toast('Ponele un nombre a la regla', 'alert');
      ND.state.automations.unshift({
        id: 'AU' + Date.now().toString(36), title, desc: 'Regla creada desde el panel.',
        trigger: val('nr-trigger'), action: val('nr-action'), on: true, runs: 0, icon: 'bolt', tone: ''
      });
      ND.save();
      closeOverlay();
      render();
      ND.toast('Regla creada y activada', 'bolt');
    }
  };

  function val(id) {
    const el = document.getElementById(id);
    return el ? el.value : '';
  }

  function autoGrow(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(110, el.scrollHeight) + 'px';
  }

  /* ---------------- delegation ---------------- */
  document.addEventListener('click', (ev) => {
    if (ND.off) return;
    if (ND.justDragged) { ND.justDragged = false; return; }
    if (ev.target.classList && ev.target.classList.contains('nd-overlay')) { closeOverlay(); return; }

    const actionEl = ev.target.closest('[data-action]');
    if (actionEl && actions[actionEl.dataset.action]) {
      ev.preventDefault();
      actions[actionEl.dataset.action](actionEl);
      return;
    }
    const viewEl = ev.target.closest('[data-view]');
    if (viewEl) {
      ev.preventDefault();
      closeOverlay();
      ND.go(viewEl.dataset.view, { conv: viewEl.dataset.conv });
      return;
    }
  });

  document.addEventListener('keydown', (ev) => {
    if (ND.off) return;
    // Enter en «agregar tarea» y «nota privada» de los cajones (antes inline).
    if (ev.key === 'Enter' && ev.target && ev.target.dataset && ev.target.dataset.noteEnter) {
      ev.preventDefault();
      if (ev.target.dataset.noteEnter === 'lead') ND.addTaskTo(ev.target.dataset.noteLead, ev.target.value);
      else ND.addClientNote(ev.target.dataset.noteClient, ev.target.value);
      ev.target.value = '';
      return;
    }
    if (ev.key === 'Escape') {
      if (ND.overlay) closeOverlay();
      else document.getElementById('sidebar').classList.remove('is-open');
    }
    if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === 'k') {
      ev.preventDefault();
      ui.paletteQuery = '';
      openOverlay({ type: 'palette' });
    }
    if (ev.key === 'Enter' && ev.target && ev.target.id === 'composer-input' && !ev.shiftKey) {
      ev.preventDefault();
      actions['send-message']();
    }
  });

  document.addEventListener('input', (ev) => {
    if (ND.off) return;
    const t = ev.target;
    if (t && t.id === 'pipe-search') { ND.setPipeQuery(t.value); return; }
    if (t && t.id === 'palette-input') { ND.setPalette(t.value); return; }
    if (t && t.id === 'composer-input') autoGrow(t);
  });

  document.addEventListener('change', (ev) => {
    if (ND.off) return;
    const t = ev.target;
    if (!t || !t.dataset) return;
    if (t.dataset.stageLead) ND.changeStage(t.dataset.stageLead, t.value);
    if (t.dataset.taskLead && t.dataset.task) ND.completeTask(t.dataset.taskLead, t.dataset.task);
  });

  /* ---------------- drag & drop ---------------- */
  document.addEventListener('dragstart', (ev) => {
    if (ND.off) return;
    const card = ev.target.closest('.lead-card');
    if (!card) return;
    ND.justDragged = true;
    if (ND.motion) ND.motion.release(card);
    ev.dataTransfer.setData('text/plain', card.dataset.lead);
    ev.dataTransfer.effectAllowed = 'move';
    card.classList.add('is-dragging');
  });

  document.addEventListener('dragend', (ev) => {
    if (ND.off) return;
    const card = ev.target.closest('.lead-card');
    if (card) card.classList.remove('is-dragging');
    document.querySelectorAll('.board-col.is-over').forEach((el) => el.classList.remove('is-over'));
    setTimeout(() => { ND.justDragged = false; }, 60);
  });

  document.addEventListener('dragover', (ev) => {
    if (ND.off) return;
    const col = ev.target.closest('.board-col');
    if (!col) return;
    ev.preventDefault();
    ev.dataTransfer.dropEffect = 'move';
    document.querySelectorAll('.board-col.is-over').forEach((el) => { if (el !== col) el.classList.remove('is-over'); });
    col.classList.add('is-over');
  });

  document.addEventListener('dragleave', (ev) => {
    if (ND.off) return;
    const col = ev.target.closest('.board-col');
    if (col && !col.contains(ev.relatedTarget)) col.classList.remove('is-over');
  });

  document.addEventListener('drop', (ev) => {
    if (ND.off) return;
    const col = ev.target.closest('.board-col');
    if (!col) return;
    ev.preventDefault();
    col.classList.remove('is-over');
    const leadId = ev.dataTransfer.getData('text/plain');
    const stage = col.dataset.stage;
    if (!leadId || !stage) return;
    const wrap = document.querySelector('.board-wrap');
    const scrollLeft = wrap ? wrap.scrollLeft : 0;
    const scrollPositions = Object.fromEntries(Array.from(document.querySelectorAll('.board-col'), (column) => [column.dataset.stage, column.querySelector('.board-col-body').scrollTop]));
    const flip = ND.motion ? ND.motion.captureBoard() : null;
    if (ND.moveLead(leadId, stage)) {
      const lead = ND.lead(leadId);
      render({ animate: false });
      const newWrap = document.querySelector('.board-wrap');
      if (newWrap) newWrap.scrollLeft = scrollLeft;
      document.querySelectorAll('.board-col').forEach((column) => { column.querySelector('.board-col-body').scrollTop = scrollPositions[column.dataset.stage] || 0; });
      if (ND.motion) {
        ND.motion.playBoard(flip);
        ND.motion.bump(`.board-col[data-stage="${stage}"] .board-col-count`);
      }
      ND.toast(lead.name + ' pasó a ' + ND.stageMeta[stage].label, 'check_circle');
    }
    setTimeout(() => { ND.justDragged = false; }, 80);
  });

  /* ---------------- boot ---------------- */
  const initial = (window.location.hash || '').replace(/^#\/?/, '');
  if (initial && V[initial]) ui.view = initial;
  render();
  if (ND.motion) ND.motion.boot();
})();
