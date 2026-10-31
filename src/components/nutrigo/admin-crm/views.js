/* ============================================================
   Nutridash — vistas
   ============================================================ */
(function () {
  const ND = (window.ND = window.ND || {});
  const V = (ND.views = {});
  const e = ND.esc;
  const I = ND.icon;

  ND.ui = ND.ui || {
    view: 'resumen', inboxConv: 'C1', inboxChannel: 'all', inboxQuery: '',
    pipeQuery: '', pipeSource: 'all', analyticsPeriod: '8s',
    clientQuery: '', clientFilter: 'todas', agendaOffset: 0
  };

  const badge = (text, cls, dot) => `<span class="nd-badge ${cls || ''}">${dot ? '<span class="dot"></span>' : ''}${e(text)}</span>`;
  const empty = (text) => `<div class="nd-empty">${e(text)}</div>`;

  function delta(up, text) {
    return `<span class="kpi-delta ${up ? 'is-up' : 'is-down'}">${I(up ? 'arrow-up-right' : 'arrow-right', 12)}${e(text)}</span>`;
  }

  function pageHead(opts) {
    return `<section class="nd-page-head">
      <div class="nd-grow">
        <div class="nd-eyebrow">${e(opts.kicker || '')}</div>
        <h1 class="nd-h1">${opts.title}</h1>
        ${opts.sub ? `<p class="nd-sub nd-mt-6">${opts.sub}</p>` : ''}
      </div>
      ${opts.actions ? `<div class="nd-head-actions">${opts.actions}</div>` : ''}
    </section>`;
  }

  function kpi(opts) {
    return `<article class="nd-card kpi">
      <div class="kpi-top"><span class="kpi-label">${e(opts.label)}</span><span class="kpi-spark">${ND.charts.sparkline(opts.spark, opts.color || '#1d7a51', 66, 24)}</span></div>
      <div class="kpi-value">${opts.value}${opts.unit ? `<small>${e(opts.unit)}</small>` : ''}</div>
      <div class="kpi-foot">${delta(opts.up, opts.delta)}<span>${e(opts.note)}</span></div>
    </article>`;
  }

  function cardHead(title, sub, action) {
    return `<div class="nd-card-head"><div class="nd-grow"><div class="nd-card-title">${e(title)}</div>${sub ? `<div class="nd-card-sub">${e(sub)}</div>` : ''}</div>${action || ''}</div>`;
  }

  function todayLabel() {
    const d = new Date();
    const s = d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function greeting() {
    const h = new Date().getHours();
    if (h < 13) return 'Buen día';
    if (h < 20) return 'Buenas tardes';
    return 'Buenas noches';
  }

  /* ============================================================
     RESUMEN
     ============================================================ */
  V.resumen = function () {
    const m = ND.metrics();
    const sources = ND.sourceStats();
    const totalSources = sources.reduce((a, b) => a + b.value, 0);
    const sourceColors = { instagram: '#e97a61', email: '#5b8fa8', whatsapp: '#25a35a', web: '#6b7f74', referral: '#8a7bb8' };
    const donut = ND.charts.donut(sources.map((s) => ({ label: s.label, value: s.value, color: sourceColors[s.key] || '#c2e66e' })), { centerTop: sources.reduce((a, b) => a + b.value, 0), centerSub: 'consultas' });

    const proposals = ND.state.leads.filter((l) => l.stage === 'propuesta');
    const upcoming = ND.state.appointments.slice().sort((a, b) => new Date(a.time) - new Date(b.time)).filter((a) => new Date(a.time) >= new Date()).slice(0, 4);

    const attention = [];
    if (m.unread) attention.push({ icon: 'inbox', tone: 'is-coral', title: `${m.unread} mensajes sin responder`, sub: 'Instagram y email piden respuesta', action: 'Abrir bandeja', view: 'bandeja', target: 'C1' });
    if (proposals.length) attention.push({ icon: 'clock', tone: 'is-gold', title: `${proposals.length} propuestas enviadas`, sub: 'Hacé seguimiento antes del viernes', action: 'Ver pipeline', view: 'pipeline' });
    if (!ND.state.connections.calendar.connected) attention.push({ icon: 'calendar', tone: 'is-sky', title: 'Calendario sin conectar', sub: 'Evitá turnos duplicados y bloqueos', action: 'Conectar', view: 'conexiones' });

    const activityIcons = { message: 'instagram', email: 'mail', stage: 'target', note: 'edit', system: 'sparkle', task: 'check_circle' };
    const activityTones = { message: 'is-green', email: 'is-sky', stage: 'is-gold', note: '', system: '', task: 'is-green' };

    return `${pageHead({
      kicker: `${todayLabel()} · Centro de mando`,
      title: `${greeting()}, Verónica.`,
      sub: `Tenés ${m.nuevos7} consultas nuevas esta semana y ${ND.money(m.pipelineValue, true)} en pipeline activo.`,
      actions: ''
    })}

    <div class="nd-spotlight nd-mb-18">
      <div class="nd-grow">
        <h2>Tu negocio, en una sola mirada.</h2>
        <p>${m.active} clientas activas · ${ND.money(m.mrr)} de ingreso recurrente · ${ND.state.conversations.filter((c) => c.unread).length} conversaciones esperando respuesta.</p>
      </div>
      <button class="nd-btn" data-view="bandeja">${I('inbox')}Ir a la bandeja</button>
      <button class="nd-btn is-ghost" data-view="analitica">${I('chart')}Ver analítica</button>
    </div>

    <div class="nd-grid nd-kpis nd-mb-18">
      ${kpi({ label: 'Consultas nuevas', value: m.nuevos7, icon: 'sparkle', up: true, delta: '+18%', note: 'esta semana', spark: [4, 6, 5, 8, 7, 9, 8, 11] })}
      ${kpi({ label: 'Tasa de conversión', value: m.conversion + '%', icon: 'target', up: true, delta: '+4 pts', note: 'de consultas agendadas', spark: [22, 25, 24, 29, 31, 30, 34, 37], color: '#5b8fa8' })}
      ${kpi({ label: 'Clientas activas', value: m.active, icon: 'users', up: true, delta: '+2', note: 'en seguimiento', spark: [6, 7, 7, 8, 8, 9, 9, 10], color: '#8a7bb8' })}
      ${kpi({ label: 'Ingreso recurrente', value: ND.money(m.mrr, true), unit: '/ mes', icon: 'peso', up: true, delta: '+12%', note: 'vs. mes pasado', spark: [380, 410, 405, 440, 470, 465, 500, 528], color: '#eeb04a' })}
    </div>

    <div class="nd-grid nd-split nd-mb-18">
      <section class="nd-card">
        ${cardHead('Consultas entrantes', 'Últimas 8 semanas · todos los canales', `<button class="nd-btn is-sm is-ghost" data-view="analitica">Ver detalle ${I('arrow-right')}</button>`)}
        <div class="nd-card-pad" style="padding-top:10px">
          ${ND.charts.area([8, 11, 9, 14, 12, 18, 16, 21], ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'], { compare: [6, 7, 8, 9, 11, 10, 13, 14] })}
          <div class="nd-row-between nd-mt-10">
            <div class="legend"><span><i style="background:#1d7a51"></i>Este período</span><span><i style="background:#c9bda6"></i>Período anterior</span></div>
            <span class="nd-hint">${I('trend')}21 consultas · +32%</span>
          </div>
        </div>
      </section>

      <section class="nd-card">
        ${cardHead('De dónde llegan', 'Origen de las consultas del pipeline')}
        <div class="nd-card-pad" style="display:flex;flex-direction:column;align-items:center;gap:16px">
          ${donut}
          <div class="legend" style="justify-content:center">
            ${sources.map((s) => `<span><i style="background:${sourceColors[s.key]}"></i>${e(s.label)} · ${s.value}</span>`).join('')}
          </div>
          <div class="nd-hint">${I('instagram')}Instagram trae el ${Math.round(((sources.find((s) => s.key === 'instagram') || {}).value || 0) / (totalSources || 1) * 100)}% de las consultas</div>
        </div>
      </section>
    </div>

    <div class="nd-grid nd-split-3">
      <section class="nd-card">
        ${cardHead('Necesita tu atención', 'Lo que no debería esperar')}
        <div style="padding:8px 10px 12px">
          ${attention.length ? attention.map((a) => `<button class="nd-row nd-grow" data-view="${a.view}" ${a.target ? `data-conv="${a.target}"` : ''} style="width:100%;text-align:left;padding:11px 10px;border-radius:10px" onmouseover="this.style.background='var(--surface-2)'" onmouseout="this.style.background='transparent'">
            <span class="rule-ico ${a.tone}" style="width:34px;height:34px">${I(a.icon)}</span>
            <span class="nd-grow"><span style="display:block;font-size:12.5px;font-weight:600">${e(a.title)}</span><span style="display:block;font-size:11px;color:var(--muted);margin-top:1px">${e(a.sub)}</span></span>
            <span style="font-size:11px;color:var(--green);font-weight:600;white-space:nowrap">${e(a.action)}</span>
          </button>`).join('') : empty('Todo al día ✨')}
        </div>
      </section>

      <section class="nd-card">
        ${cardHead('Próximos turnos', 'Semana en curso', `<button class="nd-btn is-sm is-ghost" data-view="agenda">Agenda ${I('arrow-right')}</button>`)}
        <div style="padding:10px 14px 16px">
          ${upcoming.length ? upcoming.map((a) => `<div class="nd-row" style="padding:9px 4px;border-bottom:1px dashed var(--line)">
            <div style="width:44px;text-align:center"><div style="font-family:var(--font-display);font-size:15px;font-weight:600">${ND.timeOf(a.time)}</div><div style="font-size:9px;color:var(--muted)">${ND.dateShort(a.time)}</div></div>
            ${ND.avatar(a.name, 'is-sm')}
            <div class="nd-grow"><div style="font-size:12px;font-weight:600">${e(a.name)}</div><div style="font-size:10.5px;color:var(--muted)">${e(a.type)} · ${a.channel === 'online' ? 'Online' : 'Presencial'}</div></div>
            ${badge(a.status === 'confirmado' ? 'Confirmado' : 'Pendiente', a.status === 'confirmado' ? 'is-green' : 'is-gold', true)}
          </div>`).join('') : empty('Sin turnos próximos')}
        </div>
      </section>

      <section class="nd-card">
        ${cardHead('Actividad reciente', 'Todo lo que pasó en tu cuenta')}
        <div class="nd-card-pad">
          <div class="tline">
            ${ND.state.activity.slice(0, 5).map((a) => `<div class="tline-item">
              <span class="tline-ico ${activityTones[a.type] || ''}">${I(activityIcons[a.type] || 'sparkle')}</span>
              <div class="nd-grow"><div class="tline-text">${a.text}</div><div class="tline-time">${ND.timeAgo(a.at)}</div></div>
            </div>`).join('')}
          </div>
        </div>
      </section>
    </div>`;
  };

  /* ============================================================
     PIPELINE
     ============================================================ */
  V.pipeline = function () {
    const ui = ND.ui;
    const stages = ND.stageStats();
    const total = ND.state.leads.filter((l) => !['ganada', 'pausa'].includes(l.stage)).length;
    const totalValue = ND.state.leads.filter((l) => !['ganada', 'pausa'].includes(l.stage)).reduce((s, l) => s + l.value, 0);

    const filtered = (stage) => {
      let items = ND.state.leads.filter((l) => l.stage === stage);
      if (ui.pipeSource !== 'all') items = items.filter((l) => l.source === ui.pipeSource);
      if (ui.pipeQuery.trim()) {
        const q = ui.pipeQuery.toLowerCase();
        items = items.filter((l) => (l.name + ' ' + l.handle + ' ' + l.headline + ' ' + (l.tags || []).join(' ')).toLowerCase().includes(q));
      }
      return items;
    };

    const sourceChips = [['all', 'Todas'], ['instagram', 'Instagram'], ['email', 'Email'], ['whatsapp', 'WhatsApp'], ['referral', 'Referidos'], ['web', 'Web']];

    return `${pageHead({
      kicker: 'Pipeline comercial',
      title: 'Nuevas clientas',
      sub: `${total} oportunidades activas · ${ND.money(totalValue)} en juego. Arrastrá una tarjeta para moverla de etapa.`,
      actions: `<button class="nd-btn" data-view="bandeja">${I('inbox')}Bandeja</button>`
    })}

    <div class="nd-row nd-wrap nd-mb-14" style="gap:8px">
      <div class="nd-search" style="width:250px;height:34px;background:var(--surface)" data-action="focus-pipe">
        ${I('search')}<input id="pipe-search" value="${e(ui.pipeQuery)}" placeholder="Buscar por nombre, tag o handle" style="border:0;outline:none;background:transparent;flex:1;font-size:12px" />
      </div>
      ${sourceChips.map(([k, label]) => `<button class="nd-chip ${ui.pipeSource === k ? 'is-active' : ''}" data-action="pipe-source" data-source="${k}">${k !== 'all' ? ND.srcIcon(k) : ''}${label}</button>`).join('')}
      <span class="nd-grow"></span>
      <span class="nd-hint">${I('filter')}${filtered('nuevo').length + filtered('contactado').length + filtered('conversando').length + filtered('consulta').length + filtered('propuesta').length + filtered('ganada').length + filtered('pausa').length} resultados</span>
    </div>

    <div class="board-wrap">
      <div class="board" id="pipeline-board">
        ${stages.map((s) => {
          const items = filtered(s.stage);
          const meta = ND.stageMeta[s.stage];
          return `<section class="board-col" data-stage="${s.stage}">
            <header class="board-col-head">
              <div class="board-col-title"><span class="dot" style="background:${meta.color}"></span>${e(meta.label)}<span class="board-col-count">${items.length}</span></div>
              <div class="board-col-sum">${ND.money(items.reduce((sum, l) => sum + l.value, 0), true)} <span style="font-family:var(--font-ui);font-size:10px;color:var(--muted)">en juego</span></div>
            </header>
            <div class="board-col-body" data-drop="${s.stage}">
              ${items.length ? items.map((l) => leadCard(l)).join('') : `<div class="nd-empty" style="padding:22px 8px;font-size:11px">Soltá una tarjeta acá</div>`}
            </div>
          </section>`;
        }).join('')}
      </div>
    </div>
    <p class="nd-hint nd-mt-10">${I('sparkle')}Tip: las etapas y notas se guardan en este navegador. Podés ver el detalle de cada consulta haciendo clic en la tarjeta.</p>`;
  };

  function leadCard(l) {
    return `<article class="lead-card" draggable="true" data-lead="${l.id}" data-flip-id="lead-${l.id}" data-action="open-lead" tabindex="0">
      <div class="lead-card-top">
        ${ND.avatar(l.name)}
        <div class="nd-grow">
          <div class="lead-card-name">${e(l.name)}</div>
          <div class="lead-card-handle">${e(l.handle)}</div>
        </div>
        ${ND.srcIcon(l.source)}
      </div>
      <div class="lead-card-note">${e(l.headline)}</div>
      ${(l.tags || []).length ? `<div class="lead-card-tags">${l.tags.slice(0, 2).map((t) => `<span class="nd-badge">${e(t)}</span>`).join('')}</div>` : ''}
      <div class="lead-card-foot">
        <span>${ND.timeAgo(l.lastContact)}</span>
        <span class="lead-score">${I('target', 12)}${l.score}</span>
        <span class="lead-card-value">${ND.money(l.value, true)}</span>
      </div>
    </article>`;
  }

  /* ============================================================
     BANDEJA
     ============================================================ */
  V.bandeja = function () {
    const ui = ND.ui;
    const channels = [['all', 'Todas'], ['instagram', 'Instagram'], ['email', 'Email'], ['whatsapp', 'WhatsApp']];
    const counts = (key) => ND.state.conversations.filter((c) => key === 'all' || c.channel === key).length;
    const unread = (key) => ND.state.conversations.filter((c) => (key === 'all' || c.channel === key) && c.unread).reduce((s, c) => s + c.unread, 0);

    let list = ND.state.conversations.slice().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    if (ui.inboxChannel !== 'all') list = list.filter((c) => c.channel === ui.inboxChannel);
    if (ui.inboxQuery.trim()) {
      const q = ui.inboxQuery.toLowerCase();
      list = list.filter((c) => (c.name + ' ' + c.handle + ' ' + c.lastMessage).toLowerCase().includes(q));
    }

    const conv = ND.conversation(ui.inboxConv) || list[0] || null;
    const lead = conv && conv.leadId ? ND.lead(conv.leadId) : null;

    return `${pageHead({
      kicker: 'Bandeja unificada',
      title: 'Conversaciones',
      sub: 'Instagram, email y WhatsApp en un mismo lugar. Respondé y convertí consultas en clientas.',
      actions: `<button class="nd-btn" data-action="sync-all">${I('refresh')}Sincronizar</button>`
    })}

    <div class="nd-card inbox">
      <aside class="inbox-filters">
        <div class="inbox-filter-title">Canales</div>
        ${channels.map(([k, label]) => `<button class="inbox-filter ${ui.inboxChannel === k ? 'is-active' : ''}" data-action="inbox-channel" data-channel="${k}">
          ${k === 'all' ? I('inbox') : ND.srcIcon(k)}<span>${label}</span><span class="nd-nav-count">${counts(k)}</span>
        </button>`).join('')}
        <div class="inbox-filter-title" style="padding-top:20px">Bandejas</div>
        <button class="inbox-filter is-active">${I('sparkle')}<span>Para responder</span><span class="nd-nav-count">${unread('all')}</span></button>
        <button class="inbox-filter">${I('clock')}<span>Esperando respuesta</span><span class="nd-nav-count">4</span></button>
        <button class="inbox-filter">${I('check_circle')}<span>Resueltas</span><span class="nd-nav-count">38</span></button>
        <div class="nd-divider" style="margin:16px 0"></div>
        <div class="nd-hint" style="padding:0 8px;line-height:1.5">${I('sparkle')}Las respuestas automáticas están activas en Instagram.</div>
      </aside>

      <section class="conv-list">
        <div class="conv-list-head">
          <div class="conv-list-search">${I('search')}<input id="inbox-search" placeholder="Buscar conversación" value="${e(ui.inboxQuery)}" style="border:0;outline:none;background:transparent;flex:1;font-size:12px" /></div>
        </div>
        <div class="conv-list-body">
          ${list.length ? list.map((c) => `<div class="conv-item ${conv && c.id === conv.id ? 'is-active' : ''} ${c.unread ? 'is-unread' : ''}" data-action="open-conv" data-conv="${c.id}">
            ${ND.avatar(c.name, 'is-sm')}
            <div class="nd-grow" style="min-width:0">
              <div class="conv-name">${e(c.name)}${c.unread ? `<span class="conv-unread" style="margin-left:auto">${c.unread}</span>` : ''}</div>
              <div class="conv-preview">${e(c.lastMessage)}</div>
              <div class="conv-time nd-row" style="margin-top:4px;gap:5px">${ND.srcIcon(c.channel)}<span>${ND.timeAgo(c.updatedAt)}</span></div>
            </div>
          </div>`).join('') : empty('No hay conversaciones en este canal')}
        </div>
      </section>

      ${conv ? thread(conv, lead) : `<div class="thread"><div class="thread-empty">${I('inbox')}<p class="nd-mt-10">Elegí una conversación para empezar.</p></div></div>`}
    </div>`;
  };

  function thread(conv, lead) {
    const channelLabel = ND.sourceMeta[conv.channel] ? ND.sourceMeta[conv.channel].label : conv.channel;
    return `<section class="thread">
      <header class="thread-head">
        ${ND.avatar(conv.name)}
        <div class="nd-grow">
          <div class="nd-row" style="gap:7px"><strong style="font-size:13px">${e(conv.name)}</strong>${badge(channelLabel, 'is-dark')}</div>
          <div style="font-size:11px;color:var(--muted);margin-top:1px">${e(conv.handle)}${lead ? ` · ${e(ND.stageMeta[lead.stage].label)}` : ''}</div>
        </div>
        ${lead ? `<button class="nd-btn is-sm" data-action="open-lead" data-lead="${lead.id}">${I('target')}Ver ficha</button>` : ''}
        <button class="nd-btn is-sm is-ghost" data-action="new-appointment" data-name="${e(conv.name)}">${I('calendar')}Agendar</button>
        <button class="nd-icon-btn" data-action="conv-more" aria-label="Más opciones">${I('more')}</button>
      </header>
      <div class="thread-body" id="thread-body">
        <div class="thread-day">${conv.subject ? e(conv.subject) : ND.dateShort(conv.updatedAt)}</div>
        ${conv.messages.map((m) => `<div class="msg ${m.from === 'me' ? 'is-me' : ''}">
          <div class="msg-bubble">${e(m.text)}</div>
          <div class="msg-time">${m.from === 'me' ? 'Vos' : e(conv.name.split(' ')[0])} · ${ND.timeOf(m.at)}</div>
        </div>`).join('')}
      </div>
      <div class="thread-composer">
        <div class="quick-replies">
          <button class="quick-reply" data-action="quick-reply" data-text="¡Hola! ¿Cómo estás? Contame qué te gustaría trabajar 😊">Saludo</button>
          <button class="quick-reply" data-action="quick-reply" data-text="Te paso la agenda para que elijas el turno que mejor te quede 📅">Agenda</button>
          <button class="quick-reply" data-action="quick-reply" data-text="Te cuento: el plan incluye alimentación personalizada, seguimiento semanal y ajustes.">Qué incluye</button>
          <button class="quick-reply" data-action="quick-reply" data-text="Quedo atenta a cualquier duda. ¡Te espero!">Cierre</button>
        </div>
        <div class="composer">
          <textarea id="composer-input" rows="1" placeholder="Escribí una respuesta…"></textarea>
          <button class="composer-send" data-action="send-message" aria-label="Enviar mensaje">${I('send')}</button>
        </div>
      </div>
    </section>`;
  }

  /* ============================================================
     CLIENTAS
     ============================================================ */
  V.clientas = function () {
    const ui = ND.ui;
    let rows = ND.state.clients.slice();
    if (ui.clientFilter !== 'todas') {
      const map = { activas: 'Activa', pausa: 'En pausa', finalizando: 'Finalizando' };
      rows = rows.filter((c) => c.status === map[ui.clientFilter]);
    }
    if (ui.clientQuery.trim()) {
      const q = ui.clientQuery.toLowerCase();
      rows = rows.filter((c) => (c.name + ' ' + c.email + ' ' + c.plan).toLowerCase().includes(q));
    }
    const m = ND.metrics();

    return `${pageHead({
      kicker: 'Cartera de clientas',
      title: 'Clientas',
      sub: `${RD(ND.state.clients.length)} personas en tu consultorio · ${m.active} activas · ${ND.money(m.mrr)} recurrentes por mes.`,
      actions: `<button class="nd-btn" data-action="export">${I('download')}Exportar</button><button class="nd-btn is-primary" data-action="new-client">${I('plus')}Nueva clienta</button>`
    })}

    <div class="nd-row nd-wrap nd-mb-14" style="gap:8px">
      <div class="nd-search" style="width:260px;height:34px;background:var(--surface)">
        ${I('search')}<input id="client-search" value="${e(ui.clientQuery)}" placeholder="Buscar clienta, email o plan" style="border:0;outline:none;background:transparent;flex:1;font-size:12px" />
      </div>
      ${[['todas', 'Todas'], ['activas', 'Activas'], ['pausa', 'En pausa'], ['finalizando', 'Finalizando']].map(([k, l]) => `<button class="nd-chip ${ui.clientFilter === k ? 'is-active' : ''}" data-action="client-filter" data-filter="${k}">${l}</button>`).join('')}
      <span class="nd-grow"></span>
      <span class="nd-hint">${I('peso')}MRR ${ND.money(m.mrr)}</span>
    </div>

    <div class="nd-card">
      <div class="nd-table-wrap">
        <table class="nd-table">
          <thead><tr><th>Clienta</th><th>Plan</th><th>Estado</th><th>Adherencia</th><th>Próximo turno</th><th>Origen</th><th style="text-align:right">Mensual</th></tr></thead>
          <tbody>
            ${rows.length ? rows.map((c) => `<tr data-action="open-client" data-client="${c.id}">
              <td><div class="cell-person">${ND.avatar(c.name, 'is-sm')}<div><div class="cell-person-name">${e(c.name)}</div><div class="cell-person-sub">${e(c.email)}</div></div></div></td>
              <td><div class="cell-plan"><strong>${e(c.plan)}</strong>Desde ${ND.dateShort(c.since)}</div></td>
              <td>${badge(c.status, c.status === 'Activa' ? 'is-green' : c.status === 'En pausa' ? 'is-gold' : 'is-sky', true)}</td>
              <td><div class="cell-progress"><div class="nd-progress ${c.adherence < 60 ? 'is-coral' : c.adherence < 80 ? 'is-gold' : ''}"><span style="width:${c.adherence}%"></span></div><span>${c.adherence}%</span></div></td>
              <td>${c.nextAt ? `<div style="font-size:11.5px">${ND.dateShort(c.nextAt)}</div><div style="font-size:10px;color:var(--muted)">${ND.timeOf(c.nextAt)}</div>` : '<span class="nd-muted">—</span>'}</td>
              <td>${ND.srcIcon(c.source)}</td>
              <td style="text-align:right"><span class="cell-money">${c.mrr ? ND.money(c.mrr, true) : '—'}</span></td>
            </tr>`).join('') : `<tr><td colspan="7">${empty('No hay clientas con ese filtro')}</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>`;
  };

  const RD = (n) => ND.num(n);

  /* ============================================================
     AGENDA
     ============================================================ */
  V.agenda = function () {
    const ui = ND.ui;
    const base = new Date();
    const day = base.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(base);
    monday.setDate(base.getDate() + diff + ui.agendaOffset * 7);
    monday.setHours(0, 0, 0, 0);

    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
    const hours = Array.from({ length: 12 }, (_, i) => i + 8);

    const appts = ND.state.appointments.filter((a) => {
      const t = new Date(a.time);
      return t >= days[0] && t < new Date(days[6].getTime() + 864e5);
    });

    const monthName = (d) => d.toLocaleDateString('es-AR', { month: 'long' });
    const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
    const sameMonth = days[0].getMonth() === days[6].getMonth();
    const monthLabel = sameMonth
      ? `${cap(monthName(days[0]))} ${days[0].getFullYear()}`
      : `${cap(monthName(days[0]))} – ${cap(monthName(days[6]))} ${days[6].getFullYear()}`;
    const weekRange = `${days[0].getDate()} ${monthName(days[0]).slice(0, 3)} – ${days[6].getDate()} ${monthName(days[6]).slice(0, 3)}`;
    const today = new Date();

    const tones = ['', 'is-gold', 'is-sky', 'is-coral'];
    const typeTone = (type) => {
      if (type === 'Primera consulta') return 'is-gold';
      if (type === 'Control') return 'is-coral';
      if (type === 'Consulta online') return 'is-sky';
      return '';
    };

    return `${pageHead({
      kicker: 'Agenda',
      title: 'Tu semana',
      sub: `${appts.length} turnos esta semana · ${appts.filter((a) => a.status === 'pendiente').length} por confirmar.`,
      actions: `<div class="nd-row" style="gap:6px"><button class="nd-icon-btn" data-action="agenda-prev" aria-label="Semana anterior">${I('arrow-left')}</button><button class="nd-btn is-sm" data-action="agenda-today">Hoy</button><button class="nd-icon-btn" data-action="agenda-next" aria-label="Semana siguiente">${I('arrow-right')}</button></div><button class="nd-btn is-primary" data-action="new-appointment">${I('plus')}Nuevo turno</button>`
    })}

    <div class="nd-card nd-mb-18" style="overflow:hidden">
      <div class="nd-row-between agenda-head" style="padding:16px 20px">
        <div><div class="nd-card-title">${e(monthLabel)}</div><div class="nd-card-sub">Semana del ${e(weekRange)}</div></div>
        <div class="legend"><span><i style="background:#1d7a51"></i>Seguimiento</span><span><i style="background:#eeb04a"></i>Primera consulta</span><span><i style="background:#5b8fa8"></i>Online</span><span><i style="background:#e97a61"></i>Control</span></div>
      </div>
      <div class="nd-scroll-x">
        <div class="agenda-grid" style="min-width:820px">
          <div class="agenda-corner"></div>
          ${days.map((d) => {
            const isToday = ND.isSameDay(d, today);
            return `<div class="agenda-day-head ${isToday ? 'is-today' : ''}"><div class="agenda-day-name">${d.toLocaleDateString('es-AR', { weekday: 'short' }).replace('.', '')}</div><div class="agenda-day-num">${d.getDate()}</div></div>`;
          }).join('')}
          ${hours.map((hour) => `<div class="agenda-time">${String(hour).padStart(2, '0')}:00</div>
            ${days.map((d, di) => {
              const isToday = ND.isSameDay(d, today);
              const events = appts.filter((a) => {
                const t = new Date(a.time);
                return ND.isSameDay(t, d) && t.getHours() === hour;
              });
              return `<div class="agenda-cell ${isToday ? 'is-today' : ''}">
                ${events.map((a) => {
                  const t = new Date(a.time);
                  const top = (t.getMinutes() / 60) * 58;
                  return `<button class="agenda-event ${typeTone(a.type)}" data-action="open-appt" data-appt="${a.id}" style="top:${top + 2}px">
                    <strong>${e(a.name.split(' ')[0])} · ${ND.timeOf(a.time)}</strong>
                    <span>${e(a.type)}</span>
                  </button>`;
                }).join('')}
              </div>`;
            }).join('')}`).join('')}
        </div>
      </div>
    </div>

    <div class="nd-grid nd-split-2">
      <section class="nd-card">
        ${cardHead('Hoy', todayLabel())}
        <div style="padding:8px 14px 16px">
          ${(() => {
            const todays = ND.state.appointments.filter((a) => ND.isSameDay(a.time, today)).sort((a, b) => new Date(a.time) - new Date(b.time));
            return todays.length ? todays.map((a) => `<div class="nd-row" style="padding:10px 4px;border-bottom:1px dashed var(--line)">
              <div style="width:46px;font-family:var(--font-display);font-size:14px;font-weight:600">${ND.timeOf(a.time)}</div>
              ${ND.avatar(a.name, 'is-sm')}
              <div class="nd-grow"><div style="font-size:12px;font-weight:600">${e(a.name)}</div><div style="font-size:10.5px;color:var(--muted)">${e(a.type)} · ${a.channel === 'online' ? 'Online' : 'Presencial'}</div></div>
              ${badge(a.status === 'confirmado' ? 'Confirmado' : 'Pendiente', a.status === 'confirmado' ? 'is-green' : 'is-gold', true)}
            </div>`).join('') : empty('No tenés turnos hoy. Buen momento para hacer seguimiento ✨');
          })()}
        </div>
      </section>
      <section class="nd-card">
        ${cardHead('Resumen de la semana', 'Ocupación y confirmaciones')}
        <div class="nd-card-pad">
          <div class="nd-grid nd-split-2" style="gap:12px">
            <div style="background:var(--surface-2);border-radius:12px;padding:14px"><div class="nd-eyebrow">Turnos</div><div style="font-family:var(--font-display);font-size:26px;font-weight:600">${appts.length}</div><div class="nd-tiny nd-muted">${appts.filter((a) => a.channel === 'online').length} online · ${appts.filter((a) => a.channel === 'presencial').length} presencial</div></div>
            <div style="background:var(--surface-2);border-radius:12px;padding:14px"><div class="nd-eyebrow">Confirmados</div><div style="font-family:var(--font-display);font-size:26px;font-weight:600">${appts.filter((a) => a.status === 'confirmado').length}</div><div class="nd-tiny nd-muted">${appts.filter((a) => a.status === 'pendiente').length} pendientes de confirmar</div></div>
          </div>
          <div class="nd-mt-18">
            <div class="nd-row-between nd-mb-14"><span class="nd-small" style="font-weight:600">Ocupación de la semana</span><span class="nd-small nd-muted">${Math.round((appts.length / 24) * 100)}%</span></div>
            <div class="nd-progress"><span style="width:${Math.round((appts.length / 24) * 100)}%"></span></div>
            <p class="nd-hint nd-mt-14">${I('sparkle')}Tenés 24 bloques disponibles por semana.</p>
          </div>
        </div>
      </section>
    </div>`;
  };

  /* ============================================================
     ANALÍTICA
     ============================================================ */
  V.analitica = function () {
    const m = ND.metrics();
    const periods = { '4s': { label: '4 semanas', mult: 0.55, series: [12, 15, 13, 18], labels: ['S1', 'S2', 'S3', 'S4'] }, '8s': { label: '8 semanas', mult: 1, series: [8, 11, 9, 14, 12, 18, 16, 21], labels: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'] }, '12s': { label: '12 semanas', mult: 1.4, series: [7, 9, 8, 11, 10, 13, 12, 15, 14, 17, 16, 21], labels: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10', 'S11', 'S12'] } };
    const p = periods[ND.ui.analyticsPeriod] || periods['8s'];
    const sources = ND.sourceStats();
    const sourceColors = { instagram: '#e97a61', email: '#5b8fa8', whatsapp: '#25a35a', web: '#6b7f74', referral: '#8a7bb8' };
    const totalSources = sources.reduce((a, b) => a + b.value, 0);

    const funnel = [
      { label: 'Consultas recibidas', value: ND.state.leads.filter((l) => l.stage !== 'pausa').length, color: '#e9e2d3' },
      { label: 'Contactadas', value: ND.state.leads.filter((l) => ['contactado', 'conversando', 'consulta', 'propuesta', 'ganada'].includes(l.stage)).length, color: '#d9e6cb' },
      { label: 'En conversación', value: ND.state.leads.filter((l) => ['conversando', 'consulta', 'propuesta', 'ganada'].includes(l.stage)).length, color: '#b9d9a4' },
      { label: 'Consulta agendada', value: ND.state.leads.filter((l) => ['consulta', 'propuesta', 'ganada'].includes(l.stage)).length, color: '#8cc38a' },
      { label: 'Plan propuesto', value: ND.state.leads.filter((l) => ['propuesta', 'ganada'].includes(l.stage)).length, color: '#4fa370' },
      { label: 'Clientas', value: ND.state.leads.filter((l) => l.stage === 'ganada').length, color: '#1d7a51' }
    ];
    const top = funnel[0].value || 1;
    const scheduled = funnel[3].value || 1;
    const closeRate = Math.round((funnel[funnel.length - 1].value / scheduled) * 100);

    const revenue = [412000, 438000, 455000, 478000, 502000, m.mrr];
    const months = ['May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct'];

    const motives = [
      { label: 'Pérdida de peso', value: 42, color: '#1d7a51' },
      { label: 'Reeducación', value: 26, color: '#5b8fa8' },
      { label: 'Digestivo', value: 18, color: '#eeb04a' },
      { label: 'Deportivo', value: 14, color: '#8a7bb8' }
    ];

    const responseRows = [
      { label: 'Instagram', icon: ND.srcIcon('instagram'), value: 12, display: '12 min', suffix: 'promedio', color: '#e97a61' },
      { label: 'WhatsApp', icon: ND.srcIcon('whatsapp'), value: 8, display: '8 min', suffix: 'promedio', color: '#25a35a' },
      { label: 'Email', icon: ND.srcIcon('email'), value: 95, display: '1 h 35', suffix: 'promedio', color: '#5b8fa8' }
    ];

    return `${pageHead({
      kicker: 'Analítica del negocio',
      title: 'Cómo crece Plan V',
      sub: 'Conversión, ingresos y rendimiento por canal en un solo tablero.',
      actions: `<div class="nd-row" style="gap:6px">${Object.keys(periods).map((k) => `<button class="nd-chip ${ND.ui.analyticsPeriod === k ? 'is-active' : ''}" data-action="period" data-period="${k}">${periods[k].label}</button>`).join('')}</div><button class="nd-btn" data-action="export">${I('download')}Exportar</button>`
    })}

    <div class="nd-grid nd-kpis nd-mb-18">
      ${kpi({ label: 'Consultas del período', value: Math.round(21 * p.mult), unit: `en ${p.label}`, icon: 'sparkle', up: true, delta: '+32%', note: 'vs. período anterior', spark: p.series })}
      ${kpi({ label: 'Conversión a clienta', value: m.conversion + '%', unit: 'de agendadas', icon: 'target', up: true, delta: '+4 pts', note: 'vs. período anterior', spark: [12, 13, 12, 15, 16, 15, 17, 17], color: '#5b8fa8' })}
      ${kpi({ label: 'Ticket promedio', value: ND.money(47500, true), unit: 'por mes', icon: 'peso', up: true, delta: '+8%', note: 'plan mensual y trimestral', spark: [40, 42, 41, 44, 45, 46, 47, 48], color: '#eeb04a' })}
      ${kpi({ label: 'Ingreso del mes', value: ND.money(m.mrr, true), unit: 'recurrente', icon: 'trend', up: true, delta: '+12%', note: 'vs. septiembre', spark: revenue.map((v) => Math.round(v / 1000)), color: '#8a7bb8' })}
    </div>

    <section class="nd-card nd-mb-18">
      ${cardHead('Evolución de consultas', `Serie de ${p.label} · comparada con el período anterior`, `<span class="nd-hint">${I('trend')}+32% de crecimiento</span>`)}
      <div class="nd-card-pad" style="padding-top:6px">
        ${ND.charts.area(p.series, p.labels, { compare: p.series.map((v) => Math.round(v * 0.72)), height: 250 })}
      </div>
    </section>

    <div class="nd-grid nd-split nd-mb-18">
      <section class="nd-card">
        ${cardHead('Embudo de conversión', 'De consulta agendada a clienta activa', `<span class="nd-badge is-green">${closeRate}% de cierre</span>`)}
        <div class="nd-card-pad">
          ${funnel.map((f, i) => {
            const pct = Math.round((f.value / top) * 100);
            const prev = i ? funnel[i - 1].value : f.value;
            const drop = prev ? Math.round(((prev - f.value) / prev) * 100) : 0;
            return `<div class="funnel-row">
              <div class="funnel-label">${e(f.label)}</div>
              <div class="funnel-bar"><span style="width:${Math.max(6, pct)}%;background:${f.color}"></span></div>
              <div class="funnel-val">${f.value}<small>${i ? drop + '% drop' : '100%'}</small></div>
            </div>`;
          }).join('')}
        </div>
      </section>
      <section class="nd-card">
        ${cardHead('Origen de las consultas', 'Mezcla de canales de adquisición')}
        <div class="nd-card-pad" style="display:flex;gap:20px;align-items:center;flex-wrap:wrap;justify-content:center">
          ${ND.charts.donut(sources.map((s) => ({ label: s.label, value: s.value, color: sourceColors[s.key] })), { size: 170, centerTop: totalSources, centerSub: 'consultas' })}
          <div style="display:flex;flex-direction:column;gap:9px;min-width:150px">
            ${sources.map((s) => `<div class="nd-row-between" style="font-size:11.5px"><span class="nd-row" style="gap:7px"><i style="width:9px;height:9px;border-radius:3px;background:${sourceColors[s.key]};display:inline-block"></i>${e(s.label)}</span><strong>${Math.round((s.value / totalSources) * 100)}%</strong></div>`).join('')}
          </div>
        </div>
      </section>
    </div>

    <div class="nd-grid nd-split-2 nd-mb-18">
      <section class="nd-card">
        ${cardHead('Ingresos por mes', 'Facturación recurrente de los últimos 6 meses')}
        <div class="nd-card-pad">${ND.charts.bars(revenue, months, { highlight: '#1d7a51' })}</div>
      </section>
      <section class="nd-card">
        ${cardHead('Motivos de consulta', 'Qué te buscan resolver')}
        <div class="nd-card-pad">
          ${ND.charts.hbars(motives.map((x) => ({ ...x, display: x.value, suffix: '%' })))}
          <p class="nd-hint nd-mt-14">${I('sparkle')}Pérdida de peso lidera; reeducación creció 12% este mes.</p>
        </div>
      </section>
    </div>

    <section class="nd-card">
      ${cardHead('Rendimiento por canal', 'Volumen, respuesta y conversión', `<button class="nd-btn is-sm is-ghost" data-view="conexiones">Gestionar conexiones ${I('arrow-right')}</button>`)}
      <div class="nd-card-pad" style="padding-top:8px">
        ${responseRows.map((r) => `<div class="channel-row">
          <div class="channel-name">${r.icon}${r.label}</div>
          <div class="channel-bar"><span style="width:${Math.min(100, (r.value / 95) * 100)}%;background:${r.color}"></span></div>
          <div class="channel-val"><strong>${r.display}</strong> ${r.suffix}</div>
        </div>`).join('')}
        <div class="nd-divider" style="margin:12px 0"></div>
        <div class="nd-grid nd-split-3" style="gap:12px">
          <div><div class="nd-eyebrow">Mejor canal</div><div class="nd-h3 nd-mt-6">Instagram</div><div class="nd-tiny nd-muted">50% de las consultas</div></div>
          <div><div class="nd-eyebrow">Más rápido</div><div class="nd-h3 nd-mt-6">WhatsApp</div><div class="nd-tiny nd-muted">8 min de respuesta</div></div>
          <div><div class="nd-eyebrow">Oportunidad</div><div class="nd-h3 nd-mt-6">Email</div><div class="nd-tiny nd-muted">1 h 35 de demora</div></div>
        </div>
      </div>
    </section>`;
  };

  /* ============================================================
     AUTOMATIZACIONES
     ============================================================ */
  V.automatizaciones = function () {
    const active = ND.state.automations.filter((a) => a.on).length;
    return `${pageHead({
      kicker: 'Automatizaciones',
      title: 'Que trabaje solo',
      sub: `${active} de ${ND.state.automations.length} reglas activas · ahorraste 4 h 20 min este mes.`,
      actions: `<button class="nd-btn" data-action="export">${I('file')}Ver registro</button><button class="nd-btn is-primary" data-action="new-automation">${I('plus')}Nueva regla</button>`
    })}

    <div class="nd-grid nd-split-3 nd-mb-18">
      <article class="nd-card nd-card-pad"><div class="nd-eyebrow">Tiempo ahorrado</div><div class="kpi-value" style="font-size:30px">4 h 20</div><div class="nd-small nd-muted">este mes · 265 acciones</div></article>
      <article class="nd-card nd-card-pad"><div class="nd-eyebrow">Mensajes automáticos</div><div class="kpi-value" style="font-size:30px">148</div><div class="nd-small nd-muted">respuestas de bienvenida enviadas</div></article>
      <article class="nd-card nd-card-pad"><div class="nd-eyebrow">Tasa de respuesta</div><div class="kpi-value" style="font-size:30px">92%</div><div class="nd-small nd-muted">en menos de 15 minutos</div></article>
    </div>

    <section class="nd-card nd-mb-18">
      ${cardHead('Reglas activas', 'Cada regla conecta un canal con una acción', `<span class="nd-hint">${I('sparkle')}Se ejecutan en tiempo real</span>`)}
      ${ND.state.automations.map((a) => `<div class="rule">
        <span class="rule-ico ${a.tone}">${I(a.icon)}</span>
        <div class="nd-grow">
          <div class="rule-title">${e(a.title)}</div>
          <div class="rule-desc">${e(a.desc)}</div>
          <div class="rule-flow"><b>${e(a.trigger)}</b>${I('arrow-right')}<b>${e(a.action)}</b></div>
          <div class="rule-stat">${ND.num(a.runs)} ejecuciones · última hoy</div>
        </div>
        <button class="switch ${a.on ? 'is-on' : ''}" data-action="toggle-automation" data-rule="${a.id}" aria-label="${a.on ? 'Desactivar' : 'Activar'} ${e(a.title)}" aria-pressed="${a.on}"></button>
      </div>`).join('')}
    </section>

    <div class="nd-grid nd-split-2">
      <section class="nd-card nd-card-pad">
        <div class="nd-eyebrow">Plantillas de respuesta</div>
        <div class="nd-h2 nd-mt-6" style="font-size:19px">Tu voz, siempre lista</div>
        <p class="nd-sub nd-mt-6">Respuestas guardadas que podés enviar en un clic desde la bandeja.</p>
        <div class="nd-mt-18 nd-stack" style="gap:9px">
          ${[['Bienvenida', '¡Hola! Gracias por escribirme. Contame qué te gustaría trabajar y te armo un plan a medida.'], ['Precios', 'Te paso los planes: mensual $42.000 · trimestral $96.000. Incluye seguimiento semanal.'], ['Agenda', 'Te comparto la agenda para que elijas el turno que mejor te quede 📅']].map(([t, txt]) => `<div style="border:1px solid var(--line);border-radius:11px;padding:11px 13px;background:var(--surface-2)"><div class="nd-row-between"><strong style="font-size:12px">${t}</strong><button class="nd-tiny" style="color:var(--green);font-weight:600" data-action="copy-template" data-text="${e(txt)}">Copiar</button></div><p class="nd-small nd-muted" style="margin-top:4px">${e(txt)}</p></div>`).join('')}
        </div>
      </section>
      <section class="nd-card nd-card-pad">
        <div class="nd-eyebrow">Cómo funciona</div>
        <div class="nd-h2 nd-mt-6" style="font-size:19px">Conectá una vez, funciona siempre</div>
        <div class="nd-mt-18 nd-stack" style="gap:14px">
          ${[['plug', 'Conectás un canal', 'Instagram, email o WhatsApp con permisos de lectura y respuesta.'], ['bolt', 'Definís la regla', 'Elegís el disparador y la acción. Sin escribir código.'], ['eye', 'Lo ves en la bandeja', 'Cada acción queda registrada y podés intervenir cuando quieras.']].map(([ic, t, d], i) => `<div class="nd-row" style="align-items:flex-start;gap:11px"><span class="rule-ico" style="width:32px;height:32px">${I(ic)}</span><div><div style="font-size:12.5px;font-weight:600">${t}</div><div class="nd-small nd-muted" style="margin-top:2px">${d}</div></div></div>`).join('')}
        </div>
      </section>
    </div>`;
  };

  /* ============================================================
     CONEXIONES
     ============================================================ */
  V.conexiones = function () {
    const conns = Object.keys(ND.state.connections).map((k) => ND.state.connections[k]);
    const wa = ND.wa ? ND.wa.state : null;
    const waReady = !!(wa && wa.session && wa.session.status === 'ready');
    const waPending = !!(wa && wa.session && ['qr_ready', 'initializing', 'authenticating'].includes(wa.session.status));
    const waDown = !!(wa && (wa.gateway === 'offline' || wa.gateway === 'unconfigured'));

    return `${pageHead({
      kicker: 'Integraciones',
      title: 'Todo conectado',
      sub: 'Instagram, email, WhatsApp y calendario. Acá ves qué entra, qué sale y cuándo se sincronizó.',
      actions: `<button class="nd-btn" data-action="reset-demo">${I('refresh')}Reiniciar demo</button><button class="nd-btn is-primary" data-action="sync-all">${I('refresh')}Sincronizar todo</button>`
    })}

    <div class="nd-grid nd-split-2 nd-mb-18">
      ${conns.map((c) => {
        const isWa = c.id === 'whatsapp';
        const waDemo = !!(isWa && wa && wa.demo);
        const isOn = isWa ? (waReady || waDemo) : c.connected;
        const account = isWa && waReady && wa.session.phone ? '+' + String(wa.session.phone).replace(/^\+/, '') : c.account;
        const detail = isWa
          ? (waReady
            ? 'OpenWA · ' + (wa.session.pushName || 'WhatsApp vinculado')
            : waDemo
              ? 'Modo demo · sin OpenWA'
              : waPending
                ? 'OpenWA · escaneá el QR para vincular'
                : wa && wa.gateway === 'unconfigured'
                  ? 'OpenWA · falta configurar la API key'
                  : waDown
                    ? 'OpenWA · gateway sin conexión'
                    : 'OpenWA · WhatsApp Web')
          : c.detail;
        const synced = isWa ? (waDemo ? c.synced : waReady ? (wa.synced || 0) : 0) : c.synced;
        const fresh = isWa && waReady ? (wa.unread || 0) : c.newItems;
        const lastSync = isWa ? (waReady && wa.lastSync ? wa.lastSync : (waDemo ? c.lastSync : null)) : c.lastSync;
        const stateText = isOn ? 'Conectado' : waPending ? 'Esperando QR' : isWa && wa && wa.gateway === 'unconfigured' ? 'Falta configurar' : isWa && waDown ? 'Gateway offline' : 'Sin conectar';
        return `<article class="nd-card conn-card">
        <div class="conn-head">
          <span class="conn-logo ${c.tone}">${I(c.icon)}</span>
          <div class="nd-grow"><div class="conn-name">${e(c.name)}${isWa ? '<span class="wa-chip">OpenWA</span>' : ''}</div><div class="conn-account">${e(account)}</div></div>
          <span class="conn-status ${isOn ? '' : 'is-off'}"><span class="dot"></span>${stateText}</span>
        </div>
        <p class="nd-small nd-muted">${e(detail)}</p>
        <div class="conn-stats">
          <div class="conn-stat"><b>${ND.num(synced)}</b><span>sincronizados</span></div>
          <div class="conn-stat"><b>${isOn ? fresh : '—'}</b><span>nuevos</span></div>
          <div class="conn-stat"><b style="font-size:13px;font-family:var(--font-ui)">${lastSync ? ND.timeAgo(lastSync) : '—'}</b><span>última sync</span></div>
        </div>
        <div class="conn-actions">
          ${isWa
            ? (waReady
              ? `<button class="nd-btn is-sm" data-action="wa-sync">${I('refresh')}Sincronizar</button><button class="nd-btn is-sm is-ghost" data-action="wa-disconnect">Desconectar</button>`
              : `<button class="nd-btn is-sm is-primary" data-action="connect" data-conn="whatsapp">${I('plug')}${waPending ? 'Ver QR' : 'Conectar'}</button><span class="nd-hint">${I('whatsapp')}Escaneá el QR</span>`)
            : (c.connected
              ? `<button class="nd-btn is-sm" data-action="sync-one" data-conn="${c.id}">${I('refresh')}Sincronizar</button><button class="nd-btn is-sm is-ghost" data-action="disconnect" data-conn="${c.id}">Desconectar</button>`
              : `<button class="nd-btn is-sm is-primary" data-action="connect" data-conn="${c.id}">${I('plug')}Conectar</button><span class="nd-hint">${I('clock')}2 minutos</span>`)}
        </div>
      </article>`;
      }).join('')}
    </div>

    <section class="nd-card nd-mb-18">
      ${cardHead('Cómo fluye la información', 'De un mensaje a una clienta, sin que se pierda nada')}
      <div class="nd-card-pad">
        <div class="flow">
          ${[
            ['Llega el mensaje', 'DM, email o WhatsApp entra a Nutridash.'],
            ['Se crea el contacto', 'Se detecta si es nuevo y se arma la ficha.'],
            ['Aparece en la bandeja', 'Con historial, canal y contexto.'],
            ['Respondés o automatizás', 'Plantillas, reglas y recordatorios.'],
            ['Se convierte en clienta', 'Pasa al pipeline y a la cartera.']
          ].map(([t, d], i) => `<div class="flow-step"><div class="flow-step-n">${i + 1}</div><strong>${t}</strong><span>${d}</span></div>`).join('')}
        </div>
      </div>
    </section>

    <div class="nd-grid nd-split">
      <section class="nd-card">
        ${cardHead('Webhooks y sincronización', 'Así se conecta Nutridash con cada canal', `<span class="nd-badge is-green">${I('check')} Escuchando</span>`)}
        <div class="nd-card-pad">
          <div class="code-box"><span class="c"># endpoint de recepción</span>
<span class="k">POST</span> /api/webhooks/instagram
<span class="k">POST</span> /api/webhooks/email
<span class="k">POST</span> /api/webhooks/whatsapp

<span class="c"># eventos activos</span>
<span class="s">messages</span>, <span class="s">comments</span>, <span class="s">read_receipts</span>

<span class="c"># WhatsApp</span>
OpenWA · sesión "${e((wa && wa.sessionName) || 'nutridash')}" · ${e(wa ? (wa.gateway === 'online' ? 'gateway en línea' : 'gateway sin conexión') : 'sin consultar')}</div>
          <p class="nd-hint nd-mt-14">${I('sparkle')}WhatsApp se conecta de verdad con OpenWA. Instagram, email y calendario siguen simulados en este prototipo.</p>
        </div>
      </section>

      <section class="nd-card">
        ${cardHead('Salud de la integración', 'Estado de los últimos 7 días')}
        <div class="nd-card-pad">
          ${conns.map((c) => {
            const isWa = c.id === 'whatsapp';
            const on = isWa ? waReady : c.connected;
            const note = isWa
              ? (waReady ? 'OpenWA · sesión activa' : waPending ? 'OpenWA · esperando QR' : waDown ? 'OpenWA · gateway offline' : 'OpenWA · sin sesión')
              : (c.connected ? '99,9% uptime' : 'No conectado');
            return `<div class="nd-row-between" style="padding:10px 0;border-bottom:1px dashed var(--line)">
            <div class="nd-row" style="gap:9px">${I(c.icon, 16)}<span style="font-size:12px;font-weight:500">${e(c.name)}</span></div>
            <div class="nd-row" style="gap:8px">
              <span class="nd-tiny nd-muted">${note}</span>
              ${badge(on ? 'Operativo' : 'Pendiente', on ? 'is-green' : 'is-gold', true)}
            </div>
          </div>`;
          }).join('')}
          <div class="nd-row nd-mt-14" style="gap:8px;align-items:flex-start">
            <span class="rule-ico" style="width:30px;height:30px;background:var(--gold-soft);color:var(--gold-ink)">${I('alert')}</span>
            <p class="nd-small nd-muted" style="line-height:1.5">Conectá Google Calendar para que los turnos agendados bloqueen tu disponibilidad automáticamente.</p>
          </div>
        </div>
      </section>
    </div>`;
  };

  /* ============================================================
     DRAWER: LEAD
     ============================================================ */
  V.drawerLead = function (id) {
    const l = ND.lead(id);
    if (!l) return '';
    const meta = ND.stageMeta[l.stage];
    const conv = ND.state.conversations.find((c) => c.leadId === l.id);
    return `<div class="drawer" role="dialog" aria-modal="true" aria-label="Ficha de ${e(l.name)}">
      <div class="drawer-head">
        <div class="nd-row-between">
          <span class="nd-eyebrow">Consulta · ${e(ND.sourceMeta[l.source].label)}</span>
          <button class="drawer-close" data-action="close-overlay" aria-label="Cerrar">${I('x')}</button>
        </div>
        <div class="nd-row nd-mt-14" style="gap:13px">
          ${ND.avatar(l.name, 'is-lg')}
          <div class="nd-grow"><div class="nd-h2">${e(l.name)}</div><div class="nd-small nd-muted">${e(l.handle)}</div></div>
          ${ND.srcIcon(l.source)}
        </div>
        <div class="nd-row nd-wrap nd-mt-14" style="gap:6px">
          ${badge(meta.label, meta.badge, true)}
          ${(l.tags || []).map((t) => badge(t)).join('')}
          <span class="nd-badge is-dark">${I('target')} ${l.score}</span>
        </div>
        <div class="nd-row nd-mt-18" style="gap:8px">
          ${conv ? `<button class="nd-btn is-primary is-sm" data-action="open-conv" data-conv="${conv.id}">${I('send')}Responder</button>` : ''}
          <button class="nd-btn is-sm" data-action="new-appointment" data-name="${e(l.name)}" data-lead="${l.id}">${I('calendar')}Agendar</button>
          <button class="nd-btn is-sm" data-action="convert-lead" data-lead="${l.id}">${I('check')}Convertir en clienta</button>
        </div>
      </div>
      <div class="drawer-body">
        <section>
          <div class="drawer-section-title">Etapa del pipeline</div>
          <div class="field"><select data-stage-lead="${l.id}">${ND.optionList(ND.stageMeta, l.stage)}</select></div>
        </section>

        <section>
          <div class="drawer-section-title">Datos</div>
          <div class="nd-card nd-card-pad" style="padding:6px 16px">
            <div class="drawer-field"><span>Headline</span><span style="text-align:right">${e(l.headline)}</span></div>
            <div class="drawer-field"><span>Valor estimado</span><span class="cell-money">${ND.money(l.value)} / mes</span></div>
            <div class="drawer-field"><span>Email</span><span>${e(l.email || '—')}</span></div>
            <div class="drawer-field"><span>Teléfono</span><span>${e(l.phone || '—')}</span></div>
            <div class="drawer-field"><span>Primer contacto</span><span>${ND.dateShort(l.createdAt)}</span></div>
            <div class="drawer-field"><span>Último contacto</span><span>${ND.timeAgo(l.lastContact)}</span></div>
          </div>
        </section>

        <section>
          <div class="drawer-section-title">Tareas</div>
          <div class="nd-stack" style="gap:7px">
            ${(l.tasks || []).length ? l.tasks.map((t) => `<label class="nd-row" style="gap:9px;background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:9px 11px;cursor:pointer">
              <input type="checkbox" ${t.done ? 'checked' : ''} data-task-lead="${l.id}" data-task="${t.id}" style="accent-color:var(--green);width:15px;height:15px" />
              <span style="font-size:12px;${t.done ? 'text-decoration:line-through;color:var(--muted)' : ''}">${e(t.text)}</span>
            </label>`).join('') : `<p class="nd-small nd-muted">Sin tareas pendientes.</p>`}
            <div class="nd-row" style="gap:7px">
              <input id="task-input" placeholder="Agregar tarea y Enter…" data-note-enter="lead" data-note-lead="${l.id}" style="flex:1;border:1px solid var(--line);border-radius:9px;padding:8px 10px;font-size:12px;background:var(--surface)" />
            </div>
          </div>
        </section>

        <section>
          <div class="drawer-section-title">Nota rápida</div>
          <div class="field">
            <textarea id="note-input" placeholder="Ej: prefiere turnos por la tarde, tiene obra social…" style="min-height:64px"></textarea>
            <button class="nd-btn is-sm is-primary" data-action="add-note" data-lead="${l.id}">${I('plus')}Guardar nota</button>
          </div>
        </section>

        <section>
          <div class="drawer-section-title">Actividad</div>
          <div class="tline">
            ${(l.timeline || []).map((t) => `<div class="tline-item">
              <span class="tline-ico ${t.type === 'stage' ? 'is-gold' : t.type === 'message' ? 'is-green' : ''}">${I(t.type === 'message' ? 'message' : t.type === 'email' ? 'mail' : t.type === 'stage' ? 'target' : t.type === 'task' ? 'check_circle' : 'edit')}</span>
              <div class="nd-grow"><div class="tline-text">${e(t.text)}</div><div class="tline-time">${ND.timeAgo(t.at)}</div></div>
            </div>`).join('')}
          </div>
        </section>
      </div>
    </div>`;
  };

  /* ============================================================
     DRAWER: CLIENTA
     ============================================================ */
  V.drawerClient = function (id) {
    const c = ND.client(id);
    if (!c) return '';
    const payments = [0, 1, 2].map((i) => ({ date: new Date(new Date(c.since).getTime() + i * 30 * 864e5).toISOString(), amount: c.mrr, status: i === 0 ? 'Pagado' : 'Pagado' }));
    return `<div class="drawer" role="dialog" aria-modal="true" aria-label="Ficha de ${e(c.name)}">
      <div class="drawer-head">
        <div class="nd-row-between">
          <span class="nd-eyebrow">Clienta · desde ${ND.dateShort(c.since)}</span>
          <button class="drawer-close" data-action="close-overlay" aria-label="Cerrar">${I('x')}</button>
        </div>
        <div class="nd-row nd-mt-14" style="gap:13px">
          ${ND.avatar(c.name, 'is-lg')}
          <div class="nd-grow"><div class="nd-h2">${e(c.name)}</div><div class="nd-small nd-muted">${e(c.email)}</div></div>
          ${ND.srcIcon(c.source)}
        </div>
        <div class="nd-row nd-wrap nd-mt-14" style="gap:6px">
          ${badge(c.status, c.status === 'Activa' ? 'is-green' : 'is-gold', true)}
          ${badge(c.plan, 'is-dark')}
          ${(c.tags || []).map((t) => badge(t)).join('')}
        </div>
        <div class="nd-row nd-mt-18" style="gap:8px">
          <button class="nd-btn is-primary is-sm" data-action="msg-client" data-name="${e(c.name)}">${I('send')}Enviar mensaje</button>
          <button class="nd-btn is-sm" data-action="new-appointment" data-name="${e(c.name)}" data-client="${c.id}">${I('calendar')}Agendar</button>
          <button class="nd-btn is-sm" data-action="edit-client" data-client="${c.id}">${I('edit')}Editar</button>
        </div>
      </div>
      <div class="drawer-body">
        <div class="nd-grid nd-split-3" style="gap:8px">
          <div style="background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:12px"><div class="nd-eyebrow">Mensual</div><div style="font-family:var(--font-display);font-size:19px;font-weight:600;margin-top:4px">${ND.money(c.mrr, true)}</div></div>
          <div style="background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:12px"><div class="nd-eyebrow">Adherencia</div><div style="font-family:var(--font-display);font-size:19px;font-weight:600;margin-top:4px">${c.adherence}%</div></div>
          <div style="background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:12px"><div class="nd-eyebrow">Turnos</div><div style="font-family:var(--font-display);font-size:19px;font-weight:600;margin-top:4px">${12 + (c.id.charCodeAt(1) % 9)}</div></div>
        </div>

        <section>
          <div class="drawer-section-title">Plan actual</div>
          <div class="nd-card nd-card-pad" style="padding:14px 16px">
            <div class="nd-row-between"><div><div style="font-size:13px;font-weight:600">${e(c.plan)}</div><div class="nd-small nd-muted">Seguimiento semanal · ajustes incluidos</div></div><span class="nd-badge is-green">Activo</span></div>
            <div class="nd-mt-14"><div class="nd-row-between nd-tiny nd-muted nd-mb-14"><span>Progreso del plan</span><span>${c.adherence}% de adherencia</span></div><div class="nd-progress ${c.adherence < 70 ? 'is-gold' : ''}"><span style="width:${c.adherence}%"></span></div></div>
          </div>
        </section>

        <section>
          <div class="drawer-section-title">Próximo turno</div>
          <div class="nd-card nd-card-pad" style="padding:14px 16px">
            ${c.nextAt ? `<div class="nd-row" style="gap:12px"><span class="rule-ico">${I('calendar')}</span><div class="nd-grow"><div style="font-size:12.5px;font-weight:600">${ND.dateLong(c.nextAt)}</div><div class="nd-small nd-muted">${ND.timeOf(c.nextAt)} · Online · 45 min</div></div><span class="nd-badge is-green">Confirmado</span></div>` : `<p class="nd-small nd-muted">Sin turno agendado.</p>`}
          </div>
        </section>

        <section>
          <div class="drawer-section-title">Pagos</div>
          <div class="nd-card" style="padding:4px 16px">
            ${payments.map((p) => `<div class="drawer-field"><span>${ND.dateShort(p.date)}</span><span class="nd-row" style="gap:10px"><span class="cell-money">${ND.money(p.amount)}</span><span class="nd-badge is-green">${p.status}</span></span></div>`).join('')}
          </div>
        </section>

        <section>
          <div class="drawer-section-title">Notas privadas</div>
          <div class="nd-stack" style="gap:7px">
            ${(c.notes || []).length ? c.notes.map((n) => `<div style="background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:10px 12px;font-size:12px">${e(n)}</div>`).join('') : `<p class="nd-small nd-muted">Sin notas todavía.</p>`}
            <input placeholder="Agregar nota privada y Enter…" data-note-enter="client" data-note-client="${c.id}" style="border:1px solid var(--line);border-radius:9px;padding:8px 10px;font-size:12px;background:var(--surface)" />
          </div>
        </section>
      </div>
    </div>`;
  };

  /* ============================================================
     MODALES
     ============================================================ */
  V.modalNewLead = function () {
    return `<div class="modal" role="dialog" aria-modal="true" aria-label="Nueva consulta">
      <div class="modal-head"><div class="nd-row-between"><div><div class="nd-eyebrow">Pipeline</div><div class="nd-h2 nd-mt-6">Nueva consulta</div></div><button class="drawer-close" data-action="close-overlay">${I('x')}</button></div></div>
      <div class="modal-body">
        <div class="field"><label>Nombre y apellido</label><input id="nl-name" placeholder="Ej: Camila Ferreyra" /></div>
        <div class="field-row">
          <div class="field"><label>Canal</label><select id="nl-source">${ND.optionList({ instagram: { label: 'Instagram' }, email: { label: 'Email' }, whatsapp: { label: 'WhatsApp' }, referral: { label: 'Recomendación' }, web: { label: 'Web' } }, 'instagram')}</select></div>
          <div class="field"><label>Usuario o email</label><input id="nl-handle" placeholder="@usuario o email" /></div>
        </div>
        <div class="field"><label>¿Qué busca?</label><input id="nl-headline" placeholder="Ej: bajar 8 kg antes del verano" /></div>
        <div class="field-row">
          <div class="field"><label>Valor estimado / mes</label><input id="nl-value" type="number" value="42000" min="0" step="1000" /></div>
          <div class="field"><label>Etiqueta</label><input id="nl-tag" placeholder="Ej: Pérdida de peso" /></div>
        </div>
        <p class="nd-hint">${I('sparkle')}La consulta se crea en la etapa “Nuevas” y queda guardada en este navegador.</p>
      </div>
      <div class="modal-foot"><button class="nd-btn" data-action="close-overlay">Cancelar</button><button class="nd-btn is-primary" data-action="create-lead">${I('plus')}Crear consulta</button></div>
    </div>`;
  };

  V.modalNewClient = function () {
    return `<div class="modal" role="dialog" aria-modal="true" aria-label="Nueva clienta">
      <div class="modal-head"><div class="nd-row-between"><div><div class="nd-eyebrow">Cartera</div><div class="nd-h2 nd-mt-6">Nueva clienta</div></div><button class="drawer-close" data-action="close-overlay">${I('x')}</button></div></div>
      <div class="modal-body">
        <div class="field"><label>Nombre y apellido</label><input id="nc-name" placeholder="Ej: Renata Quiroga" /></div>
        <div class="field-row">
          <div class="field"><label>Email</label><input id="nc-email" type="email" placeholder="nombre@email.com" /></div>
          <div class="field"><label>Teléfono</label><input id="nc-phone" placeholder="+54 9 11 …" /></div>
        </div>
        <div class="field-row">
          <div class="field"><label>Plan</label><select id="nc-plan"><option>Plan Mensual</option><option>Plan Integral Trimestral</option></select></div>
          <div class="field"><label>Valor / mes</label><input id="nc-mrr" type="number" value="42000" step="1000" /></div>
        </div>
        <div class="field"><label>Origen</label><select id="nc-source">${ND.optionList({ instagram: { label: 'Instagram' }, email: { label: 'Email' }, whatsapp: { label: 'WhatsApp' }, referral: { label: 'Recomendación' }, web: { label: 'Web' } }, 'instagram')}</select></div>
      </div>
      <div class="modal-foot"><button class="nd-btn" data-action="close-overlay">Cancelar</button><button class="nd-btn is-primary" data-action="create-client">${I('plus')}Agregar clienta</button></div>
    </div>`;
  };

  V.modalAppointment = function (preset) {
    preset = preset || {};
    const clients = ND.state.clients.filter((c) => c.status !== 'En pausa');
    const today = new Date();
    const dateVal = today.toISOString().slice(0, 10);
    return `<div class="modal" role="dialog" aria-modal="true" aria-label="Nuevo turno">
      <div class="modal-head"><div class="nd-row-between"><div><div class="nd-eyebrow">Agenda</div><div class="nd-h2 nd-mt-6">Nuevo turno</div></div><button class="drawer-close" data-action="close-overlay">${I('x')}</button></div></div>
      <div class="modal-body">
        <div class="field"><label>Persona</label><select id="na-person">${clients.map((c) => `<option value="client:${c.id}"${preset.clientId === c.id ? ' selected' : ''}>${e(c.name)}</option>`).join('')}${ND.state.leads.filter((l) => !['ganada', 'pausa'].includes(l.stage)).map((l) => `<option value="lead:${l.id}"${preset.leadId === l.id ? ' selected' : ''}>${e(l.name)} · consulta</option>`).join('')}</select></div>
        <div class="field-row">
          <div class="field"><label>Fecha</label><input id="na-date" type="date" value="${dateVal}" /></div>
          <div class="field"><label>Hora</label><input id="na-time" type="time" value="10:00" /></div>
        </div>
        <div class="field-row">
          <div class="field"><label>Tipo</label><select id="na-type"><option>Primera consulta</option><option>Seguimiento</option><option>Control</option><option>Consulta online</option></select></div>
          <div class="field"><label>Modalidad</label><select id="na-channel"><option value="online">Online</option><option value="presencial">Presencial</option></select></div>
        </div>
        <p class="nd-hint">${I('calendar')}Se agrega a la agenda de esta semana.</p>
      </div>
      <div class="modal-foot"><button class="nd-btn" data-action="close-overlay">Cancelar</button><button class="nd-btn is-primary" data-action="create-appointment">${I('plus')}Agendar turno</button></div>
    </div>`;
  };

  V.modalConnect = function (id) {
    const c = ND.state.connections[id];
    if (!c) return '';
    return `<div class="modal" role="dialog" aria-modal="true" aria-label="Conectar ${e(c.name)}">
      <div class="modal-head"><div class="nd-row-between"><div class="nd-row" style="gap:11px"><span class="conn-logo ${c.tone}" style="width:38px;height:38px">${I(c.icon)}</span><div><div class="nd-eyebrow">Integración</div><div class="nd-h2 nd-mt-6" style="font-size:20px">Conectar ${e(c.name)}</div></div></div><button class="drawer-close" data-action="close-overlay">${I('x')}</button></div></div>
      <div class="modal-body">
        <p class="nd-sub">Nutridash va a leer y responder mensajes con tu permiso. Podés desconectarlo cuando quieras.</p>
        <div class="nd-card nd-card-pad" style="padding:14px 16px">
          <div class="nd-eyebrow nd-mb-14">Permisos que pedimos</div>
          ${[['Leer mensajes y comentarios', 'Para crear contactos y no perder consultas.'], ['Enviar respuestas', 'Sólo cuando vos o una regla lo disparen.'], ['Ver datos de perfil', 'Nombre y usuario para identificar el canal.']].map(([t, d]) => `<div class="nd-row" style="align-items:flex-start;gap:9px;padding:7px 0"><span style="width:18px;height:18px;border-radius:99px;background:var(--lime-soft);color:var(--green);display:grid;place-items:center;flex:0 0 auto">${I('check', 11)}</span><div><div style="font-size:12px;font-weight:600">${t}</div><div class="nd-tiny nd-muted">${d}</div></div></div>`).join('')}
        </div>
        <div class="nd-row" style="gap:8px;background:var(--gold-soft);border-radius:10px;padding:10px 12px"><span style="color:var(--gold-ink)">${I('alert', 15)}</span><span class="nd-tiny" style="color:var(--gold-ink)">Demo: la conexión es simulada y no se envía ningún dato real.</span></div>
      </div>
      <div class="modal-foot"><button class="nd-btn" data-action="close-overlay">Cancelar</button><button class="nd-btn is-primary" data-action="confirm-connect" data-conn="${id}">${I('plug')}Conectar ahora</button></div>
    </div>`;
  };

  V.modalWhatsApp = function () {
    const wa = ND.wa ? ND.wa.state : null;
    const session = wa && wa.session;
    const ready = !!(session && session.status === 'ready');
    const pending = !!(session && ['qr_ready', 'initializing', 'authenticating'].includes(session.status));
    const offline = !wa || wa.gateway === 'offline';
    const unconfigured = wa && wa.gateway === 'unconfigured';
    const error = wa && wa.error && !unconfigured ? wa.error : null;
    const phone = session && session.phone ? '+' + String(session.phone).replace(/^\+/, '') : '';
    const cmd = 'docker compose -f docker-compose.openwa.yml up -d';

    let panel;
    if (ready) {
      panel = `<div class="wa-live"><span id="wa-live-dot" class="wa-dot is-on"></span><span id="wa-live-status">${e(ND.wa.statusLabel())}</span></div>
        <div class="wa-grid">
          <div><span class="wa-k">Número</span><b>${e(phone || '—')}</b></div>
          <div><span class="wa-k">Cuenta</span><b>${e((session && session.pushName) || 'WhatsApp')}</b></div>
          <div><span class="wa-k">Sesión</span><b>${e((wa && wa.sessionName) || 'nutridash')}</b></div>
          <div><span class="wa-k">Chats sincronizados</span><b>${wa && wa.synced ? ND.num(wa.synced) : '—'}</b></div>
        </div>
        <p class="nd-small nd-muted">La sesión queda vinculada en OpenWA. Podés sincronizar chats o cerrar sesión cuando quieras.</p>`;
    } else if (unconfigured) {
      panel = `<div class="wa-offline">
        <div class="nd-row" style="gap:9px;align-items:flex-start"><span class="wa-offline-ico">${I('alert', 18)}</span><div><b>Falta la API key de OpenWA</b><p class="nd-small nd-muted" style="margin-top:2px">El servidor necesita la clave para hablar con el gateway. El navegador nunca la ve.</p></div></div>
        <ol class="wa-steps">
          <li>Levantá OpenWA: <code>${e(cmd)}</code></li>
          <li>Sacá la clave: <code>docker exec openwa-api cat /app/data/.api-key</code></li>
          <li>Creá <code>nutridash/.env</code> con <code>OPENWA_API_KEY=…</code></li>
          <li>Reiniciá <code>npm start</code> y volvé a intentar.</li>
        </ol>
      </div>`;
    } else if (offline) {
      panel = `<div class="wa-offline">
        <div class="nd-row" style="gap:9px;align-items:flex-start"><span class="wa-offline-ico">${I('alert', 18)}</span><div><b>OpenWA no está corriendo</b><p class="nd-small nd-muted" style="margin-top:2px">Nutridash no pudo alcanzar el gateway en <code>${e((wa && wa.gatewayUrl) || 'http://127.0.0.1:2785')}</code>.</p></div></div>
        <p class="nd-small">Levantalo con Docker y después reintentá:</p>
        <div class="wa-cmd"><code>${e(cmd)}</code><button class="nd-btn is-sm is-ghost" data-action="copy-cmd" data-text="${e(cmd)}">${I('copy', 14)}Copiar</button></div>
      </div>`;
    } else {
      panel = `<div class="wa-pair">
        <div class="wa-qr">
          <img id="wa-qr-img" alt="Código QR para vincular WhatsApp" ${wa && wa.qr ? '' : 'hidden'} src="${wa && wa.qr ? wa.qr : ''}" />
          <div id="wa-qr-empty" class="wa-qr-empty" ${wa && wa.qr ? 'hidden' : ''}>
            ${I('whatsapp', 26)}
            <span>${pending ? 'Generando el QR…' : 'Todavía no hay un QR'}</span>
            <button class="nd-btn is-sm" data-action="wa-connect">${I('refresh')}Generar QR</button>
          </div>
        </div>
        <div class="wa-pair-side">
          <div class="wa-live"><span id="wa-live-dot" class="wa-dot ${pending ? 'is-wait' : 'is-off'}"></span><span id="wa-live-status">${e(wa ? ND.wa.statusLabel() : 'Consultando OpenWA…')}</span></div>
          <ol class="wa-steps">
            <li>Abrí WhatsApp en tu teléfono.</li>
            <li>Entrá a <b>Dispositivos vinculados</b> → <b>Vincular un dispositivo</b>.</li>
            <li>Escaneá el código de la izquierda.</li>
          </ol>
          <p class="nd-tiny nd-muted">El QR se renueva solo. Esta pantalla se actualiza cada pocos segundos.</p>
          <button class="nd-btn is-sm is-ghost" data-action="wa-qr">${I('refresh')}Actualizar QR</button>
        </div>
      </div>`;
    }

    return `<div class="modal wa-modal" role="dialog" aria-modal="true" aria-label="WhatsApp con OpenWA">
      <div class="modal-head"><div class="nd-row-between"><div class="nd-row" style="gap:11px"><span class="conn-logo is-whatsapp" style="width:38px;height:38px">${I('whatsapp')}</span><div><div class="nd-eyebrow">Integración · OpenWA</div><div class="nd-h2 nd-mt-6" style="font-size:20px">WhatsApp</div></div></div><button class="drawer-close" data-action="close-overlay">${I('x')}</button></div></div>
      <div class="modal-body">
        ${panel}
        ${error ? `<div class="nd-row wa-error" style="gap:8px">${I('alert', 14)}<span>${e(error)}</span></div>` : ''}
        <div class="wa-disclaimer">${I('alert', 14)}<span>OpenWA usa WhatsApp Web, no la API oficial de Meta. Usá un <b>número dedicado</b> y no lo expongas a internet. Para producción con datos de pacientes, la opción recomendada es WhatsApp Cloud API.</span></div>
      </div>
      <div class="modal-foot">
        ${ready
          ? `<button class="nd-btn" data-action="wa-sync">${I('refresh')}Sincronizar</button><button class="nd-btn is-ghost" data-action="wa-disconnect">Desconectar</button><button class="nd-btn is-primary" data-action="close-overlay">Cerrar</button>`
          : `<button class="nd-btn is-ghost" data-action="wa-demo">Usar modo demo</button><button class="nd-btn" data-action="wa-refresh">${I('refresh')}Reintentar</button><button class="nd-btn is-primary" data-action="close-overlay">Cerrar</button>`}
      </div>
    </div>`;
  };

  V.modalNewAutomation = function () {
    return `<div class="modal" role="dialog" aria-modal="true" aria-label="Nueva automatización">
      <div class="modal-head"><div class="nd-row-between"><div><div class="nd-eyebrow">Automatizaciones</div><div class="nd-h2 nd-mt-6">Nueva regla</div></div><button class="drawer-close" data-action="close-overlay">${I('x')}</button></div></div>
      <div class="modal-body">
        <div class="field"><label>Nombre</label><input id="nr-title" placeholder="Ej: Seguimiento a los 7 días" /></div>
        <div class="field"><label>Disparador</label><select id="nr-trigger"><option>DM nuevo</option><option>Email entrante</option><option>Sin respuesta 48 h</option><option>Turno agendado</option><option>30 días inactiva</option></select></div>
        <div class="field"><label>Acción</label><select id="nr-action"><option>Responder + crear lead</option><option>Crear tarea</option><option>WhatsApp automático</option><option>Email de reseña</option></select></div>
        <p class="nd-hint">${I('bolt')}La regla se activa al guardarla y queda registrada en la bandeja.</p>
      </div>
      <div class="modal-foot"><button class="nd-btn" data-action="close-overlay">Cancelar</button><button class="nd-btn is-primary" data-action="create-automation">${I('plus')}Crear regla</button></div>
    </div>`;
  };

  V.palette = function (query) {
    const q = (query || '').toLowerCase().trim();
    const actions = [
      { label: 'Ir a Resumen', view: 'resumen', icon: 'home' },
      { label: 'Ir a Pipeline', view: 'pipeline', icon: 'pipeline' },
      { label: 'Ir a Bandeja', view: 'bandeja', icon: 'inbox' },
      { label: 'Ir a Clientas', view: 'clientas', icon: 'users' },
      { label: 'Ir a Agenda', view: 'agenda', icon: 'calendar' },
      { label: 'Ir a Analítica', view: 'analitica', icon: 'chart' },
      { label: 'Ir a Conexiones', view: 'conexiones', icon: 'plug' },
      { label: 'Nueva consulta', action: 'new-lead', icon: 'plus' },
      { label: 'Nuevo turno', action: 'new-appointment', icon: 'calendar' }
    ].filter((a) => !q || a.label.toLowerCase().includes(q)).slice(0, q ? 9 : 5);

    const leads = ND.state.leads.filter((l) => !q || (l.name + ' ' + l.handle).toLowerCase().includes(q)).slice(0, 5);
    const clients = ND.state.clients.filter((c) => !q || (c.name + ' ' + c.email).toLowerCase().includes(q)).slice(0, 4);

    return `<div class="palette" role="dialog" aria-modal="true" aria-label="Buscador">
      <div class="palette-input">${I('search')}<input id="palette-input" value="${e(query || '')}" placeholder="Buscar clientas, consultas o ir a…" /><kbd>Esc</kbd></div>
      <div class="palette-results" id="palette-results">
        ${actions.length ? `<div class="palette-group">Ir a</div>${actions.map((a) => `<button class="palette-item" data-view="${a.view || ''}" ${a.action ? `data-action="${a.action}"` : ''}>${I(a.icon)}<span>${e(a.label)}</span></button>`).join('')}` : ''}
        ${leads.length ? `<div class="palette-group">Consultas</div>${leads.map((l) => `<button class="palette-item" data-action="open-lead" data-lead="${l.id}">${ND.avatar(l.name, 'is-xs')}<span>${e(l.name)}</span><span class="nd-muted">${e(ND.stageMeta[l.stage].label)}</span></button>`).join('')}` : ''}
        ${clients.length ? `<div class="palette-group">Clientas</div>${clients.map((c) => `<button class="palette-item" data-action="open-client" data-client="${c.id}">${ND.avatar(c.name, 'is-xs')}<span>${e(c.name)}</span><span class="nd-muted">${e(c.plan)}</span></button>`).join('')}` : ''}
        ${!actions.length && !leads.length && !clients.length ? `<div class="nd-empty">Sin resultados para “${e(query)}”</div>` : ''}
      </div>
    </div>`;
  };

  V.expenseNote = '';
})();
