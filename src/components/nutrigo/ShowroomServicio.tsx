import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { api } from '../../api/client';
import { formatFeeDate, formatPesos } from '../../fees';
import { localBillingDate } from '../../billing';
import { serviceTotals, SERVICE_METHOD_LABELS, SERVICE_STATE_LABELS, summarizeService, type ServiceState } from '../../service';
import type { ServiceBoard, ServiceNutritionist, ServiceOverride, ServicePaymentInput, ServicePaymentMethod, ServiceSettings } from '../../types/service';
import { Icon, type IconName } from '../shared/Icon';
import { NvBadge, NvButton, NvCard, NvState } from './primitives';
import { ConfirmDialog, FeeError } from './cobranzas-shared';
import { feeErrorMessage, parsePesos } from './cobranzas-utils';
import { adminErrorMessage, buildMailto, buildServiceRows, daysLeftText, emailsOf, filterServiceRows, mailKindFor, mailTemplate, replaceNutritionist, SERVICE_ORDERS, SERVICE_STATE_FILTERS, SERVICE_STATE_TONE, serviceEventLabel, shortDateTime, focusCounts, matchesFocus, monthlyCollections, serviceRowsCsv, SERVICE_FOCUS, type ServiceFocus, type ServiceOrder, type ServiceRow } from './servicio-utils';
import { ActividadTab, AltasTab, PruebasTab } from './ServicioTabs';
import { CollectionsChart, CountUp, StateDonut, type DonutSlice } from './AdminViz';
import './cobranzas-fig.css';
import './servicio-fig.css';

export function SettingsCard({ settings, onSaved }: { settings: ServiceSettings; onSaved: (settings: ServiceSettings) => void }) {
  const [price, setPrice] = useState(settings.monthly_price ? String(settings.monthly_price) : '');
  const [trial, setTrial] = useState(String(settings.trial_days));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const monthly = price.trim() ? parsePesos(price) : null;
    if (price.trim() && !monthly) { setError('El precio mensual tiene que ser un monto en pesos, sin decimales.'); return; }
    const days = Number(trial);
    if (!trial.trim() || !Number.isInteger(days) || days < 0 || days > 365) { setError('Los días de prueba van de 0 a 365.'); return; }
    setBusy(true); setError(''); setSaved(false);
    try {
      const result = await api.saveServiceSettings({ monthly_price: monthly, trial_days: days });
      onSaved(result.settings); setSaved(true);
    } catch (reason) { setError(feeErrorMessage(reason, 'No pudimos guardar el precio y la prueba.')); } finally { setBusy(false); }
  };

  return <NvCard title="Precio y prueba" className="cbz-settings" action={<Icon name="wallet" size={16} />}>
    <p className="cbz-hint">El precio se sugiere al registrar un pago. Los días de prueba valen para las nutricionistas nuevas.</p>
    <form className="cbz-form" onSubmit={save} noValidate>
      <div className="cbz-grid cbz-grid-2">
        <label htmlFor="svc-set-price">Precio mensual ($)<input id="svc-set-price" inputMode="numeric" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="Sin definir" disabled={busy} /></label>
        <label htmlFor="svc-set-trial">Días de prueba<input id="svc-set-trial" inputMode="numeric" value={trial} onChange={(event) => setTrial(event.target.value)} disabled={busy} /></label>
      </div>
      <FeeError message={error} />
      {saved && !error && <p className="cbz-ok" role="status">Precio y prueba guardados.</p>}
      <NvButton type="submit" disabled={busy}>{busy ? 'Guardando…' : 'Guardar'}</NvButton>
    </form>
  </NvCard>;
}

function PaymentForm({ defaultAmount, onSubmit }: { defaultAmount: number | null; onSubmit: (input: ServicePaymentInput) => Promise<void> }) {
  const [amount, setAmount] = useState(defaultAmount ? String(defaultAmount) : '');
  const [months, setMonths] = useState('1');
  const [paidOn, setPaidOn] = useState(() => localBillingDate());
  const [method, setMethod] = useState<ServicePaymentMethod>('transferencia');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const pesos = parsePesos(amount);
    const count = Number(months);
    if (!pesos) { setError('Escribí un monto en pesos, sin decimales.'); return; }
    if (!Number.isInteger(count) || count < 1 || count > 24) { setError('Los meses van de 1 a 24.'); return; }
    if (!paidOn) { setError('Elegí la fecha del pago.'); return; }
    setBusy(true); setError('');
    try {
      await onSubmit({ amount: pesos, months: count, paid_on: paidOn, method, ...(note.trim() ? { note: note.trim() } : {}) });
      setNote('');
    } catch (reason) { setError(feeErrorMessage(reason)); } finally { setBusy(false); }
  };

  return <form className="cbz-form" onSubmit={submit} noValidate>
    <div className="cbz-grid cbz-grid-2">
      <label htmlFor="svc-pay-amount">Monto ($)<input id="svc-pay-amount" inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Ej. 25000" disabled={busy} /></label>
      <label htmlFor="svc-pay-months">Meses que cubre<input id="svc-pay-months" inputMode="numeric" value={months} onChange={(event) => setMonths(event.target.value)} disabled={busy} /></label>
      <label htmlFor="svc-pay-date">Fecha<input id="svc-pay-date" type="date" value={paidOn} onChange={(event) => setPaidOn(event.target.value)} disabled={busy} /></label>
      <label htmlFor="svc-pay-method">Medio<select id="svc-pay-method" value={method} onChange={(event) => setMethod(event.target.value as ServicePaymentMethod)} disabled={busy}>{(Object.keys(SERVICE_METHOD_LABELS) as ServicePaymentMethod[]).map((key) => <option key={key} value={key}>{SERVICE_METHOD_LABELS[key]}</option>)}</select></label>
    </div>
    <label htmlFor="svc-pay-note">Nota (opcional)<input id="svc-pay-note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={280} disabled={busy} /></label>
    <FeeError message={error} />
    <NvButton type="submit" disabled={busy}>{busy ? <Icon name="loader" size={14} /> : <Icon name="check" size={14} />}{busy ? 'Guardando…' : 'Registrar pago'}</NvButton>
  </form>;
}

export function ServiceStateBadge({ state }: { state: keyof typeof SERVICE_STATE_LABELS }) {
  return <span className={`cbz-state svc-state-${state}`}><NvBadge tone={SERVICE_STATE_TONE[state]}>{SERVICE_STATE_LABELS[state]}</NvBadge></span>;
}

export function NutritionistPanel({ nutritionist, monthlyPrice, onChange, onBack, today }: {
  nutritionist: ServiceNutritionist; monthlyPrice: number | null; onChange: (nutritionist: ServiceNutritionist) => void; onBack: () => void; today: string;
}) {
  const summary = useMemo(() => summarizeService(nutritionist.subscription, today), [nutritionist, today]);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [voiding, setVoiding] = useState<string | null>(null);
  const [trialDays, setTrialDays] = useState('15');
  const [overrideNote, setOverrideNote] = useState('');
  const [internalNote, setInternalNote] = useState(nutritionist.subscription.note);
  const [notice, setNotice] = useState('');

  const act = async (id: string, run: () => Promise<{ nutritionist: ServiceNutritionist }>): Promise<boolean> => {
    setBusyId(id); setError(''); setNotice('');
    try { onChange((await run()).nutritionist); return true; }
    catch (reason) { setError(adminErrorMessage(reason)); return false; } finally { setBusyId(''); }
  };
  const resendAccess = async () => {
    setBusyId('access'); setError(''); setNotice('');
    try { await api.sendNutritionistAccess(nutritionist.id); setNotice(`Le reenviamos el acceso a ${nutritionist.email}.`); }
    catch (reason) { setError(adminErrorMessage(reason, 'No pudimos reenviar el acceso.')); } finally { setBusyId(''); }
  };
  const saveNote = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void act('note', () => api.saveNutritionistNote(nutritionist.id, internalNote.trim())).then((ok) => { if (ok) setNotice('Nota guardada.'); });
  };
  const mail = mailTemplate(mailKindFor(summary.state), nutritionist.display_name);
  const record = async (input: ServicePaymentInput) => { onChange((await api.addServicePayment(nutritionist.id, input)).nutritionist); setNotice('Pago registrado.'); };
  const extend = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const days = Number(trialDays);
    if (!Number.isInteger(days) || days < 1 || days > 365) { setError('Los días van de 1 a 365.'); return; }
    void act('trial', () => api.extendServiceTrial(nutritionist.id, days));
  };
  const setOverride = (override: ServiceOverride) => act(`override-${override}`, () => api.setServiceOverride(nutritionist.id, override, overrideNote.trim())).then((ok) => { if (ok) setOverrideNote(''); });

  const history = [...nutritionist.payments].sort((a, b) => b.paid_on.localeCompare(a.paid_on) || b.created_at.localeCompare(a.created_at));
  const current = nutritionist.subscription.override;
  const busy = Boolean(busyId);

  return <aside className="cbz-panel" aria-label={`Servicio de ${nutritionist.display_name}`}>
    <button type="button" className="cbz-back" onClick={onBack}><Icon name="chevron" size={14} />Volver a la lista</button>
    <header className="cbz-panel-head">
      <div><h2>{nutritionist.display_name}</h2><p>{nutritionist.email}</p></div>
      <ServiceStateBadge state={summary.state} />
    </header>
    <dl className="cbz-figures">
      <div><dt>{summary.until ? 'Hasta' : 'Vigencia'}</dt><dd>{summary.until ? formatFeeDate(summary.until) : 'Sin fecha'}</dd></div>
      <div><dt>Pacientes activos</dt><dd>{nutritionist.patients_active}</dd></div>
      <div><dt>Último ingreso</dt><dd>{nutritionist.last_sign_in_at ? shortDateTime(nutritionist.last_sign_in_at) : 'Nunca'}</dd></div>
    </dl>
    <div className="cbz-actions svc-quick">
      <NvButton className="nv-soft" disabled={busy} onClick={() => void resendAccess()}>{busyId === 'access' ? 'Enviando…' : 'Reenviar acceso'}</NvButton>
      <a className="nv-button nv-soft svc-mail" href={buildMailto([nutritionist.email], mail.subject, mail.body)}><Icon name="message" size={14} />Escribir mail</a>
    </div>
    <FeeError message={error} />
    {notice && !error && <p className="cbz-ok" role="status">{notice}</p>}

    <section className="cbz-block"><h3>Nota interna</h3>
      <form className="cbz-form" onSubmit={saveNote} noValidate>
        <p className="cbz-hint">Sólo la ves vos. No va con datos de salud.</p>
        <label htmlFor="svc-internal-note">Nota<textarea id="svc-internal-note" rows={3} value={internalNote} onChange={(event) => setInternalNote(event.target.value)} maxLength={500} disabled={busy} /></label>
        <NvButton type="submit" className="nv-soft" disabled={busy}>{busyId === 'note' ? 'Guardando…' : 'Guardar nota'}</NvButton>
      </form>
    </section>

    <section className="cbz-block"><h3>Registrar pago</h3>
      <PaymentForm key={`${nutritionist.id}-${nutritionist.payments.length}-${monthlyPrice ?? 0}`} defaultAmount={monthlyPrice} onSubmit={record} />
    </section>

    <section className="cbz-block"><h3>Extender prueba</h3>
      <form className="cbz-form" onSubmit={extend} noValidate>
        <p className="cbz-hint">La prueba termina el {formatFeeDate(nutritionist.subscription.trial_ends_on)}.</p>
        <label htmlFor="svc-trial-days">Días a sumar<input id="svc-trial-days" inputMode="numeric" value={trialDays} onChange={(event) => setTrialDays(event.target.value)} disabled={busy} /></label>
        <NvButton type="submit" className="nv-soft" disabled={busy}>{busyId === 'trial' ? 'Guardando…' : 'Extender prueba'}</NvButton>
      </form>
    </section>

    <section className="cbz-block"><h3>Excepción</h3>
      <p className="cbz-hint">{current === 'waived' ? 'Tiene el servicio sin cargo.' : current === 'suspended' ? 'Está suspendida: ve todo, pero no puede cargar ni cambiar nada.' : 'Sin excepciones: se rige por la prueba y los pagos. Si vence, sigue andando y ve un aviso; para dejarla en solo lectura, suspendela.'}</p>
      <div className="cbz-form"><label htmlFor="svc-override-note">Nota (opcional)<input id="svc-override-note" value={overrideNote} onChange={(event) => setOverrideNote(event.target.value)} maxLength={280} disabled={busy} /></label></div>
      <div className="cbz-actions">
        {current !== 'waived' && <NvButton className="nv-soft" disabled={busy} onClick={() => void setOverride('waived')}>Sin cargo</NvButton>}
        {current !== 'suspended' && <NvButton className="nv-soft" disabled={busy} onClick={() => void setOverride('suspended')}>Suspender</NvButton>}
        {current !== 'none' && <NvButton className="nv-soft" disabled={busy} onClick={() => void setOverride('none')}>Quitar excepción</NvButton>}
      </div>
    </section>

    <section className="cbz-block"><h3>Historial de pagos</h3>
      {history.length ? <ul className="cbz-list">{history.map((payment) => <li key={payment.id} className={`cbz-row${payment.status === 'voided' ? ' cbz-dim' : ''}`}>
        <div><strong>{formatPesos(payment.amount)} · {payment.months === 1 ? '1 mes' : `${payment.months} meses`}</strong><small>{formatFeeDate(payment.paid_on)} · {SERVICE_METHOD_LABELS[payment.method]}{payment.note ? ` · ${payment.note}` : ''}</small></div>
        <div className="cbz-actions"><NvBadge tone={payment.status === 'confirmed' ? 'green' : 'coral'}>{payment.status === 'confirmed' ? 'Confirmado' : 'Anulado'}</NvBadge>
          {payment.status === 'confirmed' && <NvButton className="nv-ghost" disabled={busy} onClick={() => setVoiding(payment.id)}>Anular</NvButton>}</div>
      </li>)}</ul> : <p className="cbz-muted">Todavía no hay pagos registrados.</p>}
    </section>

    {voiding && <ConfirmDialog title="¿Anular este pago?" description="El pago deja de contar para la vigencia. Queda en el historial como anulado." confirmLabel="Anular pago" busy={busyId === voiding} error={error}
      onCancel={() => setVoiding(null)} onConfirm={() => void act(voiding, () => api.voidServicePayment(voiding)).then((ok) => { if (ok) setVoiding(null); })} />}
  </aside>;
}

export type ServicioTab = 'resumen' | 'altas' | 'pruebas' | 'actividad' | 'precio';
export const SERVICIO_TABS: Array<{ id: ServicioTab; label: string }> = [
  { id: 'resumen', label: 'Resumen' }, { id: 'altas', label: 'Altas' }, { id: 'pruebas', label: 'Cuentas de prueba' }, { id: 'actividad', label: 'Actividad' }, { id: 'precio', label: 'Precio y prueba' },
];
export const SERVICIO_TAB_ICONS: Record<ServicioTab, IconName> = { resumen: 'grid', altas: 'plus', pruebas: 'sparkle', actividad: 'history', precio: 'wallet' };

const SORTABLE: Array<{ label: string; order?: ServiceOrder }> = [
  { label: '#' }, { label: 'Nutricionista', order: 'nombre' }, { label: 'Estado' }, { label: 'Pacientes', order: 'pacientes' }, { label: 'Vigencia', order: 'vencimiento' }, { label: 'Último ingreso', order: 'ingreso' },
];

function downloadCsv(text: string): boolean {
  try {
    const url = URL.createObjectURL(new Blob([`﻿${text}`], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = `nutricionistas-plan-v-${localBillingDate()}.csv`; anchor.click(); URL.revokeObjectURL(url);
    return true;
  } catch { return false; }
}

function ServiceList({ rows, selectedId, onSelect }: { rows: ServiceRow[]; selectedId: string | null; onSelect: (id: string) => void }) {
  const [query, setQuery] = useState('');
  const [state, setState] = useState<ServiceState | 'todas'>('todas');
  const [order, setOrder] = useState<ServiceOrder>('vencimiento');
  const [focus, setFocus] = useState<ServiceFocus>('todas');
  const [copied, setCopied] = useState('');
  const counts = useMemo(() => focusCounts(rows), [rows]);
  const visible = useMemo(() => filterServiceRows(rows, { query, state, order }).filter((row) => matchesFocus(row, focus)), [rows, query, state, order, focus]);
  const maxPatients = Math.max(1, ...visible.map((row) => row.nutritionist.patients_active));
  const emails = emailsOf(visible);
  const template = mailTemplate(state === 'todas' ? 'bienvenida' : mailKindFor(state));
  const mailto = buildMailto(emails, template.subject, template.body);

  const copy = async () => {
    try { await navigator.clipboard.writeText(emails.join(', ')); setCopied(emails.length === 1 ? 'Copiamos 1 mail.' : `Copiamos ${emails.length} mails.`); }
    catch { setCopied('No pudimos copiar. Probá de nuevo.'); }
  };
  const download = () => setCopied(downloadCsv(serviceRowsCsv(visible)) ? `Descargamos ${visible.length === 1 ? '1 nutricionista' : `${visible.length} nutricionistas`}.` : 'No pudimos descargar la lista.');

  return <section className="cbz-directory" aria-label="Nutricionistas">
    <header className="adm-list-head"><h2>Ranking de nutricionistas <span className="svc-count">{visible.length === rows.length ? rows.length : `${visible.length} de ${rows.length}`}</span></h2>
      {rows.length > 0 && <div className="adm-segment" role="group" aria-label="Mostrar">{SERVICE_FOCUS.map((item) => <button key={item.id} type="button" aria-pressed={focus === item.id} onClick={() => setFocus(item.id)}>{item.label}<span>{counts[item.id]}</span></button>)}</div>}
    </header>
    {rows.length > 0 && <div className="svc-tools">
      <div className="cbz-form svc-filters">
        <label htmlFor="svc-search">Buscar<input id="svc-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nombre o mail" /></label>
        <label htmlFor="svc-state">Estado<select id="svc-state" value={state} onChange={(event) => setState(event.target.value as ServiceState | 'todas')}>{SERVICE_STATE_FILTERS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <label htmlFor="svc-order">Ordenar por<select id="svc-order" value={order} onChange={(event) => setOrder(event.target.value as ServiceOrder)}>{SERVICE_ORDERS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
      </div>
      <div className="cbz-actions">
        <NvButton className="nv-soft" disabled={!emails.length} onClick={() => void copy()}>Copiar mails</NvButton>
        {mailto ? <a className="nv-button nv-soft svc-mail" href={mailto}>Escribir mail</a> : <NvButton className="nv-soft" disabled>Escribir mail</NvButton>}
        <NvButton className="nv-soft" disabled={!visible.length} onClick={download}><Icon name="download" size={14} />Descargar lista</NvButton>
        {copied && <span className="cbz-muted" role="status">{copied}</span>}
      </div>
    </div>}
    {!rows.length ? <NvState title="Todavía no hay nutricionistas" description="Cuando se sumen las vas a ver acá con su prueba y sus pagos." />
      : !visible.length ? <p className="cbz-muted cbz-pad">Ninguna nutricionista coincide con la búsqueda.</p>
        : <div className="adm-table-wrap"><table className="adm-table">
          <thead><tr>{SORTABLE.map((column) => <th key={column.label} scope="col" aria-sort={column.order && column.order === order ? (column.order === 'nombre' || column.order === 'vencimiento' ? 'ascending' : 'descending') : undefined}>
            {column.order ? <button type="button" className={`adm-sort${column.order === order ? ' adm-sort-on' : ''}`} onClick={() => setOrder(column.order!)}>{column.label}<svg viewBox="0 0 10 14" aria-hidden="true"><path d="M5 1 8.5 5h-7zM5 13 1.5 9h7z" /></svg></button> : column.label}
          </th>)}</tr></thead>
          <tbody>{visible.map(({ nutritionist, summary }, index) => <tr key={nutritionist.id} className={nutritionist.id === selectedId ? 'adm-selected' : ''} style={{ ['--adm-i' as string]: Math.min(index, 14) }}>
            <td className="adm-rank">{index + 1}</td>
            <td><button type="button" className="adm-who" aria-pressed={nutritionist.id === selectedId} aria-label={`Ver servicio de ${nutritionist.display_name}`} onClick={() => onSelect(nutritionist.id)}>
              <span className="adm-avatar" aria-hidden="true">{nutritionist.display_name.trim().charAt(0).toUpperCase()}</span>
              <span><strong>{nutritionist.display_name}</strong><small>{nutritionist.email}</small></span></button></td>
            <td><ServiceStateBadge state={summary.state} /></td>
            <td><span className="adm-bar" title={`${nutritionist.patients_active} activas de ${nutritionist.patients_total}`}><i style={{ width: `${Math.round((nutritionist.patients_active / maxPatients) * 100)}%` }} /></span><b>{nutritionist.patients_active === 1 ? '1 paciente activa' : `${nutritionist.patients_active} pacientes activas`}</b></td>
            <td>{summary.until ? <>Hasta {formatFeeDate(summary.until)}<small>{daysLeftText(summary)}</small></> : <small>Sin fecha</small>}</td>
            <td>{nutritionist.last_sign_in_at ? shortDateTime(nutritionist.last_sign_in_at) : <small>Último ingreso: nunca</small>}</td>
          </tr>)}</tbody></table></div>}
  </section>;
}

export function ServicioScreen({ board, onBoard, today = localBillingDate(), initialSelectedId = null, initialTab = 'resumen', tab: controlledTab, onTab }: {
  board: ServiceBoard; onBoard: (board: ServiceBoard) => void; today?: string; initialSelectedId?: string | null; initialTab?: ServicioTab;
  /** Si la pantalla de afuera maneja la sección (la barra lateral del /admin), la pasa acá. */
  tab?: ServicioTab; onTab?: (tab: ServicioTab) => void;
}) {
  const [ownTab, setOwnTab] = useState<ServicioTab>(initialTab);
  const tab = controlledTab ?? ownTab;
  const setTab = (next: ServicioTab) => { setOwnTab(next); onTab?.(next); };
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId);
  const rows = useMemo(() => buildServiceRows(board, today), [board, today]);
  const totals = serviceTotals(board.nutritionists, today);
  const collections = useMemo(() => monthlyCollections(board.nutritionists, today), [board.nutritionists, today]);
  const slices: DonutSlice[] = [
    { id: 'activas', label: 'Activas', value: totals.activas, color: 'var(--adm-accent)' },
    { id: 'prueba', label: 'En prueba', value: totals.prueba, color: 'var(--adm-slice-2)' },
    { id: 'vencidas', label: 'Vencidas', value: totals.vencidas, color: 'var(--adm-slice-3)' },
    { id: 'sin_cargo', label: 'Sin cargo', value: totals.sin_cargo, color: 'var(--adm-slice-4)' },
  ];
  const real = totals.activas + totals.prueba + totals.vencidas + totals.sin_cargo;
  const selected = selectedId ? board.nutritionists.find((item) => item.id === selectedId) ?? null : null;
  const names = useMemo(() => new Map(board.nutritionists.map((item) => [item.id, item.display_name])), [board.nutritionists]);
  const selectedEvents = selected ? board.events.filter((event) => event.nutritionist_id === selected.id).slice(0, 6) : [];

  return <div className="cbz svc">
    <header className="svc-head"><h2>Panel del servicio</h2><p>Acá no hay datos de salud de las pacientes: solo cantidades.</p></header>
    <div className="svc-tabs" role="tablist" aria-label="Secciones del panel">
      {SERVICIO_TABS.map((item) => <button key={item.id} type="button" role="tab" id={`svc-tab-${item.id}`} aria-selected={tab === item.id} aria-controls="svc-tabpanel" tabIndex={tab === item.id ? 0 : -1} onClick={() => setTab(item.id)}><Icon name={SERVICIO_TAB_ICONS[item.id]} size={14} />{item.label}</button>)}
    </div>
    <div id="svc-tabpanel" role="tabpanel" aria-labelledby={`svc-tab-${tab}`} className="svc-tabpanel">
      {tab === 'resumen' && <>
        <dl className="cbz-summary">
          <div className="cbz-stat"><dt>Activas</dt><dd><CountUp value={totals.activas} /></dd></div>
          <div className="cbz-stat"><dt>En prueba</dt><dd><CountUp value={totals.prueba} /></dd></div>
          <div className="cbz-stat"><dt>Vencidas</dt><dd><CountUp value={totals.vencidas} /></dd></div>
          <div className="cbz-stat"><dt>Cobrado este mes</dt><dd><CountUp value={totals.cobrado_mes} format={formatPesos} /></dd></div>
        </dl>
        <div className="adm-charts">
          <section className="adm-chart-card" aria-label="Estado del servicio">
            <header><h3>Estado del servicio</h3><strong className="adm-big"><CountUp value={real ? Math.round((totals.activas / real) * 100) : 0} format={(n) => `${n}%`} /></strong><small>{totals.activas === 1 ? "1 activa" : `${totals.activas} activas`} de {real === 1 ? "1 nutricionista" : `${real} nutricionistas`}</small></header>
            <StateDonut slices={slices} />
          </section>
          <section className="adm-chart-card" aria-label="Cobros por mes">
            <header><h3>Cobros por mes</h3><strong className="adm-big"><CountUp value={collections.reduce((sum, item) => sum + item.total, 0)} format={formatPesos} /></strong><small>En los últimos {collections.length} meses, sin cuentas de prueba</small></header>
            <CollectionsChart points={collections} format={formatPesos} />
          </section>
        </div>
        <div className={`cbz-layout${selected ? ' cbz-has-selection' : ''}`}>
          <div className="cbz-list-col">
            <ServiceList rows={rows} selectedId={selectedId} onSelect={setSelectedId} />
            <NvCard title="Actividad reciente">
              {board.events.length ? <ul className="cbz-list svc-events">{board.events.slice(0, 8).map((event) => <li key={event.id} className="cbz-row">
                <div><strong>{serviceEventLabel(event.action)}</strong><small>{event.nutritionist_id ? names.get(event.nutritionist_id) ?? 'Nutricionista' : 'General'} · {shortDateTime(event.occurred_at)}</small></div>
              </li>)}</ul> : <p className="cbz-muted">Todavía no hay movimientos.</p>}
              {board.events.length > 8 && <NvButton className="nv-ghost" onClick={() => setTab('actividad')}>Ver toda la actividad</NvButton>}
            </NvCard>
          </div>
          {selected ? <div className="adm-detail-col">
            <NutritionistPanel key={selected.id} nutritionist={selected} monthlyPrice={board.settings.monthly_price} today={today} onBack={() => setSelectedId(null)} onChange={(next) => onBoard(replaceNutritionist(board, next))} />
            <NvCard title={`Movimientos de ${selected.display_name.split(' ')[0]}`}>
              {selectedEvents.length ? <ol className="adm-timeline">{selectedEvents.map((event) => <li key={event.id}><strong>{serviceEventLabel(event.action)}</strong><small>{shortDateTime(event.occurred_at)}</small></li>)}</ol>
                : <p className="cbz-muted">Todavía no hay movimientos de esta nutricionista.</p>}
            </NvCard>
          </div>
            : <aside className="cbz-panel cbz-panel-empty" aria-label="Detalle del servicio"><p>Elegí una nutricionista para registrar pagos, extender su prueba o cambiar su estado.</p></aside>}
        </div>
      </>}
      {tab === 'altas' && <AltasTab nutritionists={board.nutritionists} onCreated={(nutritionist) => onBoard({ ...board, nutritionists: [...board.nutritionists.filter((item) => item.id !== nutritionist.id), nutritionist] })} onOpen={(id) => { setSelectedId(id); setTab('resumen'); }} />}
      {tab === 'pruebas' && <PruebasTab />}
      {tab === 'actividad' && <ActividadTab events={board.events} names={names} />}
      {tab === 'precio' && <SettingsCard settings={board.settings} onSaved={(settings) => onBoard({ ...board, settings })} />}
    </div>
  </div>;
}

export function ShowroomServicio({ tab, onTab }: { tab?: ServicioTab; onTab?: (tab: ServicioTab) => void } = {}) {
  const [board, setBoard] = useState<ServiceBoard | null>(null);
  const [error, setError] = useState('');
  const load = useCallback(() => {
    setError(''); setBoard(null);
    api.getServiceBoard().then((result) => setBoard(result.board)).catch((reason) => setError(feeErrorMessage(reason, 'No pudimos cargar el panel del servicio.')));
  }, []);
  useEffect(load, [load]);

  if (error) return <NvState kind="error" title="No pudimos cargar el panel del servicio" description={error} action={<NvButton className="nv-soft" onClick={load}>Reintentar</NvButton>} />;
  if (!board) return <NvState kind="loading" title="Cargando el panel…" description="Estamos buscando las nutricionistas y sus pagos." />;
  return <ServicioScreen board={board} onBoard={setBoard} tab={tab} onTab={onTab} />;
}
