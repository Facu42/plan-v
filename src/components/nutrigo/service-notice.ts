import { formatFeeDate, formatPesos } from '../../fees';
import type { OwnService } from '../../types/service';

export type ServiceNoticeAction = { label: string; href: string };
export type ServiceNoticeText = { tone: 'info' | 'warning' | 'blocked'; title: string; body: string; action?: ServiceNoticeAction };

export const SERVICE_PAY_ACTION: ServiceNoticeAction = { label: 'Pagar', href: '/crm/ajustes' };

const left = (days: number) => days === 0 ? 'vence hoy' : days === 1 ? 'falta 1 día' : `faltan ${days} días`;

function leftoverTitle(days: number): string {
  if (days === 0) return 'Hoy vence el plazo para regularizar';
  if (days === 1) return 'Te queda 1 día para regularizar';
  return `Te quedan ${days} días para regularizar`;
}

/** Aviso para la nutricionista sobre su propio servicio. `null` cuando no hay nada que avisar. */
export function serviceNoticeText(service: OwnService | null): ServiceNoticeText | null {
  if (!service) return null;
  const price = service.monthly_price ? ` El servicio cuesta ${formatPesos(service.monthly_price)} por mes.` : '';
  const pay = ` Coordiná el pago con Nutridash.${price}`;
  const until = service.until ? formatFeeDate(service.until) : '';
  const days = service.days_left ?? 0;
  if (service.state === 'suspendida') return { tone: 'blocked', title: 'Cuenta en solo lectura', body: 'Tu cuenta de Nutridash está suspendida: podés ver todo, pero no cargar ni cambiar nada. Escribile a Nutridash para reactivarla.' };
  if ((service.state === 'vencida' || service.state === 'cortada') && service.until) {
    return { tone: 'warning', title: 'Servicio vencido', body: `Tu servicio de Nutridash venció el ${until}.${pay}`, action: SERVICE_PAY_ACTION };
  }
  if (service.state === 'prueba') {
    return {
      tone: days <= 7 ? 'warning' : 'info',
      title: leftoverTitle(days),
      body: until
        ? `La prueba de Nutridash termina el ${until} (${left(days)}). Podés seguir trabajando. Coordiná el pago con Nutridash.${price}`
        : `Podés seguir trabajando. Coordiná el pago con Nutridash.${price}`,
      action: SERVICE_PAY_ACTION,
    };
  }
  if (service.state === 'por_vencer') return { tone: 'info', title: 'Tu servicio vence pronto', body: `Tu servicio de Nutridash vence el ${until} (${left(days)}).${pay}`, action: SERVICE_PAY_ACTION };
  return null;
}
