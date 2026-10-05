import { afterEach, expect, it, vi } from 'vitest';
import { generateRecipeCoverImage, recipeCoverEnabled } from './recipe-cover.js';
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();});
it.each(['free','paid','unknown',''])('no genera fotos con proveedores pagos incluso con configuración %s',async mode=>{
  vi.stubEnv('AI_COST_MODE',mode);vi.stubEnv('AI_MODE','live');vi.stubEnv('OPENAI_API_KEY','synthetic-only');
  const network=vi.fn();vi.stubGlobal('fetch',network);
  expect(recipeCoverEnabled()).toBe(false);
  expect(await generateRecipeCoverImage({title:'Plato ficticio',items:[]})).toEqual({status:'failed'});
  expect(network).not.toHaveBeenCalled();
});
