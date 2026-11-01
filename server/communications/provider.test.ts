import {REMINDER_WHATSAPP_TEXT,reminderTemplateHash} from './catalog.js';
import { describe, expect, it, vi } from 'vitest';
import { readApprovedTemplate, sendApprovedTemplate, verifyWhatsAppSignature, isOptOut, normalPhone, whatsappConfig } from './provider.js';
import { createHmac } from 'node:crypto';

describe('WhatsApp oficial sin entrega simulada', () => {
  const config = { token:'test-token', phoneId:'1234', businessId:'4567', version:'v22.0', enabled:true };
  const completeEnv = { WHATSAPP_ACCESS_TOKEN:'fictional-token', WHATSAPP_PHONE_ID:'1234', WHATSAPP_BUSINESS_ID:'4567', WHATSAPP_ENABLED:'true', WHATSAPP_APP_SECRET:'fictional-app-secret', WHATSAPP_VERIFY_TOKEN:'fictional-verify-token' };
  it('una configuración sin firma o verificación de bajas no permite ningún envío', async () => {
    for (const missing of ['WHATSAPP_APP_SECRET','WHATSAPP_VERIFY_TOKEN'] as const) {
      const partial = { ...completeEnv, [missing]:'' };
      const configured = whatsappConfig(partial)!;
      expect(configured.enabled).toBe(false);
      const fetcher=vi.fn();
      await expect(sendApprovedTemplate(configured,'+5491112345678','aviso','es_AR',fetcher,async()=>true)).rejects.toThrow();
      expect(fetcher).not.toHaveBeenCalled();
    }
  });
  it('la configuración completa conserva el envío aprobado y la preparación con flag apagado', async () => {
    const fetcher=vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({data:[{name:'aviso',language:'es_AR',status:'APPROVED',components:[{type:'BODY',text:'Respondé BAJA'}]}]}))).mockResolvedValueOnce(new Response(JSON.stringify({messages:[{id:'wamid.fictional'}]})));
    expect(await sendApprovedTemplate(whatsappConfig(completeEnv)!,'+5491112345678','aviso','es_AR',fetcher,async()=>true)).toBe('wamid.fictional');
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(whatsappConfig({...completeEnv,WHATSAPP_ENABLED:'false',WHATSAPP_APP_SECRET:'',WHATSAPP_VERIFY_TOKEN:''})?.enabled).toBe(false);
  });
  it('permite revisar el contenido exacto de la plantilla antes de confirmar destinatarios',async()=>{
    const fetcher=vi.fn().mockResolvedValue(new Response(JSON.stringify({data:[{name:'aviso',language:'es_AR',status:'APPROVED',components:[{type:'BODY',text:'Respondé BAJA'}]}]})));
    expect(await readApprovedTemplate(config,'aviso','es_AR',fetcher)).toBe('Respondé BAJA');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it('no llama al proveedor si la integración no está activada', async () => {
    const fetcher=vi.fn();
    await expect(sendApprovedTemplate({...config,enabled:false},'+5491112345678','aviso','es_AR',fetcher,async()=>true)).rejects.toThrow();
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('sólo envía plantilla aprobada a través de Graph API y devuelve id de proveedor', async () => {
    const fetcher=vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({data:[{name:'aviso',language:'es_AR',status:'APPROVED',components:[{type:'BODY',text:'Aviso del consultorio. Respondé BAJA para dejar de recibir.'}]}]}))).mockResolvedValueOnce(new Response(JSON.stringify({messages:[{id:'wamid.valid'}]})));
    expect(await sendApprovedTemplate(config,'+5491112345678','aviso','es_AR',fetcher,async()=>true)).toBe('wamid.valid');
    expect(fetcher.mock.calls[1][0]).toBe('https://graph.facebook.com/v22.0/1234/messages');
    expect(JSON.parse(fetcher.mock.calls[1][1].body)).toEqual({messaging_product:'whatsapp',to:'5491112345678',type:'template',template:{name:'aviso',language:{code:'es_AR'}}});
  });
  it('rechaza plantilla sin aprobación o envío con resultado incierto', async () => {
    const fetcher=vi.fn().mockResolvedValue(new Response(JSON.stringify({data:[]})));
    await expect(sendApprovedTemplate(config,'+5491112345678','aviso','es_AR',fetcher,async()=>true)).rejects.toThrow();
    expect(fetcher).toHaveBeenCalledTimes(1);
    const unknown=vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({data:[{name:'aviso',language:'es_AR',status:'APPROVED',components:[{type:'BODY',text:'Respondé BAJA'}]}]}))).mockRejectedValueOnce(new Error('timeout'));
    await expect(sendApprovedTemplate(config,'+5491112345678','aviso','es_AR',unknown,async()=>true)).rejects.toMatchObject({uncertain:true});
    expect(unknown).toHaveBeenCalledTimes(2);
  });
  it('no envía una plantilla sin instrucciones de baja ni con parámetros o adjuntos',async()=>{
    for(const components of [[{type:'BODY',text:'Hola'}],[{type:'BODY',text:'BAJA {{1}}'}],[{type:'BODY',text:'BAJA'},{type:'HEADER',format:'IMAGE'}]]){
      const fetcher=vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({data:[{name:'aviso',language:'es_AR',status:'APPROVED',components}]})));
      await expect(sendApprovedTemplate(config,'+5491112345678','aviso','es_AR',fetcher,async()=>true)).rejects.toThrow();
      expect(fetcher).toHaveBeenCalledTimes(1);
    }
  });
  it('el recordatorio con marca vigente coincide con el hash revisado de catálogo',async()=>{
    const fetcher=vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({data:[{name:'recordatorio',language:'es_AR',status:'APPROVED',components:[{type:'BODY',text:REMINDER_WHATSAPP_TEXT}]}]}))).mockResolvedValueOnce(new Response(JSON.stringify({messages:[{id:'wamid.reminder'}]})));
    expect(await sendApprovedTemplate(config,'+5491112345678','recordatorio','es_AR',fetcher,async()=>true,reminderTemplateHash)).toBe('wamid.reminder');
  });
  it('rechaza envío sin comprobación persistente de baja',async()=>{const fetcher=vi.fn();await expect(sendApprovedTemplate(config,'+5491112345678','aviso','es_AR',fetcher)).rejects.toThrow();expect(fetcher).not.toHaveBeenCalled();});
  it('verifica la firma sobre bytes originales y baja explícita', () => {
    const raw='{"object":"whatsapp_business_account"}';
    const signature='sha256='+createHmac('sha256','secret').update(raw).digest('hex');
    expect(verifyWhatsAppSignature(raw,signature,'secret')).toBe(true);
    expect(verifyWhatsAppSignature(raw+' ',signature,'secret')).toBe(false);
    expect(verifyWhatsAppSignature(raw,'garbage','secret')).toBe(false);
    expect(isOptOut('  BAJA ')).toBe(true);expect(isOptOut('STOP')).toBe(true);expect(isOptOut('no quiero bajar mi peso')).toBe(false);
    expect(normalPhone('11 1234 5678')).toBeNull();expect(normalPhone('+5491112345678')).toBe('+5491112345678');
  });
  it('revalida permiso después de leer la plantilla y antes del envío externo',async()=>{
    const fetcher=vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({data:[{name:'aviso',language:'es_AR',status:'APPROVED',components:[{type:'BODY',text:'Respondé BAJA'}]}]})));
    await expect(sendApprovedTemplate(config,'+5491112345678','aviso','es_AR',fetcher,async()=>false)).rejects.toThrow();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it('rechaza encabezados y pies no incluidos en la revisión del cuerpo',async()=>{
    for(const type of ['HEADER','FOOTER']){
      const fetcher=vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({data:[{name:'aviso',language:'es_AR',status:'APPROVED',components:[{type:'BODY',text:'Respondé BAJA'},{type,format:'TEXT',text:'Contenido ajeno a la revisión'}]}]})));
      await expect(readApprovedTemplate(config,'aviso','es_AR',fetcher)).rejects.toThrow();
      expect(fetcher).toHaveBeenCalledTimes(1);
    }
  });
  it('no envía contenido que cambió después de la revisión profesional',async()=>{
    const fetcher=vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({data:[{name:'aviso',language:'es_AR',status:'APPROVED',components:[{type:'BODY',text:'Respondé BAJA'}]}]})));
    await expect(sendApprovedTemplate(config,'+5491112345678','aviso','es_AR',fetcher,async()=>true,'0'.repeat(64))).rejects.toThrow();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
