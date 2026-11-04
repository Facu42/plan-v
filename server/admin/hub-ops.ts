import type { HubCanalEstado, HubPasoEstado, HubRiesgo, HubRiesgoMotivo } from '../../src/types/hub.js';
import { brevoConfig } from '../mail/brevo.js';
import { mailTransportConfig } from '../mail/transport.js';
import { sandboxCredentialBlock } from '../billing-platform/mp-platform.js';
import { whatsappConfig } from '../communications/provider.js';

export const RIESGO_DIAS_DEFAULT = 14;
export const TRABADA_DIAS = 7;
export const SEGUIMIENTO_DIAS = 3;
export const SEGUIMIENTO_TITULO = 'Escribirle en 3 días';

export function riesgoDias(env: NodeJS.ProcessEnv = process.env): number {
  const raw = Number(env.HUB_RIESGO_DIAS);
  if (!Number.isInteger(raw) || raw < 1 || raw > 90) return RIESGO_DIAS_DEFAULT;
  return raw;
}

export function sumarDias(today: string, days: number): string {
  const date = new Date(`${today}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function edadDias(iso: string | null, today: string): number | null {
  if (!iso) return null;
  const then = Date.parse(iso.length === 10 ? `${iso}T12:00:00Z` : iso);
  const now = Date.parse(`${today}T12:00:00Z`);
  if (Number.isNaN(then) || Number.isNaN(now)) return null;
  return Math.floor((now - then) / 86_400_000);
}

export function riesgosDe(input: {
  cuentas: Array<{ id: string; nombre: string; last_sign_in_at: string | null; created_at: string; patients_active: number; is_test: boolean }>;
  pagosRechazados: Set<string>;
  today: string;
  diasSinLogin?: number;
}): HubRiesgo[] {
  const limite = input.diasSinLogin ?? RIESGO_DIAS_DEFAULT;
  const rows: HubRiesgo[] = [];
  for (const cuenta of input.cuentas) {
    if (cuenta.is_test) continue;
    const sinEntrar = edadDias(cuenta.last_sign_in_at, input.today);
    const vida = edadDias(cuenta.created_at, input.today) ?? 0;
    if (sinEntrar == null || sinEntrar >= limite) {
      rows.push({
        nutritionist_id: cuenta.id,
        nombre: cuenta.nombre,
        motivo: 'sin_login',
        detalle: sinEntrar == null ? `Nunca entró. El límite es ${limite} días.` : `Hace ${sinEntrar} días que no entra.`,
      });
    }
    if (vida >= limite && cuenta.patients_active <= 1) {
      rows.push({
        nutritionist_id: cuenta.id,
        nombre: cuenta.nombre,
        motivo: 'pocos_pacientes',
        detalle: cuenta.patients_active === 0 ? 'No tiene pacientes activas.' : 'Tiene una sola paciente activa.',
      });
    }
    if (input.pagosRechazados.has(cuenta.id)) {
      rows.push({
        nutritionist_id: cuenta.id,
        nombre: cuenta.nombre,
        motivo: 'pago_rechazado',
        detalle: 'Mercado Pago rechazó un cobro.',
      });
    }
  }
  return rows;
}

export function ltvRealizado(input: {
  disponible: boolean;
  pagos: Array<{ nutritionist_id: string | null; status: string; amount_cents: number }>;
}): { pesos: number | null; nutris: number | null; nota: string } {
  if (!input.disponible) {
    return { pesos: null, nutris: null, nota: 'No se pudieron leer los pagos. No mostramos un valor de vida inventado.' };
  }
  const aprobados = input.pagos.filter((row) => row.status === 'approved' && row.nutritionist_id);
  const porNutri = new Map<string, number>();
  for (const row of aprobados) {
    const id = row.nutritionist_id as string;
    porNutri.set(id, (porNutri.get(id) ?? 0) + row.amount_cents);
  }
  if (porNutri.size === 0) {
    return { pesos: 0, nutris: 0, nota: 'No hay pagos aprobados. El valor de vida realizado es cero.' };
  }
  const total = [...porNutri.values()].reduce((sum, cents) => sum + cents, 0);
  return {
    pesos: Math.round(total / porNutri.size / 100),
    nutris: porNutri.size,
    nota: 'Suma de lo cobrado y aprobado, repartida entre las nutris que pagaron al menos una vez. No es una proyección.',
  };
}

export type PasoActivacion = {
  id: 'perfil' | 'paciente' | 'plan' | 'cobro' | 'pagina';
  label: string;
  estado: HubPasoEstado;
};

export function evaluarActivacion(input: {
  nombre: string;
  pacientes: number;
  planes: boolean | null;
  cobro: boolean | null;
  pagina: boolean | null;
  creada: string;
  today: string;
}): { pasos: PasoActivacion[]; trabada: boolean } {
  const pasos: PasoActivacion[] = [
    { id: 'perfil', label: 'Perfil', estado: input.nombre.trim().length >= 2 ? 'hecho' : 'pendiente' },
    { id: 'paciente', label: 'Primer paciente', estado: input.pacientes > 0 ? 'hecho' : 'pendiente' },
    { id: 'plan', label: 'Primer plan', estado: input.planes == null ? 'sin_dato' : input.planes ? 'hecho' : 'pendiente' },
    { id: 'cobro', label: 'Cobro', estado: input.cobro == null ? 'sin_dato' : input.cobro ? 'hecho' : 'pendiente' },
    { id: 'pagina', label: 'Página pública', estado: input.pagina == null ? 'sin_dato' : input.pagina ? 'hecho' : 'pendiente' },
  ];
  const vida = edadDias(input.creada, input.today) ?? 0;
  const trabada = vida >= TRABADA_DIAS && pasos.some((paso) => paso.estado === 'pendiente');
  return { pasos, trabada };
}

export function seguimientoSiCambia(stage: string | undefined): { title: string; days: number } | null {
  if (stage !== 'demo' && stage !== 'trial' && stage !== 'paga') return null;
  return { title: SEGUIMIENTO_TITULO, days: SEGUIMIENTO_DIAS };
}

export function resumenDeNumeros(input: {
  altas: number;
  churn: number;
  trialsPorVencer: number;
  riesgos: number;
  pagosFallidos: number | null;
  mrr: number | null;
}): { origen: 'numeros'; texto: string; acciones: string[]; nota: string } {
  const mrr = input.mrr == null ? 'el ingreso recurrente no se pudo leer' : `el ingreso recurrente es de ${input.mrr} pesos`;
  const pagos = input.pagosFallidos == null ? 'Los pagos rechazados no se pudieron leer.' : `Hay ${input.pagosFallidos} pagos rechazados.`;
  const acciones: string[] = [];
  if (input.trialsPorVencer > 0) acciones.push('Escribir a las pruebas que vencen en 7 días.');
  if ((input.pagosFallidos ?? 0) > 0) acciones.push('Revisar los cobros rechazados y avisar.');
  if (input.riesgos > 0) acciones.push('Mirar las cuentas con riesgo de baja.');
  if (acciones.length === 0) acciones.push('No hay un pendiente urgente con los datos que sí se leyeron.');
  return {
    origen: 'numeros',
    texto: `Hoy ${mrr}. Entraron ${input.altas} cuentas nuevas y se fueron ${input.churn}. ${pagos}`,
    acciones,
    nota: 'Este texto sale de los números del día. Si la IA está encendida, lo reescribe y queda marcado.',
  };
}

export function borradorPlantilla(texto: string): string {
  const recorte = texto.replace(/\s+/g, ' ').trim().slice(0, 80);
  return recorte
    ? `Gracias por escribirnos. Vimos tu mensaje («${recorte}»). Te respondemos por acá.`
    : 'Gracias por escribirnos. Te respondemos por acá.';
}

export function estadoWhatsApp(env: NodeJS.ProcessEnv = process.env): { estado: HubCanalEstado; detalle: string } {
  const config = whatsappConfig(env);
  if (!config) return { estado: 'apagado', detalle: 'Faltan WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_ID o WHATSAPP_BUSINESS_ID.' };
  if (!config.enabled) return { estado: 'apagado', detalle: 'Está cargado, pero apagado. Hace falta WHATSAPP_ENABLED=true, WHATSAPP_APP_SECRET y WHATSAPP_VERIFY_TOKEN.' };
  return { estado: 'listo', detalle: 'Cloud API lista para recibir y responder. Nada sale solo.' };
}

export function estadoMail(env: NodeJS.ProcessEnv = process.env): { estado: HubCanalEstado; detalle: string } {
  const sale = Boolean(brevoConfig(env) || mailTransportConfig(env));
  const entra = Boolean(env.HUB_INBOX_EMAIL_SECRET?.trim());
  if (sale && entra) return { estado: 'listo', detalle: 'Se puede responder y recibir en el webhook del centro.' };
  if (sale) return { estado: 'apagado', detalle: 'El envío está listo. Falta HUB_INBOX_EMAIL_SECRET para los mails que entran.' };
  if (entra) return { estado: 'apagado', detalle: 'El webhook de entrada está listo. Falta Brevo o el mail operativo para responder.' };
  return { estado: 'apagado', detalle: 'Faltan las credenciales de salida y HUB_INBOX_EMAIL_SECRET.' };
}

export function estadoInstagram(): { estado: HubCanalEstado; detalle: string } {
  return { estado: 'preparado', detalle: 'El conector queda preparado. Instagram todavía no lee ni envía mensajes.' };
}

export function mailListo(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(brevoConfig(env) || mailTransportConfig(env));
}

export function releerListo(env: NodeJS.ProcessEnv = process.env): boolean {
  return sandboxCredentialBlock(env.MP_PLATFORM_ACCESS_TOKEN, env) == null;
}

export const MOTIVO_LABEL: Record<HubRiesgoMotivo, string> = {
  sin_login: 'Sin entrar',
  pocos_pacientes: 'Pocas pacientes',
  pago_rechazado: 'Pago rechazado',
};
