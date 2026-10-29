export const MODULOS_EQUIPO = ['Inicio', 'Pacientes', 'Ficha clínica', 'Planes', 'Mensajes', 'Agenda', 'Cobranzas', 'Página pública', 'Equipo', 'Ajustes'] as const;
export const NIVELES_EQUIPO = ['Todo', 'Ver', 'Sin acceso'] as const;
export const FILTROS_REGISTRO = ['Todo', 'Fichas', 'Cambios', 'Ingresos'] as const;

export type RolEquipo = 'Dueña' | 'Nutricionista' | 'Recepción' | 'Contador';

/** Nivel por módulo según el rol (0 todo, 1 ver, 2 sin acceso): la referencia del boceto, no un permiso guardado por persona. */
const NIVELES_POR_ROL: Record<RolEquipo, readonly number[]> = {
  'Dueña': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  Nutricionista: [0, 0, 0, 0, 0, 1, 1, 1, 2, 2],
  'Recepción': [1, 1, 2, 2, 0, 0, 0, 1, 2, 2],
  Contador: [2, 2, 2, 2, 2, 2, 1, 2, 2, 2],
};
const COLOR_POR_ROL: Record<RolEquipo, string> = { 'Dueña': 'azaf', Nutricionista: 'lima', 'Recepción': 'azul', Contador: 'rojo' };
const DETALLE_POR_ROL: Record<RolEquipo, string> = { 'Dueña': 'Nutricionista', Nutricionista: 'Asociada', 'Recepción': 'Turnos y cobros', Contador: 'Planillas para facturar' };

export const ROLES_EQUIPO: ReadonlyArray<readonly [RolEquipo, string]> = [
  ['Dueña', 'Todo, incluido Equipo y Ajustes'],
  ['Nutricionista', 'Fichas, planes y mensajes de sus pacientes'],
  ['Recepción', 'Agenda, cobros y mensajes; nunca la ficha clínica'],
  ['Contador', 'Solo ve Cobranzas y descarga planillas'],
];

export const REGLAS_EQUIPO = [
  'La ficha clínica solo la ven nutricionistas',
  'Recepción ve el contacto, nunca las notas',
  'Compartir fichas requiere una asignación explícita',
  'Quitar la recepción corta su acceso operativo',
] as const;

const esRol = (rol: string): rol is RolEquipo => rol in NIVELES_POR_ROL;
export const nivelesDeRol = (rol: string): readonly number[] => (esRol(rol) ? NIVELES_POR_ROL[rol] : NIVELES_POR_ROL['Recepción']);
export const colorDeRol = (rol: string) => (esRol(rol) ? COLOR_POR_ROL[rol] : 'lima');
export const detalleDeRol = (rol: string) => (esRol(rol) ? DETALLE_POR_ROL[rol] : '');

/** Dos iniciales del nombre o del mail (antes de la arroba). */
export function inicialesDe(nombre: string): string {
  const base = nombre.includes('@') ? nombre.split('@')[0].replace(/[._-]+/g, ' ') : nombre;
  const letras = base.trim().split(/\s+/).filter(Boolean).map(parte => parte[0]);
  return (letras.length > 1 ? letras.slice(0, 2).join('') : (base.trim().slice(0, 2) || '·')).toUpperCase();
}

export const claseEstado = (estado: string) => (estado === 'Activa' ? 'p-conf' : estado === 'Revocada' ? 'p-bad' : 'p-wait');

export function resumenPersonas(estados: readonly string[]): string {
  const activas = estados.filter(estado => estado !== 'Revocada');
  const invitadas = activas.filter(estado => estado === 'Invitada').length;
  const texto = `${activas.length} ${activas.length === 1 ? 'persona' : 'personas'}`;
  return invitadas ? `${texto} · ${invitadas} ${invitadas === 1 ? 'invitación' : 'invitaciones'}` : texto;
}

/** Nombre de pila para los encabezados de la matriz: el primer nombre o lo anterior a la arroba. */
export const nombreCorto = (nombre: string) => (nombre.includes('@') ? nombre.split('@')[0] : nombre.split(/\s+/)[0]);
