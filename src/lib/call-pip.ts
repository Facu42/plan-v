import { embeddedVideoEnabled } from './embedded-video';

/** LiveKit, en un servidor propio, deja elegir la región. Daily publica Estados Unidos y Europa. Sin claves no hay sala conectada. */
export const CALL_PROVIDER = 'livekit' as const;

export type PipCorner = 'left' | 'right';
export type SummaryPhase = 'idle' | 'working' | 'ready' | 'failed' | 'blocked';

export type CallPipState = {
  open: boolean;
  patientId: string;
  label: string;
  appointmentId: string;
  corner: PipCorner;
  x: number | null;
  y: number | null;
  phase: SummaryPhase;
  notice: string;
  sessionId: string;
  meetUrl: string;
};

const closed: CallPipState = {
  open: false, patientId: '', label: '', appointmentId: '', corner: 'right', x: null, y: null, phase: 'idle', notice: '', sessionId: '', meetUrl: '',
};

let state: CallPipState = closed;
const listeners = new Set<() => void>();

function emit(next: CallPipState) {
  state = next;
  listeners.forEach(listener => listener());
}

export function getCallPip(): CallPipState {
  return state;
}

export function subscribeCallPip(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function resetCallPip() {
  emit(closed);
}

export function openCall(input: { patientId: string; label: string; appointmentId?: string; meetUrl?: string }, enabled = embeddedVideoEnabled()) {
  if (!enabled || !input.patientId) return false;
  const appointmentId = input.appointmentId ?? '';
  emit({
    ...state,
    open: true,
    patientId: input.patientId,
    label: input.label.trim().slice(0, 40) || 'Consulta',
    appointmentId,
    meetUrl: input.meetUrl?.startsWith('https://') ? input.meetUrl : '',
    sessionId: state.appointmentId === appointmentId ? state.sessionId : '',
    phase: state.appointmentId === appointmentId ? state.phase : 'idle',
    notice: state.appointmentId === appointmentId ? state.notice : '',
  });
  return true;
}

export function closeCall() {
  emit({ ...state, open: false, phase: state.phase === 'working' ? 'working' : state.phase });
}

export function moveCall(x: number, y: number, viewport = { w: 1440, h: 900 }) {
  const point = clampPip(x, y, viewport);
  emit({ ...state, x: point.x, y: point.y });
}

export function snapCall(corner: PipCorner) {
  emit({ ...state, corner, x: null, y: null });
}

export function setCallPhase(phase: SummaryPhase, notice = '') {
  emit({ ...state, phase, notice });
}

export function setCallSession(sessionId: string) {
  emit({ ...state, sessionId, phase: 'working', notice: '' });
}

export function clampPip(x: number, y: number, viewport = { w: 1440, h: 900 }, box = { w: 280, h: 180 }) {
  const maxX = Math.max(8, viewport.w - box.w - 8);
  const maxY = Math.max(8, viewport.h - box.h - 8);
  return { x: Math.min(maxX, Math.max(8, Math.round(x))), y: Math.min(maxY, Math.max(8, Math.round(y))) };
}
