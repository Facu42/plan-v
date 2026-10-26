import './planes-reutilizar.css';
import { useEffect, useState } from 'react';
import { modelsApi } from '../../api/models';
import { plansApi } from '../../api/plans';
import { careErrorMessage } from '../../api/care';
import { componentTitle } from '../../types/plan-components';
import { datedModelItems, type ProfessionalModel } from '../../types/models';
import type { ProfessionalMealPlan } from '../../types/plans';
import { FigmaRecordDialog } from './FigmaPatientFront';
import { borradorReutilizable } from './planes-reutilizar';
import { sumarDias } from './planes-editor';

type Persona = { id: string; name: string };

export function GuardarPlantilla({ guardar, onCerrar, onAviso }: {
  guardar: () => Promise<ProfessionalMealPlan | null>;
  onCerrar: () => void;
  onAviso: (texto: string) => void;
}) {
  const [nombre, setNombre] = useState('');
  const [para, setPara] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');
  async function confirmar() {
    if (ocupado || !nombre.trim()) return;
    setOcupado(true);
    setError('');
    try {
      const plan = await guardar();
      if (!plan?.current.revision) { setError('No se pudo guardar el plan de origen. Reintentá.'); return; }
      await modelsApi.save({
        id: crypto.randomUUID(), expected_revision: null, kind: 'plan', title: nombre.trim(), description: para.trim(), lines: [], overrides: [],
        source: { patient_id: plan.patient_id, version: plan.current.version, revision: plan.current.revision },
      });
      onAviso('Plantilla guardada. Ya podés elegirla desde Plantillas.');
      onCerrar();
    } catch (e) { setError(careErrorMessage(e)); }
    finally { setOcupado(false); }
  }
  return <FigmaRecordDialog className="p3c-dialog" title="Guardar como plantilla" onClose={() => { if (!ocupado) onCerrar(); }} closeLabel="Cerrar">
    <form aria-busy={ocupado} onSubmit={e => { e.preventDefault(); void confirmar(); }}>
      <p className="mhelp">Para usarla con otras pacientes. Se guardan las comidas de todo el período, sin metas ni indicaciones de la ficha. Revisá que los textos de las comidas no incluyan datos personales.</p>
      <label className="af"><span>Nombre</span><input className="p3c-input" aria-label="Nombre" maxLength={160} disabled={ocupado} required value={nombre} onChange={e => setNombre(e.target.value)} /></label>
      <label className="af"><span>Para</span><input className="p3c-input" aria-label="Para" maxLength={400} disabled={ocupado} value={para} onChange={e => setPara(e.target.value)} /></label>
      {error ? <p role="alert">{error}</p> : null}
      <footer><button className="sbtn k" type="submit" disabled={ocupado || !nombre.trim()}>{ocupado ? 'Guardando…' : 'Guardar plantilla'}</button></footer>
    </form>
  </FigmaRecordDialog>;
}

export function CopiarComidas({ pacientes, titulo = 'Copiar a otra paciente', copiar, onCerrar, onPlan, onAviso }: {
  pacientes: Persona[];
  titulo?: string;
  copiar: (id: string, destino: ProfessionalMealPlan | null) => Promise<ProfessionalMealPlan>;
  onCerrar: () => void;
  onPlan: (plan: ProfessionalMealPlan) => void;
  onAviso: (texto: string) => void;
}) {
  const [id, setId] = useState(pacientes[0]?.id ?? '');
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');
  async function confirmar() {
    if (!id || ocupado) return;
    setOcupado(true);
    setError('');
    try {
      const { plan: destino } = await plansApi.professional(id);
      const plan = await copiar(id, destino);
      onPlan(plan);
      onAviso('Comidas copiadas en borrador. Revisá el plan antes de publicarlo.');
      onCerrar();
    } catch (e) { setError(careErrorMessage(e)); }
    finally { setOcupado(false); }
  }
  return <FigmaRecordDialog className="p3c-dialog" title={titulo} onClose={() => { if (!ocupado) onCerrar(); }} closeLabel="Cerrar">
    <form aria-busy={ocupado} onSubmit={e => { e.preventDefault(); void confirmar(); }}>
      <p className="mhelp">Las comidas reemplazan el borrador de destino. Su plan publicado se conserva. No se copian metas ni indicaciones de la ficha. Revisá los textos de las comidas antes de confirmar.</p>
      <label className="af"><span>Paciente</span><select className="p3c-input" aria-label="Paciente" value={id} disabled={ocupado} onChange={e => setId(e.target.value)}>{pacientes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      {!pacientes.length ? <p className="mhelp">No hay otra paciente para copiar.</p> : null}
      {error ? <p role="alert">{error}</p> : null}
      <footer><button className="sbtn k" type="submit" disabled={ocupado || !id}>{ocupado ? 'Copiando…' : titulo === 'Copiar a otra paciente' ? 'Copiar' : 'Crear borrador'}</button></footer>
    </form>
  </FigmaRecordDialog>;
}

export function ElegirPlantilla({ pacientes, hoy, onCerrar, onPlan, onAviso }: {
  pacientes: Persona[]; hoy: string; onCerrar: () => void; onPlan: (plan: ProfessionalMealPlan) => void; onAviso: (texto: string) => void;
}) {
  return <CatalogoPlantillas pacientes={pacientes} hoy={hoy} onPlan={onPlan} onAviso={onAviso} onCerrar={onCerrar} />;
}

export function CatalogoPlantillas({ pacientes, hoy, onPlan, onAviso, onCerrar }: {
  pacientes: Persona[]; hoy: string; onPlan: (plan: ProfessionalMealPlan) => void; onAviso: (texto: string) => void; onCerrar?: () => void;
}) {
  const [modelos, setModelos] = useState<ProfessionalModel[]>([]);
  const [elegido, setElegido] = useState('');
  const [consulta, setConsulta] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);
  const [intento, setIntento] = useState(0);
  const [aplicar, setAplicar] = useState(false);
  useEffect(() => {
    const control = new AbortController();
    setCargando(true);
    setError('');
    modelsApi.list(control.signal).then(({ models }) => {
      if (!control.signal.aborted) setModelos(models.filter(m => m.kind === 'plan' && !m.archived_at));
    }).catch(e => { if (!control.signal.aborted) setError(careErrorMessage(e)); })
      .finally(() => { if (!control.signal.aborted) setCargando(false); });
    return () => control.abort();
  }, [intento]);
  const modelo = modelos.find(m => m.id === elegido) ?? modelos[0];
  if (aplicar && modelo) return <CopiarComidas titulo="Aplicar plantilla" pacientes={pacientes} onCerrar={() => setAplicar(false)} onAviso={onAviso} onPlan={plan => { onPlan(plan); onCerrar?.(); }} copiar={async (id, destino) => {
      // Releer el catálogo evita aplicar una copia retirada o editada mientras estaba abierta.
      const actual = (await modelsApi.list()).models.find(m => m.id === modelo.id && m.revision === modelo.revision && !m.archived_at);
      if (!actual?.current.plan) throw new Error('La plantilla cambió. Volvé a elegirla.');
      const borrador = borradorReutilizable(datedModelItems(actual.current, hoy), hoy, sumarDias(hoy, actual.current.plan.days - 1), destino);
      return (await plansApi.save(id, borrador)).plan;
    }} />;
  const contenido = <div className="fx">
    <div className="c"><section className="fxp g"><header><h3>Plantillas</h3><span className="sp" /></header>
      <label className="r29-search"><input type="search" aria-label="Buscar plantillas" placeholder="Buscar por nombre u objetivo…" value={consulta} onChange={e => setConsulta(e.target.value)} /></label>
      {cargando ? <p role="status">Cargando plantillas…</p> : error ? <p role="alert">{error} <button className="sbtn" onClick={() => setIntento(v => v + 1)}>Reintentar</button></p> : <div className="fxs fxtb tall"><table><thead><tr><th>Nombre</th><th>Para</th><th>Estado</th></tr></thead><tbody>
        {modelos.filter(m => `${m.current.title} ${m.current.description}`.toLocaleLowerCase('es').includes(consulta.toLocaleLowerCase('es'))).map(m => <tr key={m.id} className={modelo?.id === m.id ? 'on' : undefined}><td><button className="lnk" type="button" aria-label={`Seleccionar plantilla ${m.current.title}`} onClick={() => setElegido(m.id)}>{m.current.title}</button></td><td>{m.current.description || 'Sin descripción'}</td><td>{m.current.published_at ? 'Publicada' : 'Borrador'}</td></tr>)}
      </tbody></table>{!modelos.length ? <p className="mhelp">Todavía no hay plantillas. Guardá una desde el editor de un plan.</p> : null}</div>}
    </section></div>
    {modelo && !error && !cargando ? <div className="c"><section className="fxp g"><header><h3>{modelo.current.title}</h3><span className="sp" /></header><p className="mhelp">{modelo.current.description}</p><p>{modelo.current.plan?.days ?? 0} días · {modelo.current.plan?.items.length ?? 0} comidas</p>
      <div className="fxs fxr">{modelo.current.plan?.items.slice(0, 5).map((item, i) => <div key={i}><span className="t"><b>{item.slot}</b><small>{item.recipe_title || item.free_text || item.components?.map(componentTitle).filter(Boolean).join(' · ')}</small></span></div>)}</div>
      <div className="macts"><button className="sbtn k" type="button" disabled={!modelo.current.plan?.items.length || !pacientes.length} onClick={() => setAplicar(true)}>Aplicar a una paciente</button></div>
    </section></div> : null}

  </div>;
  return onCerrar ? <FigmaRecordDialog className="p3c-dialog p3c-catalog" title="Elegir plantilla" onClose={onCerrar} closeLabel="Cerrar">{contenido}</FigmaRecordDialog> : contenido;
}
