import { z } from 'zod';

/** Plantillas de formularios y certificados, y avisos automáticos de Ajustes (pestañas Plantillas y Avisos). */
export const TEMPLATE_KINDS = ['Formulario', 'Certificado'] as const;
export const TEMPLATE_WHEN = ['Se manda desde la ficha', 'Al reservar el primer turno', 'Antes de cada turno', 'Cada domingo a las 19'] as const;
export const CERTIFICATE_VARIABLES = ['nombre', 'dni', 'fecha', 'hora_inicio', 'hora_fin', 'tipo_de_dieta', 'especialidad', 'motivo'] as const;

const templateBase = { id: z.uuid(), name: z.string().trim().min(2).max(80), when_text: z.enum(TEMPLATE_WHEN) };
export const templateInputSchema = z.discriminatedUnion('kind', [
  z.object({ ...templateBase, kind: z.literal('Formulario'), questions: z.array(z.string().trim().min(2).max(200)).min(1).max(30) }).strict(),
  z.object({ ...templateBase, kind: z.literal('Certificado'), text: z.string().trim().min(10).max(1200) }).strict(),
]);
export type TemplateInput = z.infer<typeof templateInputSchema>;
export type TemplateView = TemplateInput & { updated_at: string };

export const NOTICE_KEYS = [
  'turno_recordatorio', 'cuota_recordatorio', 'cuota_vencida', 'bienvenida', 'registrar_comidas', 'pesarse', 'objetivo', 'cumple',
  'regreso_45', 'regreso_alta_3m', 'plan_por_vencer',
] as const;
export type NoticeKey = typeof NOTICE_KEYS[number];
export const noticeSaveSchema = z.object({
  key: z.enum(NOTICE_KEYS),
  enabled: z.boolean(),
  when_text: z.string().trim().min(3).max(120).nullable(),
  message: z.string().trim().min(5).max(500).nullable(),
}).strict();
export type NoticeSave = z.infer<typeof noticeSaveSchema>;
export type NoticeView = NoticeSave & { updated_at: string };

/** Variables que se completan solas en el texto de un certificado. */
export function certificateVariables(text: string): string[] {
  return [...new Set([...text.matchAll(/\{(\w+)\}/g)].map(m => m[1]))];
}
