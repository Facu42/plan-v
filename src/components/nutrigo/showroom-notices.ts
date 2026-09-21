import type { ConsultAlertAudience } from './consult-alerts';

export type NoticePrefs = { browser: boolean; email: boolean; push: boolean };

const DEFAULT_PREFS: NoticePrefs = { browser: false, email: false, push: false };

export function noticePrefsKey(audience: ConsultAlertAudience) {
  return `plan-v:notice-prefs:${audience}`;
}

export function noticeFiredKey(id: string) {
  return `plan-v:notice-fired:${id}`;
}

export function readNoticePrefs(storage: Pick<Storage, 'getItem'> | null, audience: ConsultAlertAudience): NoticePrefs {
  const raw = storage?.getItem(noticePrefsKey(audience));
  if (!raw) return DEFAULT_PREFS;
  try {
    const parsed = JSON.parse(raw) as Partial<NoticePrefs>;
    return { browser: Boolean(parsed.browser), email: Boolean(parsed.email), push: Boolean(parsed.push) };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function writeNoticePrefs(storage: Pick<Storage, 'setItem'> | null, audience: ConsultAlertAudience, prefs: NoticePrefs) {
  storage?.setItem(noticePrefsKey(audience), JSON.stringify(prefs));
}

export function wasNoticeFired(storage: Pick<Storage, 'getItem'> | null, id: string) {
  return storage?.getItem(noticeFiredKey(id)) === '1';
}

export function markNoticeFired(storage: Pick<Storage, 'setItem'> | null, id: string) {
  storage?.setItem(noticeFiredKey(id), '1');
}

export function browserNoticesSupported() {
  return typeof Notification !== 'undefined';
}

export async function enableBrowserNotices(): Promise<boolean> {
  if (!browserNoticesSupported()) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  return (await Notification.requestPermission()) === 'granted';
}

export function fireBrowserNotice(title: string, body: string) {
  if (!browserNoticesSupported() || Notification.permission !== 'granted') return false;
  try {
    new Notification(title, { body });
    return true;
  } catch {
    return false;
  }
}
