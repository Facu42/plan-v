import { CONSULTATION_AI_VERSION, CONSULTATION_RECORDING_VERSION, type ConsultationCommand } from '../types/consultations';

/** La grabación de la sala usa la consulta que ya existe. Sin los dos permisos no se manda audio. */
export function recordingAllowed(consented: readonly string[]) {
  return consented.includes('consultation_recording') && consented.includes('ai_consultation');
}

export type SummaryTask = { kind: string; status: string };
export type SummaryView = { transcript: string; draft: string; tasks: readonly SummaryTask[] };

export function summaryPhase(view: SummaryView): 'idle' | 'working' | 'ready' | 'failed' {
  if (view.draft.trim()) return 'ready';
  if (view.tasks.some(task => task.kind === 'summary' && task.status === 'failed')) return 'failed';
  if (view.tasks.some(task => task.status === 'queued' || task.status === 'running' || task.status === 'uploading')) return 'working';
  if (view.transcript.trim()) return 'working';
  return 'idle';
}

/** El resumen se pide una sola vez, cuando ya hay transcripción y el trabajador todavía no lo tomó. */
export function shouldQueueSummary(view: SummaryView) {
  return Boolean(view.transcript.trim())
    && !view.draft.trim()
    && !view.tasks.some(task => task.kind === 'summary');
}

export function summaryNotice(phase: 'idle' | 'working' | 'ready' | 'failed' | 'blocked') {
  if (phase === 'working') return 'Preparando el resumen de la consulta. Podés seguir en otra pantalla.';
  if (phase === 'ready') return 'El resumen quedó en la ficha. Revisalo antes de compartirlo.';
  if (phase === 'failed') return 'No se pudo preparar el resumen. Reintentá desde la ficha.';
  if (phase === 'blocked') return 'Sin permiso de grabación o de IA no se guarda el audio.';
  return '';
}

type Started = { id: string; revision: number };

/** Manda el audio por la consulta existente. No llama a LiveKit ni a Daily. */
export async function recordCallWithConsent(input: {
  consented: readonly string[];
  chunks: readonly Uint8Array[];
  start: (command: ConsultationCommand) => Promise<Started>;
  upload: (sessionId: string, index: number, audio: Uint8Array) => Promise<void>;
  finish: (sessionId: string, revision: number, chunks: number) => Promise<void>;
  sessionId?: string;
  appointmentId?: string;
}): Promise<{ recorded: false; reason: string } | { recorded: true; sessionId: string }> {
  if (!recordingAllowed(input.consented)) {
    return { recorded: false, reason: summaryNotice('blocked') };
  }
  if (!input.chunks.length) return { recorded: false, reason: 'No hay audio para guardar.' };
  const id = input.sessionId ?? crypto.randomUUID();
  const appointment = input.appointmentId && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.appointmentId)
    ? input.appointmentId : undefined;
  const started = await input.start({
    action: 'start',
    id,
    source: 'capture',
    recording_version: CONSULTATION_RECORDING_VERSION,
    microphone: true,
    remote_audio: false,
    ...(appointment ? { appointment_id: appointment } : {}),
  });
  for (let index = 0; index < input.chunks.length; index += 1) {
    await input.upload(started.id, index, input.chunks[index]);
  }
  await input.finish(started.id, started.revision, input.chunks.length);
  return { recorded: true, sessionId: started.id };
}

export function summaryCommand(sessionId: string, revision: number): ConsultationCommand {
  return { action: 'summarize', id: sessionId, expected_revision: revision, consent_version: CONSULTATION_AI_VERSION };
}
