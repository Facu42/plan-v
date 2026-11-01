import { readFileSync } from 'node:fs';
import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import { liveKitClaims, liveKitSettings, SAVE_CALL_VIDEO, LIVEKIT_EGRESS } from '../../src/lib/livekit-room.js';
import { liveKitJoin } from './livekit.js';
import { registerCallRoutes } from './routes.js';

const firma = ['clave', 'de', 'prueba', 'larga', '32c'].join('-');
const env = { LIVEKIT_URL: 'wss://sala.example/live', LIVEKIT_API_KEY: 'devkey', LIVEKIT_API_SECRET: firma };

describe('sala LiveKit sin grabar video', () => {
  it('exige las tres claves y no guarda video ni prende egress', () => {
    expect(liveKitSettings({ ...env, LIVEKIT_API_SECRET: '' })).toBeNull();
    expect(liveKitSettings({ ...env, LIVEKIT_URL: 'http://sala.example' })).toBeNull();
    expect(SAVE_CALL_VIDEO).toBe(false);
    expect(LIVEKIT_EGRESS).toBe(false);
    const join = liveKitJoin(env, 'turno-1', 'nutri:consultorio', 1_700_000_000);
    expect(join.ready).toBe(true);
    if (!join.ready) return;
    expect(join.videoRecording).toBe(false);
    expect(join.egress).toBe(false);
    expect(join.token.includes(firma)).toBe(false);
    const payload = JSON.parse(Buffer.from(join.token.split('.')[1], 'base64url').toString()) as { sub: string; video: { roomRecord: boolean; recorder: boolean; room: string } };
    expect(payload.sub).toBe('nutri:consultorio');
    expect(payload.video.room).toBe('consulta-turno-1');
    expect(payload.video.roomRecord).toBe(false);
    expect(payload.video.recorder).toBe(false);
    expect(JSON.stringify(payload)).not.toMatch(/egress|Ana|paciente@/i);
    expect(liveKitClaims('consulta-turno-1', 'nutri:consultorio', 'devkey', 1).video.roomRecord).toBe(false);
  });

  it('sin claves responde que no está lista y no inventa un token', async () => {
    const app = new Hono();
    app.use('*', async (c, next) => { c.set('auth', { demo: true }); return next(); });
    registerCallRoutes(app, () => ({}));
    const response = await app.request('/api/calls/livekit', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ patient_id: 'paciente-1', appointment_id: 'turno-1' }) });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ready: false, videoRecording: false, egress: false });
  });

  it('el código de la sala no pide grabar ni Egress', () => {
    const text = [
      readFileSync(new URL('./livekit.ts', import.meta.url), 'utf8'),
      readFileSync(new URL('../../src/lib/livekit-join.ts', import.meta.url), 'utf8'),
    ].join('\n');
    expect(text).not.toMatch(/startEgress|RoomCompositeEgress|startRecording|roomRecord:\s*true/);
    expect(text).toMatch(/no se graba|No llama a Egress/i);
  });
});
