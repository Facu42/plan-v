import { beforeAll, afterAll, expect, it } from 'vitest';
import { openMigratedDatabase } from '../security/public-view-grants.js';
let db: Awaited<ReturnType<typeof openMigratedDatabase>>;
const owner = '00000000-0000-4000-a000-000000000301', other = '00000000-0000-4000-a000-000000000302', patientUser = '00000000-0000-4000-a000-000000000303', admin = '00000000-0000-4000-a000-000000000304', reception = '00000000-0000-4000-a000-000000000305';
const target = '10000000-0000-4000-a000-000000000301';
const origin = { file: 'historia.xlsx', fingerprint: 'a'.repeat(64), sheet: 'Medidas', page: 2, row: 7 };
async function actor(user: string, sql: string, params: unknown[] = []) {
  return db.transaction(async tx => { await tx.exec('set local role authenticated'); await tx.query("select set_config('request.jwt.claim.sub',$1,true)", [user]); return (await tx.query(sql, params)).rows as Record<string, any>[]; });
}
const read = (user = owner,id=target) => actor(user, 'select public.export_patient_imported_history($1) result', [id]);
beforeAll(async () => {
  db = await openMigratedDatabase();
  for (const user of [owner, other, patientUser, admin, reception]) await db.query('insert into auth.users(id,email,email_confirmed_at)values($1,$2,now())', [user, `${user}@example.test`]);
  for (const user of [owner, other]) await db.query('select public.provision_nutritionist($1,$2)', [user, 'Consultorio ficticio']);
  await db.query('insert into public.platform_admins(user_id)values($1)',[admin]);
  await db.query('insert into public.scheduling_staff_members(nutritionist_id,user_id,granted_by)select id,$2,$1 from public.nutritionists where user_id=$1',[owner,reception]);
  await db.query("insert into public.patients(id,nutritionist_id,full_name,billing_status)select $1,id,'Ficha sin cuenta','waived'from public.nutritionists where user_id=$2", [target, owner]);
  await actor(owner, 'select public.record_patient_import_authorization($1,$2,0,$3::jsonb)', [target, crypto.randomUUID(), JSON.stringify({ obtained_on: '2026-10-01', source: 'Permiso escrito específico', document: { file: 'permiso.pdf', fingerprint: 'b'.repeat(64) }, purposes: ['history', 'measurement'], confirmed: true })]);
  for (const category of ['history', 'study', 'plan']) await db.query("insert into public.patient_import_history(patient_id,nutritionist_id,category,body,origin)select $1,id,$3,$4,$5::jsonb from public.nutritionists where user_id=$2", [target, owner, category, `Original ${category}`, JSON.stringify(origin)]);
  await db.query("insert into public.patient_import_measurements(patient_id,nutritionist_id,kind,value,unit,recorded_on,origin)select $1,id,'weight',132.25,'lb','2020-09-01',$3::jsonb from public.nutritionists where user_id=$2", [target, owner, JSON.stringify(origin)]);
}, 60_000);
afterAll(async () => { await db?.close(); });
it('exporta sólo propósitos autorizados sin incluir clínica actual, notas ni cálculos', async () => {
  const pkg = (await read())[0].result;
  expect(Object.keys(pkg).sort()).toEqual(['imported_history', 'imported_measurements', 'patient']);
  expect(pkg.patient).toEqual({ id: target, name: 'Ficha sin cuenta' });
  expect(pkg.imported_history).toHaveLength(1); expect(pkg.imported_history[0]).toMatchObject({ category: 'history', body: 'Original history', origin });
  expect(pkg.imported_measurements).toHaveLength(1); expect(pkg.imported_measurements[0]).toMatchObject({ value: 132.25, unit: 'lb', recorded_on: '2020-09-01', origin });
  expect((await db.query('select id from public.measurements where patient_id=$1', [target])).rows).toEqual([]);
  expect((await db.query("select id from public.audit_events where action='imported_clinical_export'and patient_id=$1", [target])).rows).toHaveLength(1);
});
it('no permite acceso a otro consultorio, paciente, administrador, recepción ni anon', async () => {
  for (const user of [other, patientUser, admin, reception]) await expect(read(user)).rejects.toMatchObject({ code: '42501' });
  await expect(db.transaction(async tx => { await tx.exec('set local role anon'); await tx.query('select public.export_patient_imported_history($1)', [target]); })).rejects.toMatchObject({ code: '42501' });
});
it('una cuenta vinculada con atención parcial recibe sólo historia y planes, sin estudios ni medidas',async()=>{
  const linked=crypto.randomUUID();
  await db.query("insert into public.patients(id,nutritionist_id,user_id,full_name,billing_status)select $1,id,$3,'Paciente vinculada','waived'from public.nutritionists where user_id=$2",[linked,owner,patientUser]);
  for(const category of ['history','study','plan'])await db.query("insert into public.patient_import_history(patient_id,nutritionist_id,category,body,origin)select $1,id,$3,'Texto original autorizado por categoría',$4::jsonb from public.nutritionists where user_id=$2",[linked,owner,category,JSON.stringify(origin)]);
  await db.query("insert into public.patient_import_measurements(patient_id,nutritionist_id,kind,value,unit,recorded_on,origin)select $1,id,'weight',60,'kg','2020-09-01',$3::jsonb from public.nutritionists where user_id=$2",[linked,owner,JSON.stringify(origin)]);
  const consent=(await db.query<{text_version:string;text_hash:string}>("select text_version,text_hash from public.consent_catalog where purpose='care_relationship'")).rows[0];
  await actor(patientUser,"select public.record_patient_consent($1,'care_relationship',$2,$3,'granted')",[linked,consent.text_version,consent.text_hash]);
  const pkg=(await read(owner,linked))[0].result;
  expect(pkg.imported_history.map((h:{category:string})=>h.category).sort()).toEqual(['history','plan']);
  expect(pkg.imported_measurements).toEqual([]);
  await expect(read(patientUser,linked)).rejects.toMatchObject({code:'42501'});
  await actor(patientUser,"select public.record_patient_consent($1,'care_relationship',$2,$3,'withdrawn')",[linked,consent.text_version,consent.text_hash]);
  await expect(read(owner,linked)).rejects.toMatchObject({code:'42501'});
});
it('reasignar una ficha con evidencia activa no transfiere la autorización del actor anterior',async()=>{
  const moved=crypto.randomUUID();
  await db.query("insert into public.patients(id,nutritionist_id,full_name,billing_status)select $1,id,'Ficha reasignada','waived'from public.nutritionists where user_id=$2",[moved,owner]);
  await actor(owner,'select public.record_patient_import_authorization($1,$2,0,$3::jsonb)',[moved,crypto.randomUUID(),JSON.stringify({obtained_on:'2026-10-01',source:'Autorización específica anterior',document:{file:'permiso.pdf',fingerprint:'c'.repeat(64)},purposes:['history'],confirmed:true})]);
  await db.query("insert into public.patient_import_history(patient_id,nutritionist_id,category,body,origin)select $1,id,'history','Antecedente previo',$3::jsonb from public.nutritionists where user_id=$2",[moved,owner,JSON.stringify(origin)]);
  expect((await read(owner,moved))[0].result.imported_history).toHaveLength(1);
  await db.transaction(async tx=>{
    await tx.exec('set constraints all deferred');
    await tx.query('update public.patient_import_history set nutritionist_id=(select id from public.nutritionists where user_id=$2)where patient_id=$1',[moved,other]);
    await tx.query('update public.patients set nutritionist_id=(select id from public.nutritionists where user_id=$2)where id=$1',[moved,other]);
  });
  await expect(read(owner,moved)).rejects.toMatchObject({code:'42501'});
  await expect(read(other,moved)).rejects.toMatchObject({code:'42501'});
});
it('retirar evidencia corta exportación y reasignar no transfiere la autorización al nuevo titular', async () => {
  await actor(owner, 'select public.revoke_patient_import_authorization($1,$2,1,$3)', [target, crypto.randomUUID(), 'Retiro solicitado']);
  await expect(read()).rejects.toMatchObject({ code: '42501' });
  await db.transaction(async tx=>{
    await tx.exec('set constraints all deferred');
    await tx.query('update public.patient_import_history set nutritionist_id=(select id from public.nutritionists where user_id=$2)where patient_id=$1',[target,other]);
    await tx.query('update public.patients set nutritionist_id=(select id from public.nutritionists where user_id=$2)where id=$1',[target,other]);
  });
  await expect(read()).rejects.toMatchObject({ code: '42501' });
  await expect(read(other)).rejects.toMatchObject({ code: '42501' });
});
