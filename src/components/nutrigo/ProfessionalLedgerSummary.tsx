import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { formatPesos, summarizeLedger, type FeeSummary } from '../../fees';
import { NvButton } from './primitives';
import { feeErrorMessage } from './cobranzas-utils';

export function ProfessionalLedgerSummary({ patientId, onOpen }: { patientId: string; onOpen: () => void }) {
  const [summary, setSummary] = useState<FeeSummary | null>(null);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true; setSummary(null); setError('');
    api.getPatientLedger(patientId).then(({ ledger }) => { if (active) setSummary(summarizeLedger(ledger)); }).catch((reason) => { if (active) setError(feeErrorMessage(reason)); });
    return () => { active = false; };
  }, [patientId, revision]);
  return <section className="pw-safety" aria-label="Estado de cobranzas del paciente"><h3>Cuotas y pagos</h3>
    {error ? <div role="alert"><p>{error}</p><NvButton onClick={() => setRevision((value) => value + 1)}>Reintentar cobranzas</NvButton></div> : !summary ? <p role="status">Consultando cuotas y pagos…</p> : <dl><div><dt>Debe</dt><dd>{formatPesos(summary.owed)}</dd></div><div><dt>Saldo a favor</dt><dd>{formatPesos(summary.credit)}</dd></div><div><dt>Pagado este mes</dt><dd>{formatPesos(summary.paid_this_month)}</dd></div><div><dt>Avisos por confirmar</dt><dd>{summary.pending_reports}</dd></div></dl>}
    <NvButton className="nv-soft" onClick={onOpen}>Gestionar cobros del paciente</NvButton>
  </section>;
}
