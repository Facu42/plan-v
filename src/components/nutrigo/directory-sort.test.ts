import { expect, it } from 'vitest';
import type { Patient } from '../../types';
import { sortDirectoryPatients } from './directory-sort';
it('ordena por turno absoluto o semanal, deja sin turno al final y no muta el directorio',()=>{
  const patients=[{id:'a',name:'Ana',appointment:null},{id:'z',name:'Zoe',appointment:{when:'Martes · 14:00',duration:30}},{id:'b',name:'Bea',appointment:{starts_at:'2026-10-19T17:00:00Z',when:'Lunes · 14:00',duration:30}}] as Patient[];
  expect(sortDirectoryPatients(patients,'appointment',new Date('2026-10-19T12:00:00Z')).map(p=>p.id)).toEqual(['b','z','a']);
  expect(patients.map(p=>p.id)).toEqual(['a','z','b']);
  expect(sortDirectoryPatients(patients,'name').map(p=>p.id)).toEqual(['a','b','z']);
});
