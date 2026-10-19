import { useCallback, useEffect, useState } from 'react';
import { api, request } from '../../api/client';
import { schedulingApi, type SchedulingWorkspaceSnapshot } from '../../api/scheduling';
import { friendlyError } from '../../lib/error-messages';
import { schedulingDefaultSettings, type SchedulingBooking, type SchedulingSettings } from '../../types/scheduling';

export const CONNECTION_MISSING = 'Faltan las claves en el servidor. No hay una conexión activa.';

export function usePanelScheduling() {
  const [snapshot, setSnapshot] = useState<SchedulingWorkspaceSnapshot | null>(null);
  const [config, setConfig] = useState<SchedulingSettings>(schedulingDefaultSettings);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [whatsapp, setWhatsapp] = useState(false);
  const [patients, setPatients] = useState<Array<{ id: string; name: string }>>([]);

  const load = useCallback((signal?: AbortSignal) => {
    setError('');
    return Promise.all([
      schedulingApi.workspace(0, signal),
      request<{ enabled?: boolean }>('/api/portfolio/communications', { signal }).then(body => Boolean(body.enabled)).catch(() => false),
      api.getPatients({ limit: 100, offset: 0 }, { signal }).then(body => body.patients.map(patient => ({ id: patient.id, name: patient.name }))).catch(() => []),
    ]).then(([next, enabled, list]) => {
      if (signal?.aborted) return;
      setSnapshot(next);
      setConfig(next.profile.config);
      setWhatsapp(enabled);
      setPatients(list);
    }).catch(reason => {
      if (signal?.aborted) return;
      setError(friendlyError(reason));
    });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  async function save(next: SchedulingSettings, message = 'Cambios guardados.') {
    setBusy(true); setStatus('');
    try {
      await schedulingApi.save(snapshot?.profile.revision ?? 0, next);
      const fresh = await schedulingApi.workspace();
      setSnapshot(fresh); setConfig(fresh.profile.config); setStatus(message);
      return true;
    } catch (reason) { setStatus(friendlyError(reason)); return false; }
    finally { setBusy(false); }
  }

  async function connect(provider: 'google' | 'mercadopago' | 'whatsapp') {
    if (provider === 'whatsapp') { if (!whatsapp) setStatus(CONNECTION_MISSING); return; }
    const available = Boolean(snapshot?.available[provider]);
    const connected = Boolean(snapshot?.connections[provider]);
    if (connected) return;
    if (!available) { setStatus(CONNECTION_MISSING); return; }
    setBusy(true); setStatus('');
    try {
      const result = await schedulingApi.connection(provider);
      window.location.assign(result.url);
    } catch (reason) { setStatus(friendlyError(reason)); setBusy(false); }
  }

  async function changeBooking(booking: SchedulingBooking, action: 'cancel' | 'reschedule', startsAt?: string) {
    setBusy(true); setStatus('');
    try {
      if (action === 'reschedule') {
        if (!startsAt) throw new Error('Elegí el nuevo horario.');
        await schedulingApi.change(booking.id, { action, expected_revision: booking.revision, starts_at: startsAt });
      } else await schedulingApi.change(booking.id, { action, expected_revision: booking.revision });
      await load(); setStatus(action === 'cancel' ? 'Turno cancelado. Los pagos quedan registrados.' : 'Turno reprogramado.');
    } catch (reason) { setStatus(friendlyError(reason)); }
    finally { setBusy(false); }
  }

  async function confirm(booking: SchedulingBooking, patientId: string) {
    setBusy(true); setStatus('');
    try {
      await schedulingApi.change(booking.id, { action: 'confirm', expected_revision: booking.revision, ...(patientId ? { patient_id: patientId } : {}) });
      await load(); setStatus('Turno confirmado.');
    } catch (reason) { setStatus(friendlyError(reason)); }
    finally { setBusy(false); }
  }

  return { snapshot, config, setConfig, error, status, setStatus, busy, whatsapp, patients, load, save, connect, confirm, changeBooking };
}
