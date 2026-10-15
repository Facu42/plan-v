import { addDays, SERVICE_GRACE_DAYS, SERVICE_SOON_DAYS } from '../../service';
import { formatFeeDate, formatPesos } from '../../fees';
import type { OwnService } from '../../types/service';

export type ServiceNoticeText = { tone: 'info' | 'warning' | 'blocked'; title: string; body: string };

const left = (days: number) => days === 0 ? 'vence hoy' : days === 1 ? 'falta 1 día' : `faltan ${days} días`;

/** Aviso para la nutricionista sobre su propio servicio. `null` cuando no hay nada que avisar. */
export function serviceNoticeText(service: OwnService | null): ServiceNoticeText | null {
  if (!service) return null;
  const price = service.monthly_price ? ` El servicio cuesta ${formatPesos(service.monthly_price)} por mes.` : '';
  const pay = ` Coordiná el pago con Plan V.${price}`;
  const until = service.until ? formatFeeDate(service.until) : '';
  const days = service.days_left ?? 0;
  if (service.state === 'suspendida') return { tone: 'blocked', title: 'Cuenta en solo lectura', body: 'Tu cuenta de Plan V está suspendida: podés ver todo, pero no cargar ni cambiar nada. Escribile a Plan V para reactivarla.' };
  if (service.state === 'cortada') return { tone: 'blocked', title: 'Cuenta en solo lectura', body: `Tu servicio venció el ${until}: podés ver todo, pero no cargar ni cambiar nada hasta renovarlo.${pay}` };
  if (service.state === 'vencida' && service.until) {
    const last = formatFeeDate(addDays(service.until, SERVICE_GRACE_DAYS));
    return { tone: 'warning', title: 'Servicio vencido', body: `Tu servicio venció el ${until}. Si no se renueva antes del ${last}, la cuenta queda en solo lectura: vas a ver todo, pero sin cargar ni cambiar nada.${pay}` };
  }
  if (service.state === 'prueba' && days <= SERVICE_SOON_DAYS) return { tone: 'info', title: 'Tu prueba termina pronto', body: `La prueba gratis de Plan V termina el ${until} (${left(days)}).${pay}` };
  if (service.state === 'por_vencer') return { tone: 'info', title: 'Tu servicio vence pronto', body: `Tu servicio de Plan V vence el ${until} (${left(days)}).${pay}` };
  return null;
}
