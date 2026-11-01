/**
 * La sala en vivo puede mostrar imagen, pero no se graba ni se guarda.
 * No hay Egress ni room recording. El audio de la transcripción es otro camino y se borra al procesarlo.
 */
export const SAVE_CALL_VIDEO = false;
export const LIVEKIT_EGRESS = false;
export const LIVEKIT_ROOM_RECORD = false;

export type LiveKitSettings = { url: string; apiKey: string; apiSecret: string };

export function liveKitSettings(env: { LIVEKIT_URL?: string; LIVEKIT_API_KEY?: string; LIVEKIT_API_SECRET?: string }): LiveKitSettings | null {
  const url = env.LIVEKIT_URL?.trim() ?? '';
  const apiKey = env.LIVEKIT_API_KEY?.trim() ?? '';
  const apiSecret = env.LIVEKIT_API_SECRET?.trim() ?? '';
  if (!url || !apiKey || !apiSecret) return null;
  let parsed: URL;
  try { parsed = new URL(url); } catch { return null; }
  if ((parsed.protocol !== 'wss:' && parsed.protocol !== 'https:') || parsed.username || parsed.password) return null;
  if (apiKey.length < 3 || apiSecret.length < 16) return null;
  return { url: parsed.origin + parsed.pathname.replace(/\/$/, ''), apiKey, apiSecret };
}

export function liveKitRoomName(appointmentId: string) {
  const clean = appointmentId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80);
  return clean ? `consulta-${clean}` : '';
}

export function liveKitClaims(room: string, identity: string, apiKey: string, nowSec: number) {
  return {
    iss: apiKey,
    sub: identity.slice(0, 80),
    nbf: nowSec - 10,
    exp: nowSec + 2 * 60 * 60,
    video: {
      roomJoin: true,
      room,
      canPublish: true,
      canSubscribe: true,
      canPublishData: false,
      roomRecord: LIVEKIT_ROOM_RECORD,
      recorder: false,
      canPublishSources: ['camera', 'microphone'],
    },
  };
}
