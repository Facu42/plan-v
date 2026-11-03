import { useState } from 'react';
import type { HubActivacion, HubCobranza, HubRiesgo, HubRiesgoMotivo } from '../../../types/hub';
import { money, num } from './centro-format';

const MOTIVOS: { id: '' | HubRiesgoMotivo; label: string }[] = [
  { id: '', label: 'Todas' },
  { id: 'sin_login', label: 'Sin entrar' },
  { id: 'pocos_pacientes', label: 'Pocas pacientes' },
  { id: 'pago_rechazado', label: 'Pago rechazado' },
];

export function RiesgoView({
  items,
  dias,
  nota,
  onFiltrar,
}: {
  items: HubRiesgo[];
  dias: number;
  nota: string;
  onFiltrar: (motivo: HubRiesgoMotivo | '') => void;
}) {
  const [motivo, setMotivo] = useState<'' | HubRiesgoMotivo>('');
  return (
    <>
      <section className="nd-page-head"><div className="nd-grow"><div className="nd-eyebrow">Cuentas</div><h1 className="nd-h1">Riesgo de baja</h1><p className="nd-sub nd-mt-6">Sin entrar hace {dias} días, una paciente o ninguna, o un pago rechazado.</p></div></section>
      <p className="nd-sub nd-mb-14">{nota}</p>
      <div className="nd-row nd-mb-14" style={{ gap: 8 }}>
        {MOTIVOS.map((row) => (
          <button key={row.id || 'todas'} type="button" className={`nd-chip${motivo === row.id ? ' is-active' : ''}`} onClick={() => { setMotivo(row.id); onFiltrar(row.id); }}>{row.label}</button>
        ))}
      </div>
      <section className="nd-card" data-motion="card">
        <div className="nd-card-pad">
          {items.length ? items.map((row) => (
            <div key={`${row.nutritionist_id}-${row.motivo}`} className="service-activity"><strong>{row.nombre}</strong><span>{row.detalle}</span></div>
          )) : <p className="nd-muted">No hay cuentas en este filtro.</p>}
        </div>
      </section>
    </>
  );
}

export function CobranzaView({
  data,
  busy,
  error,
  onAviso,
  onReleer,
}: {
  data: HubCobranza;
  busy: boolean;
  error: string;
  onAviso: (paymentId: string) => void;
  onReleer: (paymentId: string) => void;
}) {
  const cifras = [
    { label: 'Ingreso recurrente', value: data.mrr_pesos, note: data.mrr_nota },
    { label: 'Bajas del mes', value: data.churn_mes, note: data.churn_nota },
    { label: 'Valor de vida', value: data.ltv_pesos, note: data.ltv_nota },
  ];
  return (
    <>
      <section className="nd-page-head"><div className="nd-grow"><div className="nd-eyebrow">Plataforma</div><h1 className="nd-h1">Cobranza</h1><p className="nd-sub nd-mt-6">Ingreso, bajas y valor de vida con los pagos reales. Avisar no crea otro débito.</p></div></section>
      {error ? <p className="nd-planes-msg is-error">{error}</p> : null}
      <div className="nd-grid nd-kpis nd-mb-18">
        {cifras.map((row) => (
          <article key={row.label} className="nd-card kpi" data-motion="card">
            <div className="kpi-top"><span className="kpi-label">{row.label}</span></div>
            <div className="kpi-value">{row.value == null ? 'Sin dato' : <span data-count={row.value} data-format={row.label === 'Bajas del mes' ? 'num' : 'money'}>{row.label === 'Bajas del mes' ? num(row.value) : money(row.value)}</span>}</div>
            <div className="kpi-foot"><span>{row.note}</span></div>
          </article>
        ))}
      </div>
      <section className="nd-card" data-motion="card">
        <div className="nd-card-head"><div className="nd-card-title">Pagos fallidos</div><div className="nd-card-sub">{data.mail.nota} {data.releer.nota}</div></div>
        <div className="nd-card-pad">
          {data.pagos_fallidos.length ? data.pagos_fallidos.map((row) => (
            <div key={row.id} className="service-activity">
              <strong>{money(row.monto_pesos)}</strong>
              <span>{row.estado}{row.mail ? ` · ${row.mail}` : ''}</span>
              <div className="nd-row" style={{ marginTop: 8 }}>
                <button type="button" className="nd-btn is-primary is-sm" disabled={busy || !data.mail.listo} onClick={() => onAviso(row.id)}>Avisar</button>
                <button type="button" className="nd-btn is-action is-sm" disabled={busy || !data.releer.listo} onClick={() => onReleer(row.id)}>Releer en Mercado Pago</button>
              </div>
            </div>
          )) : <p className="nd-muted">{data.mrr_nota.includes('No se pudo') ? 'Sin dato de pagos fallidos.' : 'No hay pagos rechazados.'}</p>}
          {data.avisos.slice(0, 6).map((row) => <p key={row.id} className="nd-tiny nd-muted">{row.kind === 'aviso' ? 'Aviso' : 'Relectura'}: {row.estado}. {row.detalle}</p>)}
        </div>
      </section>
    </>
  );
}

const PASO: Record<string, string> = { hecho: 'Hecho', pendiente: 'Pendiente', sin_dato: 'Sin dato' };

export function ActivacionView({ data }: { data: HubActivacion }) {
  return (
    <>
      <section className="nd-page-head"><div className="nd-grow"><div className="nd-eyebrow">Cuentas</div><h1 className="nd-h1">Activación</h1><p className="nd-sub nd-mt-6">Perfil, primer paciente, primer plan, cobro y página pública. Si lleva más de 7 días trabada, se marca.</p></div></section>
      <p className="nd-sub nd-mb-14">{data.nota}</p>
      <section className="nd-card" data-motion="card">
        <div className="nd-card-pad">
          {data.filas.length ? data.filas.map((fila) => (
            <article key={fila.nutritionist_id} className="service-activity">
              <strong>{fila.nombre}{fila.trabada ? ' · trabada' : ''}</strong>
              <span>{fila.pasos.map((paso) => `${paso.label}: ${PASO[paso.estado]}`).join(' · ')}</span>
            </article>
          )) : <p className="nd-muted">{data.disponible ? 'No hay cuentas para mostrar.' : data.nota}</p>}
        </div>
      </section>
    </>
  );
}
