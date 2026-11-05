// Estadísticas del consultorio: lo que devuelve GET /api/consultorio/estadisticas.
export type MesEstadistico = {
  mes: string;          // 2026-11
  rotulo: string;       // nov
  consultas: number;    // turnos cuyo horario ya pasó, sin cancelar ni marcados «no vino»
  ausencias: number;    // turnos marcados «no se realizó» en la ficha
  canceladas: number;   // turnos cancelados (por la nutri o la paciente)
  nuevas: number;       // pacientes dadas de alta en el consultorio
  ingresos: number;     // pesos cobrados (pagos confirmados)
};

export type SedeEstadistica = { id: string; nombre: string; detalle: string; consultas: number; ausencias: number; online: number; presencial: number };

export type EstadisticasConsultorio = {
  hoy: string;
  meses: MesEstadistico[];
  total: MesEstadistico & { primeraVez: number; seguimiento: number; presencial: number; online: number; pacientesAtendidas: number };
  porSede: SedeEstadistica[];
  masAusencias: Array<{ id: string; nombre: string; ausencias: number; ultima: string }>;
  sedesInstaladas: boolean;
};
