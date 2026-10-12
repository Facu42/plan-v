import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../index.js';
import { resetStore } from '../store.js';
beforeEach(resetStore);
describe('asistente de cartera conectado con fuentes',()=>{
 it('responde sin IA y no publica ni manda mensajes',async()=>{
  const response=await app.request('/api/portfolio/assistant',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question:'¿Qué comidas esperan revisión?',days:7,use_ai:false})});
  expect(response.status).toBe(200);
  const data=await response.json();expect(data.mode).toBe('local');expect(data.proposals).toEqual([]);expect(data.sources.length).toBeGreaterThan(0);expect(data.sources.every((r:{pending_review:number})=>r.pending_review>0)).toBe(true);
 });
 it('rechaza acceso paciente y períodos no admitidos',async()=>{
  expect((await app.request('/api/portfolio/indicators?audience=patient')).status).toBe(403);
  expect((await app.request('/api/portfolio/indicators?days=999')).status).toBe(400);
 });
});
