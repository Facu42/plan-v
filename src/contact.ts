/**
 * Contacto comercial de Nutridash. Desde el 5/11/2026 las nutricionistas no se dan de alta solas:
 * escriben por WhatsApp y la cuenta la crea Nutridash desde el panel del administrador.
 */
/** Número de WhatsApp de Nutridash en formato internacional, solo dígitos (ej. 5493511234567). */
export const NUTRIDASH_WHATSAPP = '';

export const NUTRI_SIGNUP_MESSAGE = 'Hola, soy nutricionista y quiero usar Nutridash en mi consultorio.';

/** Enlace que abre el chat con el mensaje ya escrito. Sin número cargado, abre WhatsApp para elegir el contacto. */
export function nutriSignupWhatsappUrl(phone: string = NUTRIDASH_WHATSAPP): string {
  const digits = phone.replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(NUTRI_SIGNUP_MESSAGE)}`;
}
