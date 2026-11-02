import type { ReactNode } from 'react';
import type { CentroAlerta, CentroCobros, CentroNutri, CentroPacientes, CentroResumen, CentroSalud, CentroSeguridad } from '../../../types/centro';
import { NdIcon } from './nd-icon';
import { avatarColor, dateShort, greeting, initials, money, num, sparkline, stateBadge, stateLabel, timeAgo, todayLabel } from './centro-format';

function pageHead({ kicker, title, sub }: { kicker: string; title: string; sub?: string }) {
  return (
    <section className="nd-page-head">
      <div className="nd-grow">
        <div className="nd-eyebrow">{kicker}</div>
        <h1 className="nd-h1">{title}</h1>
        {sub ? <p className="nd-sub nd-mt-6">{sub}</p> : null}
      </div>
    </section>
  );
}

function kpi({ label, value, unit, note, spark, color }: { label: string; value: string; unit?: string; note: string; spark?: number[]; color?: string }) {
  return (
    <article className="nd-card kpi">
      <div className="kpi-top">
        <span className="kpi-label">{label}</span>
        {spark ? <span className="kpi-spark" dangerouslySetInnerHTML={{ __html: sparkline(spark, color) }} /> : null}
      </div>
      <div className="kpi-value">{value}{unit ? <small>{unit}</small> : null}</div>
      <div className="kpi-foot"><span>{note}</span></div>
    </article>
  );
}

function cardHead(title: string, sub?: string) {
  return (
    <div className="nd-card-head">
      <div className="nd-grow">
        <div className="nd-card-title">{title}</div>
        {sub ? <div className="nd-card-sub">{sub}</div> : null}
      </div>
    </div>
  );
}

function badge(text: string, cls?: string) {
  return <span className={`nd-badge ${cls || ''}`}><span className="dot" />{text}</span>;
}

function avatar(name: string) {
  return <span className="nd-avatar is-sm" style={{ background: avatarColor(name) }} aria-hidden="true">{initials(name)}</span>;
}

function alertaTone(tone: CentroAlerta['tone']): string {
  if (tone === 'coral') return 'is-coral';
  if (tone === 'gold') return 'is-gold';
  if (tone === 'sky') return 'is-sky';
  return 'is-green';
}

function Alertas({ items }: { items: CentroAlerta[] }) {
  return (
    <section className="nd-card">
      {cardHead('Necesita tu atención', 'Lo que no debería esperar')}
      <div style={{ padding: '8px 10px 12px' }}>
        {items.map((item) => (
          <div key={item.title} className="nd-row" style={{ width: '100%', textAlign: 'left', padding: '11px 10px', borderRadius: 10 }}>
            <span className={`rule-ico ${alertaTone(item.tone)}`} style={{ width: 34, height: 34 }}><NdIcon name={item.tone === 'green' ? 'check_circle' : 'alert'} /></span>
            <span className="nd-grow">
              <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600 }}>{item.title}</span>
              <span style={{ display: 'block', fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{item.sub}</span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ResumenView({ data, adminName }: { data: CentroResumen; adminName?: string }) {
  return (
    <>
      {pageHead({
        kicker: `${todayLabel()} · Centro de mando`,
        title: greeting(adminName),
        sub: `${num(data.nutris_activas)} nutris activas · ${num(data.pacientes_activos)} pacientes activos · ${money(data.ingresos_mes)} cobrados este mes.`,
      })}
      <div className="nd-spotlight nd-mb-18">
        <div className="nd-grow">
          <h2>El servicio, en una sola mirada.</h2>
          <p>{num(data.nutris_total)} consultorios · {money(data.mrr)} de ingreso recurrente · {num(data.nutris_vencidas)} con el pago atrasado.</p>
        </div>
      </div>
      <div className="nd-grid nd-kpis nd-mb-18">
        {kpi({ label: 'Nutris activas', value: num(data.nutris_activas), note: `${num(data.nutris_prueba)} en prueba`, spark: data.spark_altas })}
        {kpi({ label: 'Pacientes activos', value: num(data.pacientes_activos), note: 'en todos los consultorios', spark: data.spark_altas, color: '#8a7bb8' })}
        {kpi({ label: 'Cobrado este mes', value: money(data.ingresos_mes), note: 'pagos confirmados', spark: data.spark_ingresos, color: '#eeb04a' })}
        {kpi({ label: 'Ingreso recurrente', value: money(data.mrr), unit: '/ mes', note: data.precio_mensual ? `${money(data.precio_mensual)} por cuenta` : 'sin precio cargado', spark: data.spark_ingresos, color: '#5b8fa8' })}
      </div>
      <div className="nd-grid nd-split">
        <Alertas items={data.alertas} />
        <section className="nd-card">
          {cardHead('Altas recientes', 'Cuentas nuevas del servicio')}
          <div style={{ padding: '10px 14px 16px' }}>
            {data.altas_recientes.length ? data.altas_recientes.map((row) => (
              <div key={row.id} className="nd-row" style={{ padding: '9px 4px', borderBottom: '1px dashed var(--line)' }}>
                {avatar(row.name)}
                <div className="nd-grow">
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{row.name}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--muted)' }}>{row.email} · {dateShort(row.created_at)}</div>
                </div>
                {badge(stateLabel(row.state), stateBadge(row.state))}
              </div>
            )) : <div className="nd-empty">Todavía no hay altas.</div>}
          </div>
        </section>
      </div>
    </>
  );
}

export function NutrisView({ data }: { data: CentroNutri[] }) {
  const visibles = data.filter((row) => !row.is_test);
  return (
    <>
      {pageHead({
        kicker: 'Cuentas del servicio',
        title: 'Nutris',
        sub: `${num(visibles.length)} consultorios. Estado de la suscripción, plan y uso. Sin datos clínicos.`,
      })}
      <div className="nd-card">
        <div className="nd-table-wrap">
          <table className="nd-table">
            <thead>
              <tr>
                <th>Nutri</th>
                <th>Estado</th>
                <th>Plan</th>
                <th>Alta</th>
                <th>Uso</th>
                <th>Último ingreso</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div className="cell-person">
                      {avatar(row.display_name)}
                      <div>
                        <div className="cell-person-name">{row.display_name}{row.is_test ? ' · prueba' : ''}</div>
                        <div className="cell-person-sub">{row.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{badge(stateLabel(row.state), stateBadge(row.state))}</td>
                  <td><div className="cell-plan"><strong>{row.precio_mensual ? money(row.precio_mensual) : 'Sin precio'}</strong>{row.until ? `Hasta ${dateShort(row.until)}` : '—'}</div></td>
                  <td>{dateShort(row.created_at)}</td>
                  <td>{num(row.patients_active)} activas · {num(row.patients_total)} en total</td>
                  <td>{timeAgo(row.last_sign_in_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export function PacientesView({ data }: { data: CentroPacientes }) {
  return (
    <>
      {pageHead({
        kicker: 'Agregados',
        title: 'Pacientes',
        sub: `${num(data.activos)} activas en ${num(data.consultorios)} consultorios. Solo conteos: nunca datos clínicos.`,
      })}
      <div className="nd-grid nd-kpis nd-mb-18">
        {kpi({ label: 'Pacientes activas', value: num(data.activos), note: 'sin archivar ni dar de baja' })}
        {kpi({ label: 'Total de fichas', value: num(data.total), note: 'incluye inactivas' })}
        {kpi({ label: 'Consultorios', value: num(data.consultorios), note: 'con al menos una cuenta' })}
      </div>
      <div className="nd-card">
        {cardHead('Por nutri', 'Cuántas pacientes tiene cada consultorio')}
        <div className="nd-table-wrap">
          <table className="nd-table">
            <thead><tr><th>Consultorio</th><th>Activas</th><th>Total</th></tr></thead>
            <tbody>
              {data.por_nutri.map((row) => (
                <tr key={row.nutritionist_id}>
                  <td><div className="cell-person">{avatar(row.name)}<div className="cell-person-name">{row.name}</div></div></td>
                  <td>{num(row.activos)}</td>
                  <td>{num(row.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export function CobrosView({ data }: { data: CentroCobros }) {
  return (
    <>
      {pageHead({
        kicker: 'Plataforma',
        title: 'Cobros e ingresos',
        sub: 'Suscripciones del servicio: lo cobrado, lo que vence y lo que está en gracia.',
      })}
      <div className="nd-grid nd-kpis nd-mb-18">
        {kpi({ label: 'Ingreso recurrente', value: money(data.mrr), unit: '/ mes', note: data.precio_mensual ? `${money(data.precio_mensual)} por cuenta activa` : 'sin precio cargado' })}
        {kpi({ label: 'Cobrado este mes', value: money(data.cobrado_mes), note: 'pagos confirmados' })}
        {kpi({ label: 'Vencidas o cortadas', value: num(data.vencidos), note: `${num(data.en_gracia)} en gracia` })}
      </div>
      <div className="nd-grid nd-split">
        <section className="nd-card">
          {cardHead('Cuentas', 'Estado de cobro de cada nutri')}
          <div className="nd-table-wrap">
            <table className="nd-table">
              <thead><tr><th>Nutri</th><th>Estado</th><th>Hasta</th><th>Este mes</th></tr></thead>
              <tbody>
                {data.cuentas.map((row) => (
                  <tr key={row.id}>
                    <td>{row.name}</td>
                    <td>{badge(stateLabel(row.state), stateBadge(row.state))}</td>
                    <td>{dateShort(row.until)}</td>
                    <td>{row.cobrado_mes ? money(row.cobrado_mes) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="nd-card">
          {cardHead('Pagos del mes', 'Confirmados y anulados')}
          <div className="nd-table-wrap">
            <table className="nd-table">
              <thead><tr><th>Fecha</th><th>Nutri</th><th>Monto</th><th>Estado</th></tr></thead>
              <tbody>
                {data.pagos_mes.length ? data.pagos_mes.map((row) => (
                  <tr key={row.id}>
                    <td>{dateShort(row.paid_on)}</td>
                    <td>{row.nutritionist_name}</td>
                    <td>{money(row.amount)}</td>
                    <td>{badge(row.status === 'confirmed' ? 'Confirmado' : 'Anulado', row.status === 'confirmed' ? 'is-green' : 'is-coral')}</td>
                  </tr>
                )) : <tr><td colSpan={4}><div className="nd-empty">Este mes no hay pagos registrados.</div></td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}

export function SaludView({ data }: { data: CentroSalud }) {
  return (
    <>
      {pageHead({
        kicker: 'Operación',
        title: 'Salud del sistema',
        sub: 'API, worker, cola de trabajos, errores recientes y migraciones. Sin secretos.',
      })}
      <div className="nd-grid nd-kpis nd-mb-18">
        {kpi({ label: 'API', value: data.api.status === 'ok' ? 'Anda' : 'Degradada', note: data.api.supabase ? 'Base conectada' : 'Sin base persistente' })}
        {kpi({ label: 'Worker', value: data.worker === 'external' ? 'Separado' : data.worker === 'inline' ? 'En la API' : data.worker, note: data.api.sha ? `sha ${data.api.sha.slice(0, 7)}` : 'sin versión' })}
        {kpi({ label: 'Cola', value: num(data.jobs.queued + data.jobs.leased), note: `${num(data.jobs.dead)} muertos · ${num(data.jobs.failed)} fallidos` })}
        {kpi({ label: 'Migraciones', value: data.migraciones.count == null ? '—' : num(data.migraciones.count), note: data.migraciones.available ? `última ${data.migraciones.latest ?? '—'}` : data.migraciones.note })}
      </div>
      {data.integraciones_faltantes ? (
        <div className="nd-card nd-card-pad nd-mb-18">
          <div className="nd-row" style={{ gap: 10 }}>
            <span className="rule-ico is-gold"><NdIcon name="alert" /></span>
            <div>
              <div className="nd-card-title">Faltan {num(data.integraciones_faltantes)} variables de integraciones</div>
              <div className="nd-card-sub">Solo se cuenta cuántas faltan. Nunca se muestran valores.</div>
            </div>
          </div>
        </div>
      ) : null}
      <section className="nd-card">
        {cardHead('Errores recientes', 'Trabajos fallidos o muertos de la cola')}
        <div className="nd-table-wrap">
          <table className="nd-table">
            <thead><tr><th>Cuándo</th><th>Tipo</th><th>Estado</th><th>Error</th></tr></thead>
            <tbody>
              {data.errores_recientes.length ? data.errores_recientes.map((row) => (
                <tr key={row.id}>
                  <td>{timeAgo(row.updated_at)}</td>
                  <td>{row.kind}</td>
                  <td>{badge(row.status, row.status === 'dead' ? 'is-coral' : 'is-gold')}</td>
                  <td>{row.last_error || '—'}</td>
                </tr>
              )) : <tr><td colSpan={4}><div className="nd-empty">No hay errores recientes en la cola.</div></td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

export function SeguridadView({ data }: { data: CentroSeguridad }) {
  return (
    <>
      {pageHead({
        kicker: 'Acceso',
        title: 'Seguridad',
        sub: 'Código de la app en /admin, opcional para la nutricionista, y administradores de plataforma.',
      })}
      <div className="nd-grid nd-kpis nd-mb-18">
        {kpi({ label: 'MFA_ENFORCE', value: data.mfa_enforce ? 'Prendido' : 'Apagado', note: '/admin pide el segundo paso igual' })}
        {kpi({ label: 'Administradores', value: num(data.admins.length), note: 'cuentas en platform_admins' })}
        {kpi({ label: 'Con segundo paso', value: num(data.cuentas.filter((row) => row.mfa === 'activo').length), note: `${num(data.cuentas.filter((row) => row.mfa === 'sin_alta').length)} sin alta` })}
      </div>
      <div className="nd-grid nd-split nd-mb-18">
        <Alertas items={data.advertencias} />
        <section className="nd-card">
          {cardHead('Administradores de plataforma', 'Quién puede entrar a /admin')}
          <div style={{ padding: '10px 14px 16px' }}>
            {data.admins.length ? data.admins.map((row) => (
              <div key={row.user_id} className="nd-row" style={{ padding: '9px 4px', borderBottom: '1px dashed var(--line)' }}>
                {avatar(row.name)}
                <div className="nd-grow">
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{row.name}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--muted)' }}>{row.email || 'sin mail'} · desde {dateShort(row.created_at)}</div>
                </div>
              </div>
            )) : <div className="nd-empty">No hay administradores cargados.</div>}
          </div>
        </section>
      </div>
      <div className="nd-card">
        {cardHead('MFA por cuenta', 'Nutris y administradores. Sin datos clínicos.')}
        <div className="nd-table-wrap">
          <table className="nd-table">
            <thead><tr><th>Cuenta</th><th>Rol</th><th>MFA</th></tr></thead>
            <tbody>
              {data.cuentas.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div className="cell-person">
                      {avatar(row.name)}
                      <div>
                        <div className="cell-person-name">{row.name}</div>
                        <div className="cell-person-sub">{row.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{row.role === 'ambos' ? 'Admin y nutri' : row.role === 'admin' ? 'Admin' : 'Nutri'}</td>
                  <td>{badge(row.mfa === 'activo' ? 'Activo' : row.mfa === 'sin_alta' ? 'Sin alta' : 'Sin dato', row.mfa === 'activo' ? 'is-green' : row.mfa === 'sin_alta' ? 'is-coral' : 'is-gold')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export function CentroState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <section className="nd-page-head">
      <div className="nd-grow">
        <h1 className="nd-h1">{title}</h1>
        <p className="nd-sub nd-mt-6">{description}</p>
        {action ? <div className="nd-mt-14">{action}</div> : null}
      </div>
    </section>
  );
}
