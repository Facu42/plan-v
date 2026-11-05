// Bloque «Uso de IA» de Ajustes > Mi cuenta. Mismas clases del boceto v29 (`fxp`, `.bars`, `.tr`, `.nthint`).
// La nutri ve solo un porcentaje del mes: nunca créditos, modelos ni costos.
import { useEffect, useState } from 'react';
import { aiUsageApi } from '../../api/ai-usage';
import { friendlyError } from '../../lib/error-messages';
import type { NutritionistAiUsageView } from '../../types/ai-usage';
import { FxPanel } from './ficha-fx';

const fecha = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', timeZone: 'America/Argentina/Buenos_Aires' });

const AVISO = {
  ok: '',
  near: 'Estás cerca del uso previsto para este mes.',
  over: 'Pasaste el uso previsto para tu plan este mes.',
} as const;

function renovacion(iso: string): string {
  const dia = new Date(`${iso}T12:00:00-03:00`);
  return Number.isNaN(dia.getTime()) ? '' : `Se renueva el ${fecha.format(dia)}.`;
}

/** Parte visible, sin pedidos: así se prueba y se reutiliza sin red. */
export function UsoIAVista({ uso, error, onReintentar }: { uso: NutritionistAiUsageView | null; error: string; onReintentar: () => void }) {
  const porcentaje = uso?.percent ?? 0;
  return <FxPanel titulo="Uso de IA" meta="este mes">
    <div className="bars">
      <div>
        <b>Recetas, planes y fotos con IA</b>
        <small className="num">{uso ? `${porcentaje}%` : '—'}</small>
        <span className="tr" role="progressbar" aria-label="Uso de IA este mes" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, porcentaje)}>
          <i className={uso?.level === 'over' ? 'o' : uso?.level === 'near' ? 'k' : ''} style={{ width: `${Math.min(100, porcentaje)}%` }} />
        </span>
      </div>
    </div>
    {error ? <small className="nthint" role="alert">{error} <button type="button" className="lnk" onClick={onReintentar}>Reintentar</button></small>
      : !uso ? <small className="nthint" role="status">Cargando…</small>
      : <small className="nthint" role="status">{[AVISO[uso.level], renovacion(uso.renews_on)].filter(Boolean).join(' ')}</small>}
  </FxPanel>;
}

export function AjustesUsoIA() {
  const [uso, setUso] = useState<NutritionistAiUsageView | null>(null);
  const [error, setError] = useState('');
  const [intento, setIntento] = useState(0);
  useEffect(() => {
    const control = new AbortController();
    setError('');
    aiUsageApi.mine(control.signal).then(({ usage }) => { if (!control.signal.aborted) setUso(usage); })
      .catch((cause) => { if (!control.signal.aborted) setError(friendlyError(cause)); });
    return () => control.abort();
  }, [intento]);
  return <UsoIAVista uso={uso} error={error} onReintentar={() => setIntento((n) => n + 1)} />;
}
