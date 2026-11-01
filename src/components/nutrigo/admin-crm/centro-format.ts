import { SERVICE_STATE_LABELS, type ServiceState } from '../../../service';

export function money(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—';
  return `$ ${new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(n)}`;
}

export function num(n: number | null | undefined): string {
  return new Intl.NumberFormat('es-AR').format(n ?? 0);
}

export function dateShort(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return 'nunca';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '—';
  const diff = Math.max(0, Date.now() - then);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'ahora';
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'ayer';
  if (days < 7) return `hace ${days} días`;
  return dateShort(iso);
}

export function stateLabel(state: ServiceState): string {
  return SERVICE_STATE_LABELS[state];
}

export function stateBadge(state: ServiceState): string {
  if (state === 'activa' || state === 'sin_cargo') return 'is-green';
  if (state === 'prueba' || state === 'por_vencer' || state === 'vencida') return 'is-gold';
  if (state === 'cortada' || state === 'suspendida') return 'is-coral';
  return '';
}

export function greeting(name?: string): string {
  const hour = new Date().getHours();
  const hello = hour < 13 ? 'Buen día' : hour < 20 ? 'Buenas tardes' : 'Buenas noches';
  const who = (name || 'equipo').trim().split(/\s+/)[0];
  return `${hello}, ${who}.`;
}

export function todayLabel(): string {
  const text = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] || '').join('').toUpperCase() || '?';
}

const COLORS = ['#1d7a51', '#5b8fa8', '#b3588f', '#d18b3f', '#6b7f74', '#8a7bb8', '#c05f43', '#3f7d6b'];
export function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) % 997;
  return COLORS[hash % COLORS.length];
}

export function sparkline(values: number[], color = '#1d7a51', width = 66, height = 24): string {
  if (!values.length) return '';
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const points = values.map((value, index) => {
    const x = (index / Math.max(1, values.length - 1)) * (width - 2) + 1;
    const y = height - 2 - ((value - min) / span) * (height - 4);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" aria-hidden="true"><polyline points="${points.join(' ')}" stroke="${color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
