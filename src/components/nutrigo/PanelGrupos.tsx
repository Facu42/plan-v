// Cajón «Grupos de pacientes» de Pacientes (v29): mismas piezas del boceto (`#actw`, `.aseg`, `.ach`, `.ai`).
// Un grupo es una etiqueta que comparten varias pacientes; no hay tablas nuevas.
import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { Patient } from '../../types';
import type { TagGroup } from '../../api/crm-work';
import { PanelV29Icon } from './PanelV29Icon';
import { usePanelBoceto } from './panel-v29-boceto';
import { LARGO_ETIQUETA } from './FichaEtiquetas';

const igual = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** Quién queda dentro del grupo elegido (o todas, si no hay ninguno). */
export function pacientesDelGrupo<T extends Pick<Patient, 'id'>>(pacientes: readonly T[], grupos: readonly TagGroup[], grupo: string | null): T[] {
  if (!grupo) return [...pacientes];
  const ids = new Set(grupos.find(g => igual(g.label, grupo))?.patient_ids ?? []);
  return pacientes.filter(p => ids.has(p.id));
}

/** Cantidad de pacientes visibles de cada grupo, sin contar las que ya no están disponibles. */
export function gruposConCantidad(grupos: readonly TagGroup[], visibles: ReadonlySet<string>) {
  return grupos.map(g => ({ label: g.label, cantidad: g.patient_ids.filter(id => visibles.has(id)).length })).filter(g => g.cantidad > 0);
}

export type CrearGrupo = (etiqueta: string, pacienteIds: readonly string[]) => Promise<boolean>;

export function PanelGrupos({ pacientes, grupos, actual, total, onVer, onCrear, onClose }: {
  pacientes: readonly Pick<Patient, 'id' | 'name'>[];
  grupos: readonly { label: string; cantidad: number }[];
  actual: string | null;
  total: number;
  onVer: (grupo: string | null) => void;
  onCrear: CrearGrupo;
  onClose: () => void;
}) {
  const [mostrar, setMostrar] = useState<string | null>(actual);
  const [nombre, setNombre] = useState('');
  const [sumar, setSumar] = useState<string[]>([]);
  const [aviso, setAviso] = useState('');
  const [guardando, setGuardando] = useState(false);
  const { clase, cerrar } = usePanelBoceto(onClose);
  const alternar = (id: string) => setSumar(lista => lista.includes(id) ? lista.filter(x => x !== id) : [...lista, id]);
  const aplicar = async () => {
    const nuevo = nombre.trim();
    if (!nuevo) { onVer(mostrar); cerrar(); return; }
    if (!sumar.length) { setAviso('Elegí al menos una paciente para el grupo nuevo.'); return; }
    setGuardando(true); setAviso('');
    const ok = await onCrear(nuevo, sumar);
    setGuardando(false);
    if (ok) cerrar(); else setAviso('No pudimos armar el grupo completo. Probá de nuevo (cada paciente puede tener hasta 8 etiquetas).');
  };
  const opciones = [{ clave: null as string | null, texto: `Todas · ${total}` }, ...grupos.map(g => ({ clave: g.label as string | null, texto: `${g.label} · ${g.cantidad}` }))];
  const nodo = <div id="actw" className={clase || undefined}>
    <div className="ascrim" onClick={cerrar} />
    <aside id="act" role="dialog" aria-modal="true" aria-labelledby="actt">
      <header><div><h2 id="actt">Grupos de pacientes</h2><p id="acts">Sirven para filtrar y para escribirles a todas juntas</p></div><button type="button" className="ibtn" aria-label="Cerrar" onClick={cerrar}><PanelV29Icon name="x" size={13} /></button></header>
      <div className="abody" id="actb">
        <div className="af"><span>Mostrar</span><div className="aseg" role="radiogroup">{opciones.map(o => {
          const activa = mostrar === null ? o.clave === null : o.clave !== null && igual(o.clave, mostrar);
          return <button type="button" role="radio" key={o.texto} aria-label={o.texto} aria-checked={activa} onClick={() => setMostrar(o.clave)}>{o.texto}</button>;
        })}</div></div>
        <label className="af"><span>Nuevo grupo</span><input className="ai" type="text" maxLength={LARGO_ETIQUETA} placeholder="Por ejemplo: Taller de cocina" value={nombre} onChange={e => { setNombre(e.target.value); setAviso(''); }} /></label>
        <div className="af"><span>Sumar al nuevo grupo</span><div className="ach">{pacientes.map(p => <button type="button" key={p.id} aria-pressed={sumar.includes(p.id)} onClick={() => alternar(p.id)}>{p.name}</button>)}</div><small>Una paciente puede estar en varios grupos.</small></div>
        {aviso ? <p className="sxsub" role="alert">{aviso}</p> : null}
      </div>
      <footer id="actf"><button type="button" className="chip" onClick={cerrar}>Cancelar</button><span style={{ flex: 1 }} /><button type="button" className="cta" disabled={guardando} onClick={() => void aplicar()}>Ver este grupo</button></footer>
    </aside>
  </div>;
  const host = typeof document === 'undefined' ? null : document.querySelector('#pv-panel-v29 .app');
  return host ? createPortal(nodo, host) : nodo;
}
