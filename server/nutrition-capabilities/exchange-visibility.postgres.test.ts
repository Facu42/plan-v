import { PGlite } from '@electric-sql/pglite';
import { readFile, readdir } from 'node:fs/promises';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
let db: PGlite, clinicA: string, clinicB: string;
const userA='00000000-0000-4000-a000-000000000081', userB='00000000-0000-4000-a000-000000000082';
const patientUserA='00000000-0000-4000-a000-000000000083', patientUserB='00000000-0000-4000-a000-000000000084';
const admin='00000000-0000-4000-a000-000000000085', reception='00000000-0000-4000-a000-000000000086';
const patientA='10000000-0000-4000-a000-000000000081', patientB='10000000-0000-4000-a000-000000000082';
async function asUser<T>(user: string, sql: string, args: unknown[] = []) { return db.transaction(async tx => { await tx.exec('set local role authenticated'); await tx.query("select set_config('request.jwt.claim.sub',$1,true)", [user]); return (await tx.query<T>(sql,args)).rows; }); }
async function rpc<T>(user: string, name: string, args: unknown[] = []) { return (await asUser<{r:T}>(user, `select public.${name}(${args.map((_,i) => '$'+(i+1)).join(',')}) as r`, args))[0].r; }
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls; create schema auth; create schema storage;
    grant usage on schema public,auth,storage to anon,authenticated,service_role;
    alter default privileges in schema public grant all on functions to anon,authenticated,service_role;
    alter default privileges in schema public grant all on tables to anon,authenticated,service_role;
    create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,last_sign_in_at timestamptz,raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text); alter table storage.objects enable row level security;
    create function storage.foldername(text) returns text[] language sql immutable as $$ select string_to_array($1,'/') $$;`);
  const dir=new URL('../../supabase/migrations/', import.meta.url);
  const names = (await readdir(dir)).filter(n => n.endsWith('.sql')).sort();
  for (const name of names) await db.exec(await readFile(new URL(name,dir),'utf8'));
  const manifest = JSON.parse(await readFile(new URL('../../docs/deployment/nutridesk-migrations-2026-10-13.json',import.meta.url),'utf8'));
  expect(names.filter(n => n >= manifest.firstVersion)).toHaveLength(manifest.migrations.length + manifest.baselineMigrations.length);
  expect(manifest.migrations.map((m: {file:string}) => m.file)).toContain('20261029195500_nutrition_exchange_visibility.sql');
  for (const [i,id] of [userA,userB,patientUserA,patientUserB,admin,reception].entries()) await db.query('insert into auth.users(id,email,email_confirmed_at) values($1,$2,now())',[id,`exchange${i}@example.test`]);
  clinicA=(await db.query<{id:string}>("select public.provision_nutritionist($1,'Nutri A') as id",[userA])).rows[0].id;
  clinicB=(await db.query<{id:string}>("select public.provision_nutritionist($1,'Nutri B') as id",[userB])).rows[0].id;
  await db.query("select public.provision_nutritionist($1,'Admin con perfil profesional')",[admin]);
  await db.query('insert into public.platform_admins(user_id) values($1)',[admin]);
  for(const [id,owner,user] of [[patientA,clinicA,patientUserA],[patientB,clinicB,patientUserB]]) await db.query("insert into public.patients(id,nutritionist_id,user_id,full_name,billing_status) values($1,$2,$3,'Paciente ficticia','waived')",[id,owner,user]);
  for (const [i,user] of [userA,userB].entries()) {
    const foodIds = [0,1].map(n => `f0000000-0000-4000-a000-0000000000${i}${n}`);
    for (const [n,id] of foodIds.entries()) await rpc(user,'save_food_catalog_item',[id,0,{name:`Alimento ${i}-${n}`,brand:'',category:'Frutas',kind:'food',source:'Etiqueta',reference:'Nota interna alimento',nutrients:{kcal:100,protein:1,carbs:20,fat:1,fiber:null,sodium:null,calcium:null,iron:null,potassium:null,magnesium:null,vitamin_c:null},portions:[{name:'Porción',grams:150}]}]);
    await rpc(user,'save_nutrition_exchange',[{id:`e0000000-0000-4000-a000-00000000000${i}`,expected_revision:0,name:`Grupo ${i}`,reference:'Nota interna profesional',reviewed:true,items:foodIds.map(food_id=>({food_id,food_revision:1,grams:150}))}]);
  }
},60000);
afterAll(async () => { await db?.close(); });
describe('interruptor de equivalencias: Postgres, RPC real y aislamiento A/B', () => {
  it('inicia apagado por consultorio y no expone grupos a ninguna paciente', async () => {
    for (const u of [userA,userB]) expect(await rpc(u,'nutrition_exchange_visibility')).toEqual({enabled:false,revision:0});
    expect(await rpc(patientUserA,'list_patient_nutrition_exchanges',[patientA])).toEqual({enabled:false,groups:[]});
    expect(await rpc(patientUserB,'list_patient_nutrition_exchanges',[patientB])).toEqual({enabled:false,groups:[]});
  });
  it('publica solo la proyección de grupos del titular y no filtra notas ni owner UUID', async () => {
    expect(await rpc(userA,'save_nutrition_exchange_visibility',[0,true])).toEqual({enabled:true,revision:1});
    const result=await rpc<{enabled:boolean;groups:Array<{name:string;items:Array<{food:{name:string}}>} >}>(patientUserA,'list_patient_nutrition_exchanges',[patientA]);
    expect(result.enabled).toBe(true); expect(result.groups).toHaveLength(1); expect(result.groups[0].name).toBe('Grupo 0'); expect(result.groups[0].items[0].food.name).toBe('Alimento 0-0');
    for (const forbidden of ['Nota interna',clinicA,clinicB,'owner_id','reference']) expect(JSON.stringify(result)).not.toContain(forbidden);
    await expect(rpc(userB,'list_patient_nutrition_exchanges',[patientA])).rejects.toMatchObject({code:'42501'});
    await expect(rpc(patientUserA,'list_patient_nutrition_exchanges',[patientB])).rejects.toMatchObject({code:'42501'});
    await expect(rpc(patientUserB,'list_patient_nutrition_exchanges',[patientA])).rejects.toMatchObject({code:'42501'});
  });
  it('CAS rechaza el escritor viejo y apagar retira inmediatamente los grupos', async () => {
    const results=await Promise.allSettled([rpc(userA,'save_nutrition_exchange_visibility',[1,false]),rpc(userA,'save_nutrition_exchange_visibility',[1,true])]);
    expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);
    const rejection=results.find(r=>r.status==='rejected') as PromiseRejectedResult; expect(rejection.reason).toMatchObject({code:'PT409'});
    expect(await rpc(userA,'nutrition_exchange_visibility')).toEqual({enabled:false,revision:2});
    expect(await rpc(patientUserA,'list_patient_nutrition_exchanges',[patientA])).toEqual({enabled:false,groups:[]});
    expect(await rpc(userB,'save_nutrition_exchange_visibility',[0,true])).toEqual({enabled:true,revision:1});
    expect(await rpc(patientUserB,'list_patient_nutrition_exchanges',[patientB])).toMatchObject({enabled:true,groups:[{name:'Grupo 1'}]});
    expect(await rpc(userA,'nutrition_exchange_visibility')).toEqual({enabled:false,revision:2});
  });
  it('niega a administrador aun con perfil nutri, recepción y paciente la escritura y configuración ajena', async () => {
    for (const u of [admin,reception,patientUserA,patientUserB]) {
      await expect(rpc(u,'nutrition_exchange_visibility')).rejects.toMatchObject({code:'42501'});
      await expect(rpc(u,'save_nutrition_exchange_visibility',[0,true])).rejects.toMatchObject({code:'42501'});
    }
    for (const u of [admin,reception]) await expect(rpc(u,'list_patient_nutrition_exchanges',[patientA])).rejects.toMatchObject({code:'42501'});
    await expect(asUser(userA,'select * from private.nutrition_exchange_visibility')).rejects.toMatchObject({code:'42501'});
    await expect(asUser(patientUserA,'update private.nutrition_exchange_visibility set enabled=true')).rejects.toMatchObject({code:'42501'});
    const privileges=(await db.query<{allowed:boolean}>("select has_function_privilege('anon','public.list_patient_nutrition_exchanges(uuid)','execute') as allowed")).rows[0]; expect(privileges.allowed).toBe(false);
  });
  it('la cadena completa publica g/ml con su unidad nativa, sin densidades ni gramos inferidos', async () => {
    const ml = (await db.query<{id:string;revision:number}>("select id,revision from public.food_catalog where payload->>'name'='Ensure Plus (mililitro)' and payload#>>'{composition,basis,unit}'='ml'")).rows[0];
    expect(ml).toBeDefined();
    const input={id:'e0000000-0000-4000-a000-000000000009',expected_revision:0,name:'Mixto g/ml revisado',reference:'Referencia privada',reviewed:true,items:[{food_id:ml.id,food_revision:ml.revision,quantity:50,unit:'ml'},{food_id:'f0000000-0000-4000-a000-000000000000',food_revision:1,quantity:100,unit:'g'}]};
    await rpc(userA,'save_nutrition_exchange',[input]);
    const state=await rpc<{revision:number}>(userA,'nutrition_exchange_visibility');
    await rpc(userA,'save_nutrition_exchange_visibility',[state.revision,true]);
    const view=await rpc<{groups:Array<{name:string;items:Array<{quantity:number;unit:string;food:{id:string}}>} >}>(patientUserA,'list_patient_nutrition_exchanges',[patientA]);
    const items=view.groups.find(g=>g.name==='Mixto g/ml revisado')!.items;
    expect(items[0]).toMatchObject({quantity:50,unit:'ml',food:{id:ml.id}});
    expect(items[1]).toMatchObject({quantity:100,unit:'g'});
    expect(items[0]).not.toHaveProperty('grams');
    expect(items[0].food).not.toHaveProperty('owner_id');
    await expect(rpc(userA,'save_nutrition_exchange',[{...input,id:'e0000000-0000-4000-a000-000000000008',items:[{food_id:ml.id,food_revision:ml.revision,grams:50},input.items[1]]}])).rejects.toMatchObject({code:'22023'});
  });
  it('la lectura niega paciente archivada/desactivada/anonimizada y sesión vacía', async () => {
    for (const field of ['archived_at','deactivated_at','anonymized_at']) {
      await db.query(`update public.patients set ${field}=now() where id=$1`,[patientB]);
      await expect(rpc(patientUserB,'list_patient_nutrition_exchanges',[patientB])).rejects.toMatchObject({code:'42501'});
      await expect(rpc(userB,'list_patient_nutrition_exchanges',[patientB])).rejects.toMatchObject({code:'42501'});
      await db.query(`update public.patients set ${field}=null where id=$1`,[patientB]);
    }
    await expect(rpc('','list_patient_nutrition_exchanges',[patientB])).rejects.toMatchObject({code:'42501'});
  });
});
