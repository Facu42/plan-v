import {describe,expect,it,vi} from 'vitest';
import {ApiError} from '../../../api/client';
import {createPendingWrite} from './pending-write';
import {createMessageWrite} from './message-write';

describe('reintentos de compras y mensajes',()=>{
  it('una respuesta perdida conserva el pedido y un doble envío comparte la operación',async()=>{
    const execute=vi.fn().mockRejectedValueOnce(new TypeError('Sin conexión')).mockResolvedValue('guardado');
    const action=createPendingWrite(execute);const original={client_id:'uno',name:'Arroz'};
    await expect(action.run(original)).rejects.toThrow('Sin conexión');
    const first=action.run({client_id:'dos',name:'Manzana'});const second=action.run({client_id:'tres',name:'Pera'});
    expect(first).toBe(second);await expect(first).resolves.toBe('guardado');
    expect(execute).toHaveBeenNthCalledWith(2,original);expect(action.pending).toBe(false);
  });
  it.each([400,401,403,409,413,422,429])('permite corregir después del rechazo definitivo %i',async(status)=>{
    const execute=vi.fn().mockRejectedValueOnce(new ApiError(status,'Rechazado')).mockResolvedValue('guardado');
    const action=createPendingWrite(execute);await expect(action.run('primero')).rejects.toThrow();
    expect(action.pending).toBe(false);await action.run('corregido');expect(execute).toHaveBeenLastCalledWith('corregido');
  });
  it('un fallo incierto del servidor conserva el identificador',async()=>{
    const action=createPendingWrite(vi.fn().mockRejectedValue(new ApiError(503,'No confirmado')));
    await expect(action.run('original')).rejects.toThrow();expect(action.pending).toBe(true);
  });
  it('reintenta el mensaje con el adjunto ya subido y libera el formulario al retirar permisos',async()=>{
    const upload=vi.fn().mockResolvedValue({asset_id:'archivo',filename:'prueba.pdf'});
    const send=vi.fn().mockRejectedValueOnce(new TypeError('Sin conexión')).mockRejectedValueOnce(new ApiError(403,'Permiso retirado'));
    const delivery=createMessageWrite('paciente',{upload,send,refresh:vi.fn()});
    const input={text:'Consulta',file:new File(['contenido ficticio'],'prueba.pdf',{type:'application/pdf'}),client_id:'uno'};
    await expect(delivery.run(input)).rejects.toThrow();expect(delivery.pending).toBe(true);
    await expect(delivery.run({...input,client_id:'dos'})).rejects.toThrow();
    expect(upload).toHaveBeenCalledTimes(1);expect(delivery.pending).toBe(false);
  });
});
