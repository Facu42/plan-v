import { useEffect, useRef, useState } from 'react';
import { clinicalWorkspaceApi } from '../../api/clinical-workspace';
import { careErrorMessage } from '../../api/care';
import { importedClinicalSections } from '../../lib/imported-clinical-export';
import { buildClinicalPdf, downloadClinicalPdf } from '../../lib/clinical-pdf';
import { NvButton } from './primitives';

/** Contains no current notes, measurements, files or consultation data. */
export function ImportHistoryPdfExport({ patientId, disabled = false }: { patientId: string; disabled?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const owner = useRef(patientId);
  useEffect(() => { owner.current = patientId; setStatus(''); setBusy(false); return () => { owner.current = ''; }; }, [patientId]);
  async function exportPdf() {
    if (busy || disabled) return;
    const patient = patientId;
    setBusy(true); setStatus('');
    try {
      const pkg = await clinicalWorkspaceApi.importedExport(patient);
      if (owner.current !== patient) return;
      if (!pkg.brand) throw new Error('Configurá el nombre y contacto del consultorio antes de preparar el PDF.');
      const bytes = await buildClinicalPdf({ title: 'Históricos importados autorizados', patientName: pkg.patient.name, brand: pkg.brand,
        sections: importedClinicalSections(pkg.imported_history, pkg.imported_measurements) });
      if (owner.current !== patient) return;
      downloadClinicalPdf(bytes, 'historicos-importados.pdf');
      setStatus('PDF preparado con los históricos autorizados y sus datos originales.');
    } catch (error) {
      if (owner.current === patient) setStatus(careErrorMessage(error));
    } finally { if (owner.current === patient) setBusy(false); }
  }
  return <div className="pi-history-export">
    <p>Esta copia incluye sólo antecedentes, estudios, planes y medidas históricas autorizadas. No incluye notas privadas ni datos clínicos actuales.</p>
    <NvButton className="nv-soft" disabled={disabled || busy} onClick={() => void exportPdf()}>{busy ? 'Preparando PDF…' : 'Descargar PDF de históricos importados'}</NvButton>
    {status && <p role="status">{status}</p>}
  </div>;
}
