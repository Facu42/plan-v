import { describe, expect, it, vi, afterEach } from 'vitest';
import { Hono } from 'hono';
import { featureFlags, registerFeatureRoutes } from './routes.js';

afterEach(() => vi.unstubAllEnvs());

describe('banderas de producto', () => {
  it('vienen apagadas si no están en true', () => {
    vi.stubEnv('REACTIVATION_CAMPAIGNS_ENABLED', 'false');
    vi.stubEnv('BIOIMPEDANCE_ENABLED', '');
    vi.stubEnv('LAB_DRAFT_ENABLED', '1');
    expect(featureFlags()).toEqual({ reactivation_campaigns: false, bioimpedance: false, lab_draft: false });
  });
  it('el endpoint repite las tres banderas y nada más', async () => {
    vi.stubEnv('REACTIVATION_CAMPAIGNS_ENABLED', 'true');
    vi.stubEnv('BIOIMPEDANCE_ENABLED', 'true');
    vi.stubEnv('LAB_DRAFT_ENABLED', 'true');
    const app = new Hono();
    registerFeatureRoutes(app);
    const body = await (await app.request('/api/features')).json();
    expect(body).toEqual({ reactivation_campaigns: true, bioimpedance: true, lab_draft: true });
    expect(JSON.stringify(body)).not.toMatch(/token|secret|key/i);
  });
});
