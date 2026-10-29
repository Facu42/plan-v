import { useEffect, useRef, useState, type ReactNode, type FormEvent } from 'react';
import { teamApi, type Workplace } from '../../api/team';
import type { OrganizationView } from '../../types/orgs';
import { friendlyError } from '../../lib/error-messages';
import { TeamWorkspace } from './TeamWorkspace';
import { SectionTabs, SettingsDialog } from './EquipoAjustesShared';
import { EquipoIntegrantes, EquipoPermisos, EquipoRegistro, type Persona } from './PanelEquipoVistas';

const TABS = ['Integrantes', 'Permisos', 'Registro de accesos'];
type Person = Persona;
type Member = { user_id: string; email: string; revoked: boolean };
export function PanelEquipo({ onHeader, onCount, initialView = 0 }: { onHeader?: (actions: ReactNode) => void; onCount?: (count: number | null) => void; initialView?: number }) {
  const [view, setView] = useState(initialView), [filter, setFilter] = useState(0), [inviting, setInviting] = useState(false), [advanced, setAdvanced] = useState(false);
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]), [nid, setNid] = useState(''), [orgs, setOrgs] = useState<OrganizationView[]>([]), [orgId, setOrgId] = useState('');
  const [members, setMembers] = useState<Member[]>([]), [professionals, setProfessionals] = useState<Array<{ nutritionist_id: string; name: string; status: 'active'|'invited'; is_self: boolean }>>([]);
  const [selectedId, setSelectedId] = useState(''), [error, setError] = useState(''), [notice, setNotice] = useState(''), [loaded, setLoaded] = useState(false), [revision, setRevision] = useState(0), [busy, setBusy] = useState(false);
  const [email, setEmail] = useState(''), [role, setRole] = useState('Recepción'), [token, setToken] = useState('');
  const lock = useRef(false);
  const [advancedMounted, setAdvancedMounted] = useState(false);
  const [directoryReady, setDirectoryReady] = useState(false);
  const owner = Boolean(workplaces.find(w => w.nutritionist_id === nid)?.owner);
  useEffect(() => { let alive = true; teamApi.workplaces().then(r => { if (alive) { setWorkplaces(r.workplaces); setNid(old => r.workplaces.some(w => w.nutritionist_id === old) ? old : r.workplaces.find(w => w.owner)?.nutritionist_id ?? r.workplaces[0]?.nutritionist_id ?? ''); if (!r.workplaces.length) setLoaded(true); } }).catch(e => { if (alive) setError(friendlyError(e)); }); return () => { alive = false; }; }, [revision]);
  useEffect(() => {
    let alive = true; setLoaded(false); setMembers([]); setProfessionals([]); setOrgs([]); setError('');
    if (!nid) return;
    Promise.all([owner ? teamApi.members(nid) : Promise.resolve({ members: [] }), owner ? teamApi.orgs() : Promise.resolve({ organizations: [] })]).then(([m, o]) => {
      if (!alive) return; setMembers(m.members); setOrgs(o.organizations); setOrgId(old => o.organizations.some(g => g.id === old) ? old : o.organizations.find(g => g.my_status === 'active')?.id ?? ''); setLoaded(true);
    }).catch(e => { if (alive) setError(friendlyError(e)); }); return () => { alive = false; };
  }, [nid, owner, revision]);
  useEffect(() => { const c = new AbortController(); setProfessionals([]); setDirectoryReady(!orgId || !owner); if (orgId && owner) teamApi.professionals(orgId, c.signal).then(r => { if (!c.signal.aborted) { setProfessionals(r.professionals); setDirectoryReady(true); } }).catch(e => { if (!c.signal.aborted) setError(friendlyError(e)); }); return () => c.abort(); }, [orgId, nid, owner, revision]);
  const people: Person[] = [
    ...(owner ? [{ id: nid, name: workplaces.find(w => w.nutritionist_id === nid)?.name ?? 'Tu cuenta', role: 'Dueña', scope: 'Tu cartera', state: 'Activa' }] : []),
    ...professionals.filter(p => !p.is_self).map(p => ({ id: p.nutritionist_id, name: p.name, role: 'Nutricionista', scope: 'Su cartera y asignaciones explícitas', state: p.status === 'active' ? 'Activa' : 'Invitada' })),
    ...members.map(m => ({ id: m.user_id, name: m.email, email: m.email, role: 'Recepción', scope: 'Solo datos de contacto, turnos y cobros', state: m.revoked ? 'Revocada' : 'Activa', reception: m.user_id })),
  ];
  const selected = people.find(p => p.id === selectedId) ?? people[0];
  useEffect(() => { onCount?.(loaded && directoryReady ? people.filter(p => p.state !== 'Revocada').length : null); }, [onCount, loaded, directoryReady, nid, professionals, members]);
  useEffect(() => { onHeader?.(<><SectionTabs labels={TABS} value={view} onChange={setView} label="Equipo"/><button type="button" className="cta" onClick={() => { setToken(''); setInviting(true); }}>Invitar a alguien</button></>); }, [onHeader, view]);
  useEffect(() => () => { onHeader?.(null); onCount?.(null); }, [onHeader, onCount]);
  async function invite(event: FormEvent) {
    event.preventDefault(); if (lock.current || !owner) return; lock.current = true; setBusy(true); setNotice('');
    try {
      if (role === 'Recepción') { const r = await teamApi.invite(nid, email.trim()); setToken(r.token); setNotice(`Invitación preparada. Compartí el código con ${email.trim()}; vence en ${r.expires_in_days} días. No se envió un mail.`); }
      else { await teamApi.inviteProfessionalByEmail(orgId, email.trim()); setNotice('Si el correo pertenece a una cuenta profesional confirmada, verá la invitación en Equipo. No se envía un mail.'); setInviting(false); setRevision(r => r + 1); }
    } catch (e) { setNotice(friendlyError(e)); } finally { lock.current = false; setBusy(false); }
  }
  async function revoke(person: Person) {
    if (!person.reception || lock.current || !window.confirm(`¿Querés quitar el acceso de recepción de ${person.name}?`)) return;
    lock.current = true; setBusy(true); try { await teamApi.revoke(nid, person.reception); setMembers(old => old.map(m => m.user_id === person.reception ? { ...m, revoked: true } : m)); setNotice('Acceso de recepción revocado.'); } catch (e) { setNotice(friendlyError(e)); } finally { lock.current = false; setBusy(false); }
  }
  return <div id="s-equipo" className="ea-screen">
    {!onHeader && <header className="ea-local"><h1>Equipo{loaded && directoryReady ? ` · ${people.filter(p => p.state !== 'Revocada').length} personas` : ''}</h1><p>Cada persona ve solo lo que le habilitás · todo queda registrado</p><SectionTabs labels={TABS} value={view} onChange={setView} label="Equipo"/><button type="button" className="cta" onClick={() => setInviting(true)}>Invitar a alguien</button></header>}
    {error && <p role="alert">{error} <button className="chip" onClick={() => setRevision(r => r + 1)}>Reintentar</button></p>}
    {(!loaded || !directoryReady) && !error && <p role="status">Cargando equipo…</p>}
    {notice && !inviting && <p role="status">{notice}</p>}
    {workplaces.length > 1 && <label className="ea-context">Consultorio<select disabled={busy} value={nid} onChange={e => setNid(e.target.value)}>{workplaces.map(w => <option key={w.nutritionist_id} value={w.nutritionist_id}>{w.name}</option>)}</select></label>}
    {orgs.length > 1 && <label className="ea-context">Equipo profesional<select disabled={busy} value={orgId} onChange={e => setOrgId(e.target.value)}>{orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select></label>}
    <div className={`fx ea-columns${view === 1 ? ' ea-permissions' : view === 2 ? ' ea-registro' : ''}`} role="tabpanel" aria-label={TABS[view]}>
      {view === 0 ? <EquipoIntegrantes personas={people} seleccionada={selected} irAVista={setView} alElegir={setSelectedId} cargado={loaded && directoryReady} dueña={owner} ocupado={busy} alQuitar={person => void revoke(person)}/>
      : view === 1 ? <EquipoPermisos personas={people} seleccionada={selected} irAVista={setView}/>
      : <EquipoRegistro personas={people} filtro={filter} alFiltrar={setFilter}/>}
    </div>
    <details className="ea-advanced" open={advanced} onToggle={e => { setAdvanced(e.currentTarget.open); if (e.currentTarget.open) setAdvancedMounted(true); }}><summary>Asignaciones clínicas, organizaciones y recepción</summary>{advancedMounted && <TeamWorkspace/>}</details>
    {inviting && <SettingsDialog title="Invitar a alguien" onClose={() => { if (!busy) { setInviting(false); setToken(''); } }}><form className="ea-form" onSubmit={e => void invite(e)}><label>Nombre<input maxLength={120} autoComplete="name" placeholder="Solo para identificar a quién invitás"/></label><small>El nombre no se guarda en la invitación; se toma de su cuenta al aceptar.</small><label>Mail<input type="email" required maxLength={200} autoComplete="email" value={email} onChange={e => { setEmail(e.target.value); setToken(''); }}/></label><label>Rol<select value={role} disabled={busy || Boolean(token)} onChange={e => setRole(e.target.value)}><option>Recepción</option><option>Nutricionista</option><option disabled>Contador · próximamente</option></select></label>{role === 'Nutricionista' && <label>Equipo<select disabled={busy} value={orgId} required onChange={e => setOrgId(e.target.value)}><option value="">Elegí un equipo</option>{orgs.filter(o => o.my_status === 'active' && (o.my_role === 'owner' || o.my_role === 'admin')).map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select></label>}<label>Pacientes que ve<select disabled value={role}><option value="Recepción">Solo contacto, turnos y cobros</option><option value="Nutricionista">Su cartera y asignaciones explícitas</option></select></label><p>Los permisos por módulo y la exigencia de dos pasos para el equipo están pendientes. {role === 'Nutricionista' ? 'Necesita una cuenta profesional confirmada y una organización.' : 'Compartí el código por un canal privado con ese correo.'}</p>{!owner && <p>Solo la dueña del consultorio puede preparar invitaciones desde esta pantalla.</p>}{notice && <p role="status">{notice}</p>}{token && <p>Código de invitación: <code>{token}</code></p>}<div className="ea-foot"><button className="chip" type="button" disabled={busy} onClick={() => setInviting(false)}>Cerrar</button><button className="cta" disabled={busy || !owner || Boolean(token) || (role === 'Nutricionista' && !orgId)}>{busy ? 'Preparando…' : 'Preparar invitación'}</button></div></form></SettingsDialog>}
  </div>;
}
