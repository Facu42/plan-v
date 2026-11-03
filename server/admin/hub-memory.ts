import type { HubHilo, HubLead, HubMensaje, HubNota, HubTarea } from '../../src/types/hub.js';

type Memory = {
  notas: HubNota[];
  tareas: HubTarea[];
  leads: HubLead[];
  hilos: HubHilo[];
};

const memory: Memory = { notas: [], tareas: [], leads: [], hilos: [] };

export function resetHubMemory(): void {
  memory.notas = [];
  memory.tareas = [];
  memory.leads = [];
  memory.hilos = [];
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

export function memoryLinkLead(threadId: string, leadId: string): HubHilo | null {
  const row = memory.hilos.find((item) => item.id === threadId);
  if (!row) return null;
  row.lead_id = leadId;
  row.updated_at = new Date().toISOString();
  return row;
}
