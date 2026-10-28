// Contenido fijo de las cinco vistas de Ajustes (`ajV0` a `ajV4` de design/panel-nutri/v29/panel-trabajo.html)
// y los pequeños cálculos para enchufarles datos reales. Lo que la app todavía no guarda se muestra con cero o un texto corto.

export const SIN_COMPLETAR = 'Sin completar';

/** El campo «contacto» de la marca es un solo texto: si trae una arroba va a Mail, si no a Teléfono. */
export function separarContacto(contacto: string | null | undefined): { mail: string; telefono: string } {
  const texto = (contacto ?? '').trim();
  if (!texto) return { mail: SIN_COMPLETAR, telefono: SIN_COMPLETAR };
  return texto.includes('@') ? { mail: texto, telefono: SIN_COMPLETAR } : { mail: SIN_COMPLETAR, telefono: texto };
}

export type EstadoDosPasos = { texto: string; clase: 'p-conf' | 'p-wait' | 'p-ok'; activa: boolean };

export function estadoDosPasos(mfa: string): EstadoDosPasos {
  if (mfa === 'Activa') return { texto: 'Activa', clase: 'p-conf', activa: true };
  if (mfa === 'Apagada') return { texto: 'Apagada', clase: 'p-wait', activa: false };
  return { texto: mfa === 'Consultando…' ? 'Consultando' : 'Sin información', clase: 'p-ok', activa: false };
}

export const CANALES_AVISO = [
  ['in_app', 'En la app', 'las novedades aparecen dentro del panel'],
  ['email', 'Por mail', 'un mail por cada novedad'],
  ['push', 'Notificaciones push', 'en el celular, si la instalaste'],
] as const;
export type CanalAviso = (typeof CANALES_AVISO)[number][0];

export const GRUPOS_PLANTILLAS = ['Formulario', 'Certificado'] as const;

/** Avisos automáticos del boceto: nombre, cuándo se mandan y texto sugerido. Todavía no se prenden ni apagan desde Ajustes. */
export const AVISOS_AUTOMATICOS = [
  ['Recordatorio de turno', '24 h antes · le pide confirmar', 'Hola {nombre}, te espero mañana a las {hora}. ¿Me confirmás desde la app?'],
  ['Recordatorio de cuota', '3 días antes del vencimiento', 'Hola {nombre}, el {fecha} vence tu programa. Te dejo los datos para pagar en la app.'],
  ['Cuota vencida', 'Al día siguiente y a los 5 días', 'Hola {nombre}, quedó pendiente el pago del programa. Si ya lo hiciste, avisame y lo anoto.'],
  ['Bienvenida', 'Al darla de alta, con el cuestionario', '¡Bienvenida, {nombre}! Antes de la primera consulta completá el cuestionario de la app.'],
  ['Registrar comidas', 'Si no carga nada en 3 días', 'Hola {nombre}, hace unos días que no veo tus comidas. ¿Todo bien? Cargá lo que puedas.'],
  ['Pesarse antes de la consulta', 'El día anterior a las 8', 'Mañana tenemos consulta: si podés, pesate en ayunas y cargalo en la app.'],
  ['Felicitación por objetivo', 'Cuando llega a su meta', '¡Llegaste a tu objetivo, {nombre}! Es todo mérito tuyo.'],
  ['Cumpleaños', 'Ese día a las 9', '¡Feliz cumple, {nombre}! Que tengas un lindo día.'],
] as const;

export const REGLAS_DE_REGRESO = [
  ['Si no vuelve en 45 días', 'le mandamos un aviso para que reserve'],
  ['A los 3 meses del alta', 'control para ver cómo sigue'],
  ['Plan por vencer', 'te avisamos a vos 5 días antes'],
] as const;

/** Muestra el texto sugerido con datos de ejemplo, para la burbuja «Así le llega». */
export function textoDeEjemplo(texto: string): string {
  const ejemplo: Record<string, string> = { nombre: 'Sofía', hora: '10:30', fecha: '4/11' };
  return texto.replace(/\{(\w+)\}/g, (_, clave: string) => ejemplo[clave] ?? clave);
}

export type ClaveIntegracion = 'google' | 'mercadopago' | 'brevo' | 'balanzas';
export const INTEGRACIONES: ReadonlyArray<{ clave: ClaveIntegracion; titulo: string; texto: string; icono: 'cal' | 'coin' | 'send' | 'ruler'; puntos: readonly string[]; nota: string; pedido?: string }> = [
  { clave: 'google', titulo: 'Google Calendar y Meet', texto: 'Tus turnos en tu calendario y el link de Meet automático', icono: 'cal',
    puntos: ['Cada turno nuevo aparece en tu Google Calendar', 'Las videollamadas llevan su link de Meet', 'Si movés un turno, se actualiza solo'],
    nota: 'Mientras tanto: el link de la videollamada lo pegás vos en el turno.', pedido: 'Pide entrar con tu cuenta de Google.' },
  { clave: 'mercadopago', titulo: 'Mercado Pago', texto: 'Seña al reservar y turno liberado si no paga', icono: 'coin',
    puntos: ['La paciente paga la seña al reservar', 'Si no paga en 2 horas, el lugar se libera', 'Los pagos aparecen solos en Cobranzas'],
    nota: 'Mientras tanto: los pagos se cargan a mano en Cobranzas.', pedido: 'Pide entrar con tu cuenta de Mercado Pago. La plata va directo a tu cuenta.' },
  { clave: 'brevo', titulo: 'Mail (Brevo)', texto: 'Confirmaciones, recordatorios y avisos por mail', icono: 'send',
    puntos: ['Confirmación y recordatorio de turno por mail', 'Avisos de cuota por mail', 'Certificados y planes adjuntos por mail'],
    nota: 'Mientras tanto: todos los avisos llegan a la app.', pedido: 'Pide una clave de Brevo. La cargamos nosotros, nunca por el chat.' },
  { clave: 'balanzas', titulo: 'Balanzas InBody, Tanita y Omron', texto: 'Se cargan desde el informe en PDF o foto, sin conectar nada', icono: 'ruler',
    puntos: ['InBody 270, 570 y 770', 'Tanita con informe en PDF', 'Omron con foto del ticket'],
    nota: 'Cada valor se revisa y se confirma antes de guardarlo.' },
];
