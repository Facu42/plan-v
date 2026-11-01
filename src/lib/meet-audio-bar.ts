export type TabAudioSupport = 'tab' | 'mic-only';
export type MeetAudioPhase = 'idle' | 'recording' | 'paused' | 'working' | 'ready' | 'failed' | 'blocked';

export type MeetAudioState = {
  phase: MeetAudioPhase;
  notice: string;
  hint: string;
  patientId: string;
  sessionId: string;
};

const idle: MeetAudioState = { phase: 'idle', notice: '', hint: '', patientId: '', sessionId: '' };
let state: MeetAudioState = idle;
const listeners = new Set<() => void>();

function emit(next: MeetAudioState) {
  state = next;
  listeners.forEach(listener => listener());
}

export function getMeetAudio(): MeetAudioState {
  return state;
}

export function subscribeMeetAudio(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function resetMeetAudio() {
  emit(idle);
}

export function setMeetAudio(patch: Partial<MeetAudioState>) {
  emit({ ...state, ...patch });
}

/** Chrome y Edge pasan el audio de la pestaña. Safari y Firefox, no. */
export function tabAudioSupport(userAgent: string): TabAudioSupport {
  const ua = userAgent;
  if (/Edg\//.test(ua) || /EdgiOS/.test(ua)) return /EdgiOS/.test(ua) ? 'mic-only' : 'tab';
  if (/Chrome|Chromium/.test(ua) && !/CriOS/.test(ua)) return 'tab';
  return 'mic-only';
}

export function ofertaGrabacion(support: TabAudioSupport, allowed: boolean) {
  if (!allowed) return null;
  if (support === 'mic-only') {
    return {
      mode: 'mic' as const,
      title: 'Grabar solo el micrófono',
      hint: 'Safari y Firefox no pasan el audio de la pestaña. Usá Chrome o Edge y elegí compartir pestaña con audio. Mientras tanto podés grabar solo tu micrófono.',
    };
  }
  return {
    mode: 'tab' as const,
    title: 'Grabar audio de la llamada',
    hint: 'En el cuadro, elegí la pestaña de Meet y marcá compartir audio. No se guarda video.',
  };
}
