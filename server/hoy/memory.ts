import type { HechoAccion } from '../../src/lib/hoy-accion.js';

const hechos: HechoAccion[] = [];

export function resetHoyMemory() {
  hechos.length = 0;
}

export function listarHechosMemoria(): HechoAccion[] {
  return hechos.map(hecho => ({ ...hecho }));
}

export function guardarHechoMemoria(hecho: HechoAccion): HechoAccion {
  const previo = hechos.find(item => item.patientId === hecho.patientId && item.action === hecho.action && item.sourceKey === hecho.sourceKey);
  if (previo) return { ...previo };
  hechos.push(hecho);
  return { ...hecho };
}
