// Consumo de IA por consultorio y por nutri, y elección de modelo por función con sus precios.
// Pieza separada: pide sus propios datos y se monta como una vista más del centro de mando.
import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '../../../api/client';
import type { AdminAiUsage, AiModelBoard, AiModelInput } from '../../../types/ai-usage';

const dolares = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const OTRO = '__otro__';
const PLANES: Record<string, string> = { arranque: 'Base', prueba: 'Prueba', pro: 'Pro', consultorio: 'Consultorio' };

export const usd = (micros: number) => dolares.format(micros / 1_000_000);
export function mesLegible(month: string): string {
  const [year, mon] = month.split('-').map(Number);
  return `${MESES[(mon ?? 1) - 1] ?? month} de ${year}`;
}

function aviso(error: unknown): string {
  if (!(error instanceof ApiError)) return 'No se pudo completar. Reintentá en un momento.';
  try {
    const body = JSON.parse(error.message) as { error?: string };
    if (body.error) return body.error;
  } catch { /* el texto ya es el mensaje */ }
  return error.message;
}

export type Draft = { model: string; input: string; output: string };
export const draftOf = (current: AiModelBoard['features'][number]['current']): Draft =>
  ({ model: current?.model ?? 'openrouter/free', input: String(current?.input_usd_per_mtok ?? 0), output: String(current?.output_usd_per_mtok ?? 0) });

/** Al elegir un modelo de la lista se completan solos sus precios de referencia. */
export function borradorDeOpcion(options: AiModelBoard['options'], value: string): Partial<Draft> {
  const opcion = options.find((item) => item.model === value);
  return opcion ? { model: opcion.model, input: String(opcion.input_usd_per_mtok), output: String(opcion.output_usd_per_mtok) } : { model: '' };
}
export function cuerpoDeBorrador(draft: Draft): AiModelInput {
  return { model: draft.model.trim(), input_usd_per_mtok: Number(draft.input), output_usd_per_mtok: Number(draft.output) };
}

function Barra({ percent }: { percent: number }) {
  const tono = percent >= 100 ? ' is-coral' : percent >= 80 ? ' is-gold' : '';
  return <div className={`nd-progress${tono}`} role="progressbar" aria-label={`Uso ${percent}%`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, percent)}><span style={{ width: `${Math.min(100, percent)}%` }} /></div>;
}

export function Consumo({ usage }: { usage: AdminAiUsage }) {
  return <>
    <div className="nd-card">
      <div className="nd-card-head"><div className="nd-grow"><div className="nd-card-title">Consumo de {mesLegible(usage.month)}</div>
        <div className="nd-card-sub">{usage.totals.calls} usos de IA · {usd(usage.totals.cost_usd_micros)} gastados{usage.totals.unassigned_cost_usd_micros ? ` · ${usd(usage.totals.unassigned_cost_usd_micros)} sin nutri (pruebas y asistente)` : ''}</div></div></div>
      {usage.features.length === 0 ? <p className="nd-sub">Todavía no hay usos este mes.</p> : (
        <div className="nd-table-wrap"><table className="nd-table" style={{ minWidth: 420 }}>
          <thead><tr><th>Función</th><th>Usos</th><th>Costo</th></tr></thead>
          <tbody>{usage.features.map((row) => <tr key={row.feature}><td>{row.label}</td><td>{row.calls}</td><td>{usd(row.cost_usd_micros)}</td></tr>)}</tbody>
        </table></div>
      )}
    </div>
    {usage.consultorios.length > 0 ? <div className="nd-card">
      <div className="nd-card-head"><div className="nd-grow"><div className="nd-card-title">Por consultorio</div><div className="nd-card-sub">El uso del equipo contra lo previsto para sus planes.</div></div></div>
      <div className="nd-table-wrap"><table className="nd-table" style={{ minWidth: 560 }}>
        <thead><tr><th>Consultorio</th><th>Nutris</th><th style={{ width: '30%' }}>Uso del mes</th><th>Costo</th></tr></thead>
        <tbody>{usage.consultorios.map((row) => <tr key={row.organization}><td>{row.organization}</td><td>{row.nutris}</td><td><Barra percent={row.percent} /><small>{row.percent}%</small></td><td>{usd(row.cost_usd_micros)}</td></tr>)}</tbody>
      </table></div>
    </div> : null}
    <div className="nd-card">
      <div className="nd-card-head"><div className="nd-grow"><div className="nd-card-title">Por nutri</div><div className="nd-card-sub">Ordenadas por gasto. Solo cantidades y costos, nunca el contenido.</div></div></div>
      {usage.nutris.length === 0 ? <p className="nd-sub">Todavía no hay usos este mes.</p> : (
        <div className="nd-table-wrap"><table className="nd-table" style={{ minWidth: 680 }}>
          <thead><tr><th>Nutri</th><th>Plan</th><th>Consultorio</th><th style={{ width: '24%' }}>Uso del mes</th><th>Usos</th><th>Costo</th></tr></thead>
          <tbody>{usage.nutris.map((row) => <tr key={row.nutritionist_id}>
            <td><div className="cell-person-name">{row.name}</div><div className="cell-person-sub">{row.by_feature.map((item) => `${item.label} ${item.calls}`).join(' · ')}</div></td>
            <td>{row.plan_code ? PLANES[row.plan_code] ?? row.plan_code : 'Sin plan'}</td>
            <td>{row.organization ?? '—'}</td>
            <td><Barra percent={row.percent} /><small>{row.percent}%</small></td>
            <td>{row.calls}</td><td>{usd(row.cost_usd_micros)}</td>
          </tr>)}</tbody>
        </table></div>
      )}
    </div>
  </>;
}

export function Modelos({ board, onChange }: { board: AiModelBoard; onChange: (next: AiModelBoard) => void }) {
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  useEffect(() => { setDrafts(Object.fromEntries(board.features.map((row) => [row.feature, draftOf(row.current)]))); }, [board]);

  const set = (feature: string, patch: Partial<Draft>) => setDrafts((current) => ({ ...current, [feature]: { ...(current[feature] ?? draftOf(null)), ...patch } }));
  const elegir = (feature: string, value: string) => {
    set(feature, borradorDeOpcion(board.options, value));
  };
  const run = async (feature: string, label: string, work: () => Promise<AiModelBoard>, mensaje: string) => {
    setBusy(feature); setError(''); setOk('');
    try { onChange(await work()); setOk(`${label}: ${mensaje}`); } catch (cause) { setError(aviso(cause)); } finally { setBusy(''); }
  };
  const guardar = (feature: string, label: string) => {
    const draft = drafts[feature];
    if (!draft) return;
    void run(feature, label, () => api.saveAdminAiModel(feature, cuerpoDeBorrador(draft)), 'guardado. Se usa en los próximos pedidos.');
  };

  return <div className="nd-planes">
    <div className="nd-card-head"><div className="nd-grow"><div className="nd-card-title">Modelo por función</div>
      <div className="nd-card-sub">Precios en dólares por millón de textos de entrada y de salida. Confirmalos en OpenRouter antes de guardar: si el proveedor sube el precio por encima de lo cargado, el pedido se rechaza en vez de gastar de más. Sin elección, se usa el modelo gratuito.</div></div></div>
    {error ? <p className="nd-planes-msg is-error" role="alert">{error}</p> : null}
    {ok ? <p className="nd-planes-msg" role="status">{ok}</p> : null}
    <div className="nd-planes-grid">
      {board.features.map((row) => {
        const draft = drafts[row.feature] ?? draftOf(row.current);
        const conocido = board.options.some((item) => item.model === draft.model);
        const gratis = Number(draft.input) === 0 && Number(draft.output) === 0;
        const nota = board.options.find((item) => item.model === draft.model)?.note;
        return <article key={row.feature} className="nd-card nd-planes-card">
          <div className="nd-card-head"><div className="nd-grow"><div className="nd-card-title">{row.label}</div>
            <div className="nd-card-sub">{row.current ? `Hoy: ${row.current.model}` : 'Hoy: modelo gratuito de siempre'}</div></div>
            <span className={`nd-badge${row.current && !(row.current.input_usd_per_mtok === 0 && row.current.output_usd_per_mtok === 0) ? ' is-gold' : ' is-green'}`}>{row.current && !(row.current.input_usd_per_mtok === 0 && row.current.output_usd_per_mtok === 0) ? 'Pago' : 'Gratis'}</span></div>
          <label>Modelo
            <select aria-label={`Modelo de ${row.label}`} value={conocido ? draft.model : OTRO} onChange={(event) => elegir(row.feature, event.target.value === OTRO ? '' : event.target.value)}>
              {board.options.map((item) => <option key={item.model} value={item.model}>{item.label}</option>)}
              <option value={OTRO}>Otro (escribir el id)</option>
            </select>
          </label>
          {!conocido ? <label>Id en OpenRouter<input aria-label={`Id del modelo de ${row.label}`} value={draft.model} placeholder="proveedor/modelo" onChange={(event) => set(row.feature, { model: event.target.value })} /></label> : null}
          <div className="nd-planes-fields">
            <label>Entrada (USD por millón)<input aria-label={`Precio de entrada de ${row.label}`} inputMode="decimal" type="number" min={0} max={100} step="0.01" value={draft.input} onChange={(event) => set(row.feature, { input: event.target.value })} /></label>
            <label>Salida (USD por millón)<input aria-label={`Precio de salida de ${row.label}`} inputMode="decimal" type="number" min={0} max={100} step="0.01" value={draft.output} onChange={(event) => set(row.feature, { output: event.target.value })} /></label>
          </div>
          {nota ? <p className="nd-sub">{nota}</p> : null}
          {!gratis ? <p className="nd-sub">Esta función va a gastar dinero real de tu cuenta de OpenRouter.</p> : null}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="nd-btn is-action" disabled={busy === row.feature || !draft.model.trim()} onClick={() => guardar(row.feature, row.label)}>{busy === row.feature ? 'Guardando…' : 'Guardar modelo'}</button>
            {row.current ? <button type="button" className="nd-btn" disabled={busy === row.feature} onClick={() => void run(row.feature, row.label, () => api.clearAdminAiModel(row.feature), 'vuelve al modelo gratuito.')}>Volver al gratuito</button> : null}
          </div>
        </article>;
      })}
    </div>
  </div>;
}

export function AdminIA() {
  const [usage, setUsage] = useState<AdminAiUsage | null>(null);
  const [board, setBoard] = useState<AiModelBoard | null>(null);
  const [error, setError] = useState('');
  const cargar = useCallback(async () => {
    setError('');
    try {
      const [uso, modelos] = await Promise.all([api.getAdminAiUsage(), api.getAdminAiModels()]);
      setUsage(uso.usage); setBoard(modelos);
    } catch (cause) { setError(aviso(cause)); }
  }, []);
  useEffect(() => { void cargar(); }, [cargar]);

  return <div className="nd-planes">
    <section className="nd-page-head"><div className="nd-grow"><div className="nd-eyebrow">Plataforma</div><h1 className="nd-h1">Uso de IA</h1>
      <p className="nd-sub nd-mt-6">Cuánto usa cada consultorio y cada nutri, y qué modelo responde en cada función. La nutri solo ve una barra de porcentaje en Ajustes.</p></div></section>
    {error ? <p className="nd-planes-msg is-error" role="alert">{error} <button type="button" className="nd-btn" onClick={() => void cargar()}>Reintentar</button></p> : null}
    {!error && (!usage || !board) ? <p className="nd-sub" role="status">Cargando…</p> : null}
    {usage ? <Consumo usage={usage} /> : null}
    {board ? <Modelos board={board} onChange={setBoard} /> : null}
  </div>;
}
