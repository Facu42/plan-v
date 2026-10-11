export const CRM_WORK_KINDS = ['intake', 'meal', 'ai_menu', 'message', 'payment', 'appointment', 'record'] as const;
export type CrmWorkKind = (typeof CRM_WORK_KINDS)[number];

/** Metadata de trabajo: no incluye notas clínicas, textos, archivos ni borradores. */
export type CrmWorkItem = {
  id: string;
  kind: CrmWorkKind;
  patient_id: string;
  patient_name: string;
  status: string;
  updated_at: string;
  href: string;
  title: string;
  period?: { start: string; end: string };
};

export type CrmWorkQuery = {
  patient_id?: string;
  kind?: CrmWorkKind;
  cursor?: string;
  limit?: number;
};

export type CrmWorkResponse = {
  items: CrmWorkItem[];
  next_cursor: string | null;
  /** Total del filtro combinado de paciente y tipo, antes de paginar. */
  total: number;
  /** Contadores del paciente elegido o del consultorio completo, antes del filtro de tipo. */
  counts: Record<CrmWorkKind, number>;
  source: 'memory' | 'supabase';
};
