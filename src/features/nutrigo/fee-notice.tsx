import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from '../../api/client';
import { summarizeLedger } from '../../fees';
import type { PatientLedger } from '../../types/fees';
import { feeNoticeText } from '../../components/nutrigo/PatientFeeNotice';
import { nodeName, sourceText, type SourceBinding, type SourceNode } from './SourceView';
import type { ShowroomPage } from '../../components/nutrigo/ShowroomPanels';

/** Aviso a mostrar para una cuenta de cuotas (null si está al día o sin cuota). */
export const noticeFromLedger = (ledger: PatientLedger, today?: string): string | null => feeNoticeText(summarizeLedger(ledger, today));

/**
 * Con aviso, el banner amarillo del archivo cuenta la cuota y su botón lleva a Pagos.
 * Sin aviso devuelve undefined y el banner queda como en el archivo.
 */
export function feeBannerBinding(node: SourceNode, notice: string | null, onNavigate: (page: ShowroomPage) => void): SourceBinding | undefined {
  if (!notice) return undefined;
  const text = sourceText(node);
  if (node.tag === 'p' && /^Start your health journey/.test(text)) return { children: <span className="leading-[1.5] text-[12px]">{notice}</span> };
  if (nodeName(node) === 'Button' && text === 'Claim Now!') return { onClick: () => onNavigate('pagos'), label: 'Ver pagos', text: 'Ver pagos' };
  return undefined;
}

/** Texto del aviso de cuota (o null si la paciente está al día). */
const FeeNoticeContext = createContext<string | null>(null);

/**
 * Busca el estado de cuotas de la paciente y lo ofrece al banner del marco de Nutrigo.
 * Nunca bloquea: si el pedido falla, el banner queda con su texto de siempre.
 */
export function FeeNoticeProvider({ patientId, children }: { patientId: string; children: ReactNode }) {
  const [notice, setNotice] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    setNotice(null);
    api.getPatientLedger(patientId, 'patient')
      .then(result => { if (active) setNotice(noticeFromLedger(result.ledger)); })
      .catch(() => undefined);
    return () => { active = false; };
  }, [patientId]);
  return <FeeNoticeContext.Provider value={notice}>{children}</FeeNoticeContext.Provider>;
}

export const useFeeNotice = (): string | null => useContext(FeeNoticeContext);
