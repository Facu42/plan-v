import { createHmac } from 'node:crypto';
import { liveKitClaims, liveKitRoomName, liveKitSettings, LIVEKIT_EGRESS, SAVE_CALL_VIDEO } from '../../src/lib/livekit-room.js';

function b64url(value: string) {
  return Buffer.from(value).toString('base64url');
}

export function signLiveKitToken(payload: Record<string, unknown>, secret: string) {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64url(JSON.stringify(payload));
  const signature = createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

export function liveKitJoin(env: NodeJS.ProcessEnv, roomId: string, identity: string, nowSec = Math.floor(Date.now() / 1000)) {
  const settings = liveKitSettings(env);
  const room = liveKitRoomName(roomId);
  if (!settings || !room) return { ready: false as const, videoRecording: SAVE_CALL_VIDEO, egress: LIVEKIT_EGRESS };
  const claims = liveKitClaims(room, identity, settings.apiKey, nowSec);
  return {
    ready: true as const,
    url: settings.url,
    token: signLiveKitToken(claims, settings.apiSecret),
    room,
    videoRecording: SAVE_CALL_VIDEO,
    egress: LIVEKIT_EGRESS,
  };
}
