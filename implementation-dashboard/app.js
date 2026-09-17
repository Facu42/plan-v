const $ = selector => document.querySelector(selector);
const main = $('#main');
const dialog = $('#task-dialog');
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const paths = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  list: '<path d="M9 6h12M9 12h12M9 18h12M3 6l1 1 2-2M3 12l1 1 2-2M3 18l1 1 2-2"/>',
  route: '<circle cx="5" cy="5" r="2"/><circle cx="19" cy="19" r="2"/><path d="M7 5h9a4 4 0 0 1 0 8H8a3 3 0 0 0 0 6h9"/>',
  shield: '<path d="M12 3l8 3v6c0 5-8 9-8 9s-8-4-8-9V6zM8 12l3 3 5-6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  document: '<path d="M14 3H5v18h14V8zM14 3v5h5M8 12h8M8 16h6"/>',
  arrow: '<path d="M5 12h14M14 7l5 5-5 5"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5M4 16v5h16v-5"/>',
  check: '<path d="M5 12l4 4L19 6"/>',
  flag: '<path d="M5 22V3M5 4c5-4 9 4 14 0v10c-5 4-9-4-14 0"/>',
  circle: '<circle cx="12" cy="12" r="9"/><path d="M12 8v4m0 4h.01"/>',
  layout: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 9v11"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-3a8 5 0 0 1 16 0v3"/>',
  spark: '<path d="M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z"/>',
  database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 4 16 4 16 0V5M4 12c0 4 16 4 16 0"/>',
  close: '<path d="M6 6l12 12M6 18L18 6"/>',
};
const icon = name => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${paths[name] ?? paths.circle}</svg>`;
const views = [
  ['overview', 'Vista general', 'grid'], ['tasks', 'Entregas', 'list'], ['roadmap', 'Hoja de ruta', 'route'],
  ['findings', 'Hallazgos', 'shield'], ['activity', 'Actividad', 'clock'], ['documents', 'Documentación', 'document'],
];
let board, currentView = 'overview', tableMode = 'table', dialogRevision, dialogTaskId, lastFocus, toastTimer;
let filters = { search: '', milestone: '', status: '', priority: '' };
let fetching = false;
const done = ids => ids.filter(id => board.tasks.find(t => t.id === id)?.status === 'done').length;
const percent = (count, total) => total ? Math.round(count / total * 100) : 0;
const date = value => new Date(value).toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
const badge = status => `<span class="badge ${escape(status)}">${escape(board.statuses[status])}</span>`;
const ticketButtons = ids => ids.map(id => `<button class="ticket-link" data-task="${id}" aria-label="Abrir entrega ${id}">${id}</button>`).join('');
const priority = value => `<span class="priority ${value}" title="${value === 'P0' ? 'Necesaria para el piloto' : value === 'P1' ? 'Producto completo / paridad' : 'Expansión posterior'}">${value}</span>`;

function toast(message) {
  $('#toast').textContent = message; $('#toast').classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 4000);
}
function connection(connected) {
  $('#connection').classList.toggle('offline', !connected);
  $('#connection').innerHTML = `<span class="connection-dot"></span>${connected ? 'Guardado en el proyecto' : 'Sin conexión · datos sin actualizar'}`;
}
async function load(initial = false) {
  if (fetching) return;
  fetching = true;
  try {
    const response = await fetch('/api/board');
    const next = await response.json();
    if (!response.ok) throw new Error(next.error);
    const changed = board?.revision !== next.revision;
    board = next; connection(true);
    $('#last-read').textContent = `Última lectura ${new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} · actualización cada 15 s`;
    if ((changed || initial) && !dialog.open) render();
    document.querySelector('[data-load-error]')?.remove();
    return true;
  } catch (error) {
    connection(false);
    if (!board) main.innerHTML = `<div class="empty"><h1>No se pudo abrir el tablero</h1><p>${escape(error.message)}</p><button class="btn" data-retry>Volver a intentar</button></div>`;
    else if (!document.querySelector('[data-load-error]')) main.insertAdjacentHTML('afterbegin', `<div class="error-banner" data-load-error role="alert">${escape(error.message)} <button class="text-btn" data-retry>Reintentar</button></div>`);
    return false;
  } finally { fetching = false; }
}
function heading(title, subtitle) {
  return `<div class="page-heading"><div><div class="eyebrow">DEL PLAN A LA PRÁCTICA</div><h1>${title}</h1><p>${subtitle}</p></div><div class="actions"><a class="btn" href="/api/export" download>${icon('download')}<span>Exportar tablero</span></a></div></div>`;
}
function navigation() {
  $('#navigation').innerHTML = views.map(([id, label, name]) => `<a class="nav-item" href="#${id}" ${id === currentView ? 'aria-current="page"' : ''}>${icon(name)}${label}${id === 'tasks' || id === 'findings' ? `<span class="nav-count">${id === 'tasks' ? board.tasks.length : board.findings.length}</span>` : ''}</a>`).join('');
}
function taskTable(tasks) {
  if (!tasks.length) return '<div class="empty"><h3>No hay entregas con estos filtros</h3><p>Probá con otra búsqueda o quitá los filtros para ver el plan completo.</p><button class="btn" data-clear>Limpiar filtros</button></div>';
  return `<div class="table-wrap"><table class="task-table"><thead><tr><th scope="col">ENTREGA</th><th scope="col">ESTADO</th><th scope="col" class="hide-mobile">PRIORIDAD</th><th scope="col" class="hide-mobile">DEPENDENCIAS</th></tr></thead><tbody>${tasks.map(t => `<tr><td><button class="task-name" data-task="${t.id}" aria-label="Abrir ${t.id}: ${escape(t.title)}"><span class="task-code">${t.id} <span aria-hidden="true">·</span> ${t.milestone}</span>${escape(t.title)}<span class="task-subtitle">${escape(t.owner || 'Sin asignar')} · ${escape(t.roles)}</span></button></td><td>${badge(t.status)}</td><td class="hide-mobile">${priority(t.priority)}</td><td class="hide-mobile">${t.waitingFor.length ? `<span class="waiting-text" title="${t.waitingFor.join(', ')}">Espera ${t.waitingFor.length} ${t.waitingFor.length === 1 ? 'entrega' : 'entregas'}</span>` : `<span class="ready-text">${t.status === 'done' ? 'Verificadas' : 'Resueltas'}</span>`}</td></tr>`).join('')}</tbody></table></div>`;
}
function coveragePanel() {
  return `<section class="panel"><div class="panel-header"><div><h2>Lo que hay que resolver</h2><p>Los cinco puntos clave de la revisión</p></div>${icon('shield')}</div><div class="coverage-list">${board.coverage.map(item => `<div class="coverage-item"><div class="coverage-title">${icon(item.icon)}<h3>${escape(item.title)}</h3></div><p>${escape(item.description)}</p><div class="coverage-bottom">${ticketButtons(item.tasks)}<span class="coverage-count">${done(item.tasks)}/${item.tasks.length}</span></div></div>`).join('')}</div><div class="coverage-foot">Cada punto está contemplado en el plan. Su cierre requiere completar y verificar las entregas vinculadas.</div></section>`;
}
function overview() {
  const completed = board.tasks.filter(t => t.status === 'done').length;
  const active = board.tasks.filter(t => ['in_progress', 'review'].includes(t.status)).length;
  const blocked = board.tasks.filter(t => t.status === 'blocked').length;
  const ready = board.tasks.filter(t => t.ready);
  const waiting = board.tasks.filter(t => t.status === 'pending' && t.waitingFor.length).length;
  const p0 = board.tasks.filter(t => t.priority === 'P0');
  const p0Done = p0.filter(t => t.status === 'done').length;
  const next = board.tasks.find(t => t.status === 'in_progress') ?? ready[0] ?? board.tasks.find(t => t.status !== 'done');
  const currentMilestone = board.milestones.find(m => done(m.tasks) < m.tasks.length)?.id;
  const upcoming = board.tasks.filter(t => t.status !== 'done').slice(0, 8);
  return `${heading('Plan de implementación', 'Un recorrido claro para conectar pacientes y nutricionista.')}<section class="panel progress-panel" aria-label="Avance del plan restante"><div class="progress-main"><div class="progress-top"><div><div class="progress-label">Avance del plan restante</div><div class="progress-numbers"><strong>${percent(completed, board.tasks.length)}<span style="font-size:25px;color:var(--text)">%</span></strong><span>${completed} de ${board.tasks.length} entregas completadas</span></div></div><span class="progress-key">${completed ? 'En implementación' : 'Punto de partida'}</span></div><div class="segments" aria-label="Una barra por entrega">${board.tasks.map(t => `<button class="segment ${t.status}" data-task="${t.id}" title="${t.id}: ${escape(t.title)} — ${escape(board.statuses[t.status])}" aria-label="${t.id}: ${escape(t.title)}, ${escape(board.statuses[t.status])}"></button>`).join('')}</div><p class="progress-note">La demo existente es reutilizable. Este porcentaje mide las entregas pendientes para llevarla a producción.</p></div><div class="next-step"><span class="tiny-label">${next?.status === 'in_progress' ? 'EN FOCO' : 'PRÓXIMO PASO'}</span>${next ? `<span class="mono muted">${next.id} · ${next.milestone}</span><h3>${escape(next.title)}</h3><p>${next.waitingFor.length ? `Requiere ${next.waitingFor.join(', ')}.` : 'Dependencias resueltas. Puede avanzar.'}</p><button class="text-btn" data-task="${next.id}">Abrir entrega ${icon('arrow')}</button>` : '<h3>Plan completado</h3><p>Consultá la evidencia de cada entrega antes de decidir el lanzamiento.</p>'}</div></section><div class="metric-grid"><div class="metric"><div class="metric-top">Entregas en curso ${icon('clock')}</div><div class="metric-value"><strong>${active}</strong><span>/ ${board.tasks.length}</span></div><small>Incluye las que están en revisión</small></div><div class="metric"><div class="metric-top">Listas para iniciar ${icon('arrow')}</div><div class="metric-value"><strong>${ready.length}</strong></div><small>Sin dependencias pendientes</small></div><div class="metric"><div class="metric-top">Bloqueos reportados ${icon('circle')}</div><div class="metric-value"><strong>${blocked}</strong></div><small>${waiting} pendientes esperan dependencias</small></div><div class="metric"><div class="metric-top">Entregas para el piloto ${icon('flag')}</div><div class="metric-value"><strong>${p0Done}</strong><span>/ ${p0.length} P0</span></div><small>El piloto requiere validación final</small></div></div><section aria-label="Hitos del plan"><div class="section-heading"><h2>De la base al lanzamiento</h2><span>Siete hitos · avance por entregas</span></div><div class="milestone-strip">${board.milestones.map(m => `<button class="milestone-tile ${m.id === currentMilestone ? 'current' : ''}" data-milestone="${m.id}" aria-label="Ver ${m.id}: ${escape(m.title)}"><div class="milestone-label">${m.id}${m.id === currentMilestone ? '<span class="dot"></span>' : ''}</div><h3>${escape(m.title)}</h3><div class="mini-track"><span style="width:${percent(done(m.tasks), m.tasks.length)}%"></span></div><small>${done(m.tasks)} / ${m.tasks.length} completadas</small></button>`).join('')}</div></section><div class="overview-grid"><section class="panel"><div class="panel-header"><div><h2>Próximas entregas</h2><p>Orden del plan · abrí una entrega para actualizarla</p></div><a class="text-btn" href="#tasks">Ver todas ${icon('arrow')}</a></div>${upcoming.length ? taskTable(upcoming) : '<div class="empty">Todas las entregas tienen evidencia de cierre.</div>'}<div class="table-bottom">${upcoming.length} de ${board.tasks.filter(t => t.status !== 'done').length} entregas sin completar · P0 = necesario para el piloto</div></section>${coveragePanel()}</div>`;
}
function selectFilter(name, title, options) {
  return `<label class="filter">${title}<select name="${name}" data-filter="${name}">${options.map(([value, label]) => `<option value="${value}" ${filters[name] === value ? 'selected' : ''}>${escape(label)}</option>`).join('')}</select></label>`;
}
function filteredTasks() {
  const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  return board.tasks.filter(t => (!filters.milestone || t.milestone === filters.milestone) && (!filters.priority || t.priority === filters.priority) && (!filters.status || (filters.status === 'ready' ? t.ready : t.status === filters.status)) && normalize(`${t.id} ${t.title} ${t.acceptance} ${t.roles} ${t.owner}`).includes(normalize(filters.search.trim())));
}
function taskResults() {
  const tasks = filteredTasks();
  if (tableMode === 'table') return `<div class="panel">${taskTable(tasks)}<div class="table-bottom">${tasks.length} de ${board.tasks.length} entregas · tocá el nombre para abrir el detalle</div></div>`;
  return `<div class="kanban">${['pending', 'in_progress', 'review', 'blocked', 'done'].map(status => { const group = tasks.filter(t => t.status === status); return `<section class="kanban-column" aria-label="${escape(board.statuses[status])}"><div class="kanban-header">${badge(status)}<span class="mono muted">${group.length}</span></div>${group.map(t => `<button class="kanban-card" data-task="${t.id}"><span class="task-code">${t.id} · ${t.milestone}</span><h3>${escape(t.title)}</h3><div class="kanban-card-footer">${priority(t.priority)}<span class="mono muted">${t.size} · ${escape(t.roles)}</span></div><span class="task-subtitle">${escape(t.owner || 'Sin asignar')}${t.waitingFor.length ? ` · Espera ${t.waitingFor.length}` : ''}</span></button>`).join('') || '<p class="kanban-empty">Sin entregas en este estado</p>'}</section>`; }).join('')}</div><p class="note">Abrí una tarjeta para cambiar su estado y registrar evidencia. Las dependencias se validan al completarla.</p>`;
}
function tasksView() {
  return `${heading('Todas las entregas', 'Prioridades, dependencias y un criterio de cierre para cada paso.')}<div class="filters"><label class="filter search">Buscar entrega<input type="search" name="search" data-filter="search" placeholder="Nombre, ID, responsable…" value="${escape(filters.search)}" autocomplete="off"></label>${selectFilter('milestone', 'Hito', [['', 'Todos los hitos'], ...board.milestones.map(m => [m.id, `${m.id} · ${m.title}`])])}${selectFilter('status', 'Estado', [['', 'Todos los estados'], ['ready', 'Listas para iniciar'], ...Object.entries(board.statuses)])}${selectFilter('priority', 'Prioridad', [['', 'Todas'], ['P0', 'P0 · Piloto'], ['P1', 'P1 · Producto'], ['P2', 'P2 · Expansión']])}<button class="btn subtle" data-clear>Limpiar</button></div><div class="view-toggles" aria-label="Formato de vista"><button data-mode="table" aria-pressed="${tableMode === 'table'}">Tabla</button><button data-mode="kanban" aria-pressed="${tableMode === 'kanban'}">Tablero</button></div><div id="task-results">${taskResults()}</div>`;
}
function roadmapView() {
  return `${heading('Hoja de ruta', 'Siete resultados utilizables, con dependencias antes que fechas inventadas.')}<div class="roadmap-intro">${icon('route')}<p>Base y privacidad → datos → ingreso → plan nutricional → IA supervisada → piloto.<br>Sin fecha comprometida. La capacidad del equipo y la validación de cada hito definen el ritmo.</p></div><div class="roadmap">${board.milestones.map(m => `<section class="panel roadmap-card"><div class="roadmap-id">${m.id}</div><div><h2>${escape(m.title)}</h2><p>${escape(m.description)}</p><div class="roadmap-tickets">${ticketButtons(m.tasks)}</div></div><div class="roadmap-progress"><div><span>${done(m.tasks)}/${m.tasks.length} completadas</span><strong>${percent(done(m.tasks), m.tasks.length)}%</strong></div><div class="mini-track"><span style="width:${percent(done(m.tasks), m.tasks.length)}%"></span></div><button class="text-btn" data-milestone="${m.id}">Ver entregas ${icon('arrow')}</button></div></section>`).join('')}</div><p class="note" style="margin-top:18px">Los hitos agrupan el trabajo; las dependencias entre tickets determinan qué puede avanzar. PV-32 pasa a P0 si se decide cobrar durante el piloto: esa decisión requiere actualizar el plan fuente.</p>`;
}
function findingsView() {
  return `${heading('Hallazgos de arquitectura', 'Cada problema detectado tiene entregas asociadas para corregirlo.')}<p class="note" style="margin-bottom:20px">Hallazgos de la revisión local del 16 sep 2026. Los contadores reflejan cierres registrados; no vuelven a auditar el código automáticamente.</p><div class="finding-list">${board.findings.map(f => `<section class="panel finding"><div><span class="mono">${f.id}</span><div class="severity">${escape(f.severity)}</div></div><div><h3>${escape(f.consequence.replaceAll('`', ''))}</h3><p class="evidence">${escape(f.evidence.replaceAll('`', ''))}</p><div class="roadmap-tickets">${ticketButtons(f.tasks)}</div></div><div class="finding-progress"><strong>${done(f.tasks)} / ${f.tasks.length}</strong>entregas completadas<br>${done(f.tasks) === f.tasks.length ? 'Consultar evidencia de cierre' : 'Corrección pendiente'}</div></section>`).join('')}</div>`;
}
function activityView() {
  const fields = { status: 'estado', owner: 'responsable', notes: 'notas', evidence: 'evidencia' };
  return `${heading('Actividad del plan', 'Un registro de los cambios guardados desde este tablero.')}<section class="panel">${board.history.length ? `<div class="activity-list">${[...board.history].reverse().map(entry => `<div class="activity-row"><span class="activity-icon">${icon(entry.to === 'done' ? 'check' : 'clock')}</span><div>${ticketButtons([entry.taskId])}<p>${entry.from === entry.to ? 'Detalle actualizado' : `${escape(board.statuses[entry.from] || entry.from)} → ${escape(board.statuses[entry.to] || entry.to)}`}</p><small>${escape(date(entry.at))} · ${escape(entry.fields.map(f => fields[f] || f).join(', '))}</small></div></div>`).join('')}</div>` : '<div class="empty"><h3>El recorrido empieza acá</h3><p>Todavía no hay cambios registrados. Abrí una entrega y guardá su estado, responsable o notas para iniciar el seguimiento.</p><a class="btn primary" href="#tasks">Ver entregas</a></div>'}</section><p class="note" style="margin-top:15px">Seguimiento local sin cuentas de usuario. El responsable de una entrega no identifica a quien realizó el cambio.</p>`;
}
function documentsView() {
  return `${heading('Documentación del proyecto', 'El criterio técnico y de producto que sostiene cada entrega.')}<div class="documents-grid">${board.documents.map(d => `<a class="panel document-card" href="/docs/${d.id}" target="_blank" rel="noopener">${icon('document')}<div><h2>${escape(d.title)} ↗</h2><p>${escape(d.path)}</p></div></a>`).join('')}</div><section class="panel baseline"><div class="section-heading"><h2>Evidencia inicial de la auditoría</h2><span>16 sep 2026 · registro histórico</span></div><div class="baseline-grid"><div><strong>370 pruebas</strong><small>73 archivos aprobados en la revisión</small></div><div><strong>TypeScript aprobado</strong><small>Cliente y servidor</small></div><div><strong>Build aprobado</strong><small>121 módulos · superficies legacy</small></div></div><p class="note">Es evidencia de la revisión original, no un resultado de CI en vivo. No demuestra RLS real ni preparación para pacientes. Las nuevas verificaciones se registran dentro de cada entrega.</p></section><section class="panel baseline"><h2>Cómo se guarda el avance</h2><p class="note">El backlog se lee del plan de acción. Los estados, responsables, notas y evidencias se guardan en <span class="mono">tasks/implementation-status.json</span>. El tablero vuelve a leer la fuente cada 15 segundos. Las fichas abiertas conservan tu edición y detectan conflictos al guardar.</p><p class="note">El cierre requiere evidencia y dependencias completas. El tablero registra seguimiento: no ejecuta el desarrollo ni verifica por sí mismo lo escrito como evidencia.</p></section>`;
}
function render() {
  const requested = location.hash.slice(1);
  currentView = views.some(([id]) => id === requested) ? requested : 'overview';
  navigation();
  main.innerHTML = ({ overview, tasks: tasksView, roadmap: roadmapView, findings: findingsView, activity: activityView, documents: documentsView })[currentView]();
  document.title = `${views.find(([id]) => id === currentView)[1]} · Plan V`;
}

function openTask(id) {
  const t = board.tasks.find(task => task.id === id);
  if (!t) return;
  if (!dialog.open) lastFocus = document.activeElement;
  dialogTaskId = id; dialogRevision = board.revision;
  const milestone = board.milestones.find(m => m.id === t.milestone);
  $('#dialog-body').innerHTML = `<form id="task-form"><div class="dialog-header"><div><span class="mono muted">${t.id} · ${t.milestone} / ${escape(milestone.title)}</span><h2 id="dialog-title">${escape(t.title)}</h2></div><button type="button" class="close-button" data-close aria-label="Cerrar detalle">${icon('close')}</button></div><div class="dialog-content"><div class="detail-meta">${priority(t.priority)}<span>Tamaño ${t.size} · estimación inicial</span><span>Roles: ${escape(t.roles)}</span></div><section class="acceptance"><h3>Qué tiene que quedar funcionando</h3><p>${escape(t.acceptance)}</p></section><section class="dependency-block"><h3>Dependencias</h3><div class="dependency-list">${t.dependencies.length ? t.dependencies.map(id => { const dependency = board.tasks.find(d => d.id === id); return `<span class="dependency ${dependency.status === 'done' ? 'done' : ''}" title="${escape(dependency.title)}">${id} · ${dependency.status === 'done' ? 'completada' : 'pendiente de cierre'}</span>`; }).join('') : '<span class="ready-text">Sin dependencias. Puede iniciarse.</span>'}</div>${t.waitingFor.length ? '<p class="dependency-note">Podés preparar esta entrega. Para completarla, primero cerrá sus dependencias.</p>' : ''}</section><div class="form-grid"><label class="field">Estado<select name="status">${Object.entries(board.statuses).map(([value, label]) => `<option value="${value}" ${t.status === value ? 'selected' : ''}>${escape(label)}</option>`).join('')}</select></label><label class="field">Responsable<input name="owner" maxlength="120" placeholder="Nombre de la persona" value="${escape(t.owner)}" autocomplete="off"></label></div><label class="field">Notas de trabajo<textarea name="notes" maxlength="8000" placeholder="Decisiones, avances o motivo de un bloqueo…">${escape(t.notes)}</textarea></label><label class="field">Evidencia de verificación<textarea name="evidence" maxlength="8000" placeholder="PR, archivo, prueba ejecutada y resultado…">${escape(t.evidence)}</textarea><small>Obligatoria para completar. Registrá evidencia concreta; guardar no ejecuta pruebas.</small></label><div id="form-message" aria-live="polite"></div></div><div class="dialog-footer"><span class="note">${t.updatedAt ? `Último cambio: ${escape(date(t.updatedAt))}` : 'Aún no se registraron cambios en esta entrega.'}</span><button type="submit" class="btn primary" id="save-task">${icon('check')}Guardar cambios</button></div></form>`;
  if (!dialog.open) dialog.showModal();
}
async function saveTask(event) {
  event.preventDefault();
  const input = Object.fromEntries(new FormData(event.target));
  input.revision = dialogRevision;
  const button = $('#save-task'); button.disabled = true;
  $('#form-message').replaceChildren();
  try {
    const response = await fetch(`/api/tasks/${dialogTaskId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
    const result = await response.json();
    if (!response.ok) {
      $('#form-message').innerHTML = `<div class="form-error" role="alert">${escape(result.error)}${response.status === 409 ? '<div class="conflict-actions"><button type="button" class="text-btn" data-reload-task>Recargar ficha y descartar esta edición</button></div>' : ''}</div>`;
      $('#form-message').scrollIntoView({ block: 'nearest' }); return;
    }
    board = result; connection(true); dialog.close(); render(); toast(`${dialogTaskId}: cambios guardados`);
  } catch {
    $('#form-message').innerHTML = '<div class="form-error" role="alert">No se pudo confirmar el guardado. Conservamos tu edición. Revisá la conexión y reintentá; si ya se guardó, el tablero avisará del conflicto.</div>';
    connection(false);
  } finally { if (button.isConnected) button.disabled = false; }
}

document.addEventListener('click', async event => {
  const target = event.target.closest('button, a');
  if (!target) return;
  if (target.hasAttribute('data-task')) openTask(target.dataset.task);
  if (target.hasAttribute('data-milestone')) { filters = { search: '', milestone: target.dataset.milestone, status: '', priority: '' }; if (location.hash === '#tasks') render(); else location.hash = 'tasks'; }
  if (target.hasAttribute('data-mode')) { tableMode = target.dataset.mode; render(); }
  if (target.hasAttribute('data-clear')) { filters = { search: '', milestone: '', status: '', priority: '' }; render(); }
  if (target.hasAttribute('data-close')) dialog.close();
  if (target.hasAttribute('data-retry')) await load(true);
  if (target.hasAttribute('data-reload-task')) { if (await load()) openTask(dialogTaskId); }
});
document.addEventListener('input', event => {
  const name = event.target.dataset.filter;
  if (!name || !Object.hasOwn(filters, name)) return;
  filters[name] = event.target.value;
  $('#task-results').innerHTML = taskResults();
});
document.addEventListener('submit', event => { if (event.target.id === 'task-form') saveTask(event); });
dialog.addEventListener('close', () => { if (board) render(); if (lastFocus?.isConnected) lastFocus.focus(); else main.focus({ preventScroll: true }); });
dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
window.addEventListener('hashchange', () => { if (board) { render(); window.scrollTo(0, 0); main.focus({ preventScroll: true }); } });
window.addEventListener('focus', () => load());
setInterval(() => { if (!document.hidden) load(); }, 15000);
await load(true);
