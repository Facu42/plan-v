import { SERVICE_SOON_DAYS } from '../../service';
import { formatFeeDate, formatPesos } from '../../fees';
import type { OwnService } from '../../types/service';

export type ServiceNoticeText = { tone: 'info' | 'warning' | 'blocked'; title: string; body: string };

const left = (days: number) => days === 0 ? 'vence hoy' : days === 1 ? 'falta 1 día' : `faltan ${days} días`;

/** Aviso para la nutricionista sobre su propio servicio. `null` cuando no hay nada que avisar. */
export function serviceNoticeText(service: OwnService | null): ServiceNoticeText | null {
  if (!service) return null;
  const price = service.monthly_price ? ` El servicio cuesta ${formatPesos(service.monthly_price)} por mes.` : '';
  const pay = ` Coordiná el pago con Nutridash.${price}`;
  const until = service.until ? formatFeeDate(service.until) : '';
  const days = service.days_left ?? 0;
  if (service.state === 'suspendida') return { tone: 'blocked', title: 'Cuenta en solo lectura', body: 'Tu cuenta de Nutridash está suspendida: podés ver todo, pero no cargar ni cambiar nada. Escribile a Nutridash para reactivarla.' };
  // Vencer no corta nada: solo se avisa. El solo lectura lo decide el administrador suspendiendo la cuenta.
  if ((service.state === 'vencida' || service.state === 'cortada') && service.until) {
    return { tone: 'warning', title: 'Servicio vencido', body: `Tu servicio de Nutridash venció el ${until}.${pay}` };
  }
  if (service.state === 'prueba' && days <= SERVICE_SOON_DAYS) return { tone: 'info', title: 'Tu prueba termina pronto', body: `La prueba gratis de Nutridash termina el ${until} (${left(days)}).${pay}` };
  if (service.state === 'por_vencer') return { tone: 'info', title: 'Tu servicio vence pronto', body: `Tu servicio de Nutridash vence el ${until} (${left(days)}).${pay}` };
  return null;
}
