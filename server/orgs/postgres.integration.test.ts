import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { CareLinkView, OrganizationView, OwnershipTransferView } from '../../src/types/orgs.js';

let db: PGlite;
let dir: string;
let nutriAId = '';
let nutriBId = '';
let nutriCId = '';
const nutriA = '00000000-0000-4000-a000-0000000000a1';
const nutriB = '00000000-0000-4000-a000-0000000000b1';
const nutriC = '00000000-0000-4000-a000-0000000000c1';
const patientAUser = '00000000-0000-4000-a000-0000000000a2';
const patientBUser = '00000000-0000-4000-a000-0000000000b2';
const patientA = '10000000-0000-4000-a000-0000000000a1';
const patientB = '10000000-0000-4000-a000-0000000000b1';

async function asUser<T = Record<string, unknown>>(user: string, sql: string, params: unknown[] = []) {
  return db.transaction(async (tx) => {
    await tx.exec('set local role authenticated');
    await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [user]);
    return (await tx.query<T>(sql, params)).rows;
  });
}

async function rpc(user: string, name: string, args: unknown[] = []) {
  const placeholders = args.map((_, i) => `$${i + 1}`).join(',');
  const sql = placeholders
    ? `select public.${name}(${placeholders}) as result`
    : `select public.${name}() as result`;
  const rows = await asUser<{ result: unknown }>(user, sql, args);
  return rows[0].result;
}

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'plan-v-orgs-'));
  db = new PGlite(dir);
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create schema storage;
    grant usage on schema public, auth, storage to authenticated, anon, service_role;
    create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);
    alter table storage.objects enable row level security;
    create function storage.foldername(text) returns text[] language sql immutable as $$ select string_to_array($1,'/') $$;
    grant select,insert,delete on storage.objects to authenticated;
  `);
  const migrations = new URL('../../supabase/migrations/', import.meta.url);
  for (const file of (await readdir(migrations)).filter((name) => name.endsWith('.sql')).sort()) {
    try { await db.exec(await readFile(new URL(file, migrations), 'utf8')); }
    catch (error) { console.error(file, JSON.stringify(error)); throw error; }
  }
  for (const [id, email] of [
    [nutriA, 'nutri-a@example.test'],
    [nutriB, 'nutri-b@example.test'],
    [nutriC, 'nutri-c@example.test'],
    [patientAUser, 'paciente-a@example.test'],
    [patientBUser, 'paciente-b@example.test'],
  ] as const) {
    await db.query('insert into auth.users(id,email,email_confirmed_at) values($1,$2,now())', [id, email]);
  }
  nutriAId = (await db.query<{ id: string }>("select public.provision_nutritionist($1,'Nutri A') as id", [nutriA])).rows[0].id;
  nutriBId = (await db.query<{ id: string }>("select public.provision_nutritionist($1,'Nutri B') as id", [nutriB])).rows[0].id;
  nutriCId = (await db.query<{ id: string }>("select public.provision_nutritionist($1,'Nutri C') as id", [nutriC])).rows[0].id;
  await db.query(
    `insert into public.patients(id,nutritionist_id,user_id,full_name,plan_b,billing_status)
     values ($1,$2,$3,'Paciente A','','waived'),($4,$5,$6,'Paciente B','','waived')`,
    [patientA, nutriAId, patientAUser, patientB, nutriBId, patientBUser],
  );
}, 60000);

afterAll(async () => {
  await db?.close();
  if (dir) await rm(dir, { recursive: true, force: true });
});

describe('PV-38 organizaciones en PostgreSQL descartable', () => {
  it('aísla el consultorio, delega, observa y transfiere ownership con hijos', async () => {
    const org = await rpc(nutriA, 'create_organization', ['Consultorio Sur', 'consultorio-sur']) as OrganizationView;
    expect(org.subscription.status).toBe('waived');
    expect(org.teams[0].name).toBe('consultorio');
    expect(JSON.stringify(org)).not.toMatch(/mercadopago|stripe_secret|provider_customer/i);

    expect(await rpc(nutriB, 'list_my_organizations') as OrganizationView[]).toEqual([]);
    await expect(rpc(nutriB, 'org_snapshot', [org.id])).rejects.toMatchObject({ code: '42501' });
    await expect(rpc(patientAUser, 'create_organization', ['No', 'no-paciente'])).rejects.toMatchObject({ code: '42501' });

    await rpc(nutriA, 'invite_org_member', [org.id, nutriBId, 'member']);
    await rpc(nutriB, 'accept_org_invite', [org.id]);
    expect((await rpc(nutriB, 'list_my_organizations') as OrganizationView[])[0].id).toBe(org.id);
    await expect(rpc(nutriC, 'list_my_organizations')).resolves.toEqual([]);

    const delegated = await rpc(nutriA, 'delegate_patient_care', [patientA, nutriBId, 'delegate', org.id]) as CareLinkView[];
    expect(delegated.some((row) => row.nutritionist_id === nutriBId && row.link_role === 'delegate')).toBe(true);
    expect(await rpc(nutriB, 'can_care_for_patient', [patientA])).toBe(true);
    expect(await rpc(nutriC, 'can_care_for_patient', [patientA])).toBe(false);
    await expect(rpc(nutriC, 'list_patient_care_links', [patientA])).rejects.toMatchObject({ code: '42501' });

    const observer = await rpc(nutriA, 'invite_org_member', [org.id, nutriCId, 'member']) as OrganizationView;
    expect(observer.members.some((row) => row.nutritionist_id === nutriCId)).toBe(true);
    await rpc(nutriC, 'accept_org_invite', [org.id]);
    const observed = await rpc(nutriA, 'delegate_patient_care', [patientA, nutriCId, 'observer', org.id]) as CareLinkView[];
    expect(observed.some((row) => row.link_role === 'observer' && row.nutritionist_id === nutriCId)).toBe(true);
    expect(await rpc(nutriC, 'can_care_for_patient', [patientA])).toBe(false);

    const linkId = delegated.find((row) => row.link_role === 'delegate')?.id as string;
    await rpc(nutriA, 'revoke_patient_care', [linkId]);
    expect(await rpc(nutriB, 'can_care_for_patient', [patientA])).toBe(false);

    await db.query(
      `insert into public.shopping_manual_items(patient_id,nutritionist_id,name,quantity,unit,client_id)
       values ($1,$2,'Tomate',2,'u',gen_random_uuid())`,
      [patientA, nutriAId],
    );
    await db.query(
      `insert into public.measurements(id,patient_id,nutritionist_id,kind,value_numeric,unit,source,captured_on)
       values (gen_random_uuid(),$1,$2,'weight',61,'kg','professional',current_date)`,
      [patientA, nutriAId],
    );

    const transfer = await rpc(nutriA, 'transfer_patient_ownership', [patientA, nutriBId, 'cobertura']) as OwnershipTransferView;
    expect(transfer.from_nutritionist_id).toBe(nutriAId);
    expect(transfer.to_nutritionist_id).toBe(nutriBId);
    expect(transfer.child_tables).toEqual(expect.arrayContaining(['shopping_manual_items', 'measurements']));

    const owner = (await db.query<{ nutritionist_id: string }>(
      'select nutritionist_id from public.patients where id = $1',
      [patientA],
    )).rows[0].nutritionist_id;
    expect(owner).toBe(nutriBId);
    expect((await db.query<{ nutritionist_id: string }>(
      'select nutritionist_id from public.shopping_manual_items where patient_id = $1',
      [patientA],
    )).rows[0].nutritionist_id).toBe(nutriBId);
    expect((await db.query<{ nutritionist_id: string }>(
      'select nutritionist_id from public.measurements where patient_id = $1',
      [patientA],
    )).rows[0].nutritionist_id).toBe(nutriBId);
    expect(await rpc(nutriB, 'is_assigned_patient', [patientA])).toBe(true);
    expect(await rpc(nutriA, 'is_assigned_patient', [patientA])).toBe(false);
    await expect(rpc(nutriA, 'list_patient_care_links', [patientA])).rejects.toMatchObject({ code: '42501' });
  });

  it('bloquea delegar con suscripción cancelada y falla cerrado sin RPC', async () => {
    const org = await rpc(nutriB, 'create_organization', ['Consultorio Pausa', 'consultorio-pausa']) as OrganizationView;
    await rpc(nutriB, 'invite_org_member', [org.id, nutriCId, 'member']);
    await rpc(nutriC, 'accept_org_invite', [org.id]);
    await expect(rpc(nutriB, 'set_organization_subscription_status', [org.id, 'active', ''])).rejects.toMatchObject({ code: '22023' });
    await rpc(nutriB, 'set_organization_subscription_status', [org.id, 'canceled', 'cierra el piloto']);
    await expect(rpc(nutriB, 'delegate_patient_care', [patientB, nutriCId, 'delegate', org.id])).rejects.toMatchObject({ code: '22023' });

    await db.exec('drop function public.list_my_organizations()');
    await expect(rpc(nutriB, 'list_my_organizations')).rejects.toMatchObject({ code: '42883' });
  });
});
