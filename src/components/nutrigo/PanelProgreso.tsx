import type { ReactNode } from 'react';
import type { Patient } from '../../types';
import { AvisoBoceto } from './panel-v29-boceto';
import { FxCols } from './ficha-fx';
import { PROGRESS_PERIODS, type ProgressPeriodDays } from '../../types/progress';
import type { ProgressSeries } from '../../types/progress';
import type { GlobalPatientProgress, GlobalProgressResponse } from '../../types/progress-global';
import {
  adherenciaDe, alertaDe, cambioTexto, columnasAdherencia, promedioAdherencia, etiquetaCurva, etiquetaDe, fichaHref, filasDe, fondoAvatar, hitosDe, inicialesDe, lineaLista,
  medidasDe, movimientosDelMes, paraMirar, pesoTexto, primerNombre, registrosHref, resumenCartera, textoCurva, tituloEvolucion,
  type FiltroCartera, type OrdenCartera, type PersonaProgreso, type PuntoPeso,
} from './progreso-presentacion';

export function PeriodoProgreso({ days, onDays }: { days: ProgressPeriodDays; onDays: (days: ProgressPeriodDays) => void }) {
  return <div className="tabs" aria-label="Período">
    {PROGRESS_PERIODS.map(periodo => <button type="button" key={periodo} className={days === periodo ? 'on' : undefined} onClick={() => onDays(periodo)}>{periodo} días</button>)}
  </div>;
}

function Aviso({ texto }: { texto: string }) {
  return <AvisoBoceto texto={texto} />;
}

function Curva({ puntos }: { puntos: PuntoPeso[] }) {
  if (puntos.length < 2) return null;
  const valores = puntos.map(punto => punto.value);
  const W = 640;
  const H = 118;
  const pl = 6;
  const pr = 30;
  const pt = 18;
  const pb = 20;
  const bajo = Math.min(...valores);
  const alto = Math.max(...valores);
  const margen = (alto - bajo) * 0.15 || 1;
  const minimo = bajo - margen;
  const maximo = alto + margen;
  const xDe = (indice: number) => pl + indice * (W - pl - pr) / (valores.length - 1);
  const yDe = (valor: number) => pt + (maximo - valor) / (maximo - minimo) * (H - pt - pb);
  const marcas = valores.map((valor, indice) => [xDe(indice), yDe(valor)] as const);
  let trazo = `M${marcas[0][0].toFixed(1)} ${marcas[0][1].toFixed(1)}`;
  for (let indice = 1; indice < marcas.length; indice += 1) {
    const [x0, y0] = marcas[indice - 1];
    const [x1, y1] = marcas[indice];
    const medio = (x1 - x0) / 2;
    trazo += ` C${(x0 + medio).toFixed(1)} ${y0.toFixed(1)} ${(x1 - medio).toFixed(1)} ${y1.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  }
  const ultimo = marcas[marcas.length - 1];
  const etiquetas = puntos.length <= 6 ? puntos.map(punto => punto.on.slice(8, 10).replace(/^0/, '') + '/' + punto.on.slice(5, 7).replace(/^0/, '')) : [puntos[0].on.slice(5, 7), puntos[puntos.length - 1].on.slice(5, 7)];
  const posiciones = puntos.length <= 6 ? marcas.map((_, indice) => indice) : [0, marcas.length - 1];
  return <svg className="pw-g fxc" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Peso en el período: ${puntos.map(punto => `${etiquetaCurva(punto)} ${punto.unit} el ${punto.on}`).join(', ')}`}>
    <defs><linearGradient id="fxg-progreso" x1="0" y1="0" x2="0" y2="1"><stop offset="0" className="s1" /><stop offset="1" className="s2" /></linearGradient></defs>
    <path className="ar" d={`${trazo} L${ultimo[0].toFixed(1)} ${H - pb} L${pl} ${H - pb}Z`} style={{ fill: 'url(#fxg-progreso)' }} />
    <path className="ln" pathLength={1} d={trazo} />
    {marcas.slice(0, -1).map(([x, y], indice) => <circle key={puntos[indice].on + indice} className="dt" cx={x.toFixed(1)} cy={y.toFixed(1)} r="2" />)}
    <circle className="now" cx={ultimo[0].toFixed(1)} cy={ultimo[1].toFixed(1)} r="4" />
    <text className="nt" x={ultimo[0].toFixed(1)} y={(ultimo[1] - 9).toFixed(1)} textAnchor="middle">{etiquetaCurva(puntos[puntos.length - 1])}</text>
    {posiciones.map((indice, orden) => <text key={etiquetas[orden] + indice} className="xl" x={marcas[indice][0].toFixed(1)} y={H - 5} textAnchor="middle">{etiquetas[orden]}</text>)}
  </svg>;
}

const FILTROS: Array<[FiltroCartera, string]> = [['all', 'Todas'], ['with-records', 'Con registros'], ['without-records', 'Sin registros']];
const ORDENES: Array<[OrdenCartera, string]> = [['name', 'Nombre'], ['meals', 'Más comidas'], ['weight-change', 'Cambio de peso'], ['adherence', 'Adherencia']];

export function PanelProgresoVista({
  data, days, filtro, orden, quien, puntos, series, curvaEstado, pacientes, aviso,
  onFiltro, onOrden, onQuien, onOpen, onPromedio, onAviso,
}: {
  data: GlobalProgressResponse;
  days: ProgressPeriodDays;
  filtro: FiltroCartera;
  orden: OrdenCartera;
  quien: string;
  puntos: PuntoPeso[];
  series: ProgressSeries[] | null;
  curvaEstado: 'lista' | 'vacia' | 'cargando' | 'error';
  pacientes: readonly (PersonaProgreso & Pick<Patient, 'name'>)[];
  aviso: string;
  onFiltro: (filtro: FiltroCartera) => void;
  onOrden: (orden: OrdenCartera) => void;
  onQuien: (id: string) => void;
  onOpen: (href: string) => void;
  onPromedio: () => void;
  onAviso: (texto: string) => void;
}) {
  const ficha = new Map(pacientes.map(persona => [persona.id, persona]));
  const adherencias = new Map(data.patients.map(fila => [fila.patient_id, adherenciaDe(fila, ficha.get(fila.patient_id))]));
  const filas = filasDe(data.patients, filtro, orden, adherencias);
  const elegida = filas.find(fila => fila.patient_id === quien) ?? null;
  const mirar = paraMirar(data.patients);
  const movimientos = movimientosDelMes(pacientes);
  const elegir = (id: string) => {
    onQuien(id);
    if (typeof document !== 'undefined' && document.querySelector('#pv-panel-v29.mob')) {
      document.getElementById('sxevo')?.scrollIntoView({ block: 'nearest' });
    }
  };
  return <div id="s-progreso" className="sxw">
    {data.unavailable.length > 0 && <p role="status" className="sxsub">No pudimos consultar a {data.unavailable.map(entrada => entrada.patient_name).join(', ')}. Recargá para volver a intentarlo; no se las cuenta como cero.</p>}
    <div className="fx" data-mk="1" style={{ gridTemplateColumns: '.82fr 1.28fr' }}>
      <div className="c">
        <section className="fxp g">
          <header>
            <h3>La cartera</h3>
            <span className="m">{resumenCartera(data.patients, promedioAdherencia(adherencias))}</span>
            <span className="sp" />
            <button type="button" className="chip" onClick={onPromedio}>Promedio</button>
          </header>
          <div className="sxtools">
            <div className="tabs" aria-label="Filtro">{FILTROS.map(([id, etiqueta]) => <button type="button" key={id} className={filtro === id ? 'on' : undefined} onClick={() => onFiltro(id)}>{etiqueta}</button>)}</div>
            <div className="tabs" aria-label="Orden">{ORDENES.map(([id, etiqueta]) => <button type="button" key={id} className={orden === id ? 'on' : undefined} onClick={() => onOrden(id)}>{etiqueta}</button>)}</div>
          </div>
          <div className="sxq">
            <span className="sxsub" style={{ alignSelf: 'center' }}>Para mirar</span>
            {mirar.length ? mirar.map(item => <button type="button" key={item.id} className="chip" onClick={() => elegir(item.id)}>{primerNombre(item.nombre)}</button>) : <span className="sxsub">Nadie con esta señal.</span>}
            {movimientos.length ? movimientos.map(item => <button type="button" key={`${item.tipo}:${item.id}`} className="chip" onClick={() => { if (filas.some(fila => fila.patient_id === item.id)) elegir(item.id); onAviso(item.detalle); }}>{item.tipo} {primerNombre(item.nombre)}</button>) : <span className="sxsub">Sin altas ni bajas con fecha este mes.</span>}
          </div>
          <div className="fxs">
            <div className="fxr">{filas.length ? filas.map(fila => <Fila key={fila.patient_id} fila={fila} activa={fila.patient_id === elegida?.patient_id} persona={ficha.get(fila.patient_id)} adherencia={adherencias.get(fila.patient_id) ?? null} onElegir={() => elegir(fila.patient_id)} />) : <p className="sxsub">Ninguna paciente en este filtro.</p>}</div>
            <p className="sxsub">Laura no está en «para mirar»: sin registros no es un incumplimiento.</p>
          </div>
        </section>
      </div>
      <div className="c" id="sxevo">{elegida ? <Evolucion fila={elegida} persona={ficha.get(elegida.patient_id)} days={days} puntos={puntos} series={series} curvaEstado={curvaEstado} onOpen={onOpen} /> : <section className="fxp g"><header><h3>Evolución</h3><span className="sp" /></header><p className="sxsub">Elegí una paciente de la lista.</p></section>}</div>
    </div>
    {data.source === 'memory' && <p className="sxsub">Modo demo · datos ficticios para recorrer el consultorio.</p>}
    {aviso ? <Aviso texto={aviso} /> : null}
  </div>;
}

function Fila({ fila, activa, persona, adherencia, onElegir }: { fila: GlobalPatientProgress; activa: boolean; persona: Pick<Patient, 'initials' | 'tone'> | undefined; adherencia: number | null; onElegir: () => void }) {
  const etiqueta = etiquetaDe(fila);
  return <button type="button" className={activa ? 'l on' : 'l'} aria-pressed={activa} onClick={onElegir}>
    <span className="av" style={{ background: fondoAvatar(persona?.tone) }}>{inicialesDe(fila.patient_name, persona?.initials)}</span>
    <span className="sxwho"><b>{fila.patient_name}</b><small>{lineaLista(fila)}</small></span>
    {adherencia === null ? <span className="sxsub">Sin dato</span> : <span className="adh"><span className="tr"><i className={adherencia < 60 ? 'lo' : undefined} style={{ width: `${adherencia}%` }} /></span>{adherencia}%</span>}
    <span className={`pill ${etiqueta.clase}`}>{etiqueta.texto}</span>
    <span className="chip">Evolución</span>
  </button>;
}

function Evolucion({ fila, persona, days, puntos, series, curvaEstado, onOpen }: {
  fila: GlobalPatientProgress;
  persona: PersonaProgreso | undefined;
  days: ProgressPeriodDays;
  puntos: PuntoPeso[];
  series: ProgressSeries[] | null;
  curvaEstado: 'lista' | 'vacia' | 'cargando' | 'error';
  onOpen: (href: string) => void;
}) {
  const cantidad = fila.weight.state === 'ok' ? fila.weight.points : 0;
  const vacio = textoCurva(curvaEstado === 'lista' ? puntos.length : cantidad);
  const curva: ReactNode = curvaEstado === 'cargando'
    ? <p className="sxsub">Cargando el peso…</p>
    : curvaEstado === 'error'
      ? <p className="sxsub">Sin curva. No pudimos leer el peso. No es un incumplimiento.</p>
      : vacio
        ? <p className="sxsub">{vacio}</p>
        : <Curva puntos={puntos} />;
  const columnas = columnasAdherencia(persona?.meal_logs, days);
  const peso = () => document.getElementById('sxpeso')?.scrollIntoView({ block: 'nearest' });
  return <>
    <div className="fxdk">
      <small>Evolución · {days} días</small>
      <b className="num">{tituloEvolucion(fila)}</b>
      <span>{fila.patient_name} · {pesoTexto(fila.weight)} · {cambioTexto(fila.weight)}</span>
      <div className="sxq" style={{ marginTop: 10, position: 'relative', zIndex: 1 }}>
        <a className="chip" href={fichaHref(fila.patient_id)} onClick={evento => { evento.preventDefault(); onOpen(fichaHref(fila.patient_id)); }}>Ficha</a>
        <a className="chip" href={registrosHref(fila.patient_id)} onClick={evento => { evento.preventDefault(); onOpen(registrosHref(fila.patient_id)); }}>Registros</a>
        <button type="button" className="chip" onClick={peso}>El peso</button>
      </div>
    </div>
    <section className="fxp">
      <header><h3>Peso en el tiempo</h3><span className="m">sin meta de peso</span><span className="sp" /></header>
      <div id="sxpeso">{curva}</div>
    </section>
    <section className="fxp g">
      <header><h3>Cómo fue</h3><span className="m">adherencia, medidas, hitos y alertas</span><span className="sp" /></header>
      <div className="fxs">
        <p className="sxsub">{alertaDe(fila)}</p>
        <p className="sxsub">Adherencia por período</p>
        {columnas ? <FxCols valores={columnas.valores} rotulos={columnas.rotulos} max={100} alto={72} /> : <p className="sxsub">Sin adherencia: no hay registros. No es un incumplimiento.</p>}
        <p className="sxsub">Medidas</p>
        <div className="fxkv">{medidasDe(series, fila).map(([nombre, valor]) => <div key={nombre}><span>{nombre}</span><b>{valor}</b></div>)}</div>
        <p className="sxsub">Hitos</p>
        <ol className="fxtl">{hitosDe(fila, curvaEstado === 'lista' ? puntos : []).map(hito => <li key={`${hito.titulo}:${hito.cuando}:${hito.detalle}`} className={hito.clase || undefined}><i /><span><b>{hito.titulo}</b><small>{hito.detalle}</small></span><time>{hito.cuando}</time></li>)}</ol>
      </div>
    </section>
  </>;
}
