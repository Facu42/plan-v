import { describe,expect,it } from 'vitest';
import { DEFAULT_CARE_PREFERENCES, dueCareReminders, type CareSnapshot, type CareRecord } from '../../types/care';
import { patientCareNotices } from './useCareNotices';
const prefs={...DEFAULT_CARE_PREFERENCES,weight:true,waist:true,activity:true};
const record=(kind:'weight'|'waist',date:string)=>({id:kind,patient_id:'p',created_at:date,recorded_on:date,reviewed_at:null,data:{kind,value:60,note:''}} as CareRecord);
describe('frecuencia de registros y recordatorios',()=>{
  it('peso cada siete días, cintura por mes y actividad diaria, todos optativos',()=>{
    const records=[record('weight','2026-09-11'),record('waist','2026-09-01')];
    expect(dueCareReminders(records,prefs,'2026-09-17').map(r=>r.id)).toEqual(['activity:2026-09-17']);
    expect(dueCareReminders(records,prefs,'2026-09-18').map(r=>r.id)).toContain('weight:2026-09-18');
    expect(dueCareReminders(records,prefs,'2026-10-01').map(r=>r.id)).toContain('waist:2026-10');
    expect(dueCareReminders([],DEFAULT_CARE_PREFERENCES,'2026-09-18')).toEqual([]);
  });
  it('agua deduplicada por intervalo y descanso según hora argentina',()=>{
    const snapshot:CareSnapshot={records:[],preferences:DEFAULT_CARE_PREFERENCES,replacements:[],consented:[],source:'memory'};
    const at=(date:string)=>patientCareNotices('p',snapshot,new Date(date));
    expect(at('2026-09-18T11:59:00Z')).toEqual([]);
    expect(at('2026-09-18T12:00:00Z')[0].id).toBe('p:water:2026-09-18:0');
    expect(at('2026-09-18T13:30:00Z')[0].id).toBe('p:water:2026-09-18:0');
    expect(at('2026-09-18T14:00:00Z')[0].id).toBe('p:water:2026-09-18:1');
    expect(at('2026-09-19T01:30:00Z')[0].id).toBe('p:rest:2026-09-18');
  });
});
