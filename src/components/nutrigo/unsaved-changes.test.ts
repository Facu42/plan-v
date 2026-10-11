import { describe, expect, it, vi } from 'vitest';
import { canLeaveWorkspace, registerPendingFormForTest } from './unsaved-changes';

describe('cambios pendientes del consultorio', () => {
  it('conserva un formulario si se cancela y permite descartar explícitamente', () => {
    const remove = registerPendingFormForTest(Symbol(), true);
    const cancel = vi.fn(() => false);
    expect(canLeaveWorkspace(cancel)).toBe(false);
    expect(cancel).toHaveBeenCalledOnce();
    expect(canLeaveWorkspace(() => true)).toBe(true);
    expect(canLeaveWorkspace(cancel)).toBe(true);
    remove();
  });
  it('impide desmontar durante una escritura sin solicitar descartar', () => {
    const remove = registerPendingFormForTest(Symbol(), false, true);
    const confirm = vi.fn(() => true);
    expect(canLeaveWorkspace(confirm)).toBe(false);
    expect(confirm).not.toHaveBeenCalled();
    remove();
    expect(canLeaveWorkspace(confirm)).toBe(true);
  });
});
