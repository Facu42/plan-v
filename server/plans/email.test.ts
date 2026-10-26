import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { emailMealPlan, type PlanEmailDeps } from './email.js';
const mocks = vi.hoisted(() => ({ plan: vi.fn() }));
vi.mock('./repository.js', async () => ({ ...await vi.importActual('./repository.js'), getProfessionalMealPlan: mocks.plan }));
let deps: PlanEmailDeps;
beforeEach(() => {
  vi.stubEnv('MAIL_ENABLED','true'); vi.stubEnv('MAIL_PROVIDER','brevo'); vi.stubEnv('BREVO_API_KEY','fake-test'); vi.stubEnv('BREVO_SENDER_EMAIL','clinic@example.test'); vi.stubEnv('PUBLIC_SITE_URL','https://planv.example.test');
  mocks.plan.mockResolvedValue({ id:'plan', published:{version:3} });
  deps = { recipient:vi.fn().mockResolvedValue({email:'patient@example.test',userId:'u'}), claim:vi.fn().mockResolvedValue({token:'reservation',state:'pending'}), finish:vi.fn().mockResolvedValue(undefined), send:vi.fn().mockResolvedValue({providerId:null}) };
});
afterEach(() => vi.unstubAllEnvs());
it('envía enlace autenticado sin datos clínicos ni adjunto ni publicación y distingue aceptación', async () => {
  expect(await emailMealPlan('clinic','patient','plan',3,true,deps)).toEqual({status:'accepted'});
  const message = vi.mocked(deps.send).mock.calls[0][1];
  expect(message.text).toContain('https://planv.example.test/app/plan'); expect(message.text).toContain('no incluye un PDF');
  expect(message.text).not.toContain('patient@example.test');
  expect(await vi.mocked(deps.send).mock.calls[0][2]()).toBe(true);
  expect(deps.finish).toHaveBeenCalledWith('reservation','accepted');
});
it('sin transporte o mail confirmado/permiso no reserva ni envía', async () => {
  vi.stubEnv('MAIL_ENABLED','false'); await expect(emailMealPlan('clinic','patient','plan',3,true,deps)).rejects.toThrow('configurado');
  vi.stubEnv('MAIL_ENABLED','true'); vi.mocked(deps.recipient).mockResolvedValue(null);
  await expect(emailMealPlan('clinic','patient','plan',3,true,deps)).rejects.toThrow('confirmado');
  expect(deps.claim).not.toHaveBeenCalled(); expect(deps.send).not.toHaveBeenCalled();
});
it('nunca manda borrador o plan ajeno', async () => {
  mocks.plan.mockResolvedValue({id:'other',published:{version:3}});
  await expect(emailMealPlan('clinic','patient','plan',3,true,deps)).rejects.toThrow('publicá');
  mocks.plan.mockResolvedValue({id:'plan',published:null});
  await expect(emailMealPlan('clinic','patient','plan',3,true,deps)).rejects.toThrow('publicá');
  expect(deps.send).not.toHaveBeenCalled();
});
it('repetición aceptada e incertidumbre no vuelven a llamar al transporte', async () => {
  vi.mocked(deps.claim).mockResolvedValue({token:null,state:'accepted'});
  expect(await emailMealPlan('clinic','patient','plan',3,true,deps)).toEqual({status:'already_accepted'});
  vi.mocked(deps.claim).mockResolvedValue({token:null,state:'pending'});
  await expect(emailMealPlan('clinic','patient','plan',3,true,deps)).rejects.toThrow('duplicados');
  expect(deps.send).not.toHaveBeenCalled();
});
it('fallo externo se congela para revisión; permiso revocado o versión cambiada antes del envío lo frena', async () => {
  vi.mocked(deps.send).mockImplementation(async (_config,_message,canSend) => {
    vi.mocked(deps.recipient).mockResolvedValue(null);
    expect(await canSend()).toBe(false); throw new Error('uncertain');
  });
  await expect(emailMealPlan('clinic','patient','plan',3,true,deps)).rejects.toThrow('revisión');
  expect(deps.finish).toHaveBeenCalledWith('reservation','uncertain');
});
