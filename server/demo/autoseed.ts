import { seedDemoContent, type DemoStep } from './content.js';

type Fetcher = (path: string, init?: RequestInit) => Response | Promise<Response>;

/** Paciente de ejemplo principal de la demo (la misma que usa seedDemoContent). */
const MAIN_PATIENT = 'pat-sofia';

/**
 * La demo vive en memoria y arrancaba vacía: sin recetas, plan, medidas ni rutina,
 * las pantallas no se parecían al diseño. Al iniciar la API en modo demo se carga
 * el contenido de ejemplo por las mismas rutas que usa la app.
 *
 * - No hace nada si ya hay un plan publicado (por ejemplo, un guardado local restaurado).
 * - `DEMO_SEED=0` lo apaga.
 */
export async function seedDemoOnBoot(
  request: Fetcher,
  env: NodeJS.ProcessEnv = process.env,
): Promise<{ seeded: boolean; failed: DemoStep[] }> {
  if (env.DEMO_SEED === '0') return { seeded: false, failed: [] };
  const current = await request(`/api/patients/${MAIN_PATIENT}/plans`);
  if (current.ok && (await current.json() as { plan?: unknown }).plan) return { seeded: false, failed: [] };
  const steps = await seedDemoContent(request);
  return { seeded: true, failed: steps.filter((step) => !step.ok) };
}
