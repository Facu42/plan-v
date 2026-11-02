import { useEffect, useState } from 'react';
import { api, type CampaignPatientStatus, type WhatsappPracticeStatus } from '../../api/client';
import { useFeatureFlags } from '../../lib/feature-flags';
import { FxPanel } from './ficha-fx';

function textoBaja(status: CampaignPatientStatus) {
  if (!status.whatsapp.configured || status.whatsapp.status === 'unavailable') return 'WhatsApp: No disponible';
  if (status.whatsapp.opted_out || status.campaign_opted_out) return 'Se dio de baja de los avisos';
  return 'Sin baja registrada';
}

export function FichaWhatsappEstado({ patientId, status: statusProp }: { patientId: string; status?: CampaignPatientStatus | null }) {
  const flags = useFeatureFlags();
  const [status, setStatus] = useState<CampaignPatientStatus | null>(statusProp ?? null);
  const [error, setError] = useState('');
  useEffect(() => { if (statusProp !== undefined) setStatus(statusProp); }, [statusProp]);
  useEffect(() => {
    if (!flags.reactivation_campaigns || statusProp !== undefined) return;
    const controller = new AbortController();
    api.campaignPatient(patientId, { signal: controller.signal }).then(next => { if (!controller.signal.aborted) setStatus(next); }).catch(() => { if (!controller.signal.aborted) setError('No pudimos leer la baja.'); });
    return () => controller.abort();
  }, [flags.reactivation_campaigns, patientId, statusProp]);
  if (!flags.reactivation_campaigns && statusProp === undefined) return null;
  if (!status) return error ? <p role="alert">{error}</p> : null;
  return <FxPanel titulo="WhatsApp"><p>{textoBaja(status)}</p></FxPanel>;
}

export function AjustesWhatsappEstado({ status: statusProp }: { status?: WhatsappPracticeStatus | null }) {
  const flags = useFeatureFlags();
  const [status, setStatus] = useState<WhatsappPracticeStatus | null>(statusProp ?? null);
  useEffect(() => { if (statusProp !== undefined) setStatus(statusProp); }, [statusProp]);
  useEffect(() => {
    if (!flags.reactivation_campaigns || statusProp !== undefined) return;
    const controller = new AbortController();
    api.whatsappStatus({ signal: controller.signal }).then(next => { if (!controller.signal.aborted) setStatus(next); }).catch(() => { if (!controller.signal.aborted) setStatus({ configured: false, enabled: false, status: 'unavailable' }); });
    return () => controller.abort();
  }, [flags.reactivation_campaigns, statusProp]);
  if (!flags.reactivation_campaigns && statusProp === undefined) return null;
  if (!status) return null;
  const texto = status.status === 'unavailable' || !status.configured ? 'No disponible' : status.enabled ? 'Configurado' : 'Configurado, sin activar';
  return <p role="status">WhatsApp del consultorio: {texto}. Si faltan los datos de la cuenta, no se puede usar.</p>;
}
