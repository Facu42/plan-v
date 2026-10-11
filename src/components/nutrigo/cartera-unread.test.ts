import { describe, expect, it } from 'vitest';
import type { CrmWorkItem } from '../../types/crm-work';
import { mergeUnread, unreadByPatient } from './cartera-unread';

const item = (patient_id: string, kind: CrmWorkItem['kind'] = 'message') => ({ id: `${kind}:${Math.random()}`, kind, patient_id } as CrmWorkItem);

describe('mensajes sin leer de toda la cartera', () => {
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
