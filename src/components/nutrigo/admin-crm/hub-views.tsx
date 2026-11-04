import { useState } from 'react';
import type { CentroAlerta } from '../../../types/centro';
import type { HubBandeja, HubConexiones, HubFacturacion, HubFicha, HubInicio, HubLead, HubLeadSource, HubLeadStage, HubNutri, HubSeguimiento } from '../../../types/hub';
import { dateShort, money, num, timeAgo } from './centro-format';
import { NdIcon } from './nd-icon';

const CRM: Record<HubNutri['crm'], string> = {
  trial: 'En prueba',
  activa: 'Activa',
  morosa: 'Morosa',
  baja: 'Baja',
};
const CRM_BADGE: Record<HubNutri['crm'], string> = {
  trial: 'is-gold',
  activa: 'is-green',
  morosa: 'is-coral',
  baja: 'is-sky',
};
const STAGES: { id: HubLeadStage; label: string }[] = [
  { id: 'lead', label: 'Lead' },
  { id: 'demo', label: 'Demo' },
  { id: 'trial', label: 'Prueba' },
  { id: 'paga', label: 'Paga' },
  { id: 'baja', label: 'Baja' },
];
const SOURCES: { id: HubLeadSource; label: string }[] = [
  { id: 'ig', label: 'Instagram' },
  { id: 'wa', label: 'WhatsApp' },
  { id: 'web', label: 'Web' },
  { id: 'referido', label: 'Referido' },
  { id: 'email', label: 'Email' },
];

function sourceLabel(source: HubLeadSource): string {
  return SOURCES.find((row) => row.id === source)?.label ?? source;
}

function pageHead(kicker: string, title: string, sub?: string) {
  return (
    <section className="nd-page-head">
      <div className="nd-grow">
        <div className="nd-eyebrow">{kicker}</div>
        <h1 className="nd-h1">{title}</h1>
        {sub ? <p className="nd-sub nd-mt-6">{sub}</p> : null}
      </div>
    </section>
  );
}

function alertaTone(tone: CentroAlerta['tone']): string {
  if (tone === 'coral') return 'is-coral';
  if (tone === 'gold') return 'is-gold';
  if (tone === 'sky') return 'is-sky';
  return 'is-green';
}

export function InicioView({ data }: { data: HubInicio }) {
  const kpis: { label: string; value: number; money?: boolean; note: string }[] = [
    { label: 'Ingreso recurrente', value: data.mrr_pesos, money: true, note: data.mrr_nota },
    { label: 'Cobrado del mes', value: data.cobrado_mes_pesos, money: true, note: data.cobrado_nota },
    { label: 'Pruebas activas', value: data.trials_activos, note: data.trials_por_vencer === 1 ? '1 vence en 7 días' : `${data.trials_por_vencer} vencen en 7 días` },
    { label: 'Bajas del mes', value: data.churn_mes, note: 'Cuentas que se cortaron o cancelaron este mes' },
    { label: 'Altas nuevas', value: data.altas_nuevas, note: 'Cuentas creadas este mes, sin las de prueba' },
  ];
  return (
    <>
      {pageHead('Gestión', 'Inicio', 'Los números salen de las cuentas reales. Si un dato no se puede leer, se dice y no se rellena.')}
      <div className="nd-grid nd-kpis nd-mb-18">
        {kpis.map((kpi) => (
          <article key={kpi.label} className="nd-card kpi" data-motion="card">
            <div className="kpi-top"><span className="kpi-label">{kpi.label}</span></div>
            <div className="kpi-value">
              <span data-count={kpi.value} data-format={kpi.money ? 'money' : 'num'}>{kpi.money ? money(kpi.value) : num(kpi.value)}</span>
            </div>
            <div className="kpi-foot"><span>{kpi.note}</span></div>
          </article>
        ))}
      </div>
      {data.resumen ? (
        <section className="nd-card nd-mb-18" data-motion="card">
          <div className="nd-card-head"><div className="nd-card-title">Hoy en el negocio</div><div className="nd-card-sub">{data.resumen.origen === 'ia' ? 'Lo reescribió la IA' : 'Sale de los números, sin modelo'}</div></div>
          <div className="nd-card-pad">
            <p>{data.resumen.texto}</p>
            <ul>{data.resumen.acciones.map((item) => <li key={item}>{item}</li>)}</ul>
            <p className="nd-tiny nd-muted">{data.resumen.nota}</p>
          </div>
        </section>
      ) : null}
      {data.riesgos ? (
        <section className="nd-card nd-mb-18" data-motion="card">
          <div className="nd-card-head"><div className="nd-card-title">Riesgo de baja</div><div className="nd-card-sub">{data.riesgos.length} señales</div></div>
          <div className="nd-card-pad">
            {data.riesgos.length ? data.riesgos.slice(0, 3).map((row) => (
              <div key={`${row.nutritionist_id}-${row.motivo}`} className="service-activity"><strong>{row.nombre}</strong><span>{row.detalle}</span></div>
            )) : <p className="nd-muted">No hay señales con los datos que se pudieron leer.</p>}
            <a className="nd-btn is-action is-sm" href="#/riesgo">Ver la lista</a>
          </div>
        </section>
      ) : null}
      <section className="nd-card" data-motion="card">
        <div className="nd-card-head"><div className="nd-card-title">Alertas</div><div className="nd-card-sub">Pagos, salud del sistema y verificación en dos pasos</div></div>
        <div style={{ padding: '8px 10px 12px' }}>
          {data.alertas.map((item) => (
            <div key={item.title} className="nd-row" style={{ padding: '11px 10px' }}>
              <span className={`rule-ico ${alertaTone(item.tone)}`} style={{ width: 34, height: 34 }}><NdIcon name={item.tone === 'green' ? 'check_circle' : 'alert'} /></span>
              <span className="nd-grow">
                <span style={{ display: 'block', fontWeight: 600 }}>{item.title}</span>
                <span style={{ display: 'block', fontSize: 12, color: 'var(--muted)' }}>{item.sub}</span>
              </span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

export function NutrisHubView({
  rows,
  ficha,
  onOpen,
  onNota,
  onTarea,
  onToggle,
  busy,
  error,
}: {
  rows: HubNutri[];
  ficha: HubFicha | null;
  onOpen: (id: string) => void;
  onNota: (id: string, body: string) => void;
  onTarea: (id: string, title: string) => void;
  onToggle: (id: string, done: boolean) => void;
  busy: boolean;
  error: string;
}) {
  const [nota, setNota] = useState('');
  const [tarea, setTarea] = useState('');
  const [ocultarPrueba, setOcultarPrueba] = useState(true);
  const visibles = rows.filter((row) => !ocultarPrueba || !row.is_test);
  return (
    <>
      {pageHead('Cuentas', 'Nutris', 'Plan, estado, último ingreso, pacientes y un puntaje de uso, cartera y pago al día.')}
      <div className="nd-row nd-mb-14" style={{ gap: 8 }}>
        <button type="button" className={`nd-chip${ocultarPrueba ? ' is-active' : ''}`} onClick={() => setOcultarPrueba((value) => !value)}>
          {ocultarPrueba ? 'Ocultando cuentas de prueba' : 'Mostrando cuentas de prueba'}
        </button>
      </div>
      <div className="nd-hub-split">
        <section className="nd-card" data-motion="card">
          <div className="nd-scroll-x">
            <table className="nd-table">
              <thead>
                <tr>
                  <th>Cuenta</th>
                  <th>Plan</th>
                  <th>Estado</th>
                  <th>Ingreso</th>
                  <th>Pacientes</th>
                  <th>Salud</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <button type="button" className="nd-btn is-ghost is-sm" onClick={() => onOpen(row.id)}>{row.display_name}</button>
                      <div className="nd-tiny nd-muted">{row.email}{row.is_test ? ' · cuenta de prueba' : ''}</div>
                    </td>
                    <td>{row.plan}</td>
                    <td><span className={`nd-badge ${CRM_BADGE[row.crm]}`}>{CRM[row.crm]}</span></td>
                    <td>{timeAgo(row.last_sign_in_at)}</td>
                    <td>{num(row.patients_active)}</td>
                    <td>
                      <strong>{row.health.total}</strong>
                      <div className="nd-health" aria-hidden="true"><span style={{ width: `${row.health.total}%` }} /></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!visibles.length ? <div className="nd-empty">No hay cuentas para mostrar.</div> : null}
        </section>
        <section className="nd-card" data-motion="card">
          {!ficha ? <div className="nd-empty">Elegí una cuenta para ver la ficha.</div> : (
            <div className="nd-ficha-block">
              <div className="nd-card-title">{ficha.nutri.display_name}</div>
              <p className="nd-sub">{ficha.nutri.plan} · {CRM[ficha.nutri.crm]} · salud {ficha.nutri.health.total} (uso {ficha.nutri.health.uso}, pacientes {ficha.nutri.health.pacientes}, pago {ficha.nutri.health.pago})</p>
              {ficha.nota_vacia ? <p className="nd-planes-msg is-error">{ficha.nota_vacia}</p> : null}
              {error ? <p className="nd-planes-msg is-error">{error}</p> : null}
              <h2 className="nd-h3">Línea de tiempo</h2>
              {ficha.timeline.map((item) => (
                <div key={item.id} className="service-activity">
                  <strong>{item.title}</strong>
                  <span>{dateShort(item.at)} · {item.detail}</span>
                </div>
              ))}
              <h2 className="nd-h3">Notas</h2>
              {ficha.notas.length ? ficha.notas.map((item) => <p key={item.id} className="nd-sub">{item.body}</p>) : <p className="nd-muted">Sin notas.</p>}
              <form className="nd-hub-form" onSubmit={(event) => { event.preventDefault(); if (!nota.trim()) return; onNota(ficha.nutri.id, nota.trim()); setNota(''); }}>
                <label>Nueva nota
                  <input className="nd-hub-note" value={nota} maxLength={500} onChange={(event) => setNota(event.target.value)} />
                </label>
                <button type="submit" className="nd-btn is-action is-sm" disabled={busy || !ficha.notas_disponibles}>Guardar nota</button>
              </form>
              <h2 className="nd-h3">Tareas</h2>
              {ficha.tareas.map((item) => (
                <label key={item.id} className="nd-row" style={{ gap: 8 }}>
                  <input type="checkbox" checked={item.done} onChange={(event) => onToggle(item.id, event.target.checked)} />
                  <span>{item.title}{item.due_on ? ` · ${dateShort(item.due_on)}` : ''}</span>
                </label>
              ))}
              {!ficha.tareas.length ? <p className="nd-muted">Sin tareas.</p> : null}
              <form className="nd-hub-form" onSubmit={(event) => { event.preventDefault(); if (!tarea.trim()) return; onTarea(ficha.nutri.id, tarea.trim()); setTarea(''); }}>
                <label>Nueva tarea
                  <input value={tarea} maxLength={140} onChange={(event) => setTarea(event.target.value)} />
                </label>
                <button type="submit" className="nd-btn is-action is-sm" disabled={busy || !ficha.notas_disponibles}>Agregar tarea</button>
              </form>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

export function PipelineView({
  leads,
  disponible,
  nota,
  onCreate,
  onStage,
  seguimientos = [],
  busy,
  error,
}: {
  leads: HubLead[];
  disponible: boolean;
  nota: string;
  onCreate: (input: { name: string; contact: string; source: HubLeadSource; next_step: string }) => void;
  onStage: (id: string, stage: HubLeadStage) => void;
  seguimientos?: HubSeguimiento[];
  busy: boolean;
  error: string;
}) {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [source, setSource] = useState<HubLeadSource>('ig');
  const [next, setNext] = useState('');
  return (
    <>
      {pageHead('Comercial', 'Pipeline', 'Lead, demo, prueba, paga y baja. El origen puede ser Instagram, WhatsApp, la web o un referido.')}
      {nota ? <p className="nd-planes-msg">{nota}</p> : null}
      {error ? <p className="nd-planes-msg is-error">{error}</p> : null}
      <form className="nd-hub-form" onSubmit={(event) => {
        event.preventDefault();
        if (!name.trim()) return;
        onCreate({ name: name.trim(), contact: contact.trim(), source, next_step: next.trim() });
        setName(''); setContact(''); setNext('');
      }}>
        <label>Nombre<input value={name} onChange={(event) => setName(event.target.value)} required minLength={2} /></label>
        <label>Contacto<input value={contact} onChange={(event) => setContact(event.target.value)} placeholder="@ o mail" /></label>
        <label>Origen
          <select value={source} onChange={(event) => setSource(event.target.value as HubLeadSource)}>
            {SOURCES.map((row) => <option key={row.id} value={row.id}>{row.label}</option>)}
          </select>
        </label>
        <label>Próximo paso<input value={next} maxLength={200} onChange={(event) => setNext(event.target.value)} /></label>
        <button type="submit" className="nd-btn is-action" disabled={busy || !disponible}>Crear lead</button>
      </form>
      <div className="board-wrap">
        <div className="board">
          {STAGES.map((stage) => {
            const items = leads.filter((row) => row.stage === stage.id);
            return (
              <section
                key={stage.id}
                className="board-col"
                data-motion="card"
                onDragOver={(event) => { if (disponible && !busy) event.preventDefault(); }}
                onDrop={(event) => {
                  event.preventDefault();
                  const id = event.dataTransfer.getData('text/plain');
                  if (id) onStage(id, stage.id);
                }}
              >
                <header className="board-col-head">
                  <div className="board-col-title">{stage.label}<span className="board-col-count">{items.length}</span></div>
                </header>
                <div className="board-col-body">
                  {items.length ? items.map((lead) => (
                    <article key={lead.id} className="lead-card" draggable={disponible && !busy} onDragStart={(event) => event.dataTransfer.setData('text/plain', lead.id)}>
                      <div className="lead-card-name">{lead.name}</div>
                      <div className="lead-card-handle">{sourceLabel(lead.source)}{lead.contact ? ` · ${lead.contact}` : ''}</div>
                      <div className="lead-card-note">{lead.next_step || 'Sin próximo paso'}</div>
                      <div className="lead-card-foot">
                        <label className="nd-tiny">Mover
                          <select aria-label={`Etapa de ${lead.name}`} value={lead.stage} disabled={!disponible || busy} onChange={(event) => onStage(lead.id, event.target.value as HubLeadStage)}>
                            {STAGES.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                          </select>
                        </label>
                      </div>
                      {seguimientos.filter((item) => item.lead_id === lead.id && !item.done).map((item) => (
                        <p key={item.id} className="nd-tiny nd-muted">Seguimiento: {item.title} · {item.due_on}</p>
                      ))}
                    </article>
                  )) : <div className="nd-empty">Nadie en {stage.label}.</div>}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </>
  );
}

export function FacturacionView({ data }: { data: HubFacturacion }) {
  return (
    <>
      {pageHead('Plataforma', 'Facturación', 'Suscripciones de Mercado Pago, avisos, pagos fallidos y reembolsos. Los cobros manuales siguen abajo.')}
      <div className="nd-grid nd-split nd-mb-18">
        <section className="nd-card" data-motion="card">
          <div className="nd-card-head"><div className="nd-card-title">Suscripciones</div><div className="nd-card-sub">{data.suscripciones_nota}</div></div>
          {data.suscripciones_disponibles && data.suscripciones.length ? (
            <div className="nd-card-pad">
              {data.suscripciones.map((row) => (
                <div key={row.id} className="service-activity">
                  <strong>{row.plan} · {row.estado}</strong>
                  <span>{money(row.monto_pesos)} · {row.ciclo}{row.mail ? ` · ${row.mail}` : ''}{row.vence ? ` · vence ${dateShort(row.vence)}` : ''}</span>
                </div>
              ))}
            </div>
          ) : <div className="nd-empty">{data.suscripciones_disponibles ? 'No hay suscripciones.' : data.suscripciones_nota}</div>}
        </section>
        <section className="nd-card" data-motion="card">
          <div className="nd-card-head is-stack"><div className="nd-card-title">Avisos de Mercado Pago</div><div className="nd-card-sub">{data.webhooks_nota}</div></div>
          <div className="nd-card-pad">
            {data.webhooks_disponibles ? (
              <p className="nd-sub">Procesados: {num(data.webhooks_ok ?? 0)}. Fallidos: {num(data.webhooks_fallidos ?? 0)}.</p>
            ) : <p className="nd-sub">{data.webhooks_nota}</p>}
            <h2 className="nd-h3" style={{ marginTop: 12 }}>Cobrados este mes</h2>
            <p className="nd-tiny nd-muted">{data.pagos_nota}</p>
            <h2 className="nd-h3" style={{ marginTop: 12 }}>Pagos fallidos</h2>
            {data.pagos_fallidos.length ? data.pagos_fallidos.map((row) => (
              <div key={row.id} className="service-activity"><strong>{money(row.monto_pesos)}</strong><span>{row.estado} · {dateShort(row.cuando)}</span></div>
            )) : <p className="nd-muted">{data.suscripciones_disponibles ? 'No hay pagos rechazados.' : 'Sin dato de pagos fallidos.'}</p>}
            <h2 className="nd-h3" style={{ marginTop: 12 }}>Reembolsos</h2>
            {data.reembolsos.length ? data.reembolsos.map((row) => (
              <div key={row.id} className="service-activity"><strong>{money(row.monto_pesos)}</strong><span>{row.estado} · {dateShort(row.cuando)}</span></div>
            )) : <p className="nd-muted">{data.suscripciones_disponibles ? 'No hay reembolsos ni contracargos.' : 'Sin dato de reembolsos.'}</p>}
          </div>
        </section>
      </div>
      <section className="nd-card nd-mb-18" data-motion="card">
        <div className="nd-card-head"><div className="nd-card-title">AFIP</div></div>
        <div className="nd-card-pad"><span className="nd-badge is-gold">Próximamente</span><p className="nd-sub nd-mt-6">{data.afip.texto}</p></div>
      </section>
      <section className="nd-card" data-motion="card">
        <div className="nd-card-head"><div className="nd-card-title">Cobros manuales del mes</div><div className="nd-card-sub">{money(data.cobros.cobrado_mes)} confirmados</div></div>
        <div className="nd-card-pad">
          {data.cobros.pagos_mes.length ? data.cobros.pagos_mes.map((row) => (
            <div key={row.id} className="service-activity"><strong>{row.nutritionist_name}</strong><span>{money(row.amount)} · {dateShort(row.paid_on)} · {row.status === 'voided' ? 'anulado' : 'confirmado'}</span></div>
          )) : <p className="nd-muted">Este mes no hay pagos manuales.</p>}
        </div>
      </section>
    </>
  );
}

export function BandejaView({
  data,
  onAnotar,
  onLead,
  onSugerir,
  onEnviar,
  busy,
  error,
}: {
  data: HubBandeja;
  onAnotar: (input: { channel: 'whatsapp' | 'instagram' | 'email'; contact_name: string; contact_handle: string; body: string }) => void;
  onLead: (id: string) => void;
  onSugerir?: (id: string) => void;
  onEnviar?: (id: string, body: string) => void;
  busy: boolean;
  error: string;
}) {
  const [channel, setChannel] = useState<'whatsapp' | 'instagram' | 'email'>('whatsapp');
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [body, setBody] = useState('');
  const [activo, setActivo] = useState(data.hilos[0]?.id ?? '');
  const hilo = data.hilos.find((row) => row.id === activo) ?? data.hilos[0] ?? null;
  return (
    <>
      {pageHead('Mensajes', 'Bandeja', 'WhatsApp y el mail entran y salen si las credenciales están. Si faltan, el canal queda apagado. Instagram está preparado.')}
      <p className="nd-sub nd-mb-14">{data.nota}</p>
      {error ? <p className="nd-planes-msg is-error">{error}</p> : null}
      <form className="nd-hub-form" onSubmit={(event) => {
        event.preventDefault();
        onAnotar({ channel, contact_name: name.trim(), contact_handle: handle.trim(), body: body.trim() });
        setBody('');
      }}>
        <label>Canal
          <select value={channel} onChange={(event) => setChannel(event.target.value as typeof channel)}>
            <option value="whatsapp">WhatsApp</option>
            <option value="instagram">Instagram</option>
            <option value="email">Email</option>
          </select>
        </label>
        <label>Nombre<input value={name} required onChange={(event) => setName(event.target.value)} /></label>
        <label>Contacto<input value={handle} onChange={(event) => setHandle(event.target.value)} /></label>
        <label>Mensaje<textarea value={body} required rows={2} onChange={(event) => setBody(event.target.value)} /></label>
        <button type="submit" className="nd-btn is-action" disabled={busy || !data.disponible}>Anotar mensaje</button>
      </form>
      <div className="nd-card inbox" data-motion="card">
        <aside className="inbox-filters">
          <div className="inbox-filter-title">Canales</div>
          <p className="nd-hint">Si un canal está apagado, el mensaje igual se puede anotar a mano.</p>
        </aside>
        <section className="conv-list">
          <div className="conv-list-body">
            {data.hilos.length ? data.hilos.map((row) => (
              <button key={row.id} type="button" className={`conv-item${hilo?.id === row.id ? ' is-active' : ''}`} onClick={() => setActivo(row.id)}>
                <span className="nd-grow">
                  <span className="conv-name">{row.contact_name}</span>
                  <span className="conv-preview">{row.messages[0]?.body ?? 'Sin texto'}</span>
                </span>
              </button>
            )) : <div className="nd-empty">La bandeja está vacía.</div>}
          </div>
        </section>
        <section className="thread">
          {hilo ? (
            <>
              <header className="thread-head">
                <div className="nd-grow">
                  <strong>{hilo.contact_name}</strong>
                  <div className="nd-tiny nd-muted">{hilo.channel}{hilo.contact_handle ? ` · ${hilo.contact_handle}` : ''}</div>
                </div>
                <button type="button" className="nd-btn is-action is-sm" disabled={busy || !data.disponible || Boolean(hilo.lead_id)} onClick={() => onLead(hilo.id)}>
                  {hilo.lead_id ? 'Ya tiene lead' : 'Crear lead'}
                </button>
              </header>
              <div className="thread-body">
                {hilo.messages.map((message) => (
                  <div key={message.id} className={`msg${message.direction === 'out' ? ' is-me' : ''}`}>
                    <div className="msg-bubble">{message.body}</div>
                  </div>
                ))}
              {hilo.borrador ? <p className="nd-tiny">{hilo.borrador.origen === 'ia' ? 'Borrador de la IA' : 'Borrador fijo, la IA está apagada'}: {hilo.borrador.body}</p> : null}
                <div className="nd-row" style={{ gap: 8, marginTop: 8 }}>
                  {onSugerir ? <button type="button" className="nd-btn" disabled={busy} onClick={() => onSugerir(hilo.id)}>Sugerir respuesta</button> : null}
                  {onEnviar && hilo.borrador ? <button type="button" className="nd-btn is-action" disabled={busy} onClick={() => onEnviar(hilo.id, hilo.borrador?.body ?? '')}>Enviar</button> : null}
                </div>
              </div>
            </>
          ) : <div className="nd-empty">Cuando anotes un mensaje, aparece acá.</div>}
        </section>
      </div>
    </>
  );
}

export function ConexionesView({ data }: { data: HubConexiones }) {
  return (
    <>
      {pageHead('Mensajes', 'Conexiones', data.nota)}
      <div className="conn-grid">
        {data.conectores.map((row) => (
          <article key={row.id} className="nd-card conn-card" data-motion="card">
            <NdIcon name={row.id === 'email' ? 'mail' : row.id === 'instagram' ? 'sparkle' : 'inbox'} />
            <h2 className="nd-h3">{row.nombre}</h2>
            <p className="nd-sub">{row.detalle}</p>
            <span className={`nd-badge ${row.estado === 'listo' ? 'is-green' : row.estado === 'preparado' ? 'is-sky' : 'is-gold'}`}>{row.estado === 'listo' ? 'Listo' : row.estado === 'preparado' ? 'Preparado' : 'Apagado'}</span>
          </article>
        ))}
      </div>
    </>
  );
}
