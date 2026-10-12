import { describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import { resolveRequestAuth } from './contracts.js';
import { createRateLimits } from './http.js';
import { maxBodyBytes } from '../ops/readiness.js';

describe('integración de reserva pública', () => {
  it('permite sólo el prefijo público y mantiene agenda privada protegida', () => {
    const decision = (path: string) => resolveRequestAuth({ supabaseEnabled:true, path, verifiedUserId:null, allowDemo:false });
    expect(decision('/api/public/scheduling/profesional/slots')).toEqual({kind:'public'});
    expect(decision('/api/public/scheduling/oauth/google')).toEqual({kind:'public'});
    for (const path of ['/api/scheduling','/api/public/scheduling-evil/x','/api/public/team','/api/team','/api/patients']) {
      expect(decision(path),path).toEqual({kind:'unauthorized'});
    }
  });
  it('limita intentos de reserva sin bloquear la consulta de horarios', async () => {
    const app=new Hono();
    app.use('/api/*',createRateLimits({enabled:()=>true,sensitiveLimit:1,clientAddress:()=> '192.0.2.1'}).public);
    app.all('/api/*',c=>c.json({ok:true}));
    const endpoint='/api/public/scheduling/consultorio/bookings';
    expect((await app.request(endpoint,{method:'POST'})).status).toBe(200);
    expect((await app.request(endpoint,{method:'POST'})).status).toBe(429);
    expect((await app.request(endpoint,{method:'GET'})).status).toBe(200);
  });
  it('admite PDF clínico de veinte MB con base64 sólo en el recurso documental', () => {
    expect(maxBodyBytes('/api/patients/a/clinical/documents')).toBeGreaterThanOrEqual(28_000_000);
    expect(maxBodyBytes('/api/patients/a/clinical/laboratory')).toBe(1_048_576);
  });
});
