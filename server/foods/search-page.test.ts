import { describe,expect,it,vi } from 'vitest';
import { searchFoodPage } from './repository.js';
const mock=vi.hoisted(()=>({rpc:vi.fn()}));
vi.mock('../db/supabase-client.js',()=>({getRequestDb:()=>({rpc:mock.rpc})}));
describe('Búsqueda paginada de alimentos',()=>{
  it('consulta únicamente la página pedida y devuelve el total sin cortar en cinco mil',async()=>{
    mock.rpc.mockResolvedValue({data:{foods:[],total:12000,page:101,page_size:50},error:null});
    expect(await searchFoodPage('owner',{q:'manzana',kind:'food',scope:'own',source:'',category:'',order:'name-asc'},101,50,true)).toEqual({foods:[],total:12000,page:101,page_size:50});
    expect(mock.rpc).toHaveBeenCalledWith('search_food_catalog',{filters:{q:'manzana',kind:'food',scope:'own',source:'',category:'',order:'name-asc'},page:101,page_size:50});
  });
});
