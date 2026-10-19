import {describe,expect,it} from 'vitest';
import {buildAccompanimentMetrics} from './accompaniment';

const now=new Date('2026-10-20T02:59:59Z');
const patients=[
 {id:'a',name:'Ana',created_at:'2026-01-01T12:00:00Z',adherence_score:0,goal_status:'completed',goal_progress:100,goal_updated_at:'2026-10-18T12:00:00Z'},
 {id:'b',name:'Bea',created_at:'2026-10-01T12:00:00Z',adherence_score:80,goal_status:'active',goal_progress:0},
 {id:'archived',name:'Archivada',created_at:'2026-08-01T12:00:00Z',archived_at:'2026-10-10T12:00:00Z',archive_reason:'Mudanza'},
];
const meal=(id:string,patient_id:string,logged_at:string)=>({id,patient_id,logged_at,status:'pending_review',slot:'Almuerzo'});

describe('resúmenes autorizados de acompañamiento',()=>{
 it('cuenta el período completo, días únicos y medianoche argentina sin incluir ajenas ni futuras',()=>{
  const meals=Array.from({length:65},(_,i)=>meal(String(i),'a','2026-10-19T15:00:00Z'));
  meals.push(meal('edge','b','2026-10-20T02:59:59Z'),meal('future','b','2026-10-20T03:00:00Z'),meal('foreign','other','2026-10-19T15:00:00Z'),meal('archived','archived','2026-10-19T15:00:00Z'));
  const data=buildAccompanimentMetrics({patients,meals,habits:[],measurements:[],permissions:{a:['care_relationship'],b:['care_relationship']}},30,now);
  expect(data.totals.meals).toBe(66);expect(data.week.find(p=>p.id==='a')?.recorded_days).toBe(1);
  expect(data.week.find(p=>p.id==='b')?.days[6]).toBe(true);
  expect(data.totals.adherence).toBe(40);expect(data.totals.active).toBe(2);
 });
 it('no muestra metas ni hábitos sin Atención y no sustituye agua ausente por cero',()=>{
  const data=buildAccompanimentMetrics({patients,meals:[],habits:[{patient_id:'a',date:'2026-10-19',hydration:8,energy:'Alta',symptoms:['hinchazon']}],measurements:[],permissions:{a:[],b:['care_relationship']}},30,now);
  expect(data.wellbeing).toHaveLength(0);expect(data.totals.water_glasses).toBeNull();expect(data.totals.adherence).toBe(80);
  expect(data.goals.map(g=>g.id)).toEqual(['b']);expect(data.goals[0].progress).toBe(0);expect(data.totals.completed_goals).toBe(0);
 });
 it('altas y bajas salen de fechas propias y no del listado activo solamente',()=>{
  const data=buildAccompanimentMetrics({patients,meals:[],habits:[],measurements:[],permissions:{}},90,now);
  expect(data.movements.find(m=>m.month==='2026-10')).toMatchObject({joined:1,left:1});
  expect(data.totals.retained).toBe(1);expect(data.archive_reasons).toEqual([{reason:'Mudanza',count:1}]);
 });
 it('una medición requiere permiso y no mezcla unidades ni fechas futuras',()=>{
  const measurements=[{id:'first',patient_id:'a',kind:'weight',value_numeric:70,unit:'kg',captured_on:'2026-10-01'}, {id:'last',patient_id:'a',kind:'weight',value_numeric:68,unit:'kg',captured_on:'2026-10-19'}, {id:'lb',patient_id:'a',kind:'weight',value_numeric:150,unit:'lb',captured_on:'2026-10-19'}, {id:'future',patient_id:'a',kind:'weight',value_numeric:60,unit:'kg',captured_on:'2026-10-20'}];
  const input={patients,meals:[],habits:[],measurements,permissions:{a:['measurement']}};
  expect(buildAccompanimentMetrics(input,30,now).totals.weight_decreased).toBe(1);
  expect(buildAccompanimentMetrics({...input,permissions:{}},30,now).totals.weight_decreased).toBe(0);
 });
 it('seis meses se cuentan por calendario y un alta reciente no recibe aviso de siete días',()=>{
  const people=[{id:'old',name:'Abril',created_at:'2026-04-30T12:00:00Z'},{id:'short',name:'Mayo',created_at:'2026-05-01T12:00:00Z'},{id:'new',name:'Nueva',created_at:'2026-10-30T12:00:00Z'}];
  const data=buildAccompanimentMetrics({patients:people,meals:[],habits:[],measurements:[],permissions:{}},30,new Date('2026-10-31T18:00:00Z'));
  expect(data.totals.retained).toBe(1);expect(data.quiet.map(p=>p.id)).not.toContain('new');
 });
 it('agua declarada en cero y actividad cuentan sin inventar litros ni avisar que no hay registros',()=>{
  const data=buildAccompanimentMetrics({patients,meals:[],habits:[{patient_id:'a',date:'2026-10-19',hydration:0,hydration_declared:true}],measurements:[],activities:[{patient_id:'b',logged_at:'2026-10-19T12:00:00Z'}],permissions:{a:['care_relationship'],b:['care_relationship']}},30,now);
  expect(data.totals.water_glasses).toBe(0);expect(data.totals.activity_days).toBe(0.5);
  expect(data.week.find(p=>p.id==='b')?.recorded_days).toBe(1);expect(data.quiet).toHaveLength(0);
 });
 it('un registro de pasos es actividad registrada aunque no tenga agua, sueño ni comidas',()=>{
  const data=buildAccompanimentMetrics({patients,meals:[],habits:[{patient_id:'a',date:'2026-10-19',hydration:0,steps:4000}],measurements:[],permissions:{}},30,now);
  expect(data.week.find(p=>p.id==='a')?.recorded_days).toBe(1);expect(data.quiet.map(p=>p.id)).not.toContain('a');
 });
});
it('mismo peso durante cuatro semanas requiere medidas autorizadas y no afirma un diagnóstico',()=>{
 const input={patients,meals:[],habits:[],permissions:{a:['measurement']},measurements:[{id:'1',patient_id:'a',kind:'weight',unit:'kg',value_numeric:70,captured_on:'2026-09-20'},{id:'2',patient_id:'a',kind:'weight',unit:'kg',value_numeric:70,captured_on:'2026-10-19'}]};
 expect(buildAccompanimentMetrics(input,90,now).unchanged).toEqual([{id:'a',name:'Ana',kind:'weight',value:70,unit:'kg',from:'2026-09-20',to:'2026-10-19'}]);
 expect(buildAccompanimentMetrics({...input,permissions:{}},90,now).unchanged).toEqual([]);
});
