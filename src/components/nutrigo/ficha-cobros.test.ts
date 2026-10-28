import {describe,expect,it} from 'vitest';
import type {PatientPayment} from '../../types/fees';
import {diaYMes,montoCorto,pagosPorMes,rangoDeMeses,repartoPorMedio} from './ficha-cobros';

const pago=(id:string,paid_on:string,amount:number,method:PatientPayment['method'],status:PatientPayment['status']='confirmed'):PatientPayment=>({id,paid_on,amount,method,status,created_at:paid_on} as PatientPayment);

describe('ficha cobros',()=>{
 it('suma por mes solo lo confirmado y cruza el cambio de año',()=>{
  const meses=pagosPorMes([pago('a','2026-10-10',54000,'transferencia'),pago('b','2026-10-12',1000,'efectivo','reported'),pago('c','2025-12-03',40000,'efectivo')],'2026-01-15',3);
  expect(meses.map(m=>m.rotulo)).toEqual(['nov','dic','ene']);
  expect(meses[1].total).toBe(40000);
  expect(pagosPorMes([pago('a','2026-10-10',54000,'transferencia'),pago('b','2026-10-12',1000,'efectivo','reported')],'2026-10-20',1)[0].total).toBe(54000);
 });
 it('rango, monto corto y fecha corta',()=>{
  expect(rangoDeMeses(pagosPorMes([],'2026-10-20',8))).toBe('marzo a octubre');
  expect(montoCorto(54000)).toBe('$54 mil');
  expect(montoCorto(800)).toBe('$800');
  expect(diaYMes('2026-11-10')).toBe('10/11');
 });
 it('reparte por medio sin pagos y con pagos',()=>{
  expect(repartoPorMedio([])).toEqual([]);
  expect(repartoPorMedio([pago('a','2026-10-10',1,'transferencia'),pago('b','2026-09-10',1,'transferencia'),pago('c','2026-08-10',1,'efectivo')])).toEqual([{medio:'transferencia',porcentaje:67},{medio:'efectivo',porcentaje:33}]);
 });
});
