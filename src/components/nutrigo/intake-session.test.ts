import { describe, expect, it, vi } from 'vitest';
import { createIntakeSession } from './intake-session';
import { createIntakeSaveQueue } from './intake-save-queue';

const draft = { step: 'review', payload: { preferred_name: 'Ana' } };
const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>(r => { resolve = r; });
  return { promise, resolve };
};

describe('sesión del ingreso con respuestas demoradas', () => {
  it('cada escritura utiliza la revisión confirmada por la anterior', async () => {
    const gate = deferred();
    const save = vi.fn(async ({expected_revision}: {expected_revision:number}) => {
      await gate.promise;
      return { intake: { revision: expected_revision + 1, status: 'draft' } };
    });
    const session = createIntakeSession(4, {save,submit:vi.fn()});
    const first = session.save(draft);
    const second = session.save({...draft,step:'habits'});
    gate.resolve();
    await Promise.all([first, second]);
    expect(save.mock.calls.map(([arg])=>arg.expected_revision)).toEqual([4,5]);
  });
  it('un envío espera el guardado pendiente y bloquea autosaves posteriores', async () => {
    const gate = deferred();
    const order: string[] = [];
    const session = createIntakeSession(1, {
      save: async ({expected_revision}) => { await gate.promise; order.push(`save:${expected_revision}`); return {intake:{revision:expected_revision+1,status:'draft'}}; },
      submit: async revision => { order.push(`submit:${revision}`); return {intake:{revision:revision+1,status:'submitted'}}; },
    });
    const saving = session.save(draft);
    const sending = session.submit(draft);
    expect(await session.save({...draft,step:'profile'})).toBeNull();
    gate.resolve();
    await Promise.all([saving,sending]);
    expect(order).toEqual(['save:1','save:2','submit:3']);
    expect(await session.save(draft)).toBeNull();
  });
  it('recupera un envío aceptado cuya respuesta se perdió sin intentar editar lo enviado', async () => {
    const save = vi.fn(async () => ({intake:{revision:8,status:'draft'}}));
    const submit = vi.fn().mockRejectedValueOnce(new TypeError('Failed to fetch')).mockResolvedValue({intake:{revision:9,status:'submitted'}});
    const session = createIntakeSession(7,{save,submit});
    await expect(session.submit(draft)).rejects.toThrow('Failed to fetch');
    expect(session.awaitingReceipt).toBe(true);
    expect(await session.save(draft)).toBeNull();
    expect(await session.submit(draft)).toMatchObject({intake:{status:'submitted'}});
    expect(save).toHaveBeenCalledTimes(1);
    expect(submit.mock.calls).toEqual([[8],[8]]);
  });
  it('reiniciar la cola no ejecuta tareas pendientes de la ficha anterior', async () => {
    const gate = deferred();
    const queue = createIntakeSaveQueue(); queue.markReady();
    const first = queue.enqueue(async () => { await gate.promise; return 'old'; });
    await Promise.resolve();
    const staleTask = vi.fn(async () => 'stale');
    const stale = queue.enqueue(staleTask);
    queue.reset(); queue.markReady();
    expect(await queue.enqueue(async () => 'new')).toBe('new');
    gate.resolve(); await first;
    expect(await stale).toBeNull();
    expect(staleTask).not.toHaveBeenCalled();
    expect(queue.pending).toBe(0);
  });
});
