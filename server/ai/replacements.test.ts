import { afterEach,beforeEach,describe,expect,it,vi } from 'vitest';
const mocks=vi.hoisted(()=>({generateText:vi.fn()}));
vi.mock('ai',()=>({...mocks,Output:{object:vi.fn()}}));
vi.mock('@ai-sdk/openai',()=>({createOpenAI:()=>Object.assign(()=>({}),{chat:()=>({})})}));
import { generateReplacement } from './replacements.js';
import { emptyIntakePayload } from '../intake/payload.js';
const request={kind:'menu_request' as const,target:'Arroz',reason:'No consigo',replacement:'ingredient' as const};
describe('alternativas con IA',()=>{
 beforeEach(()=>{vi.clearAllMocks();vi.stubEnv('AI_MODE','live');vi.stubEnv('OPENROUTER_API_KEY','');vi.stubEnv('OPENAI_API_KEY','test-only');});
 afterEach(()=>vi.unstubAllEnvs());
 it('bloquea alergias/restricciones sin completar antes de llamar al proveedor',async()=>{
   await expect(generateReplacement(request,emptyIntakePayload(),[])).rejects.toMatchObject({status:409});expect(mocks.generateText).not.toHaveBeenCalled();
 });
 it('no cambia a demo cuando el proveedor falla y envía sólo datos necesarios',async()=>{
   mocks.generateText.mockRejectedValue(new Error('provider failed'));
   const intake={...emptyIntakePayload(),preferred_name:'Privado',conditions_note:'Nota privada',allergies:{state:'reported' as const,items:['Maní']},restrictions:{state:'none' as const,items:[]}};
   await expect(generateReplacement(request,intake,[])).rejects.toMatchObject({code:'AI_UNAVAILABLE'});
   const prompt=mocks.generateText.mock.calls[0][0].prompt;expect(prompt).toContain('Maní');expect(prompt).not.toContain('Privado');expect(prompt).not.toContain('Nota privada');
 });
});
