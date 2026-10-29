// Las tres vistas de Equipo (`eqV0`, `eqV1` y `eqV2` de design/panel-nutri/v29/panel-trabajo.html): mismas clases y orden.
// Lo que la app todavía no guarda (último ingreso, dos pasos, sesiones, permisos por persona, registro de accesos)
// se muestra en el mismo bloque con cero o un texto corto, sin inventar datos.
import type { ReactNode } from 'react';
import { FxKv, FxPanel } from './ficha-fx';
import { PanelV29Icon } from './PanelV29Icon';
import { FILTROS_REGISTRO, MODULOS_EQUIPO, NIVELES_EQUIPO, REGLAS_EQUIPO, ROLES_EQUIPO, claseEstado, colorDeRol, detalleDeRol, inicialesDe, nivelesDeRol, nombreCorto, resumenPersonas } from './ficha-equipo';

export type Persona = { id: string; name: string; email?: string; role: string; scope: string; state: string; reception?: string };

const SIN_DATO = 'Sin dato';
const Avatar = ({ persona, tamano = 30 }: { persona: Persona; tamano?: number }) => {
  const color = colorDeRol(persona.role);
  return <span className="av" style={{ background: `var(--${color}-t)`, color: `var(--${color}-ink)`, width: tamano, height: tamano, fontSize: tamano > 34 ? 13 : 11 }}>{inicialesDe(persona.name)}</span>;
};
const Quien = ({ persona, tamano, detalle }: { persona: Persona; tamano?: number; detalle?: ReactNode }) => <span className="eqwho"><Avatar persona={persona} tamano={tamano} /><span><b>{persona.name}</b>{detalle ? <small>{detalle}</small> : null}</span></span>;
const Boton = ({ texto, icono, clase = '', onClick, disabled, titulo }: { texto: string; icono?: 'lock' | 'eye' | 'dl'; clase?: string; onClick?: () => void; disabled?: boolean; titulo?: string }) =>
  <button type="button" className={`sbtn${clase ? ` ${clase}` : ''} cbtn`} onClick={onClick} disabled={disabled} title={titulo}>{icono ? <PanelV29Icon name={icono} size={13} /> : null}{texto}</button>;
const Nivel = ({ nivel }: { nivel: number }) => <span className={`eqlv l${nivel}`}>{NIVELES_EQUIPO[nivel]}</span>;
const Vacio = ({ texto }: { texto: string }) => <span className="ntempty">{texto}</span>;
const PROXIMAMENTE = 'Disponible cuando se guarden los permisos por persona.';

type Comun = { personas: readonly Persona[]; seleccionada?: Persona; irAVista: (vista: number) => void };

export function EquipoIntegrantes({ personas, seleccionada, irAVista, alElegir, cargado, dueña, ocupado, alQuitar }: Comun & { alElegir: (id: string) => void; cargado: boolean; dueña: boolean; ocupado: boolean; alQuitar: (persona: Persona) => void }) {
  const p = seleccionada;
  return <>
    <div className="c">
      <FxPanel titulo="Integrantes" meta={cargado ? resumenPersonas(personas.map(x => x.state)) : undefined}>
        <div className="fxs"><table className="pubt eqt"><thead><tr>{['Persona', 'Rol', 'Pacientes que ve', 'Último ingreso', 'Dos pasos', 'Estado'].map(t => <th key={t}>{t}</th>)}</tr></thead>
          <tbody>{personas.map(x => <tr key={x.id} className={p?.id === x.id ? 'on' : ''} tabIndex={0} aria-current={p?.id === x.id} onClick={() => alElegir(x.id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); alElegir(x.id); } }}>
            <td><Quien persona={x} detalle={detalleDeRol(x.role)} /></td><td>{x.role}</td><td>{x.scope}</td><td>—</td><td><span className="ntsig n">{SIN_DATO}</span></td><td><span className={`pill ${claseEstado(x.state)}`}>{x.state}</span></td></tr>)}</tbody></table>
          {cargado && !personas.length && <p className="ea-empty">No hay integrantes disponibles para este consultorio.</p>}</div>
      </FxPanel>
      <FxPanel titulo="Roles" meta="qué puede hacer cada uno" derecha={<Boton texto="Editar roles" disabled titulo={PROXIMAMENTE} />}>
        <div className="eqroles">{ROLES_EQUIPO.map(([rol, texto]) => <div key={rol}><b>{rol}</b><small>{texto}</small></div>)}</div>
      </FxPanel>
      <FxPanel titulo="Actividad del equipo" meta="hoy" grande derecha={<button className="lnk" type="button" onClick={() => irAVista(2)}>Registro <PanelV29Icon name="chev" size={11} /></button>}>
        <div className="fxs"><Vacio texto="Todavía no hay actividad registrada." /></div>
      </FxPanel>
    </div>
    <div className="c">{p ? <FxPanel titulo={p.name} meta={<span className={`pill ${claseEstado(p.state)}`}>{p.state}</span>} grande derecha={<Boton texto="Permisos" icono="lock" onClick={() => irAVista(1)} />}>
      <div className="eqhd"><Avatar persona={p} tamano={44} /><span><b>{p.role}</b><small>{detalleDeRol(p.role)}</small></span></div>
      <FxKv filas={[['Mail', p.email ?? '—'], ['Pacientes', p.scope], ['Último ingreso', '—'], ['Dos pasos', SIN_DATO]]} />
      <div className="eqmods">{MODULOS_EQUIPO.map((m, i) => <span key={m} className={`l${nivelesDeRol(p.role)[i]}`}>{m}</span>)}</div>
      <div className="eqsub"><small>Sesiones abiertas</small><Vacio texto="Todavía no se registran las sesiones." /></div>
      <div className="eqsub"><small>Lo último que hizo</small><Vacio texto="Todavía no hay actividad registrada." /></div>
      <div className="fxfoot pubft">{p.role === 'Dueña' ? <span className="ntsig n">La dueña no se puede pausar</span> : p.reception && p.state !== 'Revocada' && dueña ? <Boton texto="Quitar acceso de recepción" disabled={ocupado} onClick={() => alQuitar(p)} /> : null}<span style={{ flex: 1 }} /><Boton texto="Ver sus accesos" icono="eye" clase="k" onClick={() => irAVista(2)} /></div>
    </FxPanel> : <FxPanel titulo="Detalle de la persona" grande><Vacio texto="Elegí una persona para consultar su acceso." /></FxPanel>}</div>
  </>;
}

export function EquipoPermisos({ personas }: Comun) {
  const pendiente = personas.find(x => x.state === 'Invitada');
  return <>
    <div className="c">
      <FxPanel titulo="Permisos por módulo" meta="según su rol" grande derecha={<span className="eqleg">{NIVELES_EQUIPO.map((_, i) => <Nivel key={i} nivel={i} />)}</span>}>
        <div className="fxs pubts"><table className="eqm"><thead><tr><th>Módulo</th>{personas.map(x => <th key={x.id}><span className="eqwho"><Avatar persona={x} tamano={24} /><span><b>{nombreCorto(x.name)}</b><small>{x.role}</small></span></span></th>)}</tr></thead>
          <tbody>{MODULOS_EQUIPO.map((m, fila) => <tr key={m}><td>{m}</td>{personas.map(x => { const n = nivelesDeRol(x.role)[fila]; return <td key={x.id}><button type="button" className={`eqc l${n}`} disabled aria-label={`${m} para ${x.name}: ${NIVELES_EQUIPO[n]}`}>{NIVELES_EQUIPO[n]}</button></td>; })}</tr>)}</tbody></table>
          <small className="nthint">Es la referencia según el rol de cada persona: los permisos por módulo todavía no se guardan uno por uno.</small></div>
      </FxPanel>
    </div>
    <div className="c">
      <FxPanel titulo="Pacientes que ve cada uno" derecha={<Boton texto="Cambiar" disabled titulo={PROXIMAMENTE} />}>
        <div className="pubhr">{personas.map(x => <div key={x.id}><b>{nombreCorto(x.name)}</b><span>{x.scope}</span><span /></div>)}</div>
      </FxPanel>
      <FxPanel titulo="Reglas que no se cambian"><div className="pubpide">{REGLAS_EQUIPO.map(t => <div key={t}><PanelV29Icon name="lock" size={13} /><span>{t}</span></div>)}</div></FxPanel>
      <FxPanel titulo="Cambios de permisos" meta="últimos" grande><div className="fxs"><Vacio texto="Todavía no hay cambios registrados." /></div></FxPanel>
      <div className="fxai"><PanelV29Icon name="spark" size={14} /><span><b>Sugerencia:</b> {pendiente ? `${pendiente.name} todavía no aceptó la invitación.` : 'No hay invitaciones pendientes por ahora.'}</span></div>
    </div>
  </>;
}

export function EquipoRegistro({ personas, filtro, alFiltrar }: { personas: readonly Persona[]; filtro: number; alFiltrar: (i: number) => void }) {
  const pendiente = personas.find(x => x.state === 'Invitada');
  return <>
    <div className="c">
      <FxPanel titulo="Registro de accesos" meta="quién abrió cada ficha y qué cambió" grande derecha={<><div className="tabs" role="tablist" aria-label="Filtrar registro">{FILTROS_REGISTRO.map((f, i) => <button type="button" role="tab" aria-selected={i === filtro} key={f} className={i === filtro ? 'on' : ''} onClick={() => alFiltrar(i)}>{f}</button>)}</div><Boton texto="Descargar" icono="dl" disabled titulo="Disponible cuando haya un registro para descargar." /></>}>
        <div className="fxs"><table className="pubt eqt"><thead><tr>{['Cuándo', 'Quién', 'Qué hizo', 'Desde'].map(t => <th key={t}>{t}</th>)}</tr></thead>
          <tbody><tr><td colSpan={4}><Vacio texto={`Todavía no hay registro de ${['accesos', 'fichas', 'cambios', 'ingresos'][filtro]}.`} /></td></tr></tbody></table></div>
      </FxPanel>
    </div>
    <div className="c">
      <FxPanel titulo="Hoy"><div className="pubkp">{[['Fichas abiertas', 'sin registro'], ['Cambios', 'sin registro'], ['Fuera de horario', 'ingresos']].map(([t, e]) => <div key={t}><small>{t}</small><b className="num">0</b><em>{e}</em></div>)}</div></FxPanel>
      <FxPanel titulo="Para revisar" meta="0"><Vacio texto="No hay nada para revisar." /></FxPanel>
      <FxPanel titulo="Fichas más abiertas" meta="esta semana"><Vacio texto="Todavía no hay fichas abiertas registradas." /></FxPanel>
      <FxPanel titulo="Ingresos por persona" meta="esta semana" grande><Vacio texto="Todavía no hay ingresos registrados." />{pendiente ? <small className="nthint">{pendiente.name} todavía no aceptó la invitación.</small> : null}</FxPanel>
    </div>
  </>;
}
