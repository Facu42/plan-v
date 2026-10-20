import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api/client';
import { schedulingApi, type SchedulingWorkspaceSnapshot } from '../../api/scheduling';
import { friendlyError } from '../../lib/error-messages';
import { schedulingDefaultSettings, type SchedulingBooking, type SchedulingSettings } from '../../types/scheduling';
import { bocetoWorkspace, panelDemoEnabled } from '../../lib/panel-boceto-demo';

export const CONNECTION_MISSING = 'Faltan las claves en el servidor. No hay una conexión activa.';

export function usePanelScheduling() {
  const demo = panelDemoEnabled();
  const [snapshot, setSnapshot] = useState<SchedulingWorkspaceSnapshot | null>(() => demo ? bocetoWorkspace(new Date()) : null);
  const [config, setConfig] = useState<SchedulingSettings>(() => demo ? bocetoWorkspace(new Date()).profile.config : schedulingDefaultSettings);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [patients, setPatients] = useState<Array<{ id: string; name: string }>>([]);
  const [bookingMore, setBookingMore] = useState(false);
  const [patientMore, setPatientMore] = useState(false);

  const load = useCallback((signal?: AbortSignal) => {
    if (panelDemoEnabled()) {
      const sample = bocetoWorkspace(new Date());
      setSnapshot(sample); setConfig(sample.profile.config); setError(''); setPatients([]); setBookingMore(false); setPatientMore(false);
      return Promise.resolve();
    }
    setError('');
    return Promise.all([
      schedulingApi.workspace(0, signal),
      api.getPatients({ limit: 100, offset: 0 }, { signal }).then(body => ({ list: body.patients.map(patient => ({ id: patient.id, name: patient.name })), more: Boolean(body.page?.has_more) })).catch(() => ({ list: [] as Array<{ id: string; name: string }>, more: false })),
    ]).then(([next, people]) => {
      if (signal?.aborted) return;
      setSnapshot(next);
      setConfig(next.profile.config);
      setPatients(people.list);
      setBookingMore(next.has_more);
      setPatientMore(people.more);
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
    if (panelDemoEnabled()) {
      setConfig(next);
      setSnapshot(old => old ? { ...old, profile: { ...old.profile, config: next, revision: old.profile.revision } } : old);
      setStatus(message);
      return true;
    }
    setBusy(true); setStatus('');
    try {
      await schedulingApi.save(snapshot?.profile.revision ?? 0, next);
      const fresh = await schedulingApi.workspace();
      setSnapshot(fresh); setConfig(fresh.profile.config); setBookingMore(fresh.has_more); setStatus(message);
      return true;
    } catch (reason) { setStatus(friendlyError(reason)); return false; }
    finally { setBusy(false); }
  }

  async function connect(provider: 'google' | 'mercadopago') {
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

  async function disconnect(provider: 'google' | 'mercadopago') {
    setBusy(true); setStatus('');
    try {
      await schedulingApi.disconnect(provider);
      await load();
      setStatus('Conexión eliminada del consultorio.');
    } catch (reason) { setStatus(friendlyError(reason)); }
    finally { setBusy(false); }
  }

  async function loadMoreBookings() {
    setBusy(true); setStatus('');
    try {
      const next = await schedulingApi.workspace(snapshot?.bookings.length ?? 0);
      setSnapshot(old => old ? { ...next, bookings: mergeById(old.bookings, next.bookings), transfers: mergeById(old.transfers, next.transfers) } : next);
      setBookingMore(next.has_more);
    } catch (reason) { setStatus(friendlyError(reason)); }
    finally { setBusy(false); }
  }

  async function loadMorePatients() {
    setBusy(true); setStatus('');
    try {
      const body = await api.getPatients({ limit: 100, offset: patients.length });
      setPatients(current => mergeById(current, body.patients.map(patient => ({ id: patient.id, name: patient.name }))));
      setPatientMore(Boolean(body.page?.has_more));
    } catch (reason) { setStatus(friendlyError(reason)); }
    finally { setBusy(false); }
  }

  async function syncBooking(id: string) {
    setBusy(true); setStatus('');
    try { await schedulingApi.sync(id); setStatus('Sincronización solicitada.'); }
    catch (reason) { setStatus(friendlyError(reason)); }
    finally { setBusy(false); }
  }

  async function reconcileBooking(id: string) {
    setBusy(true); setStatus('');
    try { await schedulingApi.reconcile(id); setStatus('Pagos de Mercado Pago revisados.'); }
    catch (reason) { setStatus(friendlyError(reason)); }
    finally { setBusy(false); }
  }

  async function reviewTransfer(id: string, decision: 'confirm' | 'reject') {
    setBusy(true); setStatus('');
    try {
      await schedulingApi.reviewTransfer(id, decision);
      await load();
      setStatus(decision === 'confirm' ? 'Transferencia confirmada.' : 'Transferencia rechazada.');
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

  return { snapshot, config, setConfig, error, status, setStatus, busy, patients, bookingMore, patientMore, load, save, connect, disconnect, loadMoreBookings, loadMorePatients, syncBooking, reconcileBooking, reviewTransfer, confirm, changeBooking };
}

function mergeById<T extends { id: string }>(left: T[], right: T[]) {
  const seen = new Set(left.map(item => item.id));
  return [...left, ...right.filter(item => !seen.has(item.id))];
}
