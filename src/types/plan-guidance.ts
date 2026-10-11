import { z } from 'zod';
export const planGuidanceSchema = z
  .object({
    recommendations: z.array(z.string().trim().min(1).max(500)).max(100),
    avoid: z.array(z.string().trim().min(1).max(500)).max(100),
  })
  .strict();
export type PlanGuidance = z.infer<typeof planGuidanceSchema>;
export const emptyGuidance = (): PlanGuidance => ({
  recommendations: [],
  avoid: [],
});
export function mergeGuidance(
  current: PlanGuidance | undefined,
  kind: 'recommendations' | 'avoid',
  lines: string[],
): PlanGuidance {
  const result = structuredClone(current ?? emptyGuidance());
  const key = (line: string) =>
    line.trim().replace(/\s+/g, ' ').toLocaleLowerCase('es-AR');
  const seen = new Set(result[kind].map(key));
  for (const line of lines)
    if (!seen.has(key(line))) {
      result[kind].push(line.trim());
      seen.add(key(line));
    }
  return planGuidanceSchema.parse(result);
}
