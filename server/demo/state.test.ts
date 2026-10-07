import { describe, expect, it } from 'vitest';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { serialize } from 'node:v8';
import { DemoStateFile } from './state.js';

const demo = { mode: 'demo', dataMode: 'memory', aiMode: 'demo' } as const;
function temporary(run: (file: string) => void) { const dir=mkdtempSync(join(tmpdir(),'plan-v-demo-'));try{run(join(dir,'state.bin'));}finally{rmSync(dir,{recursive:true,force:true});} }
describe('guardado de la simulación local',()=>{
  it('amplía una copia anterior de recetas sin perder registros y conserva los nuevos favoritos al reiniciar',()=>temporary(file=>{
    const recipes=new Map([['recipe-1',{title:'Receta ficticia'}]]);
    const previous={ingredients:new Map(),recipes,versions:new Map(),lines:new Map(),assignments:new Map()};
    writeFileSync(file,serialize({version:1,domains:{'recipes/repository':previous}}));
    const current={...previous,recipes:new Map<string,unknown>(),professionalFavorites:new Map<string,unknown>()};
    const domains=new Map([['recipes/repository',()=>current]]);
    const first=new DemoStateFile(file,demo,domains);
    expect(current.recipes.get('recipe-1')).toEqual({title:'Receta ficticia'});
    current.professionalFavorites.set('nutri:recipe-1',{nutritionistId:'nutri',recipeId:'recipe-1'});
    first.close(); current.recipes.clear();current.professionalFavorites.clear();
    const second=new DemoStateFile(file,demo,domains);
    expect(current.professionalFavorites.has('nutri:recipe-1')).toBe(true);expect(current.recipes.has('recipe-1')).toBe(true);second.close();
  }));
  it('restaura mapas, historiales, permisos y bytes del adjunto sin cambiar sus identificadores',()=>temporary(file=>{
    const message={id:'message-1',body:'Mensaje ficticio'};
    const group={messages:new Map([['message-1',message]]),history:[message],permissions:new Set(['measurement']),store:{activePatientId:'patient-1'},assets:new Map([['asset-1',Buffer.from('Archivo ficticio')]])};
    const domains=new Map([['test',()=>group]]);const first=new DemoStateFile(file,demo,domains);first.save();first.close();
    group.messages.clear();group.history.length=0;group.permissions.clear();group.store.activePatientId='other';group.assets.clear();
    const second=new DemoStateFile(file,demo,domains);
    expect(group.messages.get('message-1')).toEqual(message);expect(group.history[0]).toBe(group.messages.get('message-1'));expect(group.permissions.has('measurement')).toBe(true);expect(group.store.activePatientId).toBe('patient-1');expect(group.assets.get('asset-1')?.toString()).toBe('Archivo ficticio');second.close();
  }));
  it('rechaza dos servidores sobre el mismo archivo y conserva la copia anterior',()=>temporary(file=>{
    const domains=new Map([['test',()=>({values:new Map()})]]);const first=new DemoStateFile(file,demo,domains);first.save();const before=readFileSync(file);expect(()=>new DemoStateFile(file,demo,domains)).toThrow('Otra demostración');expect(readFileSync(file)).toEqual(before);first.close();
  }));
  it('bloquea copias incompatibles sin restaurar parcialmente ni sobrescribirlas',()=>temporary(file=>{
    const values=new Map([['original',1]]),history=['original'];const domains=new Map([['test',()=>({values,history})]]);
    writeFileSync(file,serialize({version:1,domains:{test:{values:new Map([['changed',2]]),history:new Set()}}}));const before=readFileSync(file);expect(()=>new DemoStateFile(file,demo,domains)).toThrow('inválida');expect(values.get('original')).toBe(1);expect(history).toEqual(['original']);expect(readFileSync(file)).toEqual(before);
  }));
  it('no permite activar archivos locales en producción, staging ni test',()=>temporary(file=>{
    for(const mode of ['production','staging','test'] as const)expect(()=>new DemoStateFile(file,{...demo,mode,dataMode:mode==='test'?'memory':'supabase'})).toThrow('sólo está permitido');
  }));
});
