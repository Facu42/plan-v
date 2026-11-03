import type { CentroAlerta, CentroCobros } from './centro';
import type { ServiceState } from '../service';

/** Estado comercial de la cuenta, aparte del detalle interno del servicio. */
export type HubCrmEstado = 'trial' | 'activa' | 'morosa' | 'baja';

export type HubPlanCodigo = 'arranque' | 'pro' | 'consultorio' | 'prueba' | null;

export type HubHealth = {
  total: number;
  uso: number;
  pacientes: number;
  pago: number;
};

export type HubNutri = {
  id: string;
  display_name: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  is_test: boolean;
  patients_active: number;
  patients_total: number;
  state: ServiceState;
  until: string | null;
  days_left: number | null;
  crm: HubCrmEstado;
  plan: string;
  plan_code: HubPlanCodigo;
  health: HubHealth;
};

export type HubNota = {
  id: string;
  nutritionist_id: string;
  body: string;
  created_at: string;
};

export type HubTarea = {
  id: string;
  nutritionist_id: string;
  title: string;
  due_on: string | null;
  done: boolean;
  created_at: string;
};

export type HubTimelineItem = {
  id: string;
  at: string;
  title: string;
  detail: string;
};

export type HubFicha = {
  nutri: HubNutri;
  timeline: HubTimelineItem[];
  notas: HubNota[];
  tareas: HubTarea[];
  notas_disponibles: boolean;
  nota_vacia: string;
};

export type HubRiesgoMotivo = 'sin_login' | 'pocos_pacientes' | 'pago_rechazado';

export type HubRiesgo = {
  nutritionist_id: string;
  nombre: string;
  motivo: HubRiesgoMotivo;
  detalle: string;
};

export type HubResumenDia = {
  origen: 'numeros' | 'ia';
  texto: string;
  acciones: string[];
  nota: string;
};

export type HubInicio = {
  mrr_pesos: number;
  mrr_nota: string;
  cobrado_mes_pesos: number;
  cobrado_nota: string;
  trials_activos: number;
  trials_por_vencer: number;
  churn_mes: number;
  altas_nuevas: number;
  alertas: CentroAlerta[];
  riesgos?: HubRiesgo[];
  resumen?: HubResumenDia;
};

export type HubLeadStage = 'lead' | 'demo' | 'trial' | 'paga' | 'baja';
export type HubLeadSource = 'ig' | 'wa' | 'web' | 'referido' | 'email';

export type HubLead = {
  id: string;
  name: string;
  contact: string;
  source: HubLeadSource;
  stage: HubLeadStage;
  next_step: string;
  nutritionist_id: string | null;
  created_at: string;
  updated_at: string;
};

export type HubSuscripcion = {
  id: string;
  nutritionist_id: string;
  plan: string;
  ciclo: 'mensual' | 'anual';
  estado: string;
  monto_pesos: number;
  vence: string | null;
  mail: string;
};

export type HubPagoMp = {
  id: string;
  monto_pesos: number;
  estado: string;
  cuando: string | null;
};

export type HubFacturacion = {
  suscripciones_disponibles: boolean;
  suscripciones_nota: string;
  suscripciones: HubSuscripcion[];
  webhooks_disponibles: boolean;
  webhooks_ok: number | null;
  webhooks_fallidos: number | null;
  webhooks_nota: string;
  pagos_fallidos: HubPagoMp[];
  reembolsos: HubPagoMp[];
  pagos_nota: string;
  afip: { estado: 'proximamente'; texto: string };
  cobros: CentroCobros;
};

export type HubCanal = 'whatsapp' | 'instagram' | 'email';

export type HubMensaje = {
  id: string;
  thread_id: string;
  direction: 'in' | 'out';
  body: string;
  sent_at: string;
};

export type HubHilo = {
  id: string;
  channel: HubCanal;
  contact_name: string;
  contact_handle: string;
  status: 'abierto' | 'esperando' | 'cerrado';
  lead_id: string | null;
  nutritionist_id: string | null;
  updated_at: string;
  messages: HubMensaje[];
  borrador?: HubBorrador | null;
};

export type HubBandeja = {
  hilos: HubHilo[];
  disponible: boolean;
  nota: string;
};

export type HubCanalEstado = 'listo' | 'apagado' | 'preparado';

export type HubSeguimiento = {
  id: string;
  lead_id: string;
  title: string;
  due_on: string;
  done: boolean;
  created_at: string;
};

export type HubBorrador = {
  body: string;
  origen: 'ia' | 'plantilla';
};

export type HubCobranza = {
  mrr_pesos: number | null;
  mrr_nota: string;
  churn_mes: number | null;
  churn_nota: string;
  ltv_pesos: number | null;
  ltv_nutris: number | null;
  ltv_nota: string;
  pagos_fallidos: Array<HubPagoMp & { nutritionist_id: string | null; mail: string }>;
  avisos: Array<{ id: string; payment_id: string; kind: 'aviso' | 'releer'; estado: string; detalle: string; created_at: string }>;
  mail: { listo: boolean; nota: string };
  releer: { listo: boolean; nota: string };
};

export type HubPasoEstado = 'hecho' | 'pendiente' | 'sin_dato';

export type HubActivacionFila = {
  nutritionist_id: string;
  nombre: string;
  creada: string;
  trabada: boolean;
  pasos: Array<{ id: 'perfil' | 'paciente' | 'plan' | 'cobro' | 'pagina'; label: string; estado: HubPasoEstado }>;
};

export type HubActivacion = {
  filas: HubActivacionFila[];
  nota: string;
  disponible: boolean;
};

export type HubConector = {
  id: 'whatsapp' | 'instagram' | 'email';
  nombre: string;
  detalle: string;
  estado: HubCanalEstado;
};

export type HubConexiones = {
  conectores: HubConector[];
  nota: string;
};
