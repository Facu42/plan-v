import { useCallback, useEffect, useState } from 'react';
import { campaignApi } from '../../../api/admin-campaigns';
import { ApiError } from '../../../api/client';
import type { CampaignBroadcast, CampaignConfig, CampaignContact, CampaignDraft, ResendPage, TransactionalMail } from '../../../types/admin-campaigns';
import './campanias.css';

const emptyPage = <T,>(): ResendPage<T> => ({ data: [], has_more: false, next: null });
const initialDraft: CampaignDraft = { name: '', subject: '', html: '<p>Hola, queremos contarte las novedades de Nutridash.</p>\n<p><a href="{{{RESEND_UNSUBSCRIBE_URL}}}">Darme de baja</a></p>' };
function message(error: unknown) {
  if (error instanceof ApiError) {
    try { return (JSON.parse(error.message) as { error: string }).error || 'No se pudo completar el pedido.'; } catch { return 'No se pudo completar el pedido.'; }
  }
  return error instanceof Error ? error.message : 'No se pudo completar el pedido.';
}
const statuses: Record<string, string> = { draft: 'Borrador', queued: 'En cola', sent: 'Enviada', sending: 'Enviando', scheduled: 'Programada', delivered: 'Entregado', opened: 'Abierto', clicked: 'Clic registrado', bounced: 'Rebotado', failed: 'Falló', complained: 'Marcado como spam', canceled: 'Cancelado', delivery_delayed: 'Demorado', suppressed: 'Suprimido' };
function status(value: string) { return statuses[value] || value || 'Sin estado disponible'; }
function when(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('es-AR');
}
function mergePage<T extends { id: string }>(previous: ResendPage<T>, next: ResendPage<T>, append: boolean) {
  return { ...next, data: [...new Map((append ? [...previous.data, ...next.data] : next.data).map((row) => [row.id, row])).values()] };
}

export function Campanias({ config }: { config: CampaignConfig }) {
  const [contacts, setContacts] = useState(emptyPage<CampaignContact>);
  const [broadcasts, setBroadcasts] = useState(emptyPage<CampaignBroadcast>);
  const [emails, setEmails] = useState(emptyPage<TransactionalMail>);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState('');
  const [contact, setContact] = useState({ email: '', first_name: '', last_name: '' });
  const [csv, setCsv] = useState('');
  const [draft, setDraft] = useState(initialDraft);
  const [selected, setSelected] = useState<CampaignBroadcast | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [opens, setOpens] = useState<string>('');
  const [tab, setTab] = useState<'leads' | 'broadcasts' | 'emails'>('leads');

  const load = useCallback(async (kind: 'contacts' | 'broadcasts' | 'emails', after?: string) => {
    setErrors((current) => ({ ...current, [kind]: '' }));
    try {
      if (kind === 'contacts') { const next = await campaignApi.contacts(after); setContacts((prev) => mergePage(prev, next, Boolean(after))); }
      if (kind === 'broadcasts') { const next = await campaignApi.broadcasts(after); setBroadcasts((prev) => mergePage(prev, next, Boolean(after))); }
      if (kind === 'emails') { const next = await campaignApi.emails(after); setEmails((prev) => mergePage(prev, next, Boolean(after))); }
    } catch (error) { setErrors((current) => ({ ...current, [kind]: message(error) })); }
  }, []);
  useEffect(() => {
    let active = true;
    setLoading(true);
    void (async () => {
      // Secuencial para respetar el límite de la cuenta de Resend.
      if (config.campaigns_ready) { await load('contacts'); await load('broadcasts'); }
      if (config.mail_ready) await load('emails');
      if (active) setLoading(false);
    })();
    return () => { active = false; };
  }, [config.campaigns_ready, config.mail_ready, load]);

  const run = async (work: () => Promise<void>) => {
    setBusy(true); setNotice(''); setErrors((current) => ({ ...current, action: '' }));
    try { await work(); } catch (error) { setErrors((current) => ({ ...current, action: message(error) })); }
    finally { setBusy(false); }
  };
  const pagination = (kind: 'contacts' | 'broadcasts' | 'emails', page: { has_more: boolean; next: string | null }) => page.has_more && page.next ? <button className="nd-btn" type="button" disabled={busy || loading} onClick={() => void run(() => load(kind, page.next!))}>Cargar más</button> : null;
  const retry = (kind: 'contacts' | 'broadcasts' | 'emails') => errors[kind] ? <div role="alert"><p>{errors[kind]}</p><button className="nd-btn" type="button" disabled={busy || loading} onClick={() => void run(() => load(kind))}>Reintentar</button></div> : null;

  return <div className="nd-campaigns">
    <section className="nd-page-head"><div><div className="nd-eyebrow">Comercial</div><h1 className="nd-h1">Campañas</h1><p className="nd-sub">Novedades para nutricionistas que quieren conocer Nutridash.</p><p className="nd-sub">De: {config.from} · Respuestas: {config.reply_to}</p></div></section>
    {!config.campaigns_ready && <p className="nd-card nd-campaign-notice">Las campañas están apagadas. Falta configurar Resend y la audiencia de leads en el servidor.</p>}
    <div className="nd-campaign-tabs" role="group" aria-label="Secciones de campañas">{([['leads', 'Contactos'], ['broadcasts', 'Borradores y envíos'], ['emails', 'Avisos transaccionales']] as const).map(([key, label]) => <button key={key} className={`nd-btn${tab === key ? ' is-action' : ''}`} type="button" aria-pressed={tab === key} onClick={() => setTab(key)}>{label}</button>)}</div>
    {loading && <p role="status">Cargando datos de Resend…</p>}
    {errors.action && <p role="alert">{errors.action}</p>}
    {notice && <p role="status">{notice}</p>}
    {tab === 'leads' && <>
      <div className="nd-campaign-grid">
        <form className="nd-card nd-campaign-form" onSubmit={(event) => { event.preventDefault(); void run(async () => { await campaignApi.addContact(contact); setContact({ email: '', first_name: '', last_name: '' }); setNotice('Contacto guardado. Si ya se había dado de baja, conservó su baja.'); await load('contacts'); }); }}>
          <h2 className="nd-card-title">Agregar contacto</h2><p className="nd-sub">Cargá solo nutricionistas que aceptaron recibir novedades.</p>
          <fieldset disabled={!config.campaigns_ready || busy || loading}>
            <label>Correo<input type="email" required maxLength={254} value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} /></label>
            <label>Nombre<input maxLength={100} value={contact.first_name} onChange={(e) => setContact({ ...contact, first_name: e.target.value })} /></label>
            <label>Apellido<input maxLength={100} value={contact.last_name} onChange={(e) => setContact({ ...contact, last_name: e.target.value })} /></label>
            <button className="nd-btn is-action" type="submit">Guardar contacto</button>
          </fieldset>
        </form>
        <form className="nd-card nd-campaign-form" onSubmit={(event) => { event.preventDefault(); void run(async () => { const result = await campaignApi.importCsv(csv); setNotice(`${result.imported} contactos guardados.${result.failed_row ? ` Se detuvo en el contacto ${result.failed_row}. ${result.message}` : ''}`); await load('contacts'); }); }}>
          <h2 className="nd-card-title">Importar CSV</h2><p className="nd-sub">Hasta 100 filas y 100 KB. Columnas: email, first_name, last_name. Las bajas se conservan.</p>
          <fieldset disabled={!config.campaigns_ready || busy || loading}>
            <label>Archivo CSV<input type="file" accept=".csv,text/csv" onChange={(event) => { const file = event.target.files?.[0]; setCsv(''); if (!file) return; void run(async () => { if (file.size > 100_000) throw new Error('El archivo supera los 100 KB.'); setCsv(await file.text()); }); }} /></label>
            <label>Contenido CSV<textarea rows={5} required maxLength={100_000} value={csv} onChange={(e) => setCsv(e.target.value)} placeholder={'email,first_name,last_name\nana@ejemplo.com,Ana,Gómez'} /></label>
            <button className="nd-btn is-action" type="submit">Importar contactos</button>
          </fieldset>
        </form>
      </div>
      <section className="nd-card nd-campaign-form"><h2 className="nd-card-title">Contactos de la audiencia</h2>{retry('contacts')}<div className="nd-campaign-scroll"><table><thead><tr><th>Correo</th><th>Nombre</th><th>Estado</th></tr></thead><tbody>{contacts.data.map((row) => <tr key={row.id}><td>{row.email}</td><td>{row.first_name} {row.last_name}</td><td><span className={`nd-badge${row.unsubscribed ? '' : ' is-green'}`}>{row.unsubscribed ? 'Dado de baja' : 'Suscripto'}</span></td></tr>)}</tbody></table></div>{!loading && !errors.contacts && !contacts.data.length && <p>No hay contactos cargados.</p>}{pagination('contacts', contacts)}</section>
    </>}
    {tab === 'broadcasts' && <>
      <form className="nd-card nd-campaign-form" onSubmit={(event) => { event.preventDefault(); void run(async () => { const result = await campaignApi.createDraft(draft); setSelected(await campaignApi.broadcast(result.id)); setConfirm(false); setOpens(''); setNotice('Borrador guardado en Resend. Todavía no se envió.'); await load('broadcasts'); }); }}>
        <h2 className="nd-card-title">Nuevo borrador</h2><p className="nd-sub">Revisá el contenido antes de enviar. El enlace de baja es obligatorio para el envío.</p>
        <fieldset disabled={!config.campaigns_ready || busy || loading}>
          <label>Nombre interno<input required maxLength={100} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
          <label>Asunto<input required maxLength={200} value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} /></label>
          <label>Contenido HTML<textarea required maxLength={100_000} rows={8} value={draft.html} onChange={(e) => setDraft({ ...draft, html: e.target.value })} /></label>
          <button className="nd-btn is-action" type="submit">Guardar borrador</button>
        </fieldset>
      </form>
      <section className="nd-card nd-campaign-form"><h2 className="nd-card-title">Borradores y envíos</h2>{retry('broadcasts')}<div className="nd-campaign-scroll"><table><thead><tr><th>Campaña</th><th>Estado</th><th>Enviada</th><th>Detalle</th></tr></thead><tbody>{broadcasts.data.map((row) => <tr key={row.id}><td>{row.name || row.subject || row.id}</td><td>{status(row.status)}</td><td>{when(row.sent_at)}</td><td><button className="nd-btn" type="button" disabled={busy || loading} onClick={() => void run(async () => { setConfirm(false); setOpens(''); setSelected(await campaignApi.broadcast(row.id)); })}>Revisar</button></td></tr>)}</tbody></table></div>{!loading && !errors.broadcasts && !broadcasts.data.length && <p>No hay campañas en esta página de Resend.</p>}{pagination('broadcasts', broadcasts)}</section>
      {selected && <section className="nd-card nd-campaign-form" aria-label="Revisión de campaña"><h2 className="nd-card-title">{selected.name || selected.subject}</h2><p>Asunto: {selected.subject}</p><p>Estado: {status(selected.status)}</p><pre className="nd-campaign-source">{selected.html || selected.text || 'Sin contenido disponible.'}</pre>
        {selected.status === 'draft' ? <fieldset disabled={busy || loading || !config.campaigns_ready}><label className="nd-campaign-confirm"><input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} />Revisé el contenido y quiero enviarlo a los contactos suscriptos de la audiencia de leads.</label><button className="nd-btn is-action" type="button" disabled={!confirm} onClick={() => void run(async () => { const id = selected.id; setConfirm(false); await campaignApi.send(id); setNotice('Resend aceptó el envío. Actualizá el estado para ver el avance.'); setSelected(await campaignApi.broadcast(id)); await load('broadcasts'); })}>Enviar campaña ahora</button></fieldset> : <><button className="nd-btn" type="button" disabled={busy || loading} onClick={() => void run(async () => { const result = await campaignApi.opened(selected.id); setOpens(result.opened === null ? 'Aperturas no disponibles para esta campaña.' : `${result.opened.count}${result.opened.has_more ? ' o más' : ''} destinatarios con apertura registrada. Depende del seguimiento de Resend.`); })}>Consultar aperturas</button>{opens && <p role="status">{opens}</p>}</>}
      </section>}
    </>}
    {tab === 'emails' && <section className="nd-card nd-campaign-form"><h2 className="nd-card-title">Avisos transaccionales</h2><p className="nd-sub">Solo lectura · avisos@nutridash.net · Último evento disponible. No se muestra el contenido de los avisos.</p>{!config.mail_ready && <p>El correo está apagado. Falta configurar Resend en el servidor.</p>}{retry('emails')}<div className="nd-campaign-scroll"><table><thead><tr><th>Identificador</th><th>Fecha</th><th>Último evento</th><th>Estado</th></tr></thead><tbody>{emails.data.map((row) => <tr key={row.id}><td>{row.id}</td><td>{when(row.created_at)}</td><td>{status(row.last_event)}</td><td><button className="nd-btn" type="button" disabled={busy || loading} onClick={() => void run(async () => { const next = await campaignApi.email(row.id); setEmails((prev) => ({ ...prev, data: prev.data.map((mail) => mail.id === next.id ? next : mail) })); setNotice('Estado actualizado.'); })}>Actualizar estado</button></td></tr>)}</tbody></table></div>{!loading && !errors.emails && !emails.data.length && <p>No hay avisos transaccionales en esta página de Resend.</p>}{pagination('emails', emails)}</section>}
    {busy && <p role="status">Procesando… Esperá antes de volver a enviar.</p>}
  </div>;
}
