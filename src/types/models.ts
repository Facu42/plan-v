import { z } from 'zod';
import type { PlanItemView, PlanVersionView } from './plans.js';
import { componentGrams } from './plan-components.js';
export const MODEL_KINDS = ['plan', 'recommendations', 'avoid'] as const;
export type ModelKind = (typeof MODEL_KINDS)[number];
export const MODEL_LABELS: Record<ModelKind, string> = {
  plan: 'Planes modelo',
  recommendations: 'Recomendaciones',
  avoid: 'Alimentos a evitar',
};
export const modelSaveSchema = z
  .object({
    id: z.uuid(),
    expected_revision: z.uuid().nullable(),
    kind: z.enum(MODEL_KINDS),
    title: z.string().trim().min(1).max(160),
    description: z.string().trim().max(400),
    lines: z.array(z.string().trim().min(1).max(500)).max(50).default([]),
    source: z
      .object({
        patient_id: z.string().min(1).max(80),
        version: z.number().int().positive(),
        revision: z.uuid(),
      })
      .strict()
      .optional(),
    overrides: z
      .array(
        z
          .object({
            index: z.number().int().min(0).max(41),
            public_note: z.string().trim().max(200),
            portions: z.number().finite().positive().max(50).optional(),
            notes: z
              .array(
                z
                  .object({
                    id: z.uuid(),
                    public_note: z.string().trim().max(200),
                  })
                  .strict(),
              )
              .max(12)
              .default([]),
            amounts: z
              .array(
                z
                  .object({
                    id: z.uuid(),
                    quantity: z.number().finite().positive().max(100000),
                  })
                  .strict(),
              )
              .max(12)
              .default([]),
          })
          .strict(),
      )
      .max(42)
      .default([]),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (
      (v.kind === 'plan' && v.lines.length) ||
      (v.kind !== 'plan' && (v.source || v.overrides.length))
    )
      ctx.addIssue({
        code: 'custom',
        message: 'Revisá la categoría y el contenido.',
      });
    if (new Set(v.overrides.map((o) => o.index)).size !== v.overrides.length)
      ctx.addIssue({ code: 'custom', message: 'Hay indicaciones repetidas.' });
    for (const edit of v.overrides) {
      if (new Set(edit.notes.map((a) => a.id)).size !== edit.notes.length)
        ctx.addIssue({ code: 'custom', message: 'Hay notas repetidas.' });
      if (new Set(edit.amounts.map((a) => a.id)).size !== edit.amounts.length)
        ctx.addIssue({ code: 'custom', message: 'Hay cantidades repetidas.' });
    }
  });
export type ModelSaveInput = z.infer<typeof modelSaveSchema>;
export type ModelPlanItem = Omit<
  PlanItemView,
  'id' | 'for_date' | 'dish_card'
> & { day: number };
export type ModelCopy = {
  version: number;
  title: string;
  description: string;
  lines: string[];
  plan?: { days: number; items: ModelPlanItem[] };
  published_at: string | null;
};
export type ProfessionalModel = {
  id: string;
  kind: ModelKind;
  revision: string;
  current: ModelCopy;
  published: ModelCopy | null;
  archived_at: string | null;
  updated_at: string;
};
export function modelPlanFrom(
  version: PlanVersionView,
): NonNullable<ModelCopy['plan']> {
  const start = Date.parse(`${version.period_start}T12:00:00Z`);
  return {
    days:
      (Date.parse(`${version.period_end}T12:00:00Z`) - start) / 86400000 + 1,
    items: version.items.map(
      ({ id: _id, for_date, dish_card: _card, ...item }) => ({
        ...structuredClone(item),
        day: (Date.parse(`${for_date}T12:00:00Z`) - start) / 86400000 + 1,
      }),
    ),
  };
}
export function applyModelOverrides(
  plan: NonNullable<ModelCopy['plan']>,
  overrides: ModelSaveInput['overrides'],
) {
  const copy = structuredClone(plan);
  for (const edit of overrides) {
    const item = copy.items[edit.index];
    if (!item)
      throw new Error('La indicación del modelo cambió. Volvé a abrirlo.');
    item.public_note = edit.public_note;
    for (const note of edit.notes) {
      const component = item.components?.find((c) => c.id === note.id);
      if (!component) throw new Error('El componente del modelo cambió.');
      component.public_note = note.public_note;
    }
    if (edit.portions != null) {
      if (item.components || item.portions == null)
        throw new Error('Esta indicación no tiene porciones.');
      item.portions = edit.portions;
    }
    for (const amount of edit.amounts) {
      const component = item.components?.find((c) => c.id === amount.id);
      if (!component) throw new Error('El componente del modelo cambió.');
      if (component.kind === 'food') {
        component.quantity = amount.quantity;
        if (componentGrams(component) === null)
          throw new Error('Revisá los gramos de la medida elegida.');
      } else if (component.kind === 'recipe' || component.recipe_proposal) {
        if (amount.quantity > 50) throw new Error('Revisá las porciones.');
        component.portions = amount.quantity;
      } else throw new Error('Esta indicación no tiene cantidades.');
    }
  }
  return copy;
}
export function modelReady(copy: ModelCopy, kind: ModelKind) {
  return Boolean(kind === 'plan' ? copy.plan?.items.length : copy.lines.length);
}
