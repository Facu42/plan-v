import { useEffect, useState } from 'react';
import { api, type CampaignBoard, type CampaignChannel, type CampaignPreview, type CampaignSegment } from '../../api/client';
import { ApiError } from '../../api/error';
import { useFeatureFlags } from '../../lib/feature-flags';
import { CANALES, SEGMENTOS, destinatarias, pedidoDeCampania } from './campanas';
import { FxKv, FxPanel } from './ficha-fx';

const VACIO: CampaignBoard['channels'] = { push: false, email: false, whatsapp: false };

function textoError(error: unknown) {
  if (error instanceof ApiError) {
    try {
      const body = JSON.parse(error.message) as { error?: string };
      if (body.error) return body.error;
    } catch { /* el servidor a veces responde texto plano */ }
    return error.message;
  }
  return 'No pudimos completar la acción. No se envió nada.';
}

export function PanelCampaniasView({ enabled, board, error, onPreview, onConfirm, initialPreview = null, initialConfirmed = false, initialChannel = '', initialTemplate = '' }: {
  enabled: boolean;
  board: CampaignBoard | null;
  error: string;
  onPreview: (segment: CampaignSegment, days: number) => Promise<CampaignPreview>;
  onConfirm: (body: NonNullable<ReturnType<typeof pedidoDeCampania>>) => Promise<void>;
  initialPreview?: CampaignPreview | null;
  initialConfirmed?: boolean;
  initialChannel?: CampaignChannel | '';
  initialTemplate?: string;
}) {
  const [segment, setSegment] = useState<CampaignSegment>(initialPreview?.segment.segment ?? 'no_app_record');
  const [days, setDays] = useState(initialPreview?.segment.days ?? 30);
  const [channel, setChannel] = useState<CampaignChannel | ''>(initialChannel);
  const [template, setTemplate] = useState(initialTemplate);
  const [preview, setPreview] = useState<CampaignPreview | null>(initialPreview);
  const [confirmed, setConfirmed] = useState(initialConfirmed);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [localError, setLocalError] = useState('');
  const channels = board?.channels ?? VACIO;
  const plantilla = board?.templates.find(item => item.id === template) ?? null;
  const hash = channel === 'whatsapp' ? board?.whatsapp_template?.hash ?? '' : plantilla?.hash ?? '';
  const nombre = channel === 'whatsapp' ? board?.whatsapp_template?.name ?? '' : plantilla?.id ?? '';
  const elegibles = preview ? destinatarias(preview) : [];
  const pedido = pedidoDeCampania({
    requestKey: '00000000-0000-4000-8000-000000000000',
    segment,
    days,
    channel,
    channels,
    template: nombre,
    templateHash: hash,
    preview,
    settingsEnabled: board?.settings.enabled === true,
    confirmed,
  });
  const cambiar = () => { setPreview(null); setConfirmed(false); setNotice(''); };
  const ver = async () => {
    setBusy(true); setLocalError(''); setNotice('');
    try { setPreview(await onPreview(segment, days)); setConfirmed(false); }
    catch (caught) { setPreview(null); setLocalError(textoError(caught)); }
    finally { setBusy(false); }
  };
  if (!enabled) {
    return <section className="p5" aria-label="Campañas"><section className="p5-card"><header><h2>Campañas</h2></header><p>Próximamente</p></section></section>;
  }
  const confirmar = async () => {
    if (!pedido) return;
    setBusy(true); setLocalError(''); setNotice('');
    try {
      await onConfirm({ ...pedido, request_key: crypto.randomUUID() });
      setNotice('La campaña quedó preparada. No se envió ningún mensaje.');
      setConfirmed(false);
    } catch (caught) { setLocalError(textoError(caught)); }
    finally { setBusy(false); }
  };
  return <section className="fx" aria-label="Campañas" style={{ gridTemplateColumns: '1.2fr .8fr' }}>
    <FxPanel titulo="Nueva campaña" meta={board ? `Te quedan ${board.quota.remaining} de ${board.quota.daily_limit}` : 'Consultando el cupo…'} grande>
      <p>Elegí un segmento, mirá cuántas personas entran y confirmá el canal. Confirmar prepara la campaña: no manda nada por su cuenta.</p>
      {board && !board.settings.enabled ? <p role="status">Este consultorio tiene las campañas apagadas. No se envía nada.</p> : null}
      <div className="cw-grid">
        <label>Segmento<select value={segment} onChange={event => { setSegment(event.target.value as CampaignSegment); cambiar(); }}>{Object.entries(SEGMENTOS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
        <label>Días<input type="number" min={1} max={3650} value={days} onChange={event => { setDays(Number(event.target.value)); cambiar(); }} /></label>
        <label>Canal<select aria-label="Canal" value={channel} onChange={event => { setChannel(event.target.value as CampaignChannel | ''); setConfirmed(false); }}>
          <option value="">Elegí un canal</option>
          {(Object.keys(CANALES) as CampaignChannel[]).map(id => <option key={id} value={id} disabled={!channels[id]}>{CANALES[id]}{channels[id] ? '' : ' · No disponible'}</option>)}
        </select></label>
        {channel === 'whatsapp' ? <p>Plantilla revisada: {board?.whatsapp_template ? board.whatsapp_template.name : 'No disponible'}</p> : <label>Plantilla<select aria-label="Plantilla" value={template} onChange={event => { setTemplate(event.target.value); setConfirmed(false); }}><option value="">Elegí una plantilla</option>{(board?.templates ?? []).map(item => <option key={item.id} value={item.id}>{item.subject}</option>)}</select></label>}
      </div>
      <button type="button" className="sbtn" disabled={busy} onClick={() => void ver()}>Vista previa</button>
      {preview ? <p role="status">{elegibles.length === 1 ? '1 destinataria' : `${elegibles.length} destinatarias`} de {preview.total}. {preview.patients.filter(person => person.opted_out).length} con baja, fuera del envío.</p> : null}
      {preview && elegibles.length ? <ul>{elegibles.map(person => <li key={person.id}>{person.name}</li>)}</ul> : null}
      <label className="cw-check"><input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} />Confirmé el segmento, el canal y las bajas</label>
      <button type="button" className="cta" disabled={busy || !pedido} onClick={() => void confirmar()}>Confirmar</button>
      {notice ? <p role="status">{notice}</p> : null}
      {localError || error ? <p role="alert">{localError || error}</p> : null}
    </FxPanel>
    <div className="c">
      <FxPanel titulo="Cupo de hoy">{board ? <FxKv filas={[['Te quedan', String(board.quota.remaining)], ['Usados', String(board.quota.used)], ['Tope', String(board.quota.daily_limit)]]} /> : <p>Consultando…</p>}</FxPanel>
      <FxPanel titulo="Historial">{board?.campaigns.length ? <ul>{board.campaigns.map(item => <li key={item.id}>{SEGMENTOS[item.segment]} · {CANALES[item.channel]} · {item.days} días</li>)}</ul> : <p>Todavía no hay campañas.</p>}</FxPanel>
      <FxPanel titulo="Bajas">{board?.optouts.length ? <ul>{board.optouts.map(item => <li key={item.patient_id}>{item.name} · se dio de baja</li>)}</ul> : <p>Nadie se dio de baja.</p>}</FxPanel>
    </div>
  </section>;
}

export function PanelCampanias() {
  const flags = useFeatureFlags();
  const [board, setBoard] = useState<CampaignBoard | null>(null);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!flags.reactivation_campaigns) return;
    const controller = new AbortController();
    setError('');
    api.campaigns({ signal: controller.signal }).then(next => { if (!controller.signal.aborted) setBoard(next); }).catch(caught => { if (!controller.signal.aborted) setError(textoError(caught)); });
    return () => controller.abort();
  }, [flags.reactivation_campaigns, revision]);
  return <PanelCampaniasView
    enabled={flags.reactivation_campaigns}
    board={board}
    error={error}
    onPreview={(segment, days) => api.previewCampaign({ segment, days })}
    onConfirm={async body => { await api.createCampaign(body); setRevision(value => value + 1); }}
  />;
}
