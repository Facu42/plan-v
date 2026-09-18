import { beforeEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { app } from '../index.js';
import { resetStore } from '../store.js';
import { CONSENT_CATALOG, type ConsentPurpose } from '../intake/consent.js';
const patient='pat-sofia';
const post=(path:string,body:unknown,method='POST')=>app.request(path,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
const base=`/api/patients/${patient}/care`;
async function consent(purpose:ConsentPurpose,decision='granted') {
  const c=CONSENT_CATALOG.find(c=>c.purpose===purpose)!;
  return post(`/api/patients/${patient}/consents`,{purpose,text_version:c.text_version,text_hash:c.text_hash,decision});
}
describe('seguimiento conectado',()=>{
  beforeEach(()=>{resetStore();});
  it('exige permiso, conserva la fecha y evita duplicados al reintentar una medida',async()=>{
    const input={id:randomUUID(),recorded_on:'2026-09-10',data:{kind:'weight',value:64.5,note:''}};
    expect((await post(`${base}/records`,input)).status).toBe(403);
    expect((await consent('measurement')).status).toBe(201);
    expect((await post(`${base}/records`,input)).status).toBe(200);
    expect((await post(`${base}/records`,input)).status).toBe(200);
    expect((await post(`${base}/records`,{...input,data:{...input.data,value:65}})).status).toBe(409);
    const body=await(await app.request(base)).json();expect(body.records).toHaveLength(1);expect(body.records[0].recorded_on).toBe('2026-09-10');
    const alerts=await(await app.request('/api/care/alerts')).json();expect(alerts.alerts.find((a:any)=>a.id===input.id).title).toBe('Peso semanal');
    expect(JSON.stringify(alerts)).not.toContain('64.5');
    await post(`${base}/records/${input.id}/review`,{},'PATCH');
    expect((await(await app.request('/api/care/alerts')).json()).alerts.some((a:any)=>a.id===input.id)).toBe(false);
  });
  it('separa los pagos y los borradores de la vista paciente',async()=>{
    await post(`${base}/records`,{id:randomUUID(),recorded_on:'2026-09-10',data:{kind:'payment',amount:24000,currency:'ARS',method:'transferencia',reference:'REF1',note:''}});
    expect((await(await app.request(base)).json()).records).toEqual([]);
    expect((await(await app.request(`${base}?audience=pro`)).json()).records).toHaveLength(1);
    const id=randomUUID();await post(`${base}/records`,{id,recorded_on:'2026-09-10',data:{kind:'menu_request',target:'Almuerzo',reason:'No consigo el ingrediente',replacement:'ingredient'}});
    expect((await post(`${base}/replacements/${id}/generate`,{})).status).toBe(403);
    await consent('ai_menu_draft');
    const response=await post(`${base}/replacements/${id}/generate`,{});expect(response.status).toBe(200);const generated=await response.json();
    expect(generated.replacement.source).toBe('demo');
    expect((await(await app.request(base)).json()).replacements).toEqual([]);
    const publish={expected_recipe:generated.replacement.recipe,recipe:{...generated.replacement.recipe,title:'Alternativa revisada'}};
    expect((await post(`${base}/replacements/${generated.replacement.id}/publish`,publish)).status).toBe(200);
    expect((await post(`${base}/replacements/${generated.replacement.id}/publish`,publish)).status).toBe(200);
    expect((await(await app.request(base)).json()).replacements).toHaveLength(1);
  });
  it('fotos privadas: validación, permiso y retiro de acceso',async()=>{
    const id=randomUUID();const image='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a3uoAAAAASUVORK5CYII=';
    const input={id,recorded_on:'2026-09-10',image,note:''};
    expect((await post(`${base}/photos`,input)).status).toBe(403);await consent('body_progress');
    expect((await post(`${base}/photos`,{...input,image:'data:image/png;base64,AAAA'})).status).toBe(400);
    expect((await post(`${base}/photos`,input)).status).toBe(200);
    expect((await post(`${base}/photos`,input)).status).toBe(200);
    const alerts=await(await app.request('/api/care/alerts')).json();expect(alerts.alerts.find((a:any)=>a.id===id).title).toBe('Nuevo archivo privado');expect(JSON.stringify(alerts)).not.toContain(image);
    expect((await app.request(`${base}/photos/${id}`)).status).toBe(200);
    expect((await app.request(`/api/patients/pat-marina/care/photos/${id}`)).status).toBe(403);
    await consent('body_progress','withdrawn');expect((await app.request(`${base}/photos/${id}`)).status).toBe(403);
    expect((await app.request(`${base}/photos/${id}`,{method:'DELETE'})).status).toBe(200);
    expect((await(await app.request(base)).json()).records).toEqual([]);
  });
  it('rechaza futuras fechas, datos ajenos, calorías negativas y preferencias inválidas',async()=>{
    for(const data of [{kind:'activity',activity:'Caminar',minutes:30,intensity:'suave',kcal:-2,note:''},{kind:'payment',amount:0,currency:'ARS',method:'otro',reference:'',note:''}])expect((await post(`${base}/records`,{id:randomUUID(),recorded_on:'2026-09-10',data})).status).toBe(400);
    expect((await post(`${base}/records`,{id:randomUUID(),recorded_on:'2999-01-01',data:{kind:'activity',activity:'Caminar',minutes:30,intensity:'suave',kcal:null,note:''}})).status).toBe(400);
    expect((await post(`${base}/preferences`,{water:true},'PUT')).status).toBe(400);
  });
});
