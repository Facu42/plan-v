import type { HubBorrador, HubHilo, HubLead, HubMensaje, HubNota, HubSeguimiento, HubTarea } from '../../src/types/hub.js';

type Aviso = { id: string; payment_id: string; kind: 'aviso' | 'releer'; estado: string; detalle: string; created_at: string; nutritionist_id: string | null };

type Memory = {
  notas: HubNota[];
  tareas: HubTarea[];
  leads: HubLead[];
  hilos: HubHilo[];
  seguimientos: HubSeguimiento[];
  avisos: Aviso[];
  ocultas: Set<string>;
};

const memory: Memory = { notas: [], tareas: [], leads: [], hilos: [], seguimientos: [], avisos: [], ocultas: new Set() };

export function resetHubMemory(): void {
  memory.notas = [];
  memory.tareas = [];
  memory.leads = [];
  memory.hilos = [];
  memory.seguimientos = [];
  memory.avisos = [];
  memory.ocultas = new Set();
}

export function memoryNotas(nutritionistId?: string): HubNota[] {
  return memory.notas.filter((row) => !nutritionistId || row.nutritionist_id === nutritionistId);
}

export function memoryTareas(nutritionistId?: string): HubTarea[] {
  return memory.tareas.filter((row) => !nutritionistId || row.nutritionist_id === nutritionistId);
}

export function memoryLeads(): HubLead[] {
  return [...memory.leads].sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export function memoryHilos(): HubHilo[] {
  return [...memory.hilos].sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export function memoryAddNota(row: HubNota): HubNota {
  memory.notas.push(row);
  return row;
}

export function memoryAddTarea(row: HubTarea): HubTarea {
  memory.tareas.push(row);
  return row;
}

export function memoryToggleTarea(id: string, done: boolean): HubTarea | null {
  const row = memory.tareas.find((item) => item.id === id);
  if (!row) return null;
  row.done = done;
  return row;
}

export function memoryAddLead(row: HubLead): HubLead {
  memory.leads.push(row);
  return row;
}

export function memoryPatchLead(id: string, patch: Partial<Pick<HubLead, 'stage' | 'next_step' | 'source' | 'nutritionist_id'>>): HubLead | null {
  const row = memory.leads.find((item) => item.id === id);
  if (!row) return null;
  Object.assign(row, patch, { updated_at: new Date().toISOString() });
  return row;
}

export function memoryAddHilo(row: HubHilo): HubHilo {
  memory.hilos.push(row);
  return row;
}

export function memoryAddMensaje(threadId: string, message: HubMensaje): HubHilo | null {
  const row = memory.hilos.find((item) => item.id === threadId);
  if (!row) return null;
  row.messages.push(message);
  row.updated_at = message.sent_at;
  return row;
}

export function memorySeguimientos(leadId?: string): HubSeguimiento[] {
  return memory.seguimientos.filter((row) => !leadId || row.lead_id === leadId);
}

export function memoryAddSeguimiento(row: HubSeguimiento): HubSeguimiento {
  const abierto = memory.seguimientos.find((item) => item.lead_id === row.lead_id && item.title === row.title && !item.done);
  if (abierto) return abierto;
  memory.seguimientos.push(row);
  return row;
}

export function memoryAvisos(): Aviso[] {
  return [...memory.avisos];
}

export function memoryAddAviso(row: Aviso): Aviso {
  memory.avisos.push(row);
  return row;
}

export function memoryOculta(nutritionistId: string): boolean {
  return memory.ocultas.has(nutritionistId);
}

export function memoryOcultar(nutritionistId: string): void {
  memory.ocultas.add(nutritionistId);
}

export function memoryBorrador(threadId: string, borrador: HubBorrador | null): HubHilo | null {
  const row = memory.hilos.find((item) => item.id === threadId);
  if (!row) return null;
  row.borrador = borrador;
  return row;
}

export function memoryFindHilo(channel: HubHilo['channel'], handle: string): HubHilo | null {
  return memory.hilos.find((item) => item.channel === channel && item.contact_handle === handle) ?? null;
}

export function memoryLinkLead(threadId: string, leadId: string): HubHilo | null {
  const row = memory.hilos.find((item) => item.id === threadId);
  if (!row) return null;
  row.lead_id = leadId;
  row.updated_at = new Date().toISOString();
  return row;
}
