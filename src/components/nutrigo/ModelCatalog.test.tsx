import { renderToStaticMarkup } from 'react-dom/server';
import { expect,it } from 'vitest';
import { ModelContent } from './ModelCatalog';
import type { ModelCopy } from '../../types/models';
it('la revisión muestra notas de componentes, receta histórica, preparación y cantidades ajustadas',()=>{
 const copy:ModelCopy={version:1,title:'Modelo',description:'',published_at:null,lines:[],plan:{days:1,items:[{day:1,slot:'Almuerzo',recipe_id:null,recipe_version:null,recipe_title:null,recipe:null,free_text:'Comida compuesta',portions:null,public_note:'Nota de la comida',components:[{id:crypto.randomUUID(),kind:'recipe',recipe_id:'recipe',recipe_version:2,portions:1,public_note:'Nota específica del ingrediente',recipe_snapshot:{title:'Avena preparada',version:2,yield_portions:2,nutrient_source:'estimacion_ia.modelo',ingredients:[{id:'ingredient',name:'Avena',quantity:40,unit:'g'}],steps:['Preparación completa']} }]}]}};
 const html=renderToStaticMarkup(<ModelContent copy={copy}/>);
 expect(html).toContain('Nota específica del ingrediente');expect(html).toContain('Nota de la comida');expect(html).toContain('receta v2');expect(html).toContain('Avena: 20');expect(html).toContain('Preparación completa');expect(html).toContain('estimaciones de IA');expect(html).toContain('Datos incompletos');
});
