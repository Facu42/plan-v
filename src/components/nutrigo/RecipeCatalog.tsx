import { useEffect, useRef, useState, type FormEvent } from 'react';
import { recipesApi } from '../../api/recipes';
import { aiJobsApi } from '../../api/ai-jobs';
import { careErrorMessage } from '../../api/care';
import { recipeInputSchema, type RecipeInput, type RecipeView } from '../../types/recipes';
import type { AiJobView } from '../../types/ai-jobs';
import { hasBlockingEvaluation } from '../../types/ai-eval';
import { Icon } from '../shared/Icon';
import './care-panel.css';

function lines(value: string) {
  return value.split('\n').map(item => item.trim()).filter(Boolean);
}

export function RecipeCatalog({ query = '', patientId }: { query?: string; patientId?: string }) {
  const [recipes, setRecipes] = useState<RecipeView[] | null>(null);
  const [source, setSource] = useState<'memory' | 'supabase' | ''>('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [form, setForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const lock = useRef(false);

  const [proposal, setProposal] = useState<AiJobView | null>(null);

  const [revision, setRevision] = useState(0);

  async function reload() {
    setRevision(value => value + 1);
  }
  useEffect(() => {
    const controller = new AbortController();
    recipesApi.catalog(controller.signal)
      .then(result => { setRecipes(result.recipes); setSource(result.source); setError(''); })
      .catch(err => { if (err instanceof DOMException && err.name === 'AbortError') return; setError(careErrorMessage(err)); });
    return () => controller.abort();
  }, [revision]);

  const term = query.trim().toLocaleLowerCase('es-AR');
  const visible = (recipes ?? []).filter(recipe => !term || `${recipe.title} ${recipe.ingredients.join(' ')} ${recipe.nutrient_source}`.toLocaleLowerCase('es-AR').includes(term));

  return <section className="care-panel" aria-label="Catálogo de recetas">
    <header className="care-heading">
      <div><span className="care-eyebrow">CONSULTORIO</span><h2>Recetas del consultorio</h2><p>Ingredientes, pasos, porciones y fuente. El paciente sólo ve las que publiques. Una propuesta de IA se guarda inédita hasta que la revises.</p></div>
      <Icon name="leaf" size={24} />
    </header>
    {source === 'memory' && <p className="care-demo">Vista demo · el catálogo de prueba se conserva mientras la API siga encendida.</p>}
    {error && <p className="care-error" role="alert">{error} <button type="button" onClick={() => void reload()}>Reintentar</button></p>}
    {!recipes && !error && <p role="status">Cargando catálogo…</p>}
    <div className="care-actions">
      <button className="nv-button primary" type="button" disabled={busy} onClick={() => { setForm(true); setStatus(''); }}><Icon name="plus" size={16} />Nueva receta</button>
      <button className="nv-button" type="button" disabled={busy || !patientId} onClick={() => {
        if (!patientId || lock.current) return;
        lock.current = true; setBusy(true); setStatus('');
        void aiJobsApi.create(patientId, { id: crypto.randomUUID(), job_type: 'recipe' })
          .then((result) => {
            setProposal(result.job);
            setStatus(result.job.status === 'succeeded' ? 'Propuesta lista. Revisala y guardala en el catálogo sin publicar.' : 'La propuesta no se pudo completar. El paciente no la ve.');
          })
          .catch((err) => setStatus(careErrorMessage(err)))
          .finally(() => { lock.current = false; setBusy(false); });
      }}>Proponer receta</button>
    </div>
    {proposal?.artifact?.kind === 'recipe' && <RecipeProposalCard job={proposal} busy={busy} onSave={async () => {
      if (!patientId || lock.current) return;
      lock.current = true; setBusy(true); setStatus('');
      try {
        await aiJobsApi.apply(patientId, proposal.id);
        await reload();
        setStatus('Receta guardada en el catálogo. Todavía no la ve el paciente.');
      } catch (err) { setStatus(careErrorMessage(err)); }
      finally { lock.current = false; setBusy(false); }
    }} />}
    <div className="care-recipes">{visible.map(recipe => <article key={recipe.id}>
      <span className="care-eyebrow">{recipe.published_at ? 'PUBLICADA' : 'SIN PUBLICAR'} · {recipe.servings} {recipe.servings === 1 ? 'porción' : 'porciones'}</span>
      <h3>{recipe.title}</h3>
      <p>{recipe.explanation}</p>
      <p><small>Fuente: {recipe.nutrient_source}</small></p>
      <button className="nv-button" type="button" onClick={() => setOpenId(openId === recipe.id ? null : recipe.id)}>{openId === recipe.id ? 'Ocultar detalle' : 'Ver ingredientes y pasos'}</button>
      {openId === recipe.id && <>
        <h4>Ingredientes</h4><ul>{recipe.ingredients.map((item, index) => <li key={index}>{item}</li>)}</ul>
        <h4>Preparación</h4><ol>{recipe.steps.map((item, index) => <li key={index}>{item}</li>)}</ol>
      </>}
      {!recipe.published_at && <button className="nv-button primary" type="button" disabled={busy} onClick={() => {
        if (lock.current) return;
        lock.current = true; setBusy(true); setStatus('');
        void recipesApi.publish(recipe.id).then(async () => { await reload(); setStatus('Receta publicada. Tus pacientes asignados pueden verla.'); }).catch(err => setStatus(careErrorMessage(err))).finally(() => { lock.current = false; setBusy(false); });
      }}>Publicar para pacientes</button>}
    </article>)}{recipes && !visible.length && <p className="care-empty">{term ? 'Ninguna receta coincide con la búsqueda.' : 'Todavía no hay recetas en el catálogo.'}</p>}</div>
    {status && <p className="care-status" role="status">{status}</p>}
    {form && <RecipeForm busy={busy} onClose={() => setForm(false)} onSave={async input => {
      if (lock.current) return;
      lock.current = true; setBusy(true); setStatus('');
      try {
        await recipesApi.save(input);
        await reload();
        setForm(false);
        setStatus('Receta guardada. Todavía no la ve el paciente.');
      } catch (err) { setStatus(careErrorMessage(err)); }
      finally { lock.current = false; setBusy(false); }
    }} />}
  </section>;
}

function RecipeForm({ busy, onClose, onSave }: { busy: boolean; onClose: () => void; onSave: (input: RecipeInput) => Promise<void> }) {
  const id = useRef(crypto.randomUUID());
  const [title, setTitle] = useState('');
  const [servings, setServings] = useState('2');
  const [source, setSource] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [steps, setSteps] = useState('');
  const [explanation, setExplanation] = useState('');
  const [error, setError] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = recipeInputSchema.safeParse({
      id: id.current,
      title,
      servings: Number(servings),
      nutrient_source: source,
      ingredients: lines(ingredients),
      steps: lines(steps),
      explanation,
    });
    if (!parsed.success) { setError('Revisá el título, las porciones, los ingredientes, los pasos y la fuente nutricional.'); return; }
    setError('');
    await onSave(parsed.data);
  }
  return <div className="care-modal" role="dialog" aria-modal="true" aria-labelledby="recipe-form-title">
    <form className="care-form" onSubmit={submit}>
      <header><h2 id="recipe-form-title">Nueva receta</h2><button type="button" aria-label="Cerrar formulario" disabled={busy} onClick={onClose}>×</button></header>
      <fieldset disabled={busy}>
        <label>Nombre<input value={title} onChange={e => setTitle(e.target.value)} maxLength={150} minLength={2} required autoFocus /></label>
        <div className="care-form-row">
          <label>Porciones<input type="number" min={1} max={20} value={servings} onChange={e => setServings(e.target.value)} required /></label>
          <label>Fuente nutricional<input value={source} onChange={e => setSource(e.target.value)} maxLength={200} minLength={2} required placeholder="Ej. Tabla SARA / revisión profesional" /></label>
        </div>
        <label>Ingredientes · uno por línea<textarea value={ingredients} onChange={e => setIngredients(e.target.value)} required /></label>
        <label>Preparación · un paso por línea<textarea value={steps} onChange={e => setSteps(e.target.value)} required /></label>
        <label>Explicación para el paciente<textarea value={explanation} onChange={e => setExplanation(e.target.value)} maxLength={800} minLength={2} required /></label>
      </fieldset>
      {error && <p role="alert" className="care-error">{error}</p>}
      <footer>
        <button className="nv-button" type="button" onClick={onClose} disabled={busy}>Cancelar</button>
        <button className="nv-button primary" type="submit" disabled={busy}>{busy ? 'Guardando…' : 'Guardar sin publicar'}</button>
      </footer>
    </form>
  </div>;
}

function RecipeProposalCard({ job, busy, onSave }: { job: AiJobView; busy: boolean; onSave: () => Promise<void> }) {
  if (job.artifact?.kind !== 'recipe') return null;
  const recipe = job.artifact.payload;
  const blocked = hasBlockingEvaluation(job.evaluation);
  return <article className="care-proposal" aria-label="Propuesta de receta">
    <span className="care-eyebrow">PROPUESTA · {job.prompt_version} · no publicada</span>
    <h3>{recipe.title}</h3>
    <p>{recipe.explanation}</p>
    <ul>{recipe.ingredients.map((item, index) => <li key={index}>{item}</li>)}</ul>
    {recipe.warnings.map((warning) => <p key={warning}><small>{warning}</small></p>)}
    {(job.evaluation?.findings ?? []).length > 0 && <ul className="care-eval">{job.evaluation?.findings.map((item) => <li key={`${item.code}-${item.path ?? ''}`} data-severity={item.severity}>{item.message}</li>)}</ul>}
    <button className="nv-button primary" type="button" disabled={busy || blocked} onClick={() => void onSave()}>{blocked ? 'Revisá las alertas antes de guardar' : 'Guardar en el catálogo sin publicar'}</button>
  </article>;
}
