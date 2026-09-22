import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../index.js';
import { getPatient, resetStore } from '../store.js';
import { CareError, orgDbError } from './repository.js';
import { DEMO_OWNER_NUTRITIONIST_ID, DEMO_PEER_NUTRITIONIST_ID, demoPatientOwner } from './memory.js';
import type { CareLinkView, OrganizationView, OrgSubscriptionView, OwnershipTransferView } from '../../src/types/orgs.js';

const patient = 'pat-sofia';

function request(path: string, body?: unknown, method = 'POST') {
  return app.request(path, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function asJson<T>(response: Response) {
  return { status: response.status, body: await response.json() as T };
}

describe('PV-38 organizaciones, equipos y ownership', () => {
  beforeEach(() => resetStore());

  it('crea un consultorio con equipo y suscripción B2B waived, sin claves de cobro', async () => {
    const created = await asJson<{ organization: OrganizationView; source: string }>(
      await request('/api/orgs?audience=pro', { name: 'Consultorio Sur', slug: 'consultorio-sur' }),
    );
    expect(created.status).toBe(201);
    expect(created.body.source).toBe('memory');
    expect(created.body.organization.slug).toBe('consultorio-sur');
    expect(created.body.organization.teams[0].name).toBe('consultorio');
    expect(created.body.organization.subscription).toMatchObject({
      status: 'waived',
      plan_code: 'b2b_team',
      note: 'piloto gratuito manual',
    });
    expect(JSON.stringify(created.body)).not.toMatch(/mercadopago|stripe_secret|provider_customer|OPENAI_API_KEY/i);

    const listed = await asJson<{ organizations: OrganizationView[] }>(await app.request('/api/orgs?audience=pro'));
    expect(listed.body.organizations).toHaveLength(1);

    const outsider = await asJson<{ organizations: OrganizationView[] }>(
      await app.request(`/api/orgs?audience=pro&as=${DEMO_PEER_NUTRITIONIST_ID}`),
    );
    expect(outsider.body.organizations).toEqual([]);
    expect((await request('/api/orgs?audience=patient', { name: 'No', slug: 'no-paciente' })).status).toBe(403);
  });

  it('invita, delega, aísla al observador y transfiere el dueño clínico', async () => {
    const created = await asJson<{ organization: OrganizationView }>(
      await request('/api/orgs?audience=pro', { name: 'Equipo Norte', slug: 'equipo-norte' }),
    );
    const orgId = created.body.organization.id;
    expect((await request(`/api/orgs/${orgId}/members?audience=pro`, {
      nutritionist_id: DEMO_PEER_NUTRITIONIST_ID,
      role: 'member',
    })).status).toBe(200);
    expect((await request(`/api/orgs/${orgId}/members/accept?audience=pro&as=${DEMO_PEER_NUTRITIONIST_ID}`)).status).toBe(200);

    const delegated = await asJson<{ links: CareLinkView[] }>(await request(`/api/patients/${patient}/care-links?audience=pro`, {
      nutritionist_id: DEMO_PEER_NUTRITIONIST_ID,
      organization_id: orgId,
      role: 'delegate',
    }));
    expect(delegated.status).toBe(200);
    expect(delegated.body.links.some((row) => row.link_role === 'delegate' && !row.revoked_at)).toBe(true);

    const asPeer = await asJson<{ links: CareLinkView[] }>(
      await app.request(`/api/patients/${patient}/care-links?audience=pro&as=${DEMO_PEER_NUTRITIONIST_ID}`),
    );
    expect(asPeer.status).toBe(200);

    const observerOrg = await asJson<{ organization: OrganizationView }>(
      await request('/api/orgs?audience=pro', { name: 'Otro', slug: 'otro-consultorio' }),
    );
    expect((await request(`/api/patients/${patient}/care-links?audience=pro`, {
      nutritionist_id: DEMO_PEER_NUTRITIONIST_ID,
      organization_id: observerOrg.body.organization.id,
      role: 'observer',
    })).status).toBe(400);

    const linkId = delegated.body.links.find((row) => row.link_role === 'delegate')?.id as string;
    expect((await request(`/api/patients/${patient}/care-links/${linkId}?audience=pro`, undefined, 'DELETE')).status).toBe(200);
    expect((await app.request(`/api/patients/${patient}/care-links?audience=pro&as=${DEMO_PEER_NUTRITIONIST_ID}`)).status).toBe(403);

    const transferred = await asJson<{ transfer: OwnershipTransferView }>(
      await request(`/api/patients/${patient}/transfer-ownership?audience=pro`, {
        nutritionist_id: DEMO_PEER_NUTRITIONIST_ID,
        reason: 'cobertura de licencia',
      }),
    );
    expect(transferred.status).toBe(200);
    expect(transferred.body.transfer.from_nutritionist_id).toBe(DEMO_OWNER_NUTRITIONIST_ID);
    expect(transferred.body.transfer.to_nutritionist_id).toBe(DEMO_PEER_NUTRITIONIST_ID);
    expect(demoPatientOwner(patient)).toBe(DEMO_PEER_NUTRITIONIST_ID);
    expect(getPatient(patient)?.id).toBe(patient);
    expect((await app.request(`/api/patients/${patient}/care-links?audience=pro`)).status).toBe(403);
    expect((await app.request(`/api/patients/${patient}/care-links?audience=pro&as=${DEMO_PEER_NUTRITIONIST_ID}`)).status).toBe(200);
  });

  it('bloquea una delegación nueva si la suscripción B2B está cancelada', async () => {
    const created = await asJson<{ organization: OrganizationView }>(
      await request('/api/orgs?audience=pro', { name: 'Consultorio Pausa', slug: 'consultorio-pausa' }),
    );
    const orgId = created.body.organization.id;
    await request(`/api/orgs/${orgId}/members?audience=pro`, {
      nutritionist_id: DEMO_PEER_NUTRITIONIST_ID,
      role: 'member',
    });
    await request(`/api/orgs/${orgId}/members/accept?audience=pro&as=${DEMO_PEER_NUTRITIONIST_ID}`);
    const canceled = await asJson<{ subscription: OrgSubscriptionView }>(
      await request(`/api/orgs/${orgId}/subscription?audience=pro`, { status: 'canceled' }, 'PATCH'),
    );
    expect(canceled.status).toBe(200);
    expect(canceled.body.subscription.status).toBe('canceled');
    expect((await request(`/api/orgs/${orgId}/subscription?audience=pro`, { status: 'active' }, 'PATCH')).status).toBe(400);
    expect((await request(`/api/patients/${patient}/care-links?audience=pro`, {
      nutritionist_id: DEMO_PEER_NUTRITIONIST_ID,
      organization_id: orgId,
      role: 'delegate',
    })).status).toBe(400);
  });

  it('cierra en 501 si falta el schema persistente', () => {
    expect(() => orgDbError({ code: '42P01' })).toThrow(CareError);
    for (const code of ['42883', 'PGRST202', 'PGRST205']) {
      try {
        orgDbError({ code });
        throw new Error('expected CareError');
      } catch (error) {
        expect(error).toMatchObject({ status: 501 });
      }
    }
    expect(() => orgDbError({ code: '42501' })).toThrow(CareError);
    try {
      orgDbError({ code: '42501' });
      throw new Error('expected CareError');
    } catch (error) {
      expect(error).toMatchObject({ status: 403 });
    }
  });
});
