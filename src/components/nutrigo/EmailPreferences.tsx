import { useEffect, useRef, useState, type FormEvent } from 'react';
import { api } from '../../api/client';
import type { NotificationPrefs } from '../../types/outbox';
import { NvButton, NvCard } from './primitives';

type View = { prefs: NotificationPrefs; source: string };

/** La elección de la paciente nunca habilita el transporte externo del servicio. */
export function EmailPreferences({ patientId }: { patientId: string }) {
  const [view, setView] = useState<View | null>(null);
  const [email, setEmail] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [revision, setRevision] = useState(0);
  const lock = useRef(false), active = useRef(false);

  useEffect(() => {
    let current = true;
    active.current = true;
    setView(null); setEmail(false); setError(''); setStatus('');
    void api.getNotificationPrefs(patientId, 'patient').then(result => {
      if (current) { setView(result); setEmail(result.prefs.email); }
    }).catch(() => {
      if (current) setError('No pudimos leer tu permiso de correo. Podés reintentar.');
    });
    return () => { current = false; active.current = false; };
  }, [patientId, revision]);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (lock.current || !view) return;
    const chosen = email;
    lock.current = true; setBusy(true); setError(''); setStatus('');
    try {
      // Una lectura nueva conserva cambios de avisos internos/push realizados en otra pantalla.
      const latest = await api.getNotificationPrefs(patientId, 'patient');
      if (!active.current) return;
      const saved = await api.saveNotificationPrefs({ ...latest.prefs, email: chosen }, patientId, 'patient');
      if (!active.current) return;
      setView(saved); setEmail(saved.prefs.email);
      setStatus(saved.prefs.email ? 'Guardamos tu permiso de correo.' : 'Retiraste tu permiso de correo. Los envíos pendientes vuelven a comprobar esta elección.');
    } catch {
      if (active.current) setError('No pudimos guardar tu elección. Conservamos el cambio para que puedas reintentar.');
    } finally {
      lock.current = false;
      if (active.current) setBusy(false);
    }
  }

  return <NvCard title="Mis avisos por correo" className="care-panel ops-panel">
    <p>Elegís si recibir recordatorios y mensajes operativos del consultorio por correo. Este permiso es independiente de WhatsApp y podés retirarlo acá o desde el enlace de baja de cada correo.</p>
    <p>Guardar tu elección no activa el servicio de envío; sólo se enviarán mensajes cuando el consultorio lo tenga habilitado y tu permiso siga vigente.</p>
    {!view && !error && <p role="status">Cargando permiso de correo…</p>}
    {view?.source === 'memory' && <p>Modo demo: guardamos sólo una elección de prueba. No se envían correos externos.</p>}
    <form onSubmit={save} aria-busy={busy}>
      <label className="care-consent"><input type="checkbox" checked={email} disabled={!view || busy} onChange={event => { setEmail(event.target.checked); setStatus(''); }} />Quiero recibir avisos operativos del consultorio por correo.</label>
      <NvButton type="submit" disabled={!view || busy}>{busy ? 'Guardando correo…' : 'Guardar permiso de correo'}</NvButton>
    </form>
    {error && <p role="alert">{error} {!view && <NvButton type="button" disabled={busy} onClick={() => setRevision(value => value + 1)}>Reintentar permiso de correo</NvButton>}</p>}
    {status && <p role="status">{status}</p>}
  </NvCard>;
}
