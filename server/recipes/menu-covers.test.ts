import { beforeEach, describe, it, expect, vi } from 'vitest';
const mocks=vi.hoisted(()=>({generate:vi.fn(),enabled:vi.fn()}));
vi.mock('../ai/recipe-cover.js',()=>({generateRecipeCoverImage:mocks.generate,recipeCoverEnabled:mocks.enabled}));
import { enqueueMemoryDish, handleMemoryDish, memoryDishKey } from './menu-covers.js';
import { resetProcessQueue, processQueue, runOne } from '../jobs/queue.js';
import { getRecipeCard, setRecipeCard, resetRecipeCards } from './presentation.js';
import { createMemoryJobStore } from '../jobs/memory.js';
const context={title:'Tomate al horno',items:[{name:'Tomate',quantity:100,unit:'g'}],steps:['Hornear.']};
beforeEach(()=>{resetProcessQueue();resetRecipeCards();vi.resetAllMocks();mocks.enabled.mockReturnValue(true);mocks.generate.mockResolvedValue({status:'ready',bytes:Buffer.from('synthetic'),mime:'image/jpeg',alt:'Tomate · imagen ilustrativa generada con IA'});});
describe('fotos en la simulación persistente',()=>{
  it('doble clic y platos repetidos reservan una sola foto',async()=>{await Promise.all(Array.from({length:8},()=>enqueueMemoryDish('nutri',context,'v1')));expect(await processQueue.snapshot()).toHaveLength(1);await runOne(processQueue,'worker',handleMemoryDish);expect(mocks.generate).toHaveBeenCalledTimes(1);expect(getRecipeCard('v1',context.title).cover_status).toBe('ready');await enqueueMemoryDish('nutri',context,'v1',true);expect(await processQueue.snapshot()).toHaveLength(1);});
  it('inline idéntico reutiliza, cambios y consultorios diferentes no comparten',async()=>{await enqueueMemoryDish('nutri',context);await enqueueMemoryDish('nutri',context);await enqueueMemoryDish('other',context);await enqueueMemoryDish('nutri',{...context,steps:['Hornear más tiempo.']});expect(await processQueue.snapshot()).toHaveLength(3);expect(memoryDishKey('nutri',context)).not.toBe(memoryDishKey('other',context));});
  it('la foto manual elegida durante generación prevalece y deja de sondear',async()=>{await enqueueMemoryDish('nutri',context,'v1');mocks.generate.mockImplementationOnce(async()=>{setRecipeCard('v1',{...getRecipeCard('v1',context.title),cover_status:'ready',cover_url:'data:image/jpeg;base64,manual'});return {status:'ready',bytes:Buffer.from('new'),mime:'image/jpeg',alt:'IA'};});await runOne(processQueue,'worker',handleMemoryDish);expect(getRecipeCard('v1',context.title)).toMatchObject({cover_url:'data:image/jpeg;base64,manual',cover_generation:'ready'});});
  it('una foto manual previa a la reserva evita generar y corrige un estado pendiente antiguo',async()=>{
    await enqueueMemoryDish('nutri',context,'v1');setRecipeCard('v1',{...getRecipeCard('v1',context.title),cover_status:'ready',cover_url:'data:image/jpeg;base64,manual',cover_generation:'queued'});
    await runOne(processQueue,'worker',handleMemoryDish);expect(mocks.generate).not.toHaveBeenCalled();expect(getRecipeCard('v1',context.title).cover_generation).toBe('ready');
  });
  it('cuota agotada queda pendiente para el día siguiente y se conserva al restaurar la cola',async()=>{
    mocks.generate.mockResolvedValueOnce({status:'failed',retry_after_ms:86_400_000});await enqueueMemoryDish('nutri',context,'v1');const done=await runOne(processQueue,'worker',handleMemoryDish);expect(done?.status).toBe('queued');expect(Date.parse(done!.run_after)-Date.now()).toBeGreaterThan(86_390_000);expect(getRecipeCard('v1',context.title).cover_generation).toBe('queued');const restored=createMemoryJobStore();await restored.replaceAll(await processQueue.snapshot());expect(await restored.snapshot()).toEqual(await processQueue.snapshot());expect(await restored.lease('other')).toBeNull();
  });
});
