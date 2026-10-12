import { describe, expect, it, vi } from 'vitest';
import { createClinicalProvider } from './provider.js';
import { MemoryClinicalBudget } from './budget.js';

const input = { scope: { patientId: 'patient', nutritionistId: 'nutri', requestedBy: 'user' }, sessionId: 'session', taskId: 'task', requestKey: 'request-1', revision: 1, text: 'Se acordó registrar agua.', consentVersion: 'ai_consultation.v1' as const };
describe('proveedor de resumen clínico aislado', () => {
  it('permite una nueva solicitud explícita sin repetir una solicitud cobrada', async () => {
    const fetch = vi.fn().mockImplementation(async () => new Response(JSON.stringify({ choices: [{ message: { content: '{"summary":"Acuerdo revisado."}' } }] })));
    const provider = createClinicalProvider({ env: { GROQ_API_KEY: 'test', GROQ_ZDR_VERIFIED: '1', GROQ_FREE_TIER_VERIFIED: '1' }, fetch, budget: new MemoryClinicalBudget(), authorize: async () => true });
    await provider.summarizeClinicalText(input);
    await expect(provider.summarizeClinicalText(input)).rejects.toThrow();
    await provider.summarizeClinicalText({ ...input, requestKey: 'request-2' });
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  it('rechaza audio falsificado antes de reservar o enviarlo', async () => {
    const fetch = vi.fn();
    const provider = createClinicalProvider({ env: { GROQ_API_KEY: 'test', GROQ_ZDR_VERIFIED: '1', GROQ_FREE_TIER_VERIFIED: '1' }, fetch, budget: new MemoryClinicalBudget(), authorize: async () => true });
    await expect(provider.transcribeClinicalAudio({ ...input, mime: 'audio/wav', durationSeconds: 1, audio: new Uint8Array(44) })).rejects.toThrow();
    expect(fetch).not.toHaveBeenCalled();
  });
  it('bloquea sin confirmar retención cero y antes de enviar contenido', async () => {
    const fetch = vi.fn();
    const provider = createClinicalProvider({ env: { GROQ_API_KEY: 'test' }, fetch, budget: new MemoryClinicalBudget(5_000_000), authorize: async () => true });
    await expect(provider.summarizeClinicalText(input)).rejects.toThrow();
    expect(fetch).not.toHaveBeenCalled();
  });
  it('bloquea permiso retirado antes y después del proveedor y no usa herramientas', async () => {
    const authorize = vi.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: '{"summary":"Acuerdo: registrar agua."}' } }], usage: { prompt_tokens: 10, completion_tokens: 10 } }), { status: 200 }));
    const provider = createClinicalProvider({ env: { GROQ_API_KEY: 'test', GROQ_ZDR_VERIFIED: '1', GROQ_FREE_TIER_VERIFIED: '1' }, fetch, budget: new MemoryClinicalBudget(5_000_000), authorize });
    await expect(provider.summarizeClinicalText(input)).rejects.toThrow();
    const request = JSON.parse(fetch.mock.calls[0][1].body);
    expect(request.model).toBe('openai/gpt-oss-120b');
    expect(request.tools).toBeUndefined();
    expect(request.messages[0].content).toMatch(/no.*diagn/i);
  });
  it('no envía nada cuando la bolsa paga está agotada', async () => {
    const budget = new MemoryClinicalBudget(1);
    const fetch = vi.fn();
    const provider = createClinicalProvider({ env: { GROQ_API_KEY: 'test', GROQ_ZDR_VERIFIED: '1', CLINICAL_AI_COST_MODE: 'paid' }, fetch, budget, authorize: async () => true });
    await expect(provider.summarizeClinicalText(input)).rejects.toThrow();
    expect(fetch).not.toHaveBeenCalled();
  });
});
