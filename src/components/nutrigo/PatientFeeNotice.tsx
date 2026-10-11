import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { formatFeeDate, formatPesos, summarizeLedger, type FeeSummary } from '../../fees';
import { Icon } from '../shared/Icon';
import type { PatientLedger } from '../../types/fees';
import './cobranzas-fig.css';

export function feeNoticeText(summary: FeeSummary): string | null {
  if (summary.state === 'debe') return `Tenés una cuota pendiente de ${formatPesos(summary.owed)}`;
  if (summary.state === 'por_vencer' && summary.next_due) return `Tu próxima cuota vence el ${formatFeeDate(summary.next_due.due_on).slice(0, 5)}`;
  return null;
}

export function FeeNoticeView({ ledger, today, onOpen }: { ledger: PatientLedger; today?: string; onOpen: () => void }) {
  const text = feeNoticeText(summarizeLedger(ledger, today));
  if (!text) return null;
  return <aside className="cbz-notice" role="status"><Icon name="wallet" size={16} /><p>{text}</p><button type="button" className="nv-button nv-soft" onClick={onOpen}>Ver pagos</button></aside>;
}

/** Aviso liviano en Inicio: nunca bloquea y, si falla el pedido, no muestra nada. */
export function PatientFeeNotice({ patientId, onOpen }: { patientId: string; onOpen: () => void }) {
  const [ledger, setLedger] = useState<PatientLedger | null>(null);
  useEffect(() => {
    let active = true;
    setLedger(null);
    api.getPatientLedger(patientId, 'patient').then((result) => { if (active) setLedger(result.ledger); }).catch(() => undefined);
    return () => { active = false; };
  }, [patientId]);
  return ledger ? <FeeNoticeView ledger={ledger} onOpen={onOpen} /> : null;
}
