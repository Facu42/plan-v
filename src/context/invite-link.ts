const INVITE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const PENDING_INVITE_STORAGE_KEY = 'planv.pendingInvite';

export function pendingInviteIdFromLocation(search: string, stored?: string | null): string | null {
  const fromQuery = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search).get('invite')?.trim() ?? '';
  if (INVITE_ID.test(fromQuery)) return fromQuery;
  const fromStore = stored?.trim() ?? '';
  return INVITE_ID.test(fromStore) ? fromStore : null;
}

export function rememberPendingInvite(inviteId: string, storage: Pick<Storage, 'setItem'> | null): void {
  if (!storage || !INVITE_ID.test(inviteId)) return;
  storage.setItem(PENDING_INVITE_STORAGE_KEY, inviteId);
}

export function forgetPendingInvite(storage: Pick<Storage, 'removeItem'> | null): void {
  storage?.removeItem(PENDING_INVITE_STORAGE_KEY);
}
