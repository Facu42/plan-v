import { useEffect, useMemo, useState } from 'react';
import { useCareNotices, type CareNotice } from './useCareNotices';
import { api } from '../../api/client';
import type { DemoNotice } from '../../types';
import { Icon } from '../shared/Icon';
import { NvBadge, NvButton } from './primitives';
import {
  dismissConsultAlert,
  visibleConsultAlerts,
  type ConsultAlert,
  type ConsultAlertAudience,
} from './consult-alerts';
import type { DailyReminder } from '../patient/daily-reminders';
import {
  browserNoticesSupported,
  enableBrowserNotices,
  fireBrowserNotice,
  markNoticeFired,
  readNoticePrefs,
  wasNoticeFired,
  writeNoticePrefs,
  type NoticePrefs,
} from './showroom-notices';
import './consult-alerts.css';

const REMINDER_KIND_LABEL: Record<DailyReminder['kind'], string> = {
  comida: 'Comida',
  agua: 'Agua',
  sueno: 'Descanso',
  consulta: 'Consulta',
};

export function ShowroomConsultAlerts({
  audience,
  alerts,
  reminders = [],
  patientId,
  onOpen,
  onManage,
  onOpenReminder,
  onOpenCare,
  defaultOpen = false,
  storage = typeof window === 'undefined' ? null : window.localStorage,
}: {
  audience: ConsultAlertAudience;
  alerts: ConsultAlert[];
  reminders?: DailyReminder[];
  patientId?: string;
  onOpen: (alert: ConsultAlert) => void;
  onManage?: (alert: ConsultAlert) => void;
  onOpenReminder?: (reminder: DailyReminder) => void;
  onOpenCare?: (notice: CareNotice) => void;
  defaultOpen?: boolean;
  storage?: Pick<Storage, 'getItem' | 'setItem'> | null;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [tick, setTick] = useState(0);
  const [prefs, setPrefs] = useState(() => readNoticePrefs(storage, audience));
  const [notices, setNotices] = useState<DemoNotice[]>([]);
  const care = useCareNotices(patientId ?? '', audience === 'pro');
  const visible = useMemo(() => visibleConsultAlerts(alerts, audience, storage), [alerts, audience, storage, tick]);
  const openReminders = useMemo(
    () => reminders.filter((reminder) => reminder.state !== 'done' && reminder.kind !== 'consulta' && !(care.hasPreferences && (reminder.kind === 'agua' || reminder.kind === 'sueno'))),
    [reminders, care.hasPreferences],
  );
  const badge = visible.length + openReminders.length + care.notices.length;
  const title = audience === 'patient' ? 'Avisos' : 'Avisos del consultorio';

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    api.listNotices(audience === 'patient' ? patientId : undefined).then((result) => {
      if (!cancelled) setNotices(result.notices);
    }).catch(() => {
      if (!cancelled) setNotices([]);
    });
    return () => { cancelled = true; };
  }, [open, audience, patientId, tick]);

  useEffect(() => {
    if (!prefs.browser) return;
    care.notices.forEach(notice => {
      if (wasNoticeFired(storage, notice.id)) return;
      if (fireBrowserNotice(audience === 'pro' ? 'Plan V · nuevo registro' : notice.title, audience === 'pro' ? 'Tenés registros pendientes en el consultorio.' : notice.detail)) markNoticeFired(storage, notice.id);
    });
    visible.filter((alert) => alert.urgency === 'soon').forEach((alert) => {
      if (wasNoticeFired(storage, alert.id)) return;
      const titleText = audience === 'patient' ? 'Consulta con Verónica' : `Consulta con ${alert.patientName}`;
      if (fireBrowserNotice(titleText, `${alert.whenLabel} · ${alert.channelLabel}`)) markNoticeFired(storage, alert.id);
    });
    openReminders.filter((reminder) => reminder.state === 'ahora').forEach((reminder) => {
      if (wasNoticeFired(storage, reminder.id)) return;
      if (fireBrowserNotice(REMINDER_KIND_LABEL[reminder.kind], reminder.detail)) markNoticeFired(storage, reminder.id);
    });
  }, [prefs.browser, visible, openReminders, audience, storage, care.notices]);

  useEffect(() => {
    if (!prefs.email || !patientId || !storage) return;
    openReminders.filter((reminder) => reminder.state === 'ahora').forEach((reminder) => {
      const id = `email:${reminder.id}`;
      if (wasNoticeFired(storage, id)) return;
      markNoticeFired(storage, id);
      api.enqueueReminderNotice({ patientId, title: REMINDER_KIND_LABEL[reminder.kind], detail: reminder.detail }).catch(() => undefined);
    });
  }, [prefs.email, openReminders, patientId, storage]);

  const dismiss = (alert: ConsultAlert) => {
    dismissConsultAlert(storage, audience, alert.id);
    setTick((value) => value + 1);
  };

  const persistServerPrefs = (next: NoticePrefs) => {
    if (!storage) return;
    void api.saveNotificationPrefs(
      { in_app: true, email: next.email, push: next.push },
      patientId,
      audience === 'pro' ? 'pro' : 'patient',
    ).catch(() => undefined);
  };

  const toggleBrowser = async () => {
    if (!prefs.browser) {
      const granted = await enableBrowserNotices();
      const next = { ...prefs, browser: granted };
      writeNoticePrefs(storage, audience, next);
      setPrefs(next);
      persistServerPrefs(next);
      return;
    }
    const next = { ...prefs, browser: false };
    writeNoticePrefs(storage, audience, next);
    setPrefs(next);
    persistServerPrefs(next);
  };

  const toggleEmail = () => {
    const next = { ...prefs, email: !prefs.email };
    writeNoticePrefs(storage, audience, next);
    setPrefs(next);
    persistServerPrefs(next);
  };

  const togglePush = () => {
    const next = { ...prefs, push: !prefs.push };
    writeNoticePrefs(storage, audience, next);
    setPrefs(next);
    persistServerPrefs(next);
  };

  return <div className="nv-alerts">
    <button type="button" className="nv-alerts-bell" aria-label={badge ? `${title}, ${badge} pendientes` : title} aria-expanded={open} aria-controls="nv-alerts-panel" onClick={() => setOpen((value) => !value)}>
      <Icon name="bell" size={19} />
      {badge > 0 && <b className="nv-tab-unread">{badge > 9 ? '9+' : badge}</b>}
    </button>
    {open && <div className="nv-alerts-pop" id="nv-alerts-panel" role="dialog" aria-label={title}>
      <header>
        <div><strong>{title}</strong><small>Consultas, comidas y hábitos publicados. El teléfono usa avisos de este navegador. Mail y push quedan encolados en el buzón demo; no salen a internet sin claves del proveedor.</small></div>
        <button type="button" aria-label="Cerrar avisos" onClick={() => setOpen(false)}>×</button>
      </header>
      <div className="nv-alerts-prefs">
        <label><input type="checkbox" checked={prefs.browser} disabled={!browserNoticesSupported()} onChange={() => { void toggleBrowser(); }} /> Avisos en este dispositivo</label>
        <label><input type="checkbox" checked={prefs.email} onChange={toggleEmail} /> Buzón demo por mail</label>
        <label><input type="checkbox" checked={prefs.push} onChange={togglePush} /> Push (sin proveedor, no se envía)</label>
      </div>
      {care.error && <p role="alert">No se pudieron actualizar los avisos de seguimiento: {care.error}</p>}
      {care.notices.length > 0 && <section className="nv-alerts-habits" aria-label="Avisos de seguimiento"><h3>{audience === 'pro' ? 'Registros de pacientes' : 'Tu seguimiento'}</h3><ul>{care.notices.map(notice => <li key={notice.id}><div><strong>{notice.patient_name ? `${notice.patient_name} · ` : ''}{notice.title}</strong><small>{notice.detail}</small></div>{onOpenCare && <div className="nv-alerts-actions"><NvButton onClick={() => { setOpen(false); onOpenCare(notice); }}>{audience === 'pro' ? 'Revisar registro' : 'Abrir'}</NvButton></div>}</li>)}</ul></section>}
      {visible.length ? <ul>{visible.map((alert) => <li key={alert.id}>
        <span className={`nv-alerts-urgency ${alert.urgency}`}>{alert.urgencyLabel}</span>
        <div>
          <strong>{audience === 'patient' ? 'Consulta con Verónica' : alert.patientName}</strong>
          <small>{alert.whenLabel} · {alert.channelLabel} · {alert.duration} min</small>
        </div>
        <div className="nv-alerts-actions">
          <NvButton onClick={() => { setOpen(false); onOpen(alert); }}>Ver agenda</NvButton>
          {audience === 'pro' && onManage && <NvButton className="nv-ghost" onClick={() => { setOpen(false); onManage(alert); }}>Gestionar</NvButton>}
          {alert.meetUrl && audience === 'patient' && <a href={alert.meetUrl} target="_blank" rel="noopener noreferrer">Abrir sala</a>}
          <NvButton className="nv-ghost" onClick={() => dismiss(alert)}>Listo</NvButton>
        </div>
      </li>)}</ul>
        : <p className="nv-alerts-empty">{audience === 'patient' ? 'No tenés consultas próximas en los próximos siete días.' : 'No hay consultas próximas en los próximos siete días.'}</p>}
      {openReminders.length > 0 && <section className="nv-alerts-habits" aria-label="Recordatorios de comidas y hábitos">
        <h3>Comidas y hábitos</h3>
        <ul>{openReminders.map((reminder) => <li key={reminder.id}>
          <span className={`nv-alerts-urgency ${reminder.state === 'ahora' || reminder.state === 'perdido' ? 'today' : 'week'}`}>{REMINDER_KIND_LABEL[reminder.kind]}</span>
          <div>
            <strong>{reminder.title}</strong>
            <small>{reminder.detail}{reminder.time ? ` · ${reminder.time}` : ''}</small>
          </div>
          {onOpenReminder && <div className="nv-alerts-actions"><NvButton className="nv-ghost" onClick={() => { setOpen(false); onOpenReminder(reminder); }}>Abrir</NvButton></div>}
        </li>)}</ul>
      </section>}
      {prefs.email && <section className="nv-alerts-outbox" aria-label="Buzón demo">
        <h3>Buzón demo</h3>
        {notices.length ? <ul>{notices.slice(0, 6).map((notice) => <li key={notice.id}>
          <strong>{notice.subject}</strong>
          <small>{notice.to} · no enviado a internet</small>
        </li>)}</ul> : <p className="nv-alerts-empty">Todavía no hay avisos en el buzón demo.</p>}
      </section>}
    </div>}
  </div>;
}

export function ConsultAlertStrip({
  audience,
  alerts,
  reminder,
  onOpen,
  onOpenReminder,
  storage = typeof window === 'undefined' ? null : window.localStorage,
}: {
  audience: ConsultAlertAudience;
  alerts: ConsultAlert[];
  reminder?: DailyReminder | null;
  onOpen: (alert: ConsultAlert) => void;
  onOpenReminder?: (reminder: DailyReminder) => void;
  storage?: Pick<Storage, 'getItem'> | null;
}) {
  const next = visibleConsultAlerts(alerts, audience, storage).find((alert) => alert.urgency === 'soon' || alert.urgency === 'today' || alert.urgency === 'tomorrow');
  if (next) {
    return <aside className="nv-alerts-strip" aria-label="Aviso de consulta">
      <span className="nv-icon-tile"><Icon name="bell" size={16} /></span>
      <div>
        <strong>{next.urgencyLabel}: {audience === 'patient' ? 'consulta con Verónica' : `consulta con ${next.patientName}`}</strong>
        <small>{next.whenLabel} · {next.channelLabel} · {next.duration} min</small>
      </div>
      <NvBadge tone={next.urgency === 'week' ? 'green' : 'gold'}>{next.urgencyLabel}</NvBadge>
      <NvButton className="nv-ghost" onClick={() => onOpen(next)}>Ver agenda</NvButton>
    </aside>;
  }
  if (!reminder || reminder.state === 'done') return null;
  return <aside className="nv-alerts-strip" aria-label="Recordatorio de hábitos">
    <span className="nv-icon-tile"><Icon name="bell" size={16} /></span>
    <div>
      <strong>{REMINDER_KIND_LABEL[reminder.kind]}: {reminder.title}</strong>
      <small>{reminder.detail}{reminder.time ? ` · ${reminder.time}` : ''}</small>
    </div>
    <NvBadge tone={reminder.state === 'proximo' ? 'green' : 'gold'}>{reminder.state === 'ahora' ? 'Ahora' : reminder.state === 'perdido' ? 'Pendiente' : 'Próximo'}</NvBadge>
    {onOpenReminder && <NvButton className="nv-ghost" onClick={() => onOpenReminder(reminder)}>Abrir</NvButton>}
  </aside>;
}
