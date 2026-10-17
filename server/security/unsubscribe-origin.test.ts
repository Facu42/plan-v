import {Hono} from 'hono';
import {expect,it} from 'vitest';
import {createOriginGuard} from './http.js';
it('allows opaque-origin unsubscribe forms only on the exact token-authorized endpoint',async()=>{
 const app=new Hono();app.use('*',createOriginGuard(()=>({APP_MODE:'test',CORS_ALLOWED_ORIGINS:'https://planv.example'})));app.post('*',c=>c.json({received:true}));
 const target='/api/public/communications/email-unsubscribe';
 expect((await app.request(target,{method:'POST',headers:{Origin:'null'}})).status).toBe(200);
 expect((await app.request(target,{method:'POST',headers:{Origin:'https://evil.example'}})).status).toBe(403);
 for(const path of ['/api/patients','/api/public/communications/email-unsubscribe-evil'])expect((await app.request(path,{method:'POST',headers:{Origin:'null'}})).status).toBe(403);
});
