import type { CampaignBoard, CampaignChannel, CampaignCreate, CampaignPreview, CampaignSegment } from '../../api/client';

export const SEGMENTOS: Record<CampaignSegment, string> = {
  no_consultation: 'Sin consulta realizada',
  no_app_record: 'Sin registro en la app',
};

export const CANALES: Record<CampaignChannel, string> = {
  push: 'Aviso en la app',
  email: 'Correo',
  whatsapp: 'WhatsApp',
};

export function destinatarias(preview: CampaignPreview) {
  return preview.patients.filter(person => !person.opted_out);
}

export function puedeConfirmar(input: {
  settingsEnabled: boolean;
  channel: CampaignChannel | '';
  channels: CampaignBoard['channels'];
  template: string;
  templateHash: string;
  patientIds: string[];
  confirmed: boolean;
}) {
  return input.confirmed
    && input.settingsEnabled
    && input.channel !== ''
    && input.channels[input.channel] === true
    && /^[a-f0-9]{64}$/.test(input.templateHash)
    && /^\w{1,100}$/.test(input.template)
    && input.patientIds.length > 0
    && input.patientIds.length <= 100;
}

/** Arma el pedido sólo después de la confirmación. No incluye bajas y no dispara un envío. */
export function pedidoDeCampania(input: {
  requestKey: string;
  segment: CampaignSegment;
  days: number;
  channel: CampaignChannel | '';
  channels: CampaignBoard['channels'];
  template: string;
  templateHash: string;
  preview: CampaignPreview | null;
  settingsEnabled: boolean;
  confirmed: boolean;
}): CampaignCreate | null {
  if (!input.preview || input.preview.segment.segment !== input.segment || input.preview.segment.days !== input.days) return null;
  const patientIds = destinatarias(input.preview).map(person => person.id);
  if (!puedeConfirmar({
    settingsEnabled: input.settingsEnabled,
    channel: input.channel,
    channels: input.channels,
    template: input.template,
    templateHash: input.templateHash,
    patientIds,
    confirmed: input.confirmed,
  })) return null;
  return {
    request_key: input.requestKey,
    segment: input.segment,
    days: input.days,
    channel: input.channel as CampaignChannel,
    template: input.template,
    template_hash: input.templateHash,
    patient_ids: patientIds,
  };
}
