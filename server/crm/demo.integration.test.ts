import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../index.js';
import { getPatient, resetStore } from '../store.js';
import { recordPayment, reportPayment, reviewPayment } from '../fees/repository.js';
import { sendMemoryMessage, markMemoryRead } from '../messages/repository.js';
import type { CrmWorkResponse } from '../../src/types/crm-work.js';

describe('Bandeja profesional: API demo y persistencia de las acciones existentes', () => {
  beforeEach(() => resetStore());
  it('recupera pendientes reales y excluye pagos confirmados y mensajes leídos al recargar', async () => {
    const patient = 'pat-sofia';
    await reportPayment(patient, { amount: 1000, paid_on: '2026-10-05', method: 'efectivo' }, false);
    await recordPayment(patient, { amount: 500, paid_on: '2026-10-05', method: 'efectivo' }, false);
    sendMemoryMessage(patient, { from: 'patient', text: 'Mensaje privado para comprobar lectura', suggestedByAi: false, client_id: 'queue-message' });
    const first = await app.request(`/api/crm/work-queue?patient_id=${patient}&kind=payment`);
    expect(first.status).toBe(200);
    expect(first.headers.get('cache-control')).toBe('no-store');
    const body = await first.json() as CrmWorkResponse;
    expect(body.source).toBe('memory');
    expect(body.total).toBe(1);
    expect(body.counts.payment).toBe(1);
    expect(body.counts.message).toBeGreaterThan(0);
    expect(JSON.stringify(body)).not.toContain('Mensaje privado');
    await reviewPayment(body.items[0].id.replace('payment:', ''), 'confirm', false);
    markMemoryRead(patient, 'vero');
    const next = await (await app.request(`/api/crm/work-queue?patient_id=${patient}`)).json() as CrmWorkResponse;
    expect(next.counts.payment).toBe(0);
    expect(next.counts.message).toBe(0);
  });

  it('archivar retira la ficha de las tareas y rechaza filtros de pacientes inexistentes', async () => {
    getPatient('pat-sofia')!.archived_at = new Date().toISOString();
    const response = await app.request('/api/crm/work-queue?patient_id=pat-sofia');
    expect(response.status).toBe(200);
    expect((await response.json() as CrmWorkResponse).items).toEqual([]);
    expect((await app.request('/api/crm/work-queue?patient_id=other-clinic')).status).toBe(403);
    expect((await app.request('/api/crm/work-queue?audience=patient')).status).toBe(403);
    expect((await app.request('/api/crm/work-queue?limit=0')).status).toBe(400);
    expect((await app.request('/api/crm/work-queue?kind=invalid')).status).toBe(400);
    expect((await app.request('/api/crm/work-queue?nutritionist_id=other')).status).toBe(400);
  });
});
