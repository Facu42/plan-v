export type ShellUpdateState = { waiting: boolean; updated: boolean };

type Listener = (state: ShellUpdateState) => void;

let state: ShellUpdateState = { waiting: false, updated: false };
const listeners = new Set<Listener>();

export function getShellUpdateState(): ShellUpdateState {
  return state;
}

export function subscribeShellUpdate(listener: Listener) {
  listeners.add(listener);
  listener(state);
  return () => { listeners.delete(listener); };
}

export function emitShellUpdate(next: Partial<ShellUpdateState>) {
  state = { ...state, ...next };
  for (const listener of listeners) listener(state);
}

export function resetShellUpdateState() {
  state = { waiting: false, updated: false };
}

export function applyWaitingShell(worker: { postMessage: (value: string) => void } | null | undefined) {
  worker?.postMessage('SKIP_WAITING');
}
