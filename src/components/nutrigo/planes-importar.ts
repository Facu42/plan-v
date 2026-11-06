// Importar el plan anterior (función 3 del plan contra Nutreando, 5/11/2026): la nutri sube el plan que ya usaba
// en PDF, foto, Word, Excel o texto y queda como borrador editable. Todo se lee en el navegador de la profesional
// (texto del PDF, OCR local para fotos y PDF escaneados, planillas y Word); nada se manda a una IA externa.
import { extractImportFile } from '../../lib/patient-import-files';
import type { LocalDocument } from '../../lib/patient-import';
import { mealPlanDraftSchema, type MealPlanDraftInput, type PlanSlot, type ProfessionalMealPlan } from '../../types/plans';
import { COMIDAS_EDITOR, sumarDias } from './planes-editor';
import type { PlanComponentInput } from '../../types/plan-components';

export const MAX_TEXTO_COMIDA = 150;
const MAX_COMIDAS = 42;
const MAX_DIAS = 21;
const DIAS_PLAN_TIPO = 7;

export type DiaImportado = { etiqueta: string; semana: number | null; comidas: Partial<Record<PlanSlot, string>>; recortes?: number };
export type PlanImportado = { dias: DiaImportado[]; plantilla: boolean; comidas: number; recortadas: number; descartadas: number };

const normal = (texto: string) => texto.toLocaleLowerCase('es').normalize('NFD').replace(/\p{M}/gu, '').replace(/\s+/g, ' ').trim();

const SEMANA = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

/** Momentos del día con los nombres que usan las nutris; lo que va «antes de dormir» se suma a la cena. */
const MOMENTOS: Array<[RegExp, PlanSlot, string?]> = [
  [/^desayunos?\b/, 'Desayuno'],
  [/^(colacion(es)?( de la manana| matutina)?|media manana|colacion am)\b/, 'Colación'],
  [/^almuerzos?\b/, 'Almuerzo'],
  [/^(meriendas?|media tarde|colacion( de la tarde| vespertina| pm))\b/, 'Merienda'],
  [/^cenas?\b/, 'Cena'],
  [/^(postre|antes de dormir|colacion nocturna|colacion de la noche|extra)\b/, 'Cena', 'Antes de dormir'],
];

function momento(linea: string): { slot: PlanSlot; prefijo?: string; resto: string } | null {
  const limpio = normal(linea);
  for (const [patron, slot, prefijo] of MOMENTOS) {
    const encontrado = limpio.match(patron);
    if (!encontrado) continue;
    const resto = linea.trim().slice(encontradoLargo(linea, encontrado[0].length)).replace(/^\s*(\(\s*\d{1,2}[:.]?\d{0,2}\s*(hs?)?\s*\))?\s*[:\-–—·|.]?\s*/, '');
    // «Desayuno de campo» como nombre de un plato no es un encabezado: después del momento tiene que venir un
    // separador, una hora o nada.
    const siguiente = limpio.slice(encontrado[0].length).trim();
    if (siguiente && !/^(\(|[:\-–—·|.]|\d)/.test(siguiente)) return null;
    return { slot, prefijo, resto };
  }
  return null;
}

/** Largo del prefijo en el texto original (los acentos no cambian la cantidad de letras al normalizar con NFD). */
function encontradoLargo(original: string, largoNormal: number) {
  let cuenta = 0;
  const texto = original.trim();
  for (let i = 0; i < texto.length; i += 1) {
    // Cada letra cuenta como en `normal` (los espacios seguidos valen uno).
    if (/\s/.test(texto[i]) && i > 0 && /\s/.test(texto[i - 1])) continue;
    cuenta += texto[i].normalize('NFD').replace(/\p{M}/gu, '').length;
    if (cuenta >= largoNormal) return i + 1;
  }
  return texto.length;
}

function dia(linea: string): { etiqueta: string; semana: number | null; resto: string } | null {
  const limpio = normal(linea);
  const nombre = SEMANA.findIndex(d => limpio === d || new RegExp(`^${d}\\b\\s*[:\\-–—·|.]?`).test(limpio));
  if (nombre >= 0) {
    const siguiente = limpio.slice(SEMANA[nombre].length).trim();
    if (siguiente && !/^[:\-–—·|.]/.test(siguiente) && !momento(siguiente)) return null;
    const resto = linea.trim().slice(encontradoLargo(linea, SEMANA[nombre].length)).replace(/^\s*[:\-–—·|.]?\s*/, '');
    return { etiqueta: SEMANA[nombre], semana: nombre, resto };
  }
  const numero = limpio.match(/^dia\s*(\d{1,2})\b\s*[:\-–—·|.]?/);
  if (numero) return { etiqueta: `Día ${Number(numero[1])}`, semana: null, resto: linea.trim().slice(encontradoLargo(linea, numero[0].length)).trim() };
  return null;
}

type Armado = { dias: DiaImportado[]; actual: DiaImportado | null; slot: PlanSlot | null; textos: Map<DiaImportado, Partial<Record<PlanSlot, string[]>>> };

function sumar(armado: Armado, slot: PlanSlot, texto: string) {
  if (!armado.actual) {
    armado.actual = { etiqueta: 'Plan tipo', semana: null, comidas: {} };
    armado.dias.push(armado.actual);
  }
  const limpio = texto.replace(/^[\s•·\-–—*▪●○◦]+/, '').replace(/\s+/g, ' ').trim();
  if (!limpio) return;
  const lugar = armado.textos.get(armado.actual) ?? {};
  (lugar[slot] ??= []).push(limpio);
  armado.textos.set(armado.actual, lugar);
}

/** Lee líneas de texto: días («Lunes», «Día 2») y momentos («Desayuno:») ordenan lo que viene debajo. */
function leerLineas(lineas: string[], armado: Armado) {
  for (const original of lineas) {
    const linea = original.trim();
    if (!linea) continue;
    const esDia = dia(linea);
    if (esDia) {
      // «Lunes» que sigue a un «Plan tipo» vacío lo reemplaza.
      const previo = armado.actual;
      if (previo && previo.etiqueta === 'Plan tipo' && !armado.textos.get(previo)) armado.dias.pop();
      armado.actual = { etiqueta: esDia.etiqueta, semana: esDia.semana, comidas: {} };
      armado.dias.push(armado.actual);
      armado.slot = null;
      if (esDia.resto) leerLineas([esDia.resto], armado);
      continue;
    }
    const esMomento = momento(linea);
    if (esMomento) {
      armado.slot = esMomento.slot;
      const texto = esMomento.prefijo && esMomento.resto ? `${esMomento.prefijo}: ${esMomento.resto}` : esMomento.prefijo ? `${esMomento.prefijo}:` : esMomento.resto;
      if (texto) sumar(armado, esMomento.slot, texto);
      else if (!armado.actual) sumar(armado, esMomento.slot, '');
      continue;
    }
    // Lo que está antes del primer momento (título, nombre, fecha) no se toma: no es una comida.
    if (armado.slot) sumar(armado, armado.slot, linea);
  }
}

/** Planillas en grilla: una fila con los días como columnas, o una fila con los momentos como columnas. */
function leerTabla(filas: string[][], armado: Armado): boolean {
  const cabecera = filas.findIndex(fila => fila.filter(celda => celda && dia(celda)).length >= 2);
  if (cabecera >= 0) {
    const columnas = filas[cabecera].map(celda => (celda ? dia(celda) : null));
    const propios = columnas.map(c => (c ? { etiqueta: c.etiqueta, semana: c.semana, comidas: {} } as DiaImportado : null));
    for (const fila of filas.slice(cabecera + 1)) {
      const primera = fila.findIndex(celda => celda?.trim());
      const esMomento = primera >= 0 ? momento(fila[primera]) : null;
      if (!esMomento) continue;
      fila.forEach((celda, indice) => {
        const destino = propios[indice];
        if (!destino || !celda?.trim()) return;
        armado.actual = destino;
        if (!armado.dias.includes(destino)) armado.dias.push(destino);
        sumar(armado, esMomento.slot, esMomento.prefijo ? `${esMomento.prefijo}: ${celda}` : celda);
      });
    }
    armado.dias.sort((a, b) => propios.indexOf(a) - propios.indexOf(b));
    return armado.dias.length > 0;
  }
  const porMomento = filas.findIndex(fila => fila.filter(celda => celda && momento(celda)).length >= 2);
  if (porMomento >= 0) {
    const columnas = filas[porMomento].map(celda => (celda ? momento(celda) : null));
    for (const fila of filas.slice(porMomento + 1)) {
      const primera = fila.findIndex(celda => celda?.trim());
      if (primera < 0) continue;
      const esDia = dia(fila[primera]);
      armado.actual = esDia ? { etiqueta: esDia.etiqueta, semana: esDia.semana, comidas: {} } : { etiqueta: `Día ${armado.dias.length + 1}`, semana: null, comidas: {} };
      fila.forEach((celda, indice) => {
        const columna = columnas[indice];
        if (!columna || !celda?.trim()) return;
        if (!armado.dias.includes(armado.actual!)) armado.dias.push(armado.actual!);
        sumar(armado, columna.slot, columna.prefijo ? `${columna.prefijo}: ${celda}` : celda);
      });
    }
    return armado.dias.length > 0;
  }
  return false;
}

function recortar(texto: string): { texto: string; recortado: boolean } {
  if (texto.length <= MAX_TEXTO_COMIDA) return { texto, recortado: false };
  const corte = texto.slice(0, MAX_TEXTO_COMIDA - 1);
  const espacio = corte.lastIndexOf(' ');
  return { texto: `${(espacio > 100 ? corte.slice(0, espacio) : corte).trimEnd()}…`, recortado: true };
}

/** Arma los días del plan a partir de lo que se leyó del archivo. */
export function planDesdeDocumento(documento: Pick<LocalDocument, 'pages' | 'tables'>): PlanImportado {
  const armado: Armado = { dias: [], actual: null, slot: null, textos: new Map() };
  for (const tabla of documento.tables) {
    if (leerTabla(tabla.rows, armado)) continue;
    armado.actual = armado.dias[armado.dias.length - 1] ?? null;
    leerLineas(tabla.rows.map(fila => fila.filter(Boolean).join(' · ')), armado);
  }
  for (const pagina of documento.pages) leerLineas(pagina.text.split(/\r?\n/), armado);

  const dias = armado.dias.map(d => {
    let recortes = 0;
    const textos = armado.textos.get(d) ?? {};
    const comidas: Partial<Record<PlanSlot, string>> = {};
    for (const slot of COMIDAS_EDITOR) {
      const partes = textos[slot];
      if (!partes?.length) continue;
      const unido = partes.join(' · ').replace(/:\s·\s/g, ': ');
      const { texto, recortado } = recortar(unido);
      if (recortado) recortes += 1;
      comidas[slot] = texto;
    }
    return { ...d, comidas, recortes };
  }).filter(d => Object.keys(d.comidas).length > 0);

  const plantilla = dias.length === 1 && dias[0].etiqueta === 'Plan tipo';
  const completos = plantilla ? Array.from({ length: DIAS_PLAN_TIPO }, (_, i) => ({ ...dias[0], etiqueta: `Día ${i + 1}` })) : dias;
  const elegidos: DiaImportado[] = [];
  let comidas = 0;
  let descartadas = 0;
  let recortadas = 0;
  for (const d of completos) {
    const cantidad = Object.keys(d.comidas).length;
    if (elegidos.length >= MAX_DIAS || comidas + cantidad > MAX_COMIDAS) { descartadas += cantidad; continue; }
    elegidos.push(d);
    comidas += cantidad;
    recortadas += d.recortes ?? 0;
  }
  return { dias: elegidos, plantilla, comidas, recortadas, descartadas };
}

/** Si el plan nombra los días de la semana, arranca en el próximo día que coincide con el primero (hoy incluido). */
export function inicioDelPlan(plan: PlanImportado, hoy: string) {
  const primero = plan.dias[0]?.semana;
  if (primero == null) return hoy;
  const hoyIndice = (new Date(`${hoy}T12:00:00-03:00`).getUTCDay() + 6) % 7;
  return sumarDias(hoy, (primero - hoyIndice + 7) % 7);
}

function fechasDe(plan: PlanImportado, inicio: string) {
  const fechas: string[] = [];
  let anterior: { semana: number | null; fecha: string } | null = null;
  for (const d of plan.dias) {
    let fecha: string;
    if (!anterior) fecha = inicio;
    else if (d.semana != null && anterior.semana != null) fecha = sumarDias(anterior.fecha, ((d.semana - anterior.semana + 7) % 7) || 7);
    else fecha = sumarDias(anterior.fecha, 1);
    fechas.push(fecha);
    anterior = { semana: d.semana, fecha };
  }
  return fechas;
}

/** Borrador listo para guardar: reemplaza el borrador de la paciente y conserva su plan publicado. */
export function borradorImportado(plan: PlanImportado, hoy: string, destino: ProfessionalMealPlan | null, componentes?: Map<string, PlanComponentInput[]>): MealPlanDraftInput {
  if (!plan.comidas) throw new Error(AVISO_SIN_COMIDAS);
  const inicio = inicioDelPlan(plan, hoy);
  const fechas = fechasDe(plan, inicio);
  const limite = sumarDias(inicio, MAX_DIAS);
  const items = plan.dias.flatMap((d, indice) => fechas[indice] > limite ? [] : COMIDAS_EDITOR.filter(slot => d.comidas[slot]).map(slot => {
    const medidos = componentes?.get(`${indice}|${slot}`);
    return medidos
      ? { for_date: fechas[indice], slot, components: medidos, public_note: '' }
      : { for_date: fechas[indice], slot, free_text: d.comidas[slot]!, public_note: '' };
  }));
  const fin = items.reduce((max, item) => item.for_date > max ? item.for_date : max, inicio);
  return mealPlanDraftSchema.parse({
    id: destino?.id ?? crypto.randomUUID(),
    expected_revision: destino?.current.revision ?? null,
    period_start: inicio,
    period_end: fin,
    timezone: 'America/Argentina/Buenos_Aires',
    items,
  });
}

export const AVISO_SIN_COMIDAS = 'No encontré desayuno, almuerzo, merienda ni cena en el archivo. Podés usarlo como referencia para la IA o cargar el plan en el editor.';
export const AVISO_LOCAL = 'Se leyó en tu computadora; no se mandó a ninguna IA.';

export function resumenImportado(plan: PlanImportado) {
  const dias = plan.plantilla ? `Plan tipo repetido ${plan.dias.length} días` : `${plan.dias.length} ${plan.dias.length === 1 ? 'día' : 'días'}`;
  const partes = [`${dias} · ${plan.comidas} ${plan.comidas === 1 ? 'comida' : 'comidas'}`];
  if (plan.recortadas) partes.push(`${plan.recortadas} ${plan.recortadas === 1 ? 'comida quedó recortada' : 'comidas quedaron recortadas'} a ${MAX_TEXTO_COMIDA} letras`);
  if (plan.descartadas) partes.push(`${plan.descartadas} no entraron (el borrador admite hasta ${MAX_COMIDAS} comidas)`);
  return partes.join('. ');
}

const esTextoPlano = (archivo: File) => archivo.type === 'text/plain' || archivo.type === 'text/markdown' || /\.(txt|md)$/i.test(archivo.name);

/** Texto corrido del documento, para seguir usándolo como referencia del pedido a la IA. */
export function textoDeDocumento(documento: Pick<LocalDocument, 'pages' | 'tables'>) {
  return [
    ...documento.tables.flatMap(tabla => tabla.rows.map(fila => fila.filter(Boolean).join(' '))),
    ...documento.pages.map(pagina => pagina.text),
  ].join('\n');
}

/** Lee un archivo del plan anterior en el navegador. Los formatos son los de Importar pacientes, más texto. */
export async function leerPlanAnterior(archivo: File, progreso: (texto: string) => void = () => {}): Promise<{ texto: string; plan: PlanImportado }> {
  let documento: Pick<LocalDocument, 'pages' | 'tables'>;
  if (esTextoPlano(archivo)) {
    if (archivo.size > 1024 * 1024) throw new Error('El archivo pesa más de 1 MB.');
    documento = { pages: [{ page: 1, text: await archivo.text() }], tables: [] };
  } else {
    documento = await extractImportFile(archivo, progreso);
  }
  const texto = textoDeDocumento(documento);
  if (!texto.replace(/\s+/g, '').length) throw new Error('No encontré texto para leer en ese archivo.');
  return { texto, plan: planDesdeDocumento(documento) };
}

export const ARCHIVOS_PLAN_ANTERIOR = '.pdf,.docx,.xlsx,.csv,.jpg,.jpeg,.png,.txt,.md,application/pdf,image/jpeg,image/png,text/plain,text/csv';
