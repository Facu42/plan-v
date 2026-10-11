import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { api } from '../../api/client';
import type { NutritionistCreateMode, ServiceEvent, ServiceNutritionist, TestAccount, TestAccountsResult } from '../../types/service';
import { NvBadge, NvButton, NvCard } from './primitives';
import { FeeError } from './cobranzas-shared';
import { adminErrorMessage, filterServiceEvents, isValidEmail, MIN_PASSWORD, SERVICE_EVENT_LABELS, serviceEventLabel, shortDateTime, testAliasEmails } from './servicio-utils';

export const APP_URL = 'https://plan-v-eight.vercel.app';

/** Altas: crea una nutricionista por invitación de mail o con clave. */
export function AltasTab({ nutritionists, onCreated, onOpen }: { nutritionists: ServiceNutritionist[]; onCreated: (nutritionist: ServiceNutritionist) => void; onOpen: (id: string) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mode, setMode] = useState<NutritionistCreateMode>('invite');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const recent = useMemo(() => [...nutritionists].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 8), [nutritionists]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanName) { setError('Escribí el nombre de la nutricionista.'); return; }
    if (!isValidEmail(cleanEmail)) { setError('Escribí un mail válido.'); return; }
    if (mode === 'password' && password.length < MIN_PASSWORD) { setError(`La clave tiene que tener al menos ${MIN_PASSWORD} caracteres.`); return; }
    setBusy(true); setError(''); setDone('');
    try {
      const result = await api.createNutritionist({ name: cleanName, email: cleanEmail, mode, ...(mode === 'password' ? { password } : {}) });
      onCreated(result.nutritionist);
      setDone(mode === 'invite'
        ? `Listo: creamos la cuenta de ${cleanName} y le mandamos la invitación a ${cleanEmail}.`
        : `Listo: creamos la cuenta de ${cleanName} con clave. Pasale el mail ${cleanEmail} y la clave que elegiste.`);
      setName(''); setEmail(''); setPassword('');
    } catch (reason) { setError(adminErrorMessage(reason, 'No pudimos crear la cuenta.')); } finally { setBusy(false); }
  };

  return <div className="svc-two">
    <NvCard title="Alta de nutricionista" className="cbz-settings">
      <p className="cbz-hint">Sumá a una nutricionista nueva. Va a empezar con los días de prueba que tengas definidos.</p>
      <form className="cbz-form" onSubmit={submit} noValidate>
        <label htmlFor="alta-name">Nombre<input id="alta-name" value={name} onChange={(event) => setName(event.target.value)} autoComplete="off" disabled={busy} /></label>
        <label htmlFor="alta-email">Email<input id="alta-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="off" disabled={busy} /></label>
        <fieldset className="svc-modes" disabled={busy}>
          <legend>Cómo entra</legend>
          <label className="svc-radio"><input type="radio" name="alta-mode" checked={mode === 'invite'} onChange={() => setMode('invite')} />Enviar invitación por mail</label>
          <label className="svc-radio"><input type="radio" name="alta-mode" checked={mode === 'password'} onChange={() => setMode('password')} />Crear con clave</label>
        </fieldset>
        {mode === 'password' && <label htmlFor="alta-password">Clave (mínimo {MIN_PASSWORD} caracteres)<input id="alta-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={MIN_PASSWORD} disabled={busy} /></label>}
        <FeeError message={error} />
        {done && !error && <p className="cbz-ok" role="status">{done}</p>}
        <NvButton type="submit" disabled={busy}>{busy ? 'Creando…' : mode === 'invite' ? 'Enviar invitación' : 'Crear cuenta'}</NvButton>
      </form>
    </NvCard>
    <NvCard title="Altas recientes">
      {recent.length ? <ul className="cbz-list">{recent.map((item) => <li key={item.id} className="cbz-row">
        <div><strong>{item.display_name}</strong><small>{item.email} · Alta {shortDateTime(item.created_at)}</small></div>
        <NvButton className="nv-ghost" onClick={() => onOpen(item.id)}>Ver</NvButton>
      </li>)}</ul> : <p className="cbz-muted">Todavía no hay altas.</p>}
    </NvCard>
  </div>;
}

/** Cuentas de prueba: una nutricionista y una paciente con alias del mismo mail. */
export function PruebasTab({ initialAccounts = null }: { initialAccounts?: TestAccount[] | null }) {
  const [emailBase, setEmailBase] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<TestAccountsResult | null>(null);
  const [accounts, setAccounts] = useState<TestAccount[] | null>(initialAccounts);
  const [listError, setListError] = useState('');
  const preview = testAliasEmails(emailBase);

  const load = useCallback(() => {
    setListError('');
    api.listTestAccounts().then((response) => setAccounts(response.accounts)).catch((reason) => { setAccounts([]); setListError(adminErrorMessage(reason, 'No pudimos traer las cuentas de prueba.')); });
  }, []);
  useEffect(() => { if (initialAccounts === null) load(); }, [load, initialAccounts]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValidEmail(emailBase)) { setError('Escribí tu mail, por ejemplo facundorodriguez42@gmail.com.'); return; }
    if (password.length < MIN_PASSWORD) { setError(`La clave tiene que tener al menos ${MIN_PASSWORD} caracteres.`); return; }
    setBusy(true); setError(''); setResult(null);
    try {
      setResult(await api.createTestAccounts({ email_base: emailBase.trim(), password }));
      setPassword('');
      load();
    } catch (reason) { setError(adminErrorMessage(reason, 'No pudimos crear las cuentas de prueba.')); } finally { setBusy(false); }
  };

  return <div className="svc-two">
    <NvCard title="Crear cuentas de prueba" className="cbz-settings">
      <p className="cbz-hint">Con un solo mail armamos una nutricionista y una paciente para probar la app. Las dos entran a tu casilla gracias a los alias.</p>
      <form className="cbz-form" onSubmit={submit} noValidate>
        <label htmlFor="prueba-email">Tu mail<input id="prueba-email" type="email" value={emailBase} onChange={(event) => setEmailBase(event.target.value)} placeholder="facundorodriguez42@gmail.com" autoComplete="off" disabled={busy} /></label>
        <label htmlFor="prueba-password">Clave (mínimo {MIN_PASSWORD} caracteres)<input id="prueba-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" disabled={busy} /></label>
        {preview && !result && <p className="cbz-hint svc-preview">Se van a crear <strong>{preview.nutritionist}</strong> y <strong>{preview.patient}</strong>.</p>}
        <FeeError message={error} />
        <NvButton type="submit" disabled={busy}>{busy ? 'Creando…' : 'Crear nutricionista y paciente de prueba'}</NvButton>
      </form>
      {result && !error && <div className="svc-result" role="status">
        <p><strong>{result.created ? 'Listo, creamos las cuentas.' : 'Esas cuentas ya existían: les actualizamos la clave.'}</strong></p>
        <dl>
          <div><dt>Nutricionista</dt><dd>{result.nutritionist.email}</dd></div>
          <div><dt>Paciente</dt><dd>{result.patient.email}</dd></div>
        </dl>
        <p>Entrá a {APP_URL} con ese mail y la clave.</p>
      </div>}
    </NvCard>
    <NvCard title="Cuentas de prueba existentes">
      {accounts === null ? <p className="cbz-muted">Cargando…</p>
        : accounts.length ? <ul className="cbz-list">{accounts.map((account) => <li key={`${account.role}-${account.email}`} className="cbz-row">
          <div><strong>{account.name || account.email}</strong><small>{account.email}</small></div>
          <NvBadge tone={account.role === 'nutricionista' ? 'green' : 'gold'}>{account.role === 'nutricionista' ? 'Nutricionista' : 'Paciente'}</NvBadge>
        </li>)}</ul> : <p className="cbz-muted">{listError || 'Todavía no hay cuentas de prueba.'}</p>}
      {accounts !== null && accounts.length === 0 && listError ? <NvButton className="nv-ghost" onClick={load}>Reintentar</NvButton> : null}
    </NvCard>
  </div>;
}

/** Historial completo de service.* con filtro por tipo y buscador. */
export function ActividadTab({ events, names }: { events: ServiceEvent[]; names: Map<string, string> }) {
  const [type, setType] = useState('todos');
  const [query, setQuery] = useState('');
  const types = useMemo(() => {
    const present = new Set(events.map((event) => event.action));
    return [...new Set([...Object.keys(SERVICE_EVENT_LABELS), ...present])].filter((action) => present.has(action));
  }, [events]);
  const visible = useMemo(() => filterServiceEvents(events, { type, query, names }), [events, type, query, names]);

  return <NvCard title="Actividad del servicio">
    <div className="cbz-form svc-filters svc-filters-2">
      <label htmlFor="act-type">Tipo<select id="act-type" value={type} onChange={(event) => setType(event.target.value)}>
        <option value="todos">Todos los movimientos</option>
        {types.map((action) => <option key={action} value={action}>{serviceEventLabel(action)}</option>)}
      </select></label>
      <label htmlFor="act-search">Buscar<input id="act-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nutricionista o movimiento" /></label>
    </div>
    <p className="cbz-muted svc-count-line">{visible.length === 1 ? '1 movimiento' : `${visible.length} movimientos`}</p>
    {visible.length ? <ul className="cbz-list svc-events svc-events-all">{visible.map((event) => <li key={event.id} className="cbz-row">
      <div><strong>{serviceEventLabel(event.action)}</strong><small>{event.nutritionist_id ? names.get(event.nutritionist_id) ?? 'Nutricionista' : 'General'}</small></div>
      <small className="svc-until">{shortDateTime(event.occurred_at)}</small>
    </li>)}</ul> : <p className="cbz-muted">No hay movimientos con ese filtro.</p>}
  </NvCard>;
}
