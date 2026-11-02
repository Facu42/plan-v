import { useEffect, useState, useSyncExternalStore } from 'react';
import { careApi } from '../../api/care';
import { consultationsApi } from '../../api/consultations';
import { recordingAllowed, shouldQueueSummary, summaryCommand, summaryNotice, summaryPhase } from '../../lib/call-recording';
import { prepareConsultationCapture, type ConsultationCapture } from '../../lib/consultation-capture';
import { getMeetAudio, ofertaGrabacion, setMeetAudio, subscribeMeetAudio, tabAudioSupport, type TabAudioSupport } from '../../lib/meet-audio-bar';

let capture: ConsultationCapture | null = null;
let revision = 1;
let chunks = 0;
let queued = false;

export async function startMeetAudio(input: { patientId: string; appointmentId?: string; mode: 'tab' | 'mic'; consented: readonly string[] }) {
  if (capture) return;
  if (!recordingAllowed(input.consented)) {
    setMeetAudio({ phase: 'blocked', notice: summaryNotice('blocked'), patientId: input.patientId, hint: '' });
    return;
  }
  const patientId = input.patientId;
  let sessionId = '';
  let mic: ConsultationCapture | null = null;
  try {
    // El cuadro de la pestaña tiene que abrirse en el mismo clic, antes de hablar con el servidor.
    mic = await prepareConsultationCapture(
      audio => { const index = chunks++; void consultationsApi.chunk(patientId, sessionId, index, crypto.randomUUID(), audio); },
      () => undefined,
      () => setMeetAudio({ phase: 'recording', notice: 'Se cortó una fuente de audio. La consulta puede quedar incompleta.' }),
      async () => true,
      { micOnly: input.mode === 'mic', preconsented: true },
    );
    const appointment = input.appointmentId && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.appointmentId) ? input.appointmentId : undefined;
    const started = await consultationsApi.command(patientId, {
      action: 'start', id: crypto.randomUUID(), source: 'capture', recording_version: 'consultation_recording.v1',
      microphone: mic.sources.microphone, remote_audio: mic.sources.remote, ...(appointment ? { appointment_id: appointment } : {}),
    });
    sessionId = started.session.id;
    revision = started.session.revision;
    chunks = 0;
    queued = false;
    capture = mic;
    mic.begin();
    const hint = input.mode === 'tab' && !mic.sources.remote
      ? 'No llegó el audio de la pestaña. En Chrome o Edge, elegí la pestaña de Meet y marcá compartir audio.'
      : '';
    setMeetAudio({ phase: 'recording', notice: '', hint, patientId, sessionId });
  } catch (error) {
    mic?.dispose();
    capture = null;
    if (sessionId) void consultationsApi.command(patientId, { action: 'finish', id: sessionId, expected_revision: revision, interrupted: true, expected_chunks: chunks }).catch(() => undefined);
    setMeetAudio({ phase: 'blocked', notice: error instanceof Error ? error.message : summaryNotice('blocked'), patientId, sessionId: '' });
  }
}

export function pauseMeetAudio() {
  capture?.pause();
  setMeetAudio({ phase: 'paused' });
}

export function resumeMeetAudio() {
  capture?.resume();
  setMeetAudio({ phase: 'recording' });
}

export async function finishMeetAudio() {
  const current = getMeetAudio();
  try { await capture?.stop(); } catch { /* La consulta igual se cierra. */ }
  capture = null;
  if (!current.patientId || !current.sessionId) { setMeetAudio({ phase: 'idle', sessionId: '' }); return; }
  try {
    await consultationsApi.command(current.patientId, { action: 'finish', id: current.sessionId, expected_revision: revision, interrupted: false, expected_chunks: chunks });
    setMeetAudio({ phase: 'working', notice: summaryNotice('working'), hint: '' });
  } catch (error) {
    setMeetAudio({ phase: 'failed', notice: error instanceof Error ? error.message : summaryNotice('failed') });
  }
}

/** Aviso fijo del panel: grabación y resumen, sin video. */
export function MeetAudioBar() {
  const audio = useSyncExternalStore(subscribeMeetAudio, getMeetAudio, getMeetAudio);
  useEffect(() => { queued = false; }, [audio.sessionId]);
  useEffect(() => {
    if (audio.phase !== 'working' || !audio.patientId || !audio.sessionId) return;
    let stop = false;
    const timer = setInterval(() => {
      void consultationsApi.list(audio.patientId, true, 0).then(view => {
        if (stop) return;
        const session = view.sessions.find(item => item.id === audio.sessionId);
        if (!session) return;
        const tasks = view.tasks.filter(task => task.session_id === session.id);
        const picture = { transcript: session.transcript, draft: session.draft, tasks };
        const phase = summaryPhase(picture);
        if (phase === 'ready' || phase === 'failed') setMeetAudio({ phase, notice: summaryNotice(phase) });
        else if (shouldQueueSummary(picture) && !queued) {
          queued = true;
          void consultationsApi.command(audio.patientId, summaryCommand(session.id, session.revision)).catch(() => { queued = false; });
        }
      }).catch(() => undefined);
    }, 4000);
    return () => { stop = true; clearInterval(timer); };
  }, [audio.phase, audio.patientId, audio.sessionId]);
  if (audio.phase === 'idle') return null;
  const grabando = audio.phase === 'recording' || audio.phase === 'paused';
  return <div data-meet-audio={audio.phase} role="status" style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 40, maxWidth: 320, padding: '10px 12px', background: '#272832', color: '#fff', borderRadius: 12 }}>
    {grabando ? <strong>{audio.phase === 'paused' ? 'Audio en pausa' : 'Grabando audio'}</strong> : null}
    {audio.notice ? <p style={{ margin: '6px 0' }}>{audio.notice}</p> : null}
    {audio.hint ? <p style={{ margin: '6px 0' }}>{audio.hint}</p> : null}
    {grabando ? <span>
      {audio.phase === 'recording'
        ? <button type="button" onClick={pauseMeetAudio}>Pausar</button>
        : <button type="button" onClick={resumeMeetAudio}>Seguir</button>}
      <button type="button" onClick={() => void finishMeetAudio()}>Terminar</button>
    </span> : null}
  </div>;
}

export function OfertaGrabarAudio({ allowed, support, onStart }: { allowed: boolean; support: TabAudioSupport; onStart: (mode: 'tab' | 'mic') => void }) {
  const offer = ofertaGrabacion(support, allowed);
  if (!offer) return null;
  return <span data-grabar-audio={offer.mode}><button type="button" onClick={() => onStart(offer.mode)}>{offer.title}</button><small>{offer.hint}</small></span>;
}

export function OfertaGrabarAudioDelTurno({ patientId, appointmentId }: { patientId: string; appointmentId: string }) {
  const [allowed, setAllowed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    void careApi.snapshot(patientId, true, controller.signal).then(care => setAllowed(recordingAllowed(care.consented))).catch(() => setAllowed(false));
    return () => controller.abort();
  }, [patientId]);
  if (!allowed) return null;
  const support = typeof navigator === 'undefined' ? 'tab' : tabAudioSupport(navigator.userAgent);
  return <OfertaGrabarAudio allowed support={support} onStart={mode => { void startMeetAudio({ patientId, appointmentId, mode, consented: ['consultation_recording', 'ai_consultation'] }); }} />;
}
