import { describe, expect, it } from 'vitest';
import { forgetPendingInvite, pendingInviteIdFromLocation, rememberPendingInvite } from './invite-link';

const id = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';

describe('invite deep link', () => {
  it('reads a UUID invite from the query and ignores anything else', () => {
    expect(pendingInviteIdFromLocation(`?invite=${id}`)).toBe(id);
    expect(pendingInviteIdFromLocation('', id)).toBe(id);
    expect(pendingInviteIdFromLocation('?invite=not-a-uuid')).toBeNull();
    expect(pendingInviteIdFromLocation('?invite=../../../etc/passwd')).toBeNull();
  });

  it('stores the pending invite only when the id is well formed', () => {
    const storage = new Map<string, string>();
    const adapter = {
      setItem: (key: string, value: string) => { storage.set(key, value); },
      removeItem: (key: string) => { storage.delete(key); },
    };
    rememberPendingInvite('nope', adapter);
    expect(storage.size).toBe(0);
    rememberPendingInvite(id, adapter);
    expect([...storage.values()]).toEqual([id]);
    forgetPendingInvite(adapter);
    expect(storage.size).toBe(0);
  });
});
