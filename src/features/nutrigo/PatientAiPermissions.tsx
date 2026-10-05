import { CareConsent } from '../../components/nutrigo/CarePanel';
import { useCare } from '../../components/nutrigo/useCare';

export function PatientAiPermissions({ patientId }: { patientId: string }) {
  const { data, error, reload } = useCare(patientId);
  return <section aria-label="Permisos para la IA">
    <h2>Permisos para la IA</h2>
    <p>Vos elegís si tu nutricionista puede usar la IA para preparar propuestas. Siempre las revisa antes de compartirlas.</p>
    {error ? <p role="alert">{error} <button type="button" className="mcp-action" onClick={reload}>Reintentar permisos</button></p>
      : data ? <CareConsent key={patientId} patientId={patientId} snapshot={data} onlyAI />
        : <p role="status">Cargando permisos…</p>}
  </section>;
}
