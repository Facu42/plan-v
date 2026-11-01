import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { SchedulingSettings } from '../../types/scheduling';
import { bookingHref, depositMode, withHalfDeposit } from '../../lib/panel-agenda';
import { monthlyLabel, planDraftError } from '../../lib/panel-subscriptions';
import { subscriptionsApi } from '../../api/subscriptions';
import { nutritionCapabilityApi } from '../../api/nutrition-capabilities';
import { huellaFoto } from '../../lib/public-page-profile';
import { ApiError } from '../../api/error';
import { friendlyError } from '../../lib/error-messages';
import type { SubscriptionPlan } from '../../types/subscriptions';
import { isPublicSlug } from '../../types/public-slug';
import { Icon } from '../shared/Icon';
import { PlanForm } from './PanelDebit';
import { PanelConnections, type ConnectionKey } from './PanelConnections';
import { useUnsavedChanges } from './unsaved-changes';
import { usePanelScheduling } from './use-panel-scheduling';
import { PanelPublicaV29, Celular, PESTANAS_PUBLICA, type CajonPublica, type VistaPublica } from './PanelPublicaV29';
import { CajonV29 } from './CajonV29';
import { CajonDescuentos, CajonHorarios, CajonLugar, CajonObras, CajonPerfil, CajonPide, CajonReglas, CajonServicio, conExtras } from './PanelPublicaCajones';
import { conHorarioDelDia, qrComoSvg, type AvisoReserva } from './publica-extras';
import { PanelV29Icon } from './PanelV29Icon';
import './panel-fase5.css';

const money = (minor: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(minor / 100);

export function PanelPublicPageView({ config, published, pageUrl, connections, status, busy, loading, error, onChange, onPublish, onToggleEnabled, onConnect, onDisconnect, onRetry, plans = null, onTogglePlan, onEditPlan }: {
  config: SchedulingSettings; published: boolean; pageUrl: string; connections: Record<ConnectionKey, boolean>; status: string; busy: boolean; loading: boolean; error: string;
  onChange: (next: SchedulingSettings) => void; onPublish: () => void; onToggleEnabled: (enabled: boolean) => void; onConnect: (key: ConnectionKey) => void; onDisconnect?: (key: 'google' | 'mercadopago') => void; onRetry: () => void;
  plans?: SubscriptionPlan[] | null; onTogglePlan?: (plan: SubscriptionPlan, visible: boolean) => void; onEditPlan?: (plan: SubscriptionPlan | null) => void;
}) {
  const page = config.page;
  const mode = depositMode(config.types);
  const setPage = (patch: Partial<SchedulingSettings['page']>) => onChange({ ...config, page: { ...page, ...patch } });
  const previewTypes = config.types.slice(0, 4);
  return <section className="p5" aria-label="Página pública">
    <header className="p5-head"><div><h2>Página pública</h2><p>Tu página para que las pacientes reserven</p></div>
      {published ? <a className="p5-btn" href={pageUrl} target="_blank" rel="noreferrer"><Icon name="arrow" size={15} />Ver página</a> : <span className="p5-note">Todavía no está publicada.</span>}
      <button type="button" className="p5-btn p5-pri" disabled={busy || loading} onClick={onPublish}>Publicar cambios</button>
    </header>
    {error && <p className="p5-alert" role="alert">{error} <button type="button" onClick={onRetry}>Reintentar</button></p>}
    {status && <p className="p5-status" role="status">{status}</p>}
    {loading ? <p className="p5-empty">Cargando tu página…</p> : <div className="p5-public">
      <section className="p5-card"><header><h3>Perfil</h3></header>
        <label>Nombre<input value={page.title} maxLength={100} required onChange={event => setPage({ title: event.target.value })} /></label>
        <label>Presentación<textarea maxLength={1200} value={page.bio} onChange={event => setPage({ bio: event.target.value })} /></label>
        <label>Dirección del link<span className="p5-slug">nutridash.app/<input aria-label="Dirección del link" value={page.slug} pattern="[a-z0-9][a-z0-9-]{2,59}" onChange={event => setPage({ slug: event.target.value })} /></span></label>
        <label>Dónde atendés<input value={page.location} maxLength={200} onChange={event => setPage({ location: event.target.value })} /></label>
        <label>Contacto público<input value={page.contact} maxLength={150} onChange={event => setPage({ contact: event.target.value })} /></label>
        <label>Imagen pública<input type="url" placeholder="https://" value={page.logo_url} onChange={event => setPage({ logo_url: event.target.value })} /></label>
      </section>
      <div className="p5-stack">
        <section className="p5-card"><header><h3>Servicios</h3><button type="button" className="p5-btn" disabled={config.types.length >= 30} onClick={() => onChange({ ...config, types: [...config.types, { id: crypto.randomUUID(), name: 'Consulta', calendar_id: config.calendars[0].id, duration_min: 45, channel: 'video', price_minor: 0, deposit_minor: 0 }] })}>Agregar</button></header>
          {!config.types.length && <p className="p5-empty">Todavía no hay servicios.</p>}
          {config.types.map(type => <div className="p5-li" key={type.id}><div className="p5-tx"><input aria-label={`Nombre de ${type.name || 'servicio'}`} value={type.name} maxLength={80} onChange={event => onChange({ ...config, types: config.types.map(item => item.id === type.id ? { ...item, name: event.target.value } : item) })} /><span>{type.duration_min} min · {money(type.price_minor)}</span></div><button type="button" className="p5-btn" onClick={() => onChange({ ...config, types: config.types.filter(item => item.id !== type.id) })}>Quitar</button></div>)}
        </section>
        {plans && <section className="p5-card" aria-label="Planes de seguimiento"><header><h3>Planes de seguimiento</h3><button type="button" className="p5-btn" onClick={() => onEditPlan?.(null)}>Nuevo plan</button></header>
          {!connections.mercadopago && <p className="p5-note">Conectá Mercado Pago para cobrar con débito automático</p>}
          {!plans.length && <p className="p5-empty">Todavía no hay planes de seguimiento.</p>}
          {plans.map(plan => <div className="p5-li" key={plan.id}><div className="p5-tx"><b>{plan.name}</b><span>{monthlyLabel(plan.amount_cents)} · {plan.description || 'Seguimiento mensual'}</span></div><button type="button" className="p5-btn" onClick={() => onEditPlan?.(plan)}>Editar</button><button type="button" className={`p5-switch${plan.public_visible && connections.mercadopago ? ' on' : ''}`} aria-pressed={plan.public_visible && connections.mercadopago} disabled={!connections.mercadopago} onClick={() => onTogglePlan?.(plan, !plan.public_visible)}><span className="p5-sr">Mostrar en mi página {plan.name}</span></button></div>)}
        </section>}
        <section className="p5-card"><header><h3>Reservas</h3></header>
          <div className="p5-li"><div className="p5-tx"><b>Reserva desde la página</b><span>Las pacientes eligen día y hora</span></div><button type="button" className={`p5-switch${page.enabled ? ' on' : ''}`} aria-pressed={page.enabled} onClick={() => onToggleEnabled(!page.enabled)}><span className="p5-sr">Reserva desde la página</span></button></div>
          {mode === 'mixed' ? <p className="p5-note">La seña cambia según el servicio.</p> : <div className="p5-li"><div className="p5-tx"><b>Pedir seña</b><span>{connections.mercadopago ? '50% con Mercado Pago' : '50% cuando conectes Mercado Pago. No se cobra sola.'}</span></div>{mode !== 'none' && <button type="button" className={`p5-switch${mode === 'on' ? ' on' : ''}`} aria-pressed={mode === 'on'} onClick={() => onChange({ ...config, types: withHalfDeposit(config.types, mode !== 'on') })}><span className="p5-sr">Pedir seña</span></button>}</div>}
          <div className="p5-li"><div className="p5-tx"><b>Anticipación mínima</b><span>24 horas. Es la regla de la página.</span></div></div>
          <div className="p5-li"><div className="p5-tx"><b>Comprobar Google al ofrecer horarios</b><span>Solo si Google Calendar está conectado</span></div><button type="button" className={`p5-switch${config.google_enabled ? ' on' : ''}`} aria-pressed={config.google_enabled} disabled={!connections.google} onClick={() => onChange({ ...config, google_enabled: !config.google_enabled })}><span className="p5-sr">Comprobar Google al ofrecer horarios</span></button></div>
          <div className="p5-li"><div className="p5-tx"><b>Crear un enlace de Meet por consulta</b><span>Para las consultas online</span></div><button type="button" className={`p5-switch${config.create_meet ? ' on' : ''}`} aria-pressed={config.create_meet} onClick={() => onChange({ ...config, create_meet: !config.create_meet })}><span className="p5-sr">Crear un enlace de Meet por consulta</span></button></div>
          <label>Alias de transferencia<input maxLength={100} value={config.transfer_alias} onChange={event => onChange({ ...config, transfer_alias: event.target.value })} /></label>
          <PanelConnections connected={connections} onConnect={onConnect} onDisconnect={onDisconnect} />
        </section>
      </div>
      <section className="p5-card p5-preview" aria-label="Así la ve la paciente"><span>Así la ve la paciente</span>
        <div className="p5-phone">
          {page.logo_url.startsWith('https://') && <img src={page.logo_url} alt="" />}
          <strong>{page.title || 'Tu consultorio'}</strong>
          <p>{page.bio || 'Todavía no hay presentación.'}</p>
          <span className="p5-preview-cta" aria-hidden="true">Reservar turno</span>
          <h4>Consulta suelta</h4>
          {previewTypes.map(type => <div key={type.id}><b>{type.name}</b><small>{type.duration_min} min</small><em>{money(type.price_minor)}</em></div>)}
          {!previewTypes.length && <p className="p5-empty">Sin consulta suelta para mostrar.</p>}
          {plans && <><h4>Cuota del mes</h4><span className="p5-preview-cta">Pagar este mes</span></>}
          {plans && plans.some(plan => plan.public_visible) && <h4>Planes de seguimiento</h4>}
          {plans?.filter(plan => plan.public_visible).map(plan => <div key={plan.id}><b>{plan.name}</b><small>{plan.description || 'Seguimiento mensual'}</small><em>{monthlyLabel(plan.amount_cents)}</em><span className="p5-preview-cta">Suscribirme</span></div>)}
        </div>
      </section>
    </div>}
  </section>;
}

const PERFIL_VACIO = 'Mi consultorio';
const HORARIO_NUEVO = { start: '09:00', end: '13:00' };

export function PanelPublicPage({ onHeader, onAgenda }: { onHeader?: (actions: ReactNode) => void; onAgenda?: () => void }) {
  const scheduling = usePanelScheduling();
  const [draft, setDraft] = useState<SchedulingSettings | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[] | null>(null);
  const [editor, setEditor] = useState<SubscriptionPlan | 'nuevo' | null>(null);
  const [planNotice, setPlanNotice] = useState('');
  const [vista, setVista] = useState<VistaPublica>(0);
  const [servicio, setServicio] = useState(0);
  const [cajon, setCajon] = useState<{ cual: CajonPublica; id: string | null } | null>(null);
  const [marcaLogo, setMarcaLogo] = useState('');
  const [fotoBorrador, setFotoBorrador] = useState('');
  const loadPlans = () => {
    subscriptionsApi.plans().then(result => setPlans(result.enabled === false ? null : result.plans.filter(plan => plan.status === 'active'))).catch(error => {
      if (error instanceof ApiError && error.status === 404) setPlans(null);
      else setPlanNotice(friendlyError(error));
    });
  };
  useEffect(loadPlans, []);
  useEffect(() => {
    const c = new AbortController();
    nutritionCapabilityApi.settings(c.signal).then(view => { if (!c.signal.aborted) setMarcaLogo(view.settings.brand.logo || ''); }).catch(() => undefined);
    return () => c.abort();
  }, []);
  const config = draft ?? scheduling.config;
  const loaded = Boolean(scheduling.snapshot);
  const logoEnPantalla = fotoBorrador || marcaLogo;
  const [huellaMarca, setHuellaMarca] = useState('');
  useEffect(() => {
    if (!logoEnPantalla.startsWith('data:image/')) { setHuellaMarca(''); return undefined; }
    let cancel = false;
    void huellaFoto(logoEnPantalla).then(hash => { if (!cancel) setHuellaMarca(hash); });
    return () => { cancel = true; };
  }, [logoEnPantalla]);
  const fotoSinPublicar = !config.page.logo_url.startsWith('https://') && (Boolean(fotoBorrador) || (huellaMarca !== '' && huellaMarca !== config.page_extras?.photo_sha256));
  useUnsavedChanges(Boolean(draft) || Boolean(fotoBorrador), scheduling.busy);
  const published = Boolean(scheduling.snapshot?.profile.config.page.enabled);
  const pageUrl = published ? bookingHref(typeof window === 'undefined' ? 'https://nutridash.app' : window.location.origin, scheduling.snapshot?.profile.config.page.slug ?? config.page.slug) : '';
  const mercadoPago = Boolean(scheduling.snapshot?.connections.mercadopago);
  const publish = () => {
    if (!isPublicSlug(config.page.slug)) { scheduling.setStatus('La dirección usa minúsculas, números y guiones, y no puede ser una palabra reservada.'); return; }
    if (config.page.logo_url && !config.page.logo_url.startsWith('https://')) { scheduling.setStatus('La imagen tiene que ser un enlace https.'); return; }
    if (scheduling.busy) return;
    const base = config;
    const borrador = fotoBorrador;
    const marca = marcaLogo;
    void (async () => {
      try {
        let next = base;
        if (borrador.startsWith('data:image/')) {
          const view = await nutritionCapabilityApi.settings();
          await nutritionCapabilityApi.saveSettings({ ...view.settings, brand: { ...view.settings.brand, logo: borrador } }, view.revision);
        }
        const logo = borrador.startsWith('data:image/') ? borrador : marca;
        if (logo.startsWith('data:image/')) {
          const hash = await huellaFoto(logo);
          if (hash !== base.page_extras?.photo_sha256) next = conExtras(next, { photo_sha256: hash });
        }
        const ok = await scheduling.save({ ...next, page: { ...next.page, enabled: true, title: next.page.title.trim() || PERFIL_VACIO } }, 'Página publicada.');
        if (ok) {
          setDraft(null);
          if (borrador.startsWith('data:image/')) { setMarcaLogo(borrador); setFotoBorrador(''); }
        }
      } catch (error) {
        scheduling.setStatus(friendlyError(error));
      }
    })();
  };
  const copy = () => { if (pageUrl) void navigator.clipboard.writeText(pageUrl).then(() => scheduling.setStatus('Link copiado.')).catch(() => scheduling.setStatus('No se pudo copiar. Seleccioná el link y copialo a mano.')); };
  const downloadQr = () => {
    if (!pageUrl) return;
    const url = URL.createObjectURL(new Blob([qrComoSvg(pageUrl)], { type: 'image/svg+xml' }));
    const enlace = document.createElement('a');
    enlace.href = url; enlace.download = `qr-${config.page.slug}.svg`; enlace.click();
    URL.revokeObjectURL(url);
    scheduling.setStatus('QR descargado.');
  };
  const addService = () => { setVista(1); setCajon({ cual: 'servicio', id: null }); };
  const acciones = useRef({ copy, publish, addService });
  acciones.current = { copy, publish, addService }; // los botones del encabezado usan siempre lo último que hay en pantalla
  const sinServicios = config.types.length >= 30;
  useEffect(() => {
    onHeader?.(<>
      <div className="tabs" id="pubview" role="group" aria-label="Vista de Página pública">{PESTANAS_PUBLICA.map((texto, i) => <button type="button" key={texto} className={vista === i ? 'on' : undefined} aria-pressed={vista === i} onClick={() => setVista(i as VistaPublica)}>{texto}</button>)}</div>
      <button className="chip" type="button" data-pa="copy" onClick={() => acciones.current.copy()} disabled={!pageUrl}><PanelV29Icon name="link" />Copiar link</button>
      {vista === 1 ? <button className="cta" type="button" id="pubcta" disabled={sinServicios} onClick={() => acciones.current.addService()}><PanelV29Icon name="plus" />Nuevo servicio</button>
        : <button className="cta" type="button" id="pubcta" disabled={scheduling.busy || !loaded} onClick={() => acciones.current.publish()}><PanelV29Icon name="globe" />Publicar cambios</button>}
    </>);
  }, [onHeader, vista, pageUrl, sinServicios, scheduling.busy, loaded]);
  const current = editor && editor !== 'nuevo' ? editor : null;
  const cerrar = () => setCajon(null);
  const comun = { config, onAplicar: setDraft, onClose: cerrar };
  const quitarServicio = (id: string) => {
    const { [id]: _quitada, ...notas } = config.page_extras?.service_notes ?? {};
    setDraft(config.page_extras?.service_notes ? conExtras({ ...config, types: config.types.filter(tipo => tipo.id !== id) }, { service_notes: notas }) : { ...config, types: config.types.filter(tipo => tipo.id !== id) });
    setServicio(0);
  };
  const duplicarServicio = (id: string) => {
    const tipo = config.types.find(item => item.id === id);
    if (!tipo || config.types.length >= 30) return;
    const copia = { ...tipo, id: crypto.randomUUID(), name: `${tipo.name} (copia)`.slice(0, 80) };
    const nota = config.page_extras?.service_notes?.[id];
    const base = { ...config, types: [...config.types, copia] };
    setDraft(nota ? conExtras(base, { service_notes: { ...config.page_extras?.service_notes, [copia.id]: nota } }) : base);
    setServicio(config.types.length);
  };
  const setAviso = (clave: AvisoReserva, activo: boolean) => setDraft(conExtras(config, { notices: { ...config.page_extras?.notices, [clave]: activo } }));
  const setDia = (dia: number, activo: boolean) => setDraft({ ...config, weekly: conHorarioDelDia(config.weekly, dia, activo ? [HORARIO_NUEVO] : [], config.calendars[0].id) });
  return <>
    <PanelPublicaV29 config={config} reservas={scheduling.snapshot?.bookings ?? []} publicada={published} sinPublicar={Boolean(draft) || fotoSinPublicar} link={pageUrl} planes={plans} mercadoPago={mercadoPago} marcaLogo={logoEnPantalla} fotoBorrador={fotoSinPublicar}
      vista={vista} servicio={servicio} cargando={!loaded && !scheduling.error} error={scheduling.error} estado={planNotice || scheduling.status}
      onServicio={setServicio} onCajon={(cual, id) => setCajon({ cual, id: id ?? null })} onQuitarServicio={quitarServicio} onDuplicarServicio={duplicarServicio}
      onCopiar={copy} onDescargarQr={downloadQr} onAviso={setAviso} onDia={setDia}
      onRecordatorios={() => { const next = { ...config, reminders_enabled: config.reminders_enabled === false }; setDraft(next); void scheduling.save(next, next.reminders_enabled ? 'Recordatorio de 24 h prendido.' : 'Recordatorio de 24 h apagado.').then(ok => { if (ok) setDraft(null); }); }}
      onReservar={onAgenda ?? (() => setVista(2))} onReintentar={() => void scheduling.load()}
      onConfirmar={id => { const reserva = scheduling.snapshot?.bookings.find(item => item.id === id); if (reserva) void scheduling.confirm(reserva, reserva.patient_id ?? ''); }}
      onNuevoPlan={plans ? () => { setPlanNotice(''); setEditor('nuevo'); } : undefined}
      onPlan={plans ? (plan, visible) => { subscriptionsApi.updatePlan(plan.id, { expected_revision: plan.revision, public_visible: visible }).then(loadPlans).catch(error => setPlanNotice(friendlyError(error))); } : undefined}
      conexiones={<PanelConnections connected={{ google: Boolean(scheduling.snapshot?.connections.google), mercadopago: mercadoPago }} onConnect={key => void scheduling.connect(key)} onDisconnect={key => void scheduling.disconnect(key)} />} />
    {cajon?.cual === 'perfil' && <CajonPerfil {...comun} onFoto={setFotoBorrador} fotoInicial={logoEnPantalla} />}
    {cajon?.cual === 'lugar' && <CajonLugar {...comun} />}
    {cajon?.cual === 'obras' && <CajonObras {...comun} />}
    {cajon?.cual === 'desc' && <CajonDescuentos {...comun} />}
    {cajon?.cual === 'servicio' && <CajonServicio {...comun} tipoId={cajon.id} onAplicar={next => { setDraft(next); if (!cajon.id) setServicio(next.types.length - 1); }} />}
    {cajon?.cual === 'pide' && <CajonPide {...comun} />}
    {cajon?.cual === 'horarios' && <CajonHorarios {...comun} />}
    {cajon?.cual === 'reglas' && <CajonReglas onClose={cerrar} />}
    {cajon?.cual === 'abrir' && <CajonV29 titulo="Tu página pública" sub={pageUrl.replace(/^https?:\/\//, '') || 'Sin publicar'} ok={false} onClose={cerrar}><div className="pubbig"><Celular config={config} publicados={config.types} marcaLogo={logoEnPantalla} fotoBorrador={fotoSinPublicar} /></div></CajonV29>}
    {editor && <div className="p5-dialog" role="dialog" aria-modal="true" aria-label={current ? 'Editar plan' : 'Nuevo plan'}>
      <PlanForm plan={current} canPublish={mercadoPago} onCancel={() => setEditor(null)} onSubmit={draft => {
        const problem = planDraftError(draft);
        if (problem) { setPlanNotice(problem); return; }
        const body = { name: draft.name.trim(), description: draft.description.trim() || null, amount_cents: Number(draft.pesos) * 100, public_visible: draft.visible && mercadoPago };
        const action = current
          ? subscriptionsApi.updatePlan(current.id, { ...body, expected_revision: current.revision, apply_to_active: draft.apply })
          : subscriptionsApi.createPlan(body);
        action.then(() => { setEditor(null); setPlanNotice(current ? 'Plan actualizado.' : 'Plan guardado.'); loadPlans(); }).catch(error => setPlanNotice(friendlyError(error)));
      }} />
    </div>}
  </>;
}
