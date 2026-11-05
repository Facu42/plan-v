// Contratos del medidor de IA entre el servidor y las pantallas (Ajustes de la nutri y panel del administrador).

export type UsageLevel = 'ok' | 'near' | 'over';

/** Lo único que ve la nutri en Ajustes: un porcentaje y cuándo se renueva. Sin créditos ni modelos. */
export type NutritionistAiUsageView = { month: string; percent: number; level: UsageLevel; renews_on: string };

export type AdminNutriUsage = {
  nutritionist_id: string; name: string; plan_code: string | null; organization: string | null;
  credits: number; allowance: number; percent: number; calls: number; cost_usd_micros: number;
  by_feature: Array<{ feature: string; label: string; calls: number; cost_usd_micros: number }>;
};
export type AdminOrgUsage = { organization: string; nutris: number; credits: number; allowance: number; percent: number; cost_usd_micros: number };
export type AdminAiUsage = {
  month: string;
  totals: { calls: number; credits: number; cost_usd_micros: number; unassigned_cost_usd_micros: number };
  nutris: AdminNutriUsage[];
  consultorios: AdminOrgUsage[];
  features: Array<{ feature: string; label: string; calls: number; cost_usd_micros: number }>;
};

export type AiModelSetting = {
  feature: string; model: string; input_usd_per_mtok: number; output_usd_per_mtok: number; updated_by: string; updated_at: string;
};
export type AiModelOption = { model: string; label: string; input_usd_per_mtok: number; output_usd_per_mtok: number; note: string };
export type AiModelBoard = {
  features: Array<{ feature: string; label: string; current: AiModelSetting | null }>;
  options: AiModelOption[];
};
export type AiModelInput = { model: string; input_usd_per_mtok: number; output_usd_per_mtok: number };
