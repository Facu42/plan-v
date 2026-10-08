import { registerDemoState } from '../demo/state.js';
import { getRequestDb } from '../db/supabase-client.js';
import { CareError } from '../care/errors.js';
import {
  asProfessional,
  forkModelPlanMemory,
  getProfessionalMealPlan,
} from '../plans/repository.js';
import type { ModelApplyInput } from '../../src/types/models.js';
import type { ProfessionalMealPlan } from '../../src/types/plans.js';
import {
  applyModelOverrides,
  modelPlanFrom,
  modelReady,
  type ModelSaveInput,
  type ProfessionalModel,
} from '../../src/types/models.js';

const models = new Map<string, ProfessionalModel & { owner: string }>();
registerDemoState('models', () => ({ models }));
export function resetModelsMemory() {
  models.clear();
}
export async function applyModel(
  owner: string,
  id: string,
  input: ModelApplyInput,
  persistent: boolean,
): Promise<ProfessionalMealPlan> {
  if (persistent) {
    const { data, error } = await getRequestDb().rpc(
      'apply_professional_model',
      { model_id: id, payload: input },
    );
    dbError(error);
    if (!data) throw new CareError(503, 'No pudimos recuperar el borrador.');
    return asProfessional(data);
  }
  const model = owned(owner, id, input.expected_revision);
  if (
    !model?.published ||
    model.kind !== 'plan' ||
    model.published.version !== input.expected_version
  )
    throw new CareError(
      409,
      'Revisá la copia publicada del modelo antes de aplicar.',
    );
  return forkModelPlanMemory(
    owner,
    input.patient_id,
    structuredClone(model.published),
    input.period_start,
    input.expected_plan_revision,
  );
}
function dbError(error: { code?: string } | null) {
  if (!error) return;
  if (['42P01', '42883', 'PGRST202', 'PGRST205'].includes(error.code ?? ''))
    throw new CareError(
      501,
      'Modelos todavía requiere habilitar su almacenamiento en este entorno.',
    );
  if (error.code === '42501')
    throw new CareError(403, 'No tenés permiso para este modelo.');
  if (['PT409', '23505'].includes(error.code ?? ''))
    throw new CareError(
      409,
      'El modelo o el plan de origen cambió. Volvé a abrirlo antes de guardar.',
    );
  if (['22023', '23514', '22P02'].includes(error.code ?? ''))
    throw new CareError(
      400,
      'Revisá el contenido y las cantidades del modelo.',
    );
  throw new CareError(
    503,
    'No pudimos confirmar la operación. Tus cambios siguen en la ventana.',
  );
}
function owned(owner: string, id: string, revision: string | null) {
  const old = models.get(id);
  if (old && old.owner !== owner)
    throw new CareError(403, 'No tenés permiso para este modelo.');
  if ((old?.revision ?? null) !== revision || old?.archived_at)
    throw new CareError(409, 'El modelo cambió. Volvé a abrirlo.');
  return old;
}
function view(row: ProfessionalModel & { owner: string }): ProfessionalModel {
  const { owner: _owner, ...copy } = structuredClone(row);
  return copy;
}
export async function listModels(
  owner: string,
  persistent: boolean,
): Promise<ProfessionalModel[]> {
  if (!persistent)
    return [...models.values()]
      .filter((m) => m.owner === owner && !m.archived_at)
      .map(view);
  const result: ProfessionalModel[] = [];
  const ids = new Set<string>();
  let total: number | undefined;
  do {
    const { data, error, count } = await getRequestDb()
      .from('professional_models')
      .select('id,kind,revision,current,published,archived_at,updated_at', {
        count: 'exact',
      })
      .is('archived_at', null)
      .order('id')
      .range(result.length, result.length + 999);
    dbError(error);
    if (
      count == null ||
      (total !== undefined && total !== count) ||
      count > 5000 ||
      (!data?.length && result.length < count)
    )
      throw new CareError(
        503,
        'No pudimos cargar el catálogo completo. Reintentá.',
      );
    total = count;
    for (const row of data ?? []) {
      if (ids.has(row.id))
        throw new CareError(
          503,
          'El catálogo cambió mientras se cargaba. Reintentá.',
        );
      ids.add(row.id);
      result.push(row as ProfessionalModel);
    }
  } while (result.length < total);
  return result;
}
export async function saveModel(
  owner: string,
  input: ModelSaveInput,
  persistent: boolean,
): Promise<ProfessionalModel> {
  if (persistent) {
    const { data, error } = await getRequestDb().rpc(
      'save_professional_model',
      { payload: input },
    );
    dbError(error);
    if (!data) throw new CareError(503, 'No pudimos confirmar el guardado.');
    return data;
  }
  const before = owned(owner, input.id, input.expected_revision);
  if (before && before.kind !== input.kind)
    throw new CareError(400, 'La categoría de un modelo no se puede cambiar.');
  let plan = before?.current.plan ?? { days: 7, items: [] };
  if (input.source) {
    const source = await getProfessionalMealPlan(
      owner,
      input.source.patient_id,
      false,
    );
    if (
      !source ||
      source.current.version !== input.source.version ||
      source.current.revision !== input.source.revision
    )
      throw new CareError(
        409,
        'El plan de origen cambió. Volvé a seleccionarlo.',
      );
    plan = modelPlanFrom(source.current);
  }
  try {
    plan = applyModelOverrides(plan, input.overrides);
  } catch (error) {
    throw new CareError(
      400,
      error instanceof Error ? error.message : 'Revisá las cantidades.',
    );
  }
  // Source resolution can yield; recheck the optimistic lock before committing.
  const old = owned(owner, input.id, input.expected_revision);
  const row = {
    id: input.id,
    owner,
    kind: input.kind,
    revision: crypto.randomUUID(),
    current: {
      version:
        (old?.current.version ?? 1) + (old?.current.published_at ? 1 : 0),
      title: input.title,
      description: input.description,
      lines: input.lines,
      ...(input.kind === 'plan' ? { plan } : {}),
      published_at: null,
    },
    published: old?.published ?? null,
    archived_at: null,
    updated_at: new Date().toISOString(),
  };
  models.set(row.id, structuredClone(row));
  return view(row);
}
export async function modelAction(
  owner: string,
  id: string,
  revision: string,
  action: 'publish' | 'archive',
  persistent: boolean,
): Promise<ProfessionalModel> {
  if (persistent) {
    const { data, error } = await getRequestDb().rpc('act_professional_model', {
      model_id: id,
      expected_revision: revision,
      action,
    });
    dbError(error);
    if (!data) throw new CareError(503, 'No pudimos confirmar la operación.');
    return data;
  }
  const row = owned(owner, id, revision);
  if (!row) throw new CareError(404, 'Modelo no encontrado.');
  if (action === 'publish') {
    if (row.current.published_at || !modelReady(row.current, row.kind))
      throw new CareError(
        400,
        'Completá y revisá el contenido antes de publicar.',
      );
    row.current.published_at = new Date().toISOString();
    row.published = structuredClone(row.current);
  } else row.archived_at = new Date().toISOString();
  row.revision = crypto.randomUUID();
  row.updated_at = new Date().toISOString();
  return view(row);
}
