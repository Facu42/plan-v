// Ficha › Cobros: «Paquete de consultas». Se arma con las piezas del boceto v29 (fxP, fxsplit con medidor
// y fxkv, sbtn, fxtl y el cajón #act) porque el boceto no dibuja un panel propio para esto.
import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { localBillingDate } from '../../billing';
import { formatPesos } from '../../fees';
import { currentPack, packLeft, packStatus, type PackStatus, type PatientPack } from '../../types/packs';
import { Campo, CajonV29, Fila, Segmentado } from './CajonV29';
import { FxKv, FxMedidor, FxPanel } from './ficha-fx';
import { PanelV29Icon } from './PanelV29Icon';
import { diaYMes } from './ficha-cobros';
import { feeErrorMessage, parsePesos } from './cobranzas-utils';

const ESTADO: Record<PackStatus, readonly [string, string]> = {
  activo: ['Activo', 'p-conf'], terminado: ['Terminado', 'p-vid'], vencido: ['Vencido', 'p-wait'], baja: ['Dado de baja', 'p-ok'],
};
const VIGENCIAS = [['30', '30 días'], ['60', '60 días'], ['90', '90 días'], ['0', 'Sin vencimiento']] as const;
type Vigencia = typeof VIGENCIAS[number][0];
type Cajon = null | 'vender' | 'descontar' | 'usadas';

export function FichaPaquete({ patientId, onCobro }: { patientId: string; onCobro: () => void }) {
  const [packs, setPacks] = useState<PatientPack[] | null>(null);
  const [error, setError] = useState('');
  const [cajon, setCajon] = useState<Cajon>(null);
  const [vuelta, setVuelta] = useState(0);
  useEffect(() => {
    let activo = true; setPacks(null); setError('');
    api.getPatientPacks(patientId).then(({ packs: lista }) => { if (activo) setPacks(lista); }).catch(motivo => { if (activo) setError(feeErrorMessage(motivo, 'No pudimos traer los paquetes.')); });
    return () => { activo = false; };
  }, [patientId, vuelta]);
  const hoy = localBillingDate();
  const pack = packs ? currentPack(packs, hoy) : null;
  const estado = pack ? packStatus(pack, hoy) : null;
  const quedan = pack ? packLeft(pack) : 0;
  const derecha = <button type="button" className="sbtn k cbtn" onClick={() => setCajon('vender')}><PanelV29Icon name="plus" size={13} />Vender paquete</button>;
  const meta = estado ? <span className={`pill ${ESTADO[estado][1]}`}>{ESTADO[estado][0]}</span> : undefined;
  return <>
    <FxPanel titulo="Paquete de consultas" meta={meta} derecha={derecha}>
      {error ? <p role="alert">{error} <button type="button" className="lnk" onClick={() => setVuelta(n => n + 1)}>Reintentar</button></p>
        : !packs ? <p role="status">Consultando el paquete…</p>
        : <div className="fxsplit">
          <FxMedidor pct={pack ? Math.round(quedan / pack.sessions * 100) : 0} texto={String(quedan)} sub={pack ? `de ${pack.sessions}` : 'sin paquete'} ancho={140} />
          <FxKv filas={pack ? [
            ['Paquete', pack.name],
            ['Usadas', `${pack.uses.length} de ${pack.sessions}`],
            ['Vence', pack.expires_on ? diaYMes(pack.expires_on) : 'Sin vencimiento'],
          ] : [
            ['Paquete', 'Sin paquete'],
            ['Se descuenta', 'al marcar la consulta realizada'],
          ]} />
        </div>}
      {pack ? <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" className="sbtn cbtn" disabled={estado !== 'activo'} onClick={() => setCajon('descontar')}>Descontar consulta</button>
        <button type="button" className="sbtn cbtn" onClick={() => setCajon('usadas')}>Consultas usadas</button>
      </div> : null}
    </FxPanel>
    {cajon === 'vender' ? <CajonVender patientId={patientId} onPacks={lista => { const cobrado = lista.some(p => p.charge_id && !packs?.some(q => q.id === p.id)); setPacks(lista); if (cobrado) onCobro(); }} onClose={() => setCajon(null)} /> : null}
    {cajon === 'descontar' && pack ? <CajonDescontar patientId={patientId} pack={pack} onPacks={setPacks} onClose={() => setCajon(null)} /> : null}
    {cajon === 'usadas' && pack ? <CajonUsadas patientId={patientId} pack={pack} onPacks={setPacks} onClose={() => setCajon(null)} /> : null}
  </>;
}

type CajonProps = { patientId: string; onPacks: (packs: PatientPack[]) => void; onClose: () => void };

function CajonVender({ patientId, onPacks, onClose }: CajonProps) {
  const [nombre, setNombre] = useState('Paquete de 3 consultas');
  const [consultas, setConsultas] = useState('3');
  const [precio, setPrecio] = useState('');
  const [desde, setDesde] = useState(() => localBillingDate());
  const [vigencia, setVigencia] = useState<Vigencia>('90');
  const [cobrar, setCobrar] = useState<'si' | 'no'>('si');
  const [aviso, setAviso] = useState('');
  const [enviando, setEnviando] = useState(false);
  const guardar = () => {
    if (enviando) return false;
    const n = Number(consultas);
    const monto = precio.trim() ? parsePesos(precio) : 0;
    if (!nombre.trim()) { setAviso('Poné un nombre para el paquete.'); return false; }
    if (!Number.isInteger(n) || n < 1 || n > 50) { setAviso('Las consultas van de 1 a 50.'); return false; }
    if (monto === null || (cobrar === 'si' && !monto)) { setAviso('Escribí el precio en pesos, sin decimales.'); return false; }
    if (!desde) { setAviso('Elegí desde cuándo vale.'); return false; }
    setEnviando(true); setAviso('');
    api.sellPatientPack(patientId, { name: nombre.trim(), sessions: n, amount: monto, starts_on: desde, valid_days: vigencia === '0' ? null : Number(vigencia), charge: cobrar === 'si' })
      .then(({ packs }) => { onPacks(packs); onClose(); })
      .catch(motivo => { setAviso(feeErrorMessage(motivo, 'No pudimos guardar el paquete.')); setEnviando(false); });
    return false;
  };
  return <CajonV29 titulo="Vender paquete" sub="Consultas que la paciente paga por adelantado" ok={enviando ? 'Guardando…' : 'Vender paquete'} aviso={aviso} onGuardar={guardar} onClose={onClose}>
    <Campo etiqueta="Nombre"><input className="ai" value={nombre} maxLength={60} placeholder="Ej.: Paquete de 3 seguimientos" onChange={e => setNombre(e.target.value)} /></Campo>
    <Fila><Campo etiqueta="Consultas"><input className="ai" inputMode="numeric" value={consultas} onChange={e => setConsultas(e.target.value)} /></Campo><Campo etiqueta="Precio ($)"><input className="ai" inputMode="numeric" value={precio} placeholder="$ 0" onChange={e => setPrecio(e.target.value)} /></Campo></Fila>
    <Fila><Campo etiqueta="Desde"><input className="ai" type="date" value={desde} onChange={e => setDesde(e.target.value)} /></Campo>
      <Campo etiqueta="Vence"><select className="ai" value={vigencia} onChange={e => setVigencia(e.target.value as Vigencia)}>{VIGENCIAS.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></Campo></Fila>
    <Segmentado etiqueta="Cobro" opciones={[['si', 'Sumar a Cobranzas'], ['no', 'Ya está cobrado']]} valor={cobrar} onCambiar={setCobrar} />
    <small className="nthint">Cada consulta que marques como realizada se descuenta sola. También podés descontar a mano.</small>
  </CajonV29>;
}

function CajonDescontar({ patientId, pack, onPacks, onClose }: CajonProps & { pack: PatientPack }) {
  const [dia, setDia] = useState(() => localBillingDate());
  const [nota, setNota] = useState('');
  const [aviso, setAviso] = useState('');
  const [enviando, setEnviando] = useState(false);
  const guardar = () => {
    if (enviando) return false;
    if (!dia) { setAviso('Elegí la fecha de la consulta.'); return false; }
    setEnviando(true); setAviso('');
    api.usePatientPack(patientId, { pack_id: pack.id, used_on: dia, note: nota.trim() })
      .then(({ packs }) => { onPacks(packs); onClose(); })
      .catch(motivo => { setAviso(feeErrorMessage(motivo, 'No pudimos descontar la consulta.')); setEnviando(false); });
    return false;
  };
  return <CajonV29 titulo="Descontar consulta" sub={`${pack.name} · quedan ${packLeft(pack)} de ${pack.sessions}`} ok={enviando ? 'Guardando…' : 'Descontar'} aviso={aviso} onGuardar={guardar} onClose={onClose}>
    <Campo etiqueta="Fecha de la consulta"><input className="ai" type="date" value={dia} max={localBillingDate()} onChange={e => setDia(e.target.value)} /></Campo>
    <Campo etiqueta="Nota"><input className="ai" value={nota} maxLength={120} placeholder="Ej.: Seguimiento" onChange={e => setNota(e.target.value)} /></Campo>
    <small className="nthint">Usalo para una consulta que no está en la agenda. Las de la agenda se descuentan solas al marcarlas realizadas.</small>
  </CajonV29>;
}

function CajonUsadas({ patientId, pack, onPacks, onClose }: CajonProps & { pack: PatientPack }) {
  const [aviso, setAviso] = useState('');
  const [baja, setBaja] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const correr = (accion: () => Promise<{ packs: PatientPack[] }>, cerrar: boolean) => {
    if (enviando) return;
    setEnviando(true); setAviso('');
    accion().then(({ packs }) => { onPacks(packs); setEnviando(false); if (cerrar) onClose(); })
      .catch(motivo => { setAviso(feeErrorMessage(motivo, 'No pudimos guardar el cambio.')); setEnviando(false); });
  };
  const usos = [...pack.uses].reverse();
  return <CajonV29 titulo="Consultas usadas" sub={`${pack.name} · ${formatPesos(pack.amount)}`} ok={false} aviso={aviso} onClose={onClose}>
    <FxKv filas={[['Desde', diaYMes(pack.starts_on)], ['Vence', pack.expires_on ? diaYMes(pack.expires_on) : 'Sin vencimiento'], ['Quedan', `${packLeft(pack)} de ${pack.sessions}`]]} />
    <div className="fxs"><ol className="fxtl">{usos.map(uso => <li key={uso.id}><i /><span><b>{uso.note || 'Consulta'}</b><small>{uso.appointment_id ? 'Desde la agenda' : 'Descontada a mano'}</small></span>
      <time>{diaYMes(uso.used_on)} <button type="button" className="sbtn cbtn" disabled={enviando} onClick={() => correr(() => api.voidPatientPackUse(patientId, uso.id), false)}>Deshacer</button></time></li>)}</ol>
      {!usos.length ? <p>Todavía no usó ninguna consulta del paquete.</p> : null}</div>
    {!pack.closed_at ? <div><button type="button" className="sbtn cbtn" disabled={enviando} onClick={() => { if (!baja) { setBaja(true); return; } correr(() => api.closePatientPack(patientId, pack.id), true); }}>{baja ? 'Tocá de nuevo para dar de baja' : 'Dar de baja el paquete'}</button>
      <small className="nthint">Dar de baja deja de descontar consultas. Lo usado y el cobro quedan como están.</small></div> : null}
  </CajonV29>;
}
