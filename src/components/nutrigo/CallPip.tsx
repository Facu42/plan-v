import { useEffect, useRef, useSyncExternalStore } from 'react';
import { careApi } from '../../api/care';
import { consultationsApi } from '../../api/consultations';
import { closeCall, getCallPip, moveCall, setCallPhase, setCallSession, snapCall, subscribeCallPip } from '../../lib/call-pip';
import { recordingAllowed, shouldQueueSummary, summaryCommand, summaryNotice, summaryPhase } from '../../lib/call-recording';
import { prepareConsultationCapture, type ConsultationCapture } from '../../lib/consultation-capture';
import { embeddedVideoEnabled } from '../../lib/embedded-video';
import { callsApi } from '../../api/calls';
import { joinLiveKitRoom } from '../../lib/livekit-join';

/** Ventana flotante del cascarón. Sigue visible cuando cambia la pantalla. */
export function CallPipHost({ enabled = embeddedVideoEnabled() }: { enabled?: boolean }) {
  const pip = useSyncExternalStore(subscribeCallPip, getCallPip, getCallPip);
  const capture = useRef<ConsultationCapture | null>(null);
  const revision = useRef(1);
  const chunks = useRef(0);
  const queued = useRef(false);
  const stage = useRef<HTMLDivElement>(null);
  const joined = useRef<{ disconnect: () => void } | null>(null);
  useEffect(() => { queued.current = false; }, [pip.sessionId]);
  useEffect(() => {
    if (!enabled || pip.phase !== 'working' || !pip.patientId || !pip.sessionId) return;
    let stop = false;
    const timer = setInterval(() => {
      void consultationsApi.list(pip.patientId, true, 0).then(view => {
        if (stop) return;
        const session = view.sessions.find(item => item.id === pip.sessionId);
        if (!session) return;
        const tasks = view.tasks.filter(task => task.session_id === session.id);
        const picture = { transcript: session.transcript, draft: session.draft, tasks };
        const phase = summaryPhase(picture);
        if (phase === 'ready' || phase === 'failed') setCallPhase(phase);
        else if (shouldQueueSummary(picture) && !queued.current) {
          queued.current = true;
          void consultationsApi.command(pip.patientId, summaryCommand(session.id, session.revision)).catch(() => { queued.current = false; });
        }
      }).catch(() => undefined);
    }, 4000);
    return () => { stop = true; clearInterval(timer); };
  }, [enabled, pip.phase, pip.patientId, pip.sessionId]);
  useEffect(() => {
    if (!enabled || !pip.open || !pip.patientId || !pip.appointmentId) return;
    let cancel = false;
    void callsApi.livekit(pip.patientId, pip.appointmentId).then(async result => {
      if (cancel || !result.ready || result.videoRecording || result.egress || !result.url || !result.token || !stage.current) return;
      joined.current = await joinLiveKitRoom(result.url, result.token, stage.current);
    }).catch(() => undefined);
    return () => { cancel = true; joined.current?.disconnect(); joined.current = null; };
  }, [enabled, pip.open, pip.patientId, pip.appointmentId]);
  if (!enabled || (!pip.open && pip.phase !== 'working' && pip.phase !== 'ready' && pip.phase !== 'failed' && pip.phase !== 'blocked')) return null;
  const notice = pip.notice || summaryNotice(pip.phase);
  const placed = pip.x == null || pip.y == null
    ? { position: 'fixed' as const, bottom: 16, left: pip.corner === 'left' ? 16 : undefined, right: pip.corner === 'right' ? 16 : undefined, zIndex: 40, width: 280 }
    : { position: 'fixed' as const, left: pip.x, top: pip.y, zIndex: 40, width: 280 };
  async function grabar() {
    if (!pip.patientId || capture.current) return;
    const patientId = pip.patientId;
    let mic: ConsultationCapture | null = null;
    let sessionId = '';
    try {
      const care = await careApi.snapshot(patientId, true);
      if (!recordingAllowed(care.consented)) { setCallPhase('blocked'); return; }
      const appointment = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(pip.appointmentId) ? pip.appointmentId : undefined;
      const started = await consultationsApi.command(patientId, {
        action: 'start', id: crypto.randomUUID(), source: 'capture', recording_version: 'consultation_recording.v1',
        microphone: true, remote_audio: true, ...(appointment ? { appointment_id: appointment } : {}),
      });
      sessionId = started.session.id;
      revision.current = started.session.revision;
      chunks.current = 0;
      mic = await prepareConsultationCapture(
        audio => { const index = chunks.current++; void consultationsApi.chunk(patientId, sessionId, index, crypto.randomUUID(), audio); },
        () => undefined,
        () => setCallPhase('working', 'Se cortó una fuente de audio. La consulta puede quedar incompleta.'),
        async () => recordingAllowed(care.consented),
      );
      capture.current = mic;
      mic.begin();
      setCallSession(sessionId);
    } catch (error) {
      mic?.dispose();
      capture.current = null;
      if (sessionId) void consultationsApi.command(patientId, { action: 'finish', id: sessionId, expected_revision: revision.current, interrupted: true, expected_chunks: chunks.current }).catch(() => undefined);
      setCallPhase('blocked', error instanceof Error ? error.message : summaryNotice('blocked'));
    }
  }
  async function terminar() {
    const patientId = pip.patientId;
    const sessionId = pip.sessionId;
    try { await capture.current?.stop(); } catch { /* La consulta igual se cierra. */ }
    capture.current = null;
    if (!patientId || !sessionId) return;
    try {
      await consultationsApi.command(patientId, { action: 'finish', id: sessionId, expected_revision: revision.current, interrupted: false, expected_chunks: chunks.current });
      setCallPhase('working');
    } catch (error) {
      setCallPhase('failed', error instanceof Error ? error.message : summaryNotice('failed'));
    }
  }
  return <>
    {notice ? <p role="status" data-summary-banner={pip.phase} style={{ position: 'fixed', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 41, margin: 0, padding: '8px 12px', background: '#272832', color: '#fff', borderRadius: 8 }}>{notice}</p> : null}
    {pip.open ? <aside aria-label="Videollamada" data-call-pip="on" data-pip-corner={pip.corner} data-provider="livekit" data-connected="false" data-recording="consent" style={{ ...placed, background: '#fff', color: '#272832', border: '1px solid #e6e1d6', borderRadius: 12, padding: 12, boxShadow: '0 8px 24px rgba(39,40,50,.16)' }}>
      <header
        data-draggable="true"
        style={{ cursor: 'grab', display: 'flex', gap: 8, alignItems: 'center' }}
        onPointerDown={event => {
          const startX = event.clientX;
          const startY = event.clientY;
          const originX = pip.x ?? (pip.corner === 'right' ? window.innerWidth - 296 : 16);
          const originY = pip.y ?? window.innerHeight - 196;
          const move = (next: PointerEvent) => moveCall(originX + next.clientX - startX, originY + next.clientY - startY, { w: window.innerWidth, h: window.innerHeight });
          const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
          window.addEventListener('pointermove', move);
          window.addEventListener('pointerup', up);
        }}
      >
        <strong style={{ flex: 1 }}>Sala · {pip.label}</strong>
        <button type="button" onClick={() => snapCall('left')}>Izquierda</button>
        <button type="button" onClick={() => snapCall('right')}>Derecha</button>
        <button type="button" aria-label="Cerrar sala" onClick={() => { capture.current?.dispose(); capture.current = null; closeCall(); }}>Cerrar</button>
      </header>
      <div ref={stage} data-live-stage="audio-or-live" />
      <p>No se graba ni se guarda video. Si hay permiso, solo se toma el audio para la transcripción y el resumen, y ese audio se borra después de procesarlo.</p>
      {pip.meetUrl ? <p><a href={pip.meetUrl} target="_blank" rel="noopener noreferrer">Abrir en Meet</a> si la sala de LiveKit no está configurada.</p> : <p>Sin claves de LiveKit y sin enlace de Meet.</p>}
      {pip.sessionId ? <button type="button" onClick={() => void terminar()}>Terminar grabación</button> : <button type="button" onClick={() => void grabar()}>Grabar audio</button>}
    </aside> : null}
  </>;
}
