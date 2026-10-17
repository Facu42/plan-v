import {expect,it} from 'vitest';
import {rememberTeamReturn,takeTeamReturn} from './team-return';
it('returns reception to its authorized surface after Google without storing account or health data',()=>{
 const m=new Map<string,string>();const store={getItem:(k:string)=>m.get(k)??null,setItem:(k:string,v:string)=>void m.set(k,v),removeItem:(k:string)=>void m.delete(k)};
 rememberTeamReturn(store,'/equipo',new Date('2026-10-12T12:00:00Z'));
 expect(takeTeamReturn(store,'/',new Date('2026-10-12T12:10:00Z'))).toBe(true);expect(m.size).toBe(0);
 rememberTeamReturn(store,'/equipo',new Date('2026-10-12T12:00:00Z'));
 expect(takeTeamReturn(store,'/',new Date('2026-10-12T13:00:00Z'))).toBe(false);
 rememberTeamReturn(store,'/app');expect(takeTeamReturn(store,'/')).toBe(false);
});
