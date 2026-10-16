import {describe,it,expect,vi} from 'vitest';
vi.mock('./GoogleReviewControl',()=>({GoogleReviewControl:()=>null}));
import {TeamOperationKeys,runConfirmedTeamAction,sharedNoteDraft,saveSharedNoteDraft,clearSavedSharedNoteDraft} from './TeamWorkspace';
describe('recepción conserva confirmaciones y borradores por paciente',()=>{
 it('reintentar después de un POST confirmado y refresh fallido conserva la identidad del pago y del cobro',async()=>{
  for(const operation of ['payment','charge'] as const){const keys=new TeamOperationKeys(),payload={amount:1000,date:'2026-10-13'},record=vi.fn(async(_key:string)=>undefined),refresh=vi.fn(async()=>{throw new Error('Sin conexión');});
   const first=keys.key(operation,'clinic-a','patient-a',payload);
   const result=await runConfirmedTeamAction(()=>record(first),refresh);
   expect(result.confirmed).toBe(true);expect(result.refreshFailed).toBe(true);
   await runConfirmedTeamAction(()=>record(keys.key(operation,'clinic-a','patient-a',payload)),async()=>undefined);
   expect(record.mock.calls.map(([key])=>key)).toEqual([first,first]);
   keys.edited(operation);expect(keys.key(operation,'clinic-a','patient-a',payload)).not.toBe(first);
   expect(keys.key(operation,'clinic-a','patient-b',payload)).not.toBe(first);
  }
 });
 it('distingue una mutación rechazada y una lectura fallida de un guardado confirmado',async()=>{
  const result=await runConfirmedTeamAction(async()=>{throw new Error('Rechazado');},async()=>undefined);expect(result.confirmed).toBe(false);expect(result.refreshFailed).toBe(false);
  const read=await runConfirmedTeamAction(async()=>undefined,async()=>{throw new Error('Lectura fallida');},false);expect(read.confirmed).toBe(false);expect(read.refreshFailed).toBe(false);
 });
 it('un registro confirmado queda cerrado hasta elegir una nueva operación o editar sus datos',async()=>{
  for(const operation of ['payment','charge'] as const){const keys=new TeamOperationKeys(),payload={amount:1000,date:'2026-10-13'},posted:string[]=[];
   const first=keys.key(operation,'clinic-a','patient-a',payload);
   await runConfirmedTeamAction(async()=>{posted.push(first);keys.acknowledge(operation,first);},async()=>undefined);
   expect(keys.isConfirmed(operation,'clinic-a','patient-a',payload)).toBe(true);expect(keys.key(operation,'clinic-a','patient-a',payload)).toBe(first);
   keys.edited(operation);expect(keys.isConfirmed(operation,'clinic-a','patient-a',payload)).toBe(false);
   const next=keys.key(operation,'clinic-a','patient-a',payload);expect(next).not.toBe(first);
   await runConfirmedTeamAction(async()=>{posted.push(next);keys.acknowledge(operation,next);},async()=>{throw new Error('Actualización fallida');});
   expect(posted).toEqual([first,next]);expect(keys.key(operation,'clinic-a','patient-a',payload)).toBe(next);expect(keys.isConfirmed(operation,'clinic-a','patient-a',payload)).toBe(true);
  }
 });
 it('cambiar la ficha nunca lleva el texto de A a B y una respuesta antigua no borra una edición posterior',()=>{
  let drafts=saveSharedNoteDraft({},'patient-a','Borrador privado A');expect(sharedNoteDraft(drafts,'patient-b')).toBe('');
  drafts=saveSharedNoteDraft(drafts,'patient-b','Borrador privado B');expect(sharedNoteDraft(drafts,'patient-a')).toBe('Borrador privado A');
  drafts=clearSavedSharedNoteDraft(drafts,'patient-a','Texto anterior');expect(sharedNoteDraft(drafts,'patient-a')).toBe('Borrador privado A');
  drafts=clearSavedSharedNoteDraft(drafts,'patient-a','Borrador privado A');expect(sharedNoteDraft(drafts,'patient-a')).toBe('');expect(sharedNoteDraft(drafts,'patient-b')).toBe('Borrador privado B');
 });
});
