import { describe, expect, it } from 'vitest';
import { ApiError } from '../../api/client';
import { createIntakeSaveQueue, isIntakeConflict } from './intake-save-queue';

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('cola de autoguardado del ingreso', () => {
  it('no escribe antes de recuperar el ingreso y serializa llamadas superpuestas', async () => {
    const queue = createIntakeSaveQueue();
    const order: number[] = [];
    expect(await queue.enqueue(async () => 1)).toBeNull();
    queue.markReady();
    const first = queue.enqueue(async () => {
      await wait(20);
      order.push(1);
      return 1;
    });
    const second = queue.enqueue(async () => {
      order.push(2);
      return 2;
    });
    expect(await Promise.all([first, second])).toEqual([1, 2]);
    expect(order).toEqual([1, 2]);
  });

  it('detiene la cola ante un conflicto de revisión', async () => {
    const queue = createIntakeSaveQueue();
    queue.markReady();
    await expect(queue.enqueue(async () => {
      throw new ApiError(409, 'El ingreso cambió en otra sesión.');
    })).rejects.toBeInstanceOf(ApiError);
    expect(queue.blocked).toBe(true);
    expect(await queue.enqueue(async () => 3)).toBeNull();
    expect(isIntakeConflict(new ApiError(409, 'conflicto'))).toBe(true);
  });

  it('cancela el trabajo pendiente al cambiar de ficha', async () => {
    const queue = createIntakeSaveQueue();
    queue.markReady();
    queue.stop();
    expect(await queue.enqueue(async () => 9)).toBeNull();
    queue.reset();
    queue.markReady();
    expect(await queue.enqueue(async () => 9)).toBe(9);
  });
});
