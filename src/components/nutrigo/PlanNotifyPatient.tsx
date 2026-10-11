import { NvButton } from './primitives';

/** Como «Notificar cliente» de Nutriboost: un mensaje en la conversación, que la paciente ve en su campana. */
export function planPublishedNoticeText(patientName: string, version: number): string {
  const firstName = patientName.trim().split(/\s+/)[0] ?? '';
  const greeting = firstName ? `Hola ${firstName},` : 'Hola,';
  return `${greeting} ya publiqué tu plan alimentario (versión ${version}). Lo ves en la sección Plan de Plan V. Cualquier duda, escribime por acá.`;
}

export function PlanNotifyPatient({ patientName, publishedVersion, busy, sentVersion, onNotify }: {
  patientName: string; publishedVersion: number | null; busy: boolean; sentVersion: number | null; onNotify: () => void;
}) {
  if (publishedVersion === null) return null;
  const who = patientName.trim().split(/\s+/)[0] || 'la paciente';
  return <>
    <NvButton type="button" className="nv-soft" disabled={busy} onClick={onNotify}>Avisarle a {who}</NvButton>
    {sentVersion === publishedVersion && <small role="status">Le avisamos por Mensajes que la versión {publishedVersion} está publicada.</small>}
  </>;
}
