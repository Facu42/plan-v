import { useEffect, useRef, useState } from 'react';
import { modelsApi } from '../../api/models';
import { plansApi } from '../../api/plans';
import type { Patient } from '../../types';
import {
  MODEL_KINDS,
  MODEL_LABELS,
  applyModelOverrides,
  modelPlanFrom,
  modelReady,
  modelSaveSchema,
  type ModelCopy,
  type ModelKind,
  type ModelSaveInput,
  type ProfessionalModel,
} from '../../types/models';
import { componentGrams, componentTitle } from '../../types/plan-components';
import {
  recipeNutritionLabel,
  type ProposedRecipe,
} from '../../types/ai-nutrition';
import type { PlanRecipeDetail } from '../../types/plans';
import {
  analyzePlanWeek,
  type DayAnalysisLine,
} from '../../types/plan-day-analysis';
import { FigmaRecordDialog } from './FigmaPatientFront';
import { canLeaveWorkspace, useUnsavedChanges } from './unsaved-changes';
import { NvBadge, NvButton, NvState } from './primitives';
import './model-catalog.css';
import { ModelApplyDialog } from './ModelApplyDialog';

function errorMessage(error: unknown, fallback: string) {
  if (!(error instanceof Error)) return fallback;
  try {
    const parsed: unknown = JSON.parse(error.message);
    if (
      parsed &&
      typeof parsed === 'object' &&
      'error' in parsed &&
      typeof parsed.error === 'string'
    )
      return parsed.error;
  } catch {
    /* Plain application error. */
  }
  return error.message;
}

function RecipeDetails({
  recipe,
  portions,
}: {
  recipe: PlanRecipeDetail | ProposedRecipe;
  portions: number;
}) {
  return (
    <details>
      <summary>
        Ingredientes y preparación
        {'version' in recipe ? ` · receta v${recipe.version}` : ' · propuesta'}
      </summary>
      <p>
        {recipeNutritionLabel(
          recipe.nutrition,
          'nutrient_source' in recipe ? recipe.nutrient_source : '',
        )}
        {'catalog_recipe' in recipe && recipe.catalog_recipe?.estimate_origin
          ? ' · Procedencia de IA conservada'
          : ''}
      </p>
      <ul>
        {recipe.ingredients.map((i, index) => (
          <li key={index}>
            {i.name}:{' '}
            {Number.isFinite(portions) &&
            portions > 0 &&
            recipe.yield_portions > 0
              ? (
                  (i.quantity * portions) /
                  recipe.yield_portions
                ).toLocaleString('es-AR', { maximumSignificantDigits: 6 })
              : 'Sin cantidad confirmada'}{' '}
            {i.unit}
          </li>
        ))}
      </ul>
      <ol>
        {recipe.steps.map((s, index) => (
          <li key={index}>{s}</li>
        ))}
      </ol>
    </details>
  );
}
function Nutrients({ plan }: { plan: NonNullable<ModelCopy['plan']> }) {
  const analysis = analyzePlanWeek(
    Array.from({ length: plan.days }, (_, i) => ({
      date: String(i + 1),
      lines: plan.items
        .filter((item) => item.day === i + 1)
        .flatMap<DayAnalysisLine>((item) =>
          item.components
            ? item.components.map((component) => ({ portions: '', component }))
            : [
                {
                  portions: String(item.portions ?? ''),
                  recipe: item.recipe,
                  proposal: item.recipe_proposal,
                },
              ],
        ),
    })),
  );
  return (
    <div className="mc-nutrients">
      <small>
        Promedio diario
        {analysis.estimated ? ' · incluye estimaciones de IA' : ''}
      </small>
      <dl>
        {analysis.nutrients
          .filter((n) => ['kcal', 'protein', 'carbs', 'fat'].includes(n.key))
          .map((n) => (
            <div key={n.key}>
              <dt>{n.label}</dt>
              <dd>
                {n.total == null
                  ? '—'
                  : `${n.total.toLocaleString('es-AR', { maximumFractionDigits: 1 })} ${n.unit}`}
              </dd>
            </div>
          ))}
      </dl>
      {analysis.nutrients.some((n) => n.total == null) && (
        <small>
          Datos incompletos: los valores desconocidos no se cuentan como cero.
        </small>
      )}
    </div>
  );
}
export function ModelContent({ copy }: { copy: ModelCopy }) {
  return (
    <div className="mc-content">
      {copy.plan ? (
        <>
          <p>
            {copy.plan.days} días · {copy.plan.items.length} comidas
          </p>
          <Nutrients plan={copy.plan} />
          {copy.plan.items.map((item, i) => (
            <article key={i}>
              <strong>
                Día {item.day} · {item.slot}
              </strong>
              {item.components ? (
                <ul>
                  {item.components.map((c) => (
                    <li key={c.id}>
                      {componentTitle(c)}
                      {c.kind === 'food'
                        ? ` · ${c.quantity} ${c.measure ?? 'g'}`
                        : c.kind === 'recipe' || c.recipe_proposal
                          ? ` · ${c.portions} porciones`
                          : ''}
                      {c.kind === 'food' && (
                        <small>
                          {' '}
                          ·{' '}
                          {c.measure && componentGrams(c) != null
                            ? `${componentGrams(c)} g · `
                            : ''}
                          Fuente: {c.food_snapshot?.source ?? 'Sin fuente'} ·
                          revisión {c.food_revision}
                        </small>
                      )}
                      {c.public_note && <p>Nota: {c.public_note}</p>}
                      {c.kind === 'recipe' && c.recipe_snapshot && (
                        <RecipeDetails
                          recipe={c.recipe_snapshot}
                          portions={c.portions}
                        />
                      )}
                      {c.kind === 'text' && c.recipe_proposal && (
                        <RecipeDetails
                          recipe={c.recipe_proposal}
                          portions={c.portions ?? NaN}
                        />
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div>
                  <p>
                    {item.recipe_title ?? item.free_text}
                    {item.portions ? ` · ${item.portions} porciones` : ''}
                  </p>
                  {item.recipe && (
                    <RecipeDetails
                      recipe={item.recipe}
                      portions={item.portions ?? NaN}
                    />
                  )}
                  {item.recipe_proposal && (
                    <RecipeDetails
                      recipe={item.recipe_proposal}
                      portions={item.portions ?? NaN}
                    />
                  )}
                </div>
              )}
              {item.public_note && <p>{item.public_note}</p>}
            </article>
          ))}
        </>
      ) : (
        <ul>
          {copy.lines.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
function Editor({
  model,
  kind,
  patients,
  onClose,
  onSaved,
}: {
  model?: ProfessionalModel;
  kind: ModelKind;
  patients: Patient[];
  onClose: () => void;
  onSaved: (m: ProfessionalModel) => void;
}) {
  const [input, setInput] = useState<ModelSaveInput>(() => ({
    id: model?.id ?? crypto.randomUUID(),
    expected_revision: model?.revision ?? null,
    kind,
    title: model?.current.title ?? '',
    description: model?.current.description ?? '',
    lines: model?.current.lines ?? [],
    overrides: [],
  }));
  const [lines, setLines] = useState(input.lines.join('\n'));
  const [plan, setPlan] = useState(model?.current.plan);
  const [patient, setPatient] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const initial = useRef(JSON.stringify({ input, lines }));
  const dirty = initial.current !== JSON.stringify({ input, lines });
  useUnsavedChanges(dirty, busy);
  async function capture() {
    if (!patient || busy) return;
    if (
      plan?.items.length &&
      !window.confirm(
        '¿Reemplazar el contenido del modelo con el plan seleccionado?',
      )
    )
      return;
    setBusy(true);
    setError('');
    try {
      const { plan: source } = await plansApi.professional(patient);
      if (!source?.current.revision || !source.current.items.length)
        throw new Error('El paciente necesita un plan guardado con comidas.');
      setPlan(modelPlanFrom(source.current));
      setInput((v) => ({
        ...v,
        source: {
          patient_id: patient,
          version: source.current.version,
          revision: source.current.revision!,
        },
        overrides: [],
      }));
    } catch (e) {
      setError(errorMessage(e, 'No pudimos cargar el plan.'));
    } finally {
      setBusy(false);
    }
  }
  function editItem(
    index: number,
    change: Partial<ModelSaveInput['overrides'][number]>,
  ) {
    setInput((v) => {
      const existing = v.overrides.find((e) => e.index === index) ?? {
        index,
        public_note: plan!.items[index].public_note,
        amounts: [],
        notes: [],
      };
      return {
        ...v,
        overrides: [
          ...v.overrides.filter((e) => e.index !== index),
          { ...existing, ...change },
        ],
      };
    });
  }
  const preview = (() => {
    try {
      return plan ? applyModelOverrides(plan, input.overrides) : undefined;
    } catch {
      return plan;
    }
  })();
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError('');
    const parsed = modelSaveSchema.safeParse({
      ...input,
      lines:
        kind === 'plan'
          ? []
          : lines
              .split('\n')
              .map((l) => l.trim())
              .filter(Boolean),
    });
    if (!parsed.success) {
      setError(
        'Revisá nombre, indicaciones y cantidades. Cada lista admite hasta 50 indicaciones de 500 caracteres.',
      );
      return;
    }
    setBusy(true);
    try {
      onSaved((await modelsApi.save(parsed.data)).model);
    } catch (e) {
      setError(errorMessage(e, 'No pudimos guardar.'));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={save} className="mc-editor">
      <fieldset disabled={busy}>
        <p>
          {MODEL_LABELS[kind]}
          {model?.published
            ? ` · La copia publicada v${model.published.version} se conserva.`
            : ''}
        </p>
        <label>
          Nombre del modelo
          <input
            autoFocus
            required
            maxLength={160}
            value={input.title}
            onChange={(e) => setInput({ ...input, title: e.target.value })}
          />
        </label>
        <label>
          Descripción breve
          <textarea
            maxLength={400}
            rows={2}
            value={input.description}
            onChange={(e) =>
              setInput({ ...input, description: e.target.value })
            }
          />
        </label>
        {kind === 'plan' ? (
          <>
            <div className="mc-source">
              <label>
                Copiar desde un plan guardado
                <select
                  value={patient}
                  onChange={(e) => setPatient(e.target.value)}
                >
                  <option value="">Elegí el paciente de origen</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <NvButton
                type="button"
                disabled={!patient}
                onClick={() => void capture()}
              >
                Copiar comidas
              </NvButton>
            </div>
            <p className="mc-caption">
              Se copian comidas, cantidades y notas. El nombre del paciente, sus
              fechas y su objetivo personal quedan fuera del modelo. Revisá las
              notas por si contienen información personal antes de publicar.
            </p>
            {preview?.items.map((item, index) => (
              <article className="mc-meal" key={index}>
                <strong>
                  Día {item.day} · {item.slot}
                </strong>
                {item.components?.map((c) => (
                  <label key={c.id}>
                    {componentTitle(c)}
                    {c.kind === 'food' ||
                    c.kind === 'recipe' ||
                    (c.kind === 'text' && c.recipe_proposal) ? (
                      <input
                        type="number"
                        step="any"
                        min="0"
                        max={c.kind === 'food' ? 100000 : 50}
                        value={
                          input.overrides
                            .find((o) => o.index === index)
                            ?.amounts.find((a) => a.id === c.id)?.quantity ??
                          (c.kind === 'food' ? c.quantity : (c.portions ?? 1))
                        }
                        onChange={(e) => {
                          const amounts =
                            input.overrides.find((o) => o.index === index)
                              ?.amounts ?? [];
                          editItem(index, {
                            amounts: [
                              ...amounts.filter((a) => a.id !== c.id),
                              { id: c.id, quantity: Number(e.target.value) },
                            ],
                          });
                        }}
                        aria-label={`Cantidad de ${componentTitle(c)}`}
                      />
                    ) : (
                      <span>Indicación sin cantidades</span>
                    )}
                    <small>
                      {c.kind === 'food'
                        ? (c.measure ?? 'g')
                        : c.kind === 'recipe' || c.recipe_proposal
                          ? 'porciones'
                          : ''}
                    </small>
                  </label>
                ))}
                {item.components?.map((c) => (
                  <label key={`note:${c.id}`}>
                    Nota de {componentTitle(c)}
                    <input
                      maxLength={200}
                      value={
                        input.overrides
                          .find((o) => o.index === index)
                          ?.notes.find((n) => n.id === c.id)?.public_note ??
                        c.public_note
                      }
                      onChange={(e) => {
                        const notes =
                          input.overrides.find((o) => o.index === index)
                            ?.notes ?? [];
                        editItem(index, {
                          notes: [
                            ...notes.filter((n) => n.id !== c.id),
                            { id: c.id, public_note: e.target.value },
                          ],
                        });
                      }}
                    />
                  </label>
                ))}
                {!item.components && (
                  <p>{item.recipe_title ?? item.free_text}</p>
                )}
                {!item.components && item.portions != null && (
                  <label>
                    Porciones
                    <input
                      type="number"
                      step="any"
                      min="0"
                      max={50}
                      value={
                        input.overrides.find((o) => o.index === index)
                          ?.portions ?? item.portions
                      }
                      onChange={(e) =>
                        editItem(index, { portions: Number(e.target.value) })
                      }
                    />
                  </label>
                )}
                <label>
                  Nota para esta comida
                  <input
                    maxLength={200}
                    value={
                      input.overrides.find((o) => o.index === index)
                        ?.public_note ?? item.public_note
                    }
                    onChange={(e) =>
                      editItem(index, { public_note: e.target.value })
                    }
                  />
                </label>
              </article>
            ))}
            {!preview?.items.length && (
              <p>
                Podés guardar el nombre como borrador y completar las comidas
                después.
              </p>
            )}
            {preview?.items.length ? (
              <details>
                <summary>Revisar ingredientes, preparación y notas</summary>
                <ModelContent
                  copy={{
                    version: model?.current.version ?? 1,
                    title: input.title,
                    description: input.description,
                    lines: [],
                    plan: preview,
                    published_at: null,
                  }}
                />
              </details>
            ) : null}
          </>
        ) : (
          <label>
            Indicaciones, una por línea
            <textarea
              rows={10}
              value={lines}
              onChange={(e) => setLines(e.target.value)}
            />
            <small>Hasta 50 indicaciones. Revisalas antes de publicar.</small>
          </label>
        )}
        {error && <p role="alert">{error}</p>}
        <footer>
          <NvButton type="button" onClick={onClose}>
            Cancelar
          </NvButton>
          <NvButton className="nv-primary" type="submit">
            {busy ? 'Guardando…' : 'Guardar borrador'}
          </NvButton>
        </footer>
      </fieldset>
    </form>
  );
}
export function ModelCatalog({
  patients,
  onOpenHref,
}: {
  patients: Patient[];
  onOpenHref?: (href: string) => void;
}) {
  const [applying, setApplying] = useState<ProfessionalModel | null>(null),
    [draftHref, setDraftHref] = useState('');
  const [models, setModels] = useState<ProfessionalModel[]>([]);
  const [kind, setKind] = useState<ModelKind>('plan');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [retry, setRetry] = useState(0);
  const [editor, setEditor] = useState<{
    model?: ProfessionalModel;
    kind: ModelKind;
  } | null>(null);
  const [review, setReview] = useState<{
    model: ProfessionalModel;
    action: 'publish' | 'archive' | 'view';
  } | null>(null);
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    modelsApi
      .list(controller.signal)
      .then((r) => {
        if (!controller.signal.aborted) setModels(r.models);
      })
      .catch((e) => {
        if (!controller.signal.aborted)
          setError(errorMessage(e, 'No pudimos cargar Modelos.'));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [retry]);
  function close() {
    if (busy || !canLeaveWorkspace()) return;
    setApplying(null);
    setEditor(null);
    setReview(null);
    setChecked(false);
  }
  function update(model: ProfessionalModel) {
    setModels((v) => [
      ...v.filter((m) => m.id !== model.id),
      ...(!model.archived_at ? [model] : []),
    ]);
  }
  async function act() {
    if (!review || review.action === 'view' || busy || !checked) return;
    setBusy(true);
    setError('');
    try {
      update((await modelsApi.action(review.model, review.action)).model);
      setNotice(
        review.action === 'publish'
          ? 'Modelo publicado. Su copia queda disponible para reutilizar.'
          : 'Modelo archivado. Las copias existentes se conservan.',
      );
      setReview(null);
      setChecked(false);
    } catch (e) {
      setError(errorMessage(e, 'No pudimos confirmar la operación.'));
    } finally {
      setBusy(false);
    }
  }
  const shown = models
    .filter(
      (m) =>
        m.kind === kind &&
        `${m.current.title} ${m.current.description}`
          .toLocaleLowerCase('es')
          .includes(query.toLocaleLowerCase('es')),
    )
    .sort((a, b) => a.current.title.localeCompare(b.current.title, 'es'));
  return (
    <section className="mc-catalog" aria-label="Catálogo de modelos">
      <header className="mc-heading">
        <div>
          <span className="mc-eyebrow">TU BIBLIOTECA DE TRABAJO</span>
          <h1>Modelos</h1>
          <p>Prepará una base reutilizable y conservá su copia revisada.</p>
        </div>
        <NvButton className="nv-primary" onClick={() => setEditor({ kind })}>
          Crear modelo
        </NvButton>
      </header>
      <nav className="mc-tabs" aria-label="Categorías de modelos">
        {MODEL_KINDS.map((k) => (
          <button
            type="button"
            key={k}
            aria-pressed={kind === k}
            onClick={() => {
              setKind(k);
              setQuery('');
            }}
          >
            {MODEL_LABELS[k]}{' '}
            <span>{models.filter((m) => m.kind === k).length}</span>
          </button>
        ))}
      </nav>
      <label className="mc-search">
        Buscar modelos
        <input
          type="search"
          placeholder="Nombre o descripción"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      {notice && (
        <p role="status">
          {notice}
          {draftHref && (
            <>
              {' '}
              <a
                href={draftHref}
                onClick={(e) => {
                  if (onOpenHref) {
                    e.preventDefault();
                    onOpenHref(draftHref);
                  }
                }}
              >
                Abrir borrador para revisar
              </a>
            </>
          )}
        </p>
      )}
      {error && !review && (
        <NvState
          kind="error"
          title="No pudimos completar la operación"
          description={error}
          action={
            <NvButton onClick={() => setRetry((v) => v + 1)}>
              Reintentar carga
            </NvButton>
          }
        />
      )}
      {loading ? (
        <NvState
          kind="loading"
          title="Cargando modelos…"
          description="Estamos recuperando tu catálogo."
        />
      ) : !error && !shown.length ? (
        <NvState
          title={
            query ? 'No hay coincidencias' : 'Tu primer modelo empieza acá'
          }
          description={
            query
              ? 'Probá otro nombre.'
              : kind === 'plan'
                ? 'Copiá un plan guardado y ajustá sus comidas.'
                : 'Guardá indicaciones que quieras reutilizar.'
          }
        />
      ) : (
        <div className="mc-grid">
          {shown.map((m) => (
            <article key={m.id} className="mc-card">
              <div className="mc-card-top">
                <NvBadge tone={m.current.published_at ? 'green' : 'gold'}>
                  {m.current.published_at
                    ? 'Publicado'
                    : m.published
                      ? 'Edición en borrador'
                      : 'Borrador'}
                </NvBadge>
                <span>v{m.current.version}</span>
              </div>
              <h2>{m.current.title}</h2>
              <p>{m.current.description || MODEL_LABELS[m.kind]}</p>
              <small>
                {m.current.plan
                  ? `${m.current.plan.days} días · ${m.current.plan.items.length} comidas`
                  : `${m.current.lines.length} indicaciones`}
              </small>
              {m.current.plan?.items.length ? (
                <Nutrients plan={m.current.plan} />
              ) : null}
              {m.published && !m.current.published_at && (
                <p className="mc-caption">
                  Copia publicada: v{m.published.version}
                </p>
              )}
              <footer>
                <NvButton onClick={() => setEditor({ model: m, kind: m.kind })}>
                  Editar
                </NvButton>
                {!m.current.published_at && (
                  <NvButton
                    disabled={!modelReady(m.current, m.kind)}
                    onClick={() => {
                      setReview({ model: m, action: 'publish' });
                      setChecked(false);
                      setError('');
                    }}
                  >
                    Revisar y publicar
                  </NvButton>
                )}
                {m.published && (
                  <NvButton
                    onClick={() => {
                      setReview({ model: m, action: 'view' });
                      setError('');
                    }}
                  >
                    Ver copia publicada
                  </NvButton>
                )}
                {m.published && (
                  <NvButton
                    onClick={() => {
                      setApplying(structuredClone(m));
                      setDraftHref('');
                      setNotice('');
                    }}
                  >
                    Aplicar al paciente
                  </NvButton>
                )}
                <button
                  className="mc-archive"
                  type="button"
                  onClick={() => {
                    setReview({ model: m, action: 'archive' });
                    setChecked(false);
                    setError('');
                  }}
                >
                  Archivar
                </button>
              </footer>
            </article>
          ))}
        </div>
      )}
      {applying && (
        <ModelApplyDialog
          model={applying}
          patients={patients}
          onClose={() => {
            close();
            setRetry((v) => v + 1);
          }}
          onApplied={(id, plan) => {
            setApplying(null);
            setDraftHref(
              `/crm/ficha?paciente=${encodeURIComponent(id)}&seccion=plan`,
            );
            setNotice(
              `Borrador v${plan.current.version} creado para ${patients.find((p) => p.id === id)?.name ?? 'el paciente'}. Las versiones anteriores se conservaron.`,
            );
          }}
        />
      )}
      {editor && (
        <FigmaRecordDialog
          title={editor.model ? 'Editar modelo' : 'Crear modelo'}
          className="mc-dialog"
          onClose={close}
        >
          <Editor
            model={editor.model}
            kind={editor.kind}
            patients={patients}
            onClose={close}
            onSaved={(m) => {
              update(m);
              setEditor(null);
              setNotice('Borrador guardado. Revisalo antes de publicar.');
            }}
          />
        </FigmaRecordDialog>
      )}
      {review && (
        <FigmaRecordDialog
          title={
            review.action === 'archive'
              ? 'Archivar modelo'
              : review.action === 'view'
                ? 'Copia publicada'
                : 'Revisar modelo'
          }
          className="mc-dialog"
          onClose={close}
        >
          <div className="mc-review" aria-busy={busy}>
            <h3>
              {review.action === 'view'
                ? review.model.published!.title
                : review.model.current.title}
            </h3>
            {review.action === 'archive' ? (
              <p>
                El modelo dejará de aparecer en el catálogo. Esta acción
                conserva las copias que ya se hayan utilizado.
              </p>
            ) : (
              <ModelContent
                copy={
                  review.action === 'view'
                    ? review.model.published!
                    : review.model.current
                }
              />
            )}
            {review.action !== 'view' && (
              <>
                <label className="mc-confirm">
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={busy}
                    onChange={(e) => setChecked(e.target.checked)}
                  />
                  {review.action === 'archive'
                    ? 'Confirmo que quiero archivar este modelo.'
                    : 'Revisé las cantidades y las indicaciones. Publicar este modelo no entrega un plan a ningún paciente.'}
                </label>
                {error && <p role="alert">{error}</p>}
                <footer>
                  <NvButton disabled={busy} onClick={close}>
                    Cancelar
                  </NvButton>
                  <NvButton
                    disabled={!checked || busy}
                    className="nv-primary"
                    onClick={() => void act()}
                  >
                    {busy
                      ? 'Confirmando…'
                      : review.action === 'archive'
                        ? 'Archivar modelo'
                        : 'Publicar modelo'}
                  </NvButton>
                </footer>
              </>
            )}
          </div>
        </FigmaRecordDialog>
      )}
    </section>
  );
}
