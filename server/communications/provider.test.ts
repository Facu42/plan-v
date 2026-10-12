import { describe, expect, it, vi } from 'vitest';
import { sendApprovedTemplate, verifyWhatsAppSignature, isOptOut, normalPhone } from './provider.js';
import { createHmac } from 'node:crypto';

describe('WhatsApp oficial sin entrega simulada', () => {
  const config = { token:'test-token', phoneId:'1234', businessId:'4567', version:'v22.0', enabled:true };
  it('no llama al proveedor si la integración no está activada', async () => {
    const fetcher=vi.fn();
    await expect(sendApprovedTemplate({...config,enabled:false},'+5491112345678','aviso','es_AR',fetcher)).rejects.toThrow();
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('sólo envía plantilla aprobada a través de Graph API y devuelve id de proveedor', async () => {
    const fetcher=vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({data:[{name:'aviso',language:'es_AR',status:'APPROVED'}]}))).mockResolvedValueOnce(new Response(JSON.stringify({messages:[{id:'wamid.valid'}]})));
    expect(await sendApprovedTemplate(config,'+5491112345678','aviso','es_AR',fetcher)).toBe('wamid.valid');
    expect(fetcher.mock.calls[1][0]).toBe('https://graph.facebook.com/v22.0/1234/messages');
    expect(JSON.parse(fetcher.mock.calls[1][1].body)).toEqual({messaging_product:'whatsapp',to:'5491112345678',type:'template',template:{name:'aviso',language:{code:'es_AR'}}});
  });
  it('rechaza plantilla sin aprobación o envío con resultado incierto', async () => {
    const fetcher=vi.fn().mockResolvedValue(new Response(JSON.stringify({data:[]})));
    await expect(sendApprovedTemplate(config,'+5491112345678','aviso','es_AR',fetcher)).rejects.toThrow();
    expect(fetcher).toHaveBeenCalledTimes(1);
    const unknown=vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({data:[{name:'aviso',language:'es_AR',status:'APPROVED'}]}))).mockRejectedValueOnce(new Error('timeout'));
    await expect(sendApprovedTemplate(config,'+5491112345678','aviso','es_AR',unknown)).rejects.toMatchObject({uncertain:true});
    expect(unknown).toHaveBeenCalledTimes(2);
  });
  it('verifica la firma sobre bytes originales y baja explícita', () => {
    const raw='{"object":"whatsapp_business_account"}';
    const signature='sha256='+createHmac('sha256','secret').update(raw).digest('hex');
    expect(verifyWhatsAppSignature(raw,signature,'secret')).toBe(true);
    expect(verifyWhatsAppSignature(raw+' ',signature,'secret')).toBe(false);
    expect(verifyWhatsAppSignature(raw,'garbage','secret')).toBe(false);
    expect(isOptOut('  BAJA ')).toBe(true);expect(isOptOut('STOP')).toBe(true);expect(isOptOut('no quiero bajar mi peso')).toBe(false);
    expect(normalPhone('11 1234 5678')).toBeNull();expect(normalPhone('+5491112345678')).toBe('+5491112345678');
  });
});
