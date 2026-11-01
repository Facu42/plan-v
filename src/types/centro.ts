import type { ServiceState } from '../service';
import type { ServicePaymentMethod, ServicePaymentStatus } from './service';

export type CentroAlerta = {
  tone: 'coral' | 'gold' | 'sky' | 'green';
  title: string;
  sub: string;
};

export type CentroAlta = {
  id: string;
  name: string;
  email: string;
  created_at: string;
  state: ServiceState;
};

export type CentroResumen = {
  nutris_activas: number;
  nutris_prueba: number;
  nutris_vencidas: number;
  nutris_total: number;
  pacientes_activos: number;
  ingresos_mes: number;
  mrr: number;
  precio_mensual: number | null;
  altas_recientes: CentroAlta[];
  alertas: CentroAlerta[];
  spark_altas: number[];
  spark_ingresos: number[];
};

export type CentroNutri = {
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
  precio_mensual: number | null;
};

export type CentroPacienteFila = {
  nutritionist_id: string;
  name: string;
  activos: number;
  total: number;
};

export type CentroPacientes = {
  activos: number;
  total: number;
  consultorios: number;
  por_nutri: CentroPacienteFila[];
};

export type CentroPago = {
  id: string;
  nutritionist_id: string;
  nutritionist_name: string;
  amount: number;
  paid_on: string;
  method: ServicePaymentMethod;
  status: ServicePaymentStatus;
};

export type CentroCuentaCobro = {
  id: string;
  name: string;
  state: ServiceState;
  until: string | null;
  days_left: number | null;
  cobrado_mes: number;
};

export type CentroCobros = {
  mrr: number;
  cobrado_mes: number;
  vencidos: number;
  en_gracia: number;
  precio_mensual: number | null;
  cuentas: CentroCuentaCobro[];
  pagos_mes: CentroPago[];
};

export type CentroJobError = {
  id: string;
  kind: string;
  status: string;
  last_error: string | null;
  updated_at: string;
};

export type CentroMigraciones = {
  available: boolean;
  count: number | null;
  latest: string | null;
  note: string;
};

export type CentroSalud = {
  api: { status: string; supabase: boolean; sha: string | null; mode: string | null };
  worker: string;
  jobs: { queued: number; leased: number; dead: number; succeeded: number; failed: number };
  errores_recientes: CentroJobError[];
  migraciones: CentroMigraciones;
  integraciones_faltantes: number;
};

export type CentroMfaEstado = 'activo' | 'sin_alta' | 'sin_dato';
export type CentroCuentaRol = 'admin' | 'nutri' | 'ambos';

export type CentroAdmin = {
  user_id: string;
  name: string;
  email: string | null;
  created_at: string;
};

export type CentroCuentaSeguridad = {
  id: string;
  name: string;
  email: string;
  role: CentroCuentaRol;
  mfa: CentroMfaEstado;
};

export type CentroSeguridad = {
  mfa_enforce: boolean;
  admins: CentroAdmin[];
  cuentas: CentroCuentaSeguridad[];
  advertencias: CentroAlerta[];
};
