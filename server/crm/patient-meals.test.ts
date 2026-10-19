import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {loadPatientMealPage,patientMealQuerySchema} from './patient-meals';
import type {WorkScope} from './repository';
import {getPatient,resetStore} from '../store';
import {resetIntakeMemory} from '../intake/memory';
const scope={nutritionistId:'n',actorId:'a',persistent:false,patients:[{id:'pat-sofia'}]} as WorkScope;
beforeEach(()=>{resetStore();resetIntakeMemory();});
afterEach(()=>vi.useRealTimers());
it.each([7,30])('el período de %i días respeta medianoche argentina y excluye el día futuro',async days=>{
 const patient=getPatient('pat-sofia')!,base=patient.meal_logs[0],now=new Date('2026-10-20T02:59:59Z');
 const start=new Date(Date.parse('2026-10-19T03:00:00Z')-(days-1)*86400000);
 patient.meal_logs=[{...base,id:'before',logged_at:new Date(+start-1).toISOString()},{...base,id:'start',logged_at:start.toISOString()},{...base,id:'today',logged_at:'2026-10-20T02:59:59Z'},{...base,id:'tomorrow',logged_at:'2026-10-20T03:00:00Z'}];
 const page=await loadPatientMealPage(scope,'pat-sofia',patientMealQuerySchema.parse({days}),now);
 expect(page.logs.map(row=>row.id)).toEqual(['today','start']);
});
it('sin permiso de fotos devuelve los registros sin exponer la imagen',async()=>{
 const patient=getPatient('pat-sofia')!,base=patient.meal_logs[0];patient.meal_logs=[{...base,id:'private-photo',logged_at:'2026-10-19T15:00:00Z',photo_url:'patients/pat-sofia/private.jpg'}];
 const page=await loadPatientMealPage(scope,'pat-sofia',patientMealQuerySchema.parse({}),new Date('2026-10-19T16:00:00Z'));
 expect(page.logs).toHaveLength(1);expect(page.logs[0].photo_url).toBeNull();
});
