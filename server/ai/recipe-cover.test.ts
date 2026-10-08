import { afterEach, expect, it, vi } from 'vitest';
import { generateRecipeCoverImage, recipeCoverEnabled, recipeCoverPrompt } from './recipe-cover.js';
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();});
it.each(['free','paid','unknown',''])('no genera fotos con proveedores pagos incluso con configuración %s',async mode=>{
  vi.stubEnv('AI_COST_MODE',mode);vi.stubEnv('AI_MODE','live');vi.stubEnv('OPENAI_API_KEY','synthetic-only');
  const network=vi.fn();vi.stubGlobal('fetch',network);
  expect(recipeCoverEnabled()).toBe(false);
  expect(await generateRecipeCoverImage({title:'Plato ficticio',items:[]})).toEqual({status:'failed'});
  expect(network).not.toHaveBeenCalled();
});

const context={title:'Arroz con tomate',items:[{name:'Arroz',quantity:80,unit:'g'},{name:'Tomate',quantity:100,unit:'g'}],steps:['Cocinar y servir.']};
function enabled(){vi.stubEnv('IMAGE_PROVIDER','cloudflare_free');vi.stubEnv('CLOUDFLARE_FREE_TIER','1');vi.stubEnv('CLOUDFLARE_ACCOUNT_ID','a'.repeat(32));vi.stubEnv('CLOUDFLARE_API_TOKEN','synthetic-only');}
const jpeg=Buffer.from([0xff,0xd8,0xff,0xc0,0x00,0x0b,0x08,0x00,0x01,0x00,0x01,0x01,0x01,0x11,0x00,0xff,0xda,0x00,0x08,0x01,0x01,0x00,0x00,0x3f,0x00,0x7f,0x3f,0xff,0xd9]);
it('sólo habilita el proveedor elegido y la confirmación de Workers Free',()=>{enabled();expect(recipeCoverEnabled()).toBe(true);vi.stubEnv('CLOUDFLARE_FREE_TIER','0');expect(recipeCoverEnabled()).toBe(false);vi.stubEnv('CLOUDFLARE_FREE_TIER','1');vi.stubEnv('IMAGE_PROVIDER','openrouter');expect(recipeCoverEnabled()).toBe(false);});
it('genera y valida bytes reales con el modelo fijo, sin mandar datos extra',async()=>{
  enabled();const fetcher=vi.fn().mockResolvedValue(new Response(JSON.stringify({success:true,result:{image:jpeg.toString('base64')}})));vi.stubGlobal('fetch',fetcher);
  expect(await generateRecipeCoverImage({...context,patient_name:'Nunca enviar'} as typeof context)).toMatchObject({status:'ready',mime:'image/jpeg',bytes:jpeg,alt:expect.stringContaining('imagen ilustrativa generada con IA')});
  const [url,init]=fetcher.mock.calls[0];expect(url).toContain('/@cf/black-forest-labs/flux-1-schnell');expect(JSON.parse(init.body)).toMatchObject({steps:4});expect(init.body).not.toContain('cook and serve.');expect(init.body).not.toContain('Nunca enviar');expect(fetcher).toHaveBeenCalledTimes(1);
});
it('una cuota agotada espera al siguiente día sin un proveedor pago alternativo',async()=>{
  enabled();const fetcher=vi.fn().mockResolvedValue(new Response('{}',{status:429}));vi.stubGlobal('fetch',fetcher);
  const result=await generateRecipeCoverImage(context);expect(result).toMatchObject({status:'failed',retry_after_ms:expect.any(Number)});expect(fetcher).toHaveBeenCalledTimes(1);
});
it.each([401,403,402,500])('un error %s conserva el fallo y no cambia de proveedor',async status=>{enabled();const fetcher=vi.fn().mockResolvedValue(new Response('{}',{status}));vi.stubGlobal('fetch',fetcher);expect(await generateRecipeCoverImage(context)).toMatchObject({status:'failed'});expect(fetcher).toHaveBeenCalledTimes(1);});
it('rechaza contenido no imagen y respuestas demasiado grandes',async()=>{
  enabled();const fetcher=vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({success:true,result:{image:Buffer.from('not an image').toString('base64')}}))).mockResolvedValueOnce(new Response('{}',{headers:{'content-length':'9000000'}}));vi.stubGlobal('fetch',fetcher);
  expect(await generateRecipeCoverImage(context)).toMatchObject({status:'failed'});expect(await generateRecipeCoverImage(context)).toMatchObject({status:'failed'});
});
it('la descripción tiene un límite y conserva sólo receta, ingredientes y preparación',()=>{expect(recipeCoverPrompt({title:'x'.repeat(500),items:Array.from({length:20},()=>({name:'x'.repeat(200)})),steps:['x'.repeat(3000)]}).length).toBeLessThanOrEqual(2048);});
it('describe la tortilla de papas como el plato que es y no mezcla pasos en español',()=>{
  const prompt=recipeCoverPrompt({title:'Tortilla de papas',items:[{name:'papa',unit:'g',quantity:400},{name:'huevo'},{name:'cebolla'}],steps:['Cortar las papas y la cebolla en rodajas finas.','Freír a fuego bajo y mezclar con los huevos batidos.']});
  expect(prompt).toContain('Spanish potato omelette');expect(prompt).toContain('potato, egg, onion');
  expect(prompt).not.toMatch(/rodajas|fuego|batidos|freir|frittata/i);
});
it('un plato desconocido conserva su nombre y pide una foto simple de un solo plato',()=>{
  const prompt=recipeCoverPrompt({title:'Locro criollo',items:[{name:'maiz'}]});
  expect(prompt).toContain('locro criollo');expect(prompt).toContain('single dish');
});
it('describe los alimentos españoles en inglés sin agregar pescado a los otros platos',()=>{
  const salad=recipeCoverPrompt({title:'Ensalada de lentejas y vegetales',items:[{name:'Lentejas cocidas'},{name:'Tomate'}]});
  expect(salad).toContain('salad of lentils and vegetables');expect(salad).toContain('lentils cooked, tomato');expect(salad).not.toContain('fish');
  expect(recipeCoverPrompt({title:'Merluza al horno con papas',items:[{name:'Merluza'}]})).toContain('rectangular portion of flaky white fish meat');
  expect(recipeCoverPrompt({title:'Tortilla de espinaca al horno',items:[{name:'Espinaca'},{name:'Huevo'}]})).toContain('spinach, egg');
});
