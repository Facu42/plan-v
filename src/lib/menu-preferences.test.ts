import {describe,it,expect} from 'vitest';
import {menuPreferences} from './menu-preferences';
import {aiJobEnqueueSchema} from '../types/ai-jobs';

describe('preferencias del menú profesional',()=>{
  it('explica qué línea debe corregirse sin truncar la indicación',()=>{
    const long='Cuatro comidas por día, recetas sencillas, ingredientes habituales de Argentina y preparaciones para llevar al trabajo.';
    const result=menuPreferences('Sin maní\n'+long);expect(result.error).toContain('preferencia 2');expect(result.values[1]).toBe(long);
  });
  it('las diez líneas admitidas cumplen el contrato de la API y las vacías no cuentan',()=>{
    const text=Array.from({length:10},(_,i)=>'Preferencia '+(i+1)).join('\n\n');const result=menuPreferences(text);expect(result.error).toBeUndefined();expect(aiJobEnqueueSchema.shape.dietary_preferences.safeParse(result.values).success).toBe(true);
    expect(menuPreferences(text+'\nOtra indicación').error).toContain('hasta 10');
  });
});
