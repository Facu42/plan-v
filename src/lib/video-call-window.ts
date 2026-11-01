/** Desde 10 minutos antes del turno hasta que termina. */
export const VIDEO_CALL_LEAD_MIN = 10;

export function inVideoCallWindow(now: Date, startsAt: Date, durationMin: number, leadMin = VIDEO_CALL_LEAD_MIN) {
  if (!Number.isFinite(startsAt.getTime()) || durationMin <= 0) return false;
  const at = now.getTime();
  return at >= startsAt.getTime() - leadMin * 60_000 && at < startsAt.getTime() + durationMin * 60_000;
}

const WEEK = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] as const;

/** Hora real del turno. Si hoy es ese día, no salta a la semana que viene aunque ya haya empezado. */
export function appointmentStart(appointment: { when?: string; starts_at?: string } | null, now: Date): Date | null {
  if (!appointment) return null;
  if (appointment.starts_at) {
    const parsed = Date.parse(appointment.starts_at);
    if (Number.isFinite(parsed)) return new Date(parsed);
  }
  const [day = '', time = ''] = (appointment.when ?? '').split(' · ');
  if (!WEEK.includes(day as typeof WEEK[number]) || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) return null;
  const [hours, minutes] = time.split(':').map(Number);
  const target = WEEK.indexOf(day as typeof WEEK[number]);
  const today = (now.getDay() + 6) % 7;
  if (target === today) return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
  let delta = (target - today + 7) % 7;
  if (delta === 0) delta = 7;
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + delta, hours, minutes);
}

export function argentinaStart(day: string, startMin: number): Date {
  const hours = Math.floor(startMin / 60);
  const minutes = startMin % 60;
  return new Date(`${day}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00-03:00`);
}
