import { afterEach,describe,expect,it,vi } from 'vitest';
import { mapFdcFood,searchFdcFoods } from './fdc.js';
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();});
describe('USDA FoodData Central con procedencia y unidades',()=>{
  it('mapea sólo nutrientes declarados, conserva cero y referencia del dato original',()=>{
    const food=mapFdcFood({fdcId:123,description:'Food ficticio',dataType:'Foundation',foodNutrients:[{nutrient:{id:1008,unitName:'kcal'},amount:52},{nutrient:{id:1087,unitName:'mg'},amount:0}]},'a0000000-0000-4000-8000-000000000001');
    expect(food).toMatchObject({source:'USDA FoodData Central · Foundation',nutrients:{kcal:52,calcium:0,iron:null},reference:expect.stringContaining('dominio público')});
    expect(food.reference).toContain('fdcId=123');
  });
  it('rechaza bases no autorizadas o unidades incompatibles en vez de asumir composición',()=>{
    expect(()=>mapFdcFood({fdcId:123,description:'Brand',dataType:'Branded',foodNutrients:[]},'a0000000-0000-4000-8000-000000000001')).toThrow();
    const food=mapFdcFood({fdcId:123,description:'Sample',dataType:'SR Legacy',foodNutrients:[{nutrient:{id:1087,unitName:'g'},amount:1}]},'a0000000-0000-4000-8000-000000000001');expect(food.nutrients.calcium).toBeNull();
  });
  it('sin clave configurada no hace solicitudes externas ni simula resultados',async()=>{
    vi.stubEnv('FDC_API_KEY','');const request=vi.fn();vi.stubGlobal('fetch',request);await expect(searchFdcFoods('apple',1)).rejects.toThrow('clave');expect(request).not.toHaveBeenCalled();
  });
});
