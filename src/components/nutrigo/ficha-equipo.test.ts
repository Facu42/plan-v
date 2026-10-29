import {describe,expect,it} from 'vitest';
import {claseEstado,colorDeRol,inicialesDe,nivelesDeRol,nombreCorto,resumenPersonas} from './ficha-equipo';

describe('ficha equipo',()=>{
 it('saca iniciales de un nombre o de un mail',()=>{
  expect(inicialesDe('Verónica Trenti')).toBe('VT');
  expect(inicialesDe('recepcion@consultorio.com.ar')).toBe('RE');
  expect(inicialesDe('lucia.paz@gmail.com')).toBe('LP');
  expect(inicialesDe('')).toBe('·');
  expect(nombreCorto('Verónica Trenti')).toBe('Verónica');
  expect(nombreCorto('lucia@x.com')).toBe('lucia');
 });
 it('da niveles por rol y recepción nunca ve la ficha clínica',()=>{
  expect(nivelesDeRol('Recepción')[2]).toBe(2);
  expect(nivelesDeRol('Dueña').every(n=>n===0)).toBe(true);
  expect(nivelesDeRol('Rol raro')).toEqual(nivelesDeRol('Recepción'));
  expect(colorDeRol('Contador')).toBe('rojo');
 });
 it('resume personas e invitaciones sin contar las revocadas',()=>{
  expect(resumenPersonas(['Activa','Invitada','Revocada'])).toBe('2 personas · 1 invitación');
  expect(resumenPersonas(['Activa'])).toBe('1 persona');
  expect(resumenPersonas([])).toBe('0 personas');
  expect(claseEstado('Invitada')).toBe('p-wait');
 });
});
