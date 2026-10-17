import {describe,expect,it} from 'vitest';
import { clinicalBrandFromNutrition } from './clinical-brand';
describe('marca única para documentos',()=>{
  it('usa exactamente la marca configurada y conserva sólo matrícula clínica',()=>{
    expect(clinicalBrandFromNutrition({name:'Consultorio',contact:'',logo:''},'123')).toEqual({name:'Consultorio',contact:'',logo:null,license:'123'});
  });
  it('no recupera marca vieja cuando la profesional borra la configuración',()=>{
    expect(clinicalBrandFromNutrition({name:'',contact:'Viejo',logo:''},'123')).toBeNull();
  });
});
