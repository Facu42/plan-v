import { describe, expect, it } from 'vitest';
import type { CrmWorkItem } from '../../types/crm-work';
import { loadCarteraUnread, mergeUnread, unreadByPatient } from './cartera-unread';

const item = (patient_id: string, kind: CrmWorkItem['kind'] = 'message') => ({ id: `${kind}:${Math.random()}`, kind, patient_id } as CrmWorkItem);

describe('mensajes sin leer de toda la cartera', () => {
  it('sigue el cursor y cuenta mensajes de pacientes fuera de la primera página', async () => {
    const page = (items: CrmWorkItem[], next_cursor: string | null) => ({ items, next_cursor, total: 101, counts: {}, source: 'memory' });
    const calls: unknown[] = [];
    const result = await loadCarteraUnread(async (query) => {
      calls.push(query.cursor);
      return (query.cursor ? page([item('ultima')], null) : page(Array.from({ length: 100 }, () => item('ana')), 'next')) as never;
    });
    expect(result.byPatient.get('ultima')).toBe(1);
    expect(result.total).toBe(101);
    expect(calls).toEqual([undefined, 'next']);
  });
  it('rechaza un cursor repetido en lugar de informar conteos incompletos', async () => {
    await expect(loadCarteraUnread(async () => ({ items: [], next_cursor: 'same', total: 0, counts: {}, source: 'memory' }) as never)).rejects.toThrow();
  });
  it('cuenta los mensajes sin leer por paciente y deja afuera otros pendientes', () => {
    const counts = unreadByPatient([item('ana'), item('ana'), item('sofia'), item('ana', 'meal')]);
    expect(Object.fromEntries(counts)).toEqual({ ana: 2, sofia: 1 });
  });
  it('usa el número más alto entre lo cargado en pantalla y lo que informa el servidor', () => {
    expect(mergeUnread(0, new Map([['ana', 3]]), 'ana')).toBe(3);
    expect(mergeUnread(2, new Map(), 'ana')).toBe(2);
    expect(mergeUnread(1, null, 'ana')).toBe(1);
  });
});
