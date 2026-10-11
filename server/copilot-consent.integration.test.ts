import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ actor: vi.fn(), patient: vi.fn(), bundle: vi.fn(), generate: vi.fn(), save: vi.fn() }));
vi.mock('./db/supabase-client.js', () => ({
  isSupabaseEnabled: () => true,
  verifyAuthToken: async (token?: string) => token ? { userId: 'user-a' } : null,
  getSupabaseAdmin: () => ({}), createActorClient: () => null,
  bindActorClient: (_client: unknown, run: () => unknown) => run(),
}));
vi.mock('./db/supabase-repo.js', async original => ({
  ...await original<typeof import('./db/supabase-repo.js')>(),
  sbGetActor: mocks.actor,
  sbGetPatientResource: async (id: string) => ({ id, nutritionistId: 'nutri-a', billing_status: 'waived', billing_until: null }),
  sbGetPatientById: mocks.patient,
  sbGetNutritionistId: async () => 'nutri-a',
  sbSetBrief: mocks.save,
}));
vi.mock('./intake/repository.js', async original => ({ ...await original<typeof import('./intake/repository.js')>(), readIntakeBundle: mocks.bundle }));
vi.mock('./ai/copilot.js', () => ({ generateCopilotBrief: mocks.generate }));

import { app } from './index.js';
import { CONSENT_CATALOG } from './intake/consent.js';
import { getStore, resetStore } from './store.js';

const request = () => app.request('/api/patients/pat-sofia/copilot', { method: 'POST', headers: { Authorization: 'Bearer synthetic-only' } });
const consent = CONSENT_CATALOG.find(text => text.purpose === 'ai_followup')!;

describe('copilot consent and access', () => {
  beforeEach(() => {
    vi.clearAllMocks(); resetStore();
    mocks.actor.mockResolvedValue({ role: 'nutri', userId: 'user-a', nutritionistId: 'nutri-a' });
    mocks.patient.mockResolvedValue(getStore().patients[0]);
    mocks.bundle.mockResolvedValue({ intake: {}, consents: [] });
    mocks.generate.mockResolvedValue({ suggested_action: null, up_next_title: null, up_next_body: null, draft_message: null, source_ids: [], adherence_why: '' });
    mocks.save.mockResolvedValue(undefined);
  });
  it('blocks missing, withdrawn and stale consent before calling the provider', async () => {
    for (const consents of [[], [{ ...consent, decision: 'withdrawn' }], [{ ...consent, decision: 'granted', text_hash: 'stale' }]]) {
      mocks.bundle.mockResolvedValue({ intake: {}, consents });
      expect((await request()).status).toBe(403);
    }
    expect(mocks.generate).not.toHaveBeenCalled();
    expect(mocks.save).not.toHaveBeenCalled();
  });
  it('permits an assigned professional only with current granted consent', async () => {
    mocks.bundle.mockResolvedValue({ intake: {}, consents: [{ ...consent, decision: 'granted' }] });
    expect((await request()).status).toBe(200);
    expect(mocks.generate).toHaveBeenCalledOnce();
  });
  it('does not treat menu consent as permission to generate follow-up messages', async () => {
    const menu = CONSENT_CATALOG.find(text => text.purpose === 'ai_menu_draft')!;
    mocks.bundle.mockResolvedValue({ intake: {}, consents: [{ ...menu, decision: 'granted' }] });
    expect((await request()).status).toBe(403);
    expect(mocks.generate).not.toHaveBeenCalled();
  });
  it('rejects another professional before reading private data or consent', async () => {
    mocks.actor.mockResolvedValue({ role: 'nutri', userId: 'user-b', nutritionistId: 'nutri-b' });
    expect((await request()).status).toBe(403);
    expect(mocks.patient).not.toHaveBeenCalled();
    expect(mocks.bundle).not.toHaveBeenCalled();
    expect(mocks.generate).not.toHaveBeenCalled();
  });
});
