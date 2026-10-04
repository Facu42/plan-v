import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { careErrorMessage } from '../../api/care';
import { isAbortError } from '../../api/client';
import { bodyDataApi, nutritionTargetApi, type BodyDataView, type NutritionTarget } from '../../api/nutrition-target';
import {
  ACTIVITY_FACTORS, ACTIVITY_LABELS, ACTIVITY_LEVELS, GOAL_LABELS, SEX_LABELS, SEX_OPTIONS, TARGET_GOALS,
  ageFromBirthDate, bodyDataSchema, calculateTarget, defaultsForGoal, targetInputSchema, type TargetGoal, type TargetInput,
} from '../../lib/nutrition-target';
import { NvBadge, NvButton } from './primitives';
import './nutrition-target.css';

type Draft = { sex: string; age: string; weight_kg: string; height_cm: string; activity: string; goal: TargetGoal; adjust_pct: string; protein_g_per_kg: string; fat_pct: string };

function toDraft(input: TargetInput | null): Draft {
  const d = input ?? { sex: 'femenino' as const, age: 0, weight_kg: 0, height_cm: 0, activity: 'ligera' as const, ...defaultsForGoal('mantener') };
  const blank = (n: number) => (n ? String(n) : '');
  return { sex: d.sex, age: blank(d.age), weight_kg: blank(d.weight_kg), height_cm: blank(d.height_cm), activity: d.activity, goal: d.goal, adjust_pct: String(d.adjust_pct), protein_g_per_kg: String(d.protein_g_per_kg), fat_pct: String(d.fat_pct) };
}
const num = (v: string) => (v.trim() === '' ? NaN : Number(v.replace(',', '.')));
function parseDraft(d: Draft) {
  return targetInputSchema.safeParse({ sex: d.sex, age: num(d.age), weight_kg: num(d.weight_kg), height_cm: num(d.height_cm), activity: d.activity, goal: d.goal, adjust_pct: num(d.adjust_pct), protein_g_per_kg: num(d.protein_g_per_kg), fat_pct: num(d.fat_pct) });
}

function MacroRow({ label, grams, pct }: { label: string; grams: number; pct: number }) {
  return <li><span>{label}</span><b>{grams} g</b><small>{pct}%</small></li>;
}

export function TargetSummary({ target, heading }: { target: NutritionTarget; heading?: string }) {
  const r = target.result;
  return <div className="nvt-summary">
    {heading && <h3>{heading}</h3>}
    <p className="nvt-kcal"><strong>{r.kcal}</strong><span>kcal por día</span></p>
    <ul className="nvt-macros" aria-label="Reparto de macronutrientes"><MacroRow label="Proteínas" grams={r.protein_g} pct={r.protein_pct} /><MacroRow label="Hidratos" grams={r.carbs_g} pct={r.carbs_pct} /><MacroRow label="Grasas" grams={r.fat_g} pct={r.fat_pct} /></ul>
  </div>;
}

/** Vista de la paciente: sólo aparece cuando la nutricionista confirmó la meta. */
export function PatientNutritionTarget({ patientId }: { patientId: string }) {
  const [target, setTarget] = useState<NutritionTarget | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    setTarget(null); setError('');
    nutritionTargetApi.get(patientId, false, controller.signal).then((r) => { if (!controller.signal.aborted) setTarget(r.target); }).catch((e) => { if (!controller.signal.aborted && !isAbortError(e)) setError(careErrorMessage(e)); });
    return () => controller.abort();
  }, [patientId]);
  if (error) return <section className="nvt-card nvt-patient" aria-label="Tu meta diaria"><p role="alert">{error}</p></section>;
  if (!target?.published_at) return null;
  return <section className="nvt-card nvt-patient" aria-label="Tu meta diaria"><header><div><p className="nv-eyebrow">Definida por tu nutricionista</p><h2>Tu meta diaria</h2></div><NvBadge>{GOAL_LABELS[target.inputs.goal]}</NvBadge></header><TargetSummary target={target} /><small className="nvt-note">Es una referencia para organizar tu plan. Tu nutricionista puede ajustarla en cada consulta.</small></section>;
}

/** Calculadora de la nutricionista: calcula con Mifflin-St Jeor, ella revisa y confirma. */
export function NutritionTargetPanel({ patientId, patientName }: { patientId: string; patientName: string }) {
  const activePatient = useRef(patientId);
  activePatient.current = patientId;
  const saving = useRef(false);
  const [stored, setStored] = useState<NutritionTarget | null>(null);
  const [published, setPublished] = useState<NutritionTarget | null>(null);
  const [revision, setRevision] = useState<number | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [body, setBody] = useState<BodyDataView | null>(null);
  const [draft, setDraft] = useState<Draft>(() => toDraft(null));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setMessage(''); setError('');
    setBody(null); setStored(null); setPublished(null); setRevision(null); setDraft(toDraft(null));
    Promise.all([nutritionTargetApi.get(patientId, true, controller.signal), bodyDataApi.get(patientId, true, controller.signal).catch(() => null)]).then(([r, b]) => {
      if (controller.signal.aborted) return;
      setStored(r.target); setBody(b); setPublished(r.published ?? null); setRevision(r.revision ?? null);
      if (r.revision === undefined) setError('Recargá la aplicación para usar las metas actualizadas.');
      const base = toDraft(r.target?.inputs ?? null);
      // Si la paciente cargó datos más nuevos que la meta guardada, se usan esos.
      const fresh = b?.data && (!r.target || b.data.updated_at > r.target.updated_at);
      const age = b?.data ? ageFromBirthDate(b.data.birth_date) : null;
      setDraft(fresh && b?.data && age !== null ? { ...base, sex: b.data.sex, age: String(age), height_cm: String(b.data.height_cm), weight_kg: String(b.data.weight_kg) } : base);
    }).catch((e) => { if (!controller.signal.aborted && !isAbortError(e)) setError(careErrorMessage(e)); });
    return () => controller.abort();
  }, [patientId, refresh]);

  const parsed = useMemo(() => parseDraft(draft), [draft]);
  const live = parsed.success ? calculateTarget(parsed.data) : null;
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => { setDraft((d) => ({ ...d, [key]: value })); setMessage(''); };
  const pickGoal = (goal: TargetGoal) => { const g = defaultsForGoal(goal); setDraft((d) => ({ ...d, goal, adjust_pct: String(g.adjust_pct), protein_g_per_kg: String(g.protein_g_per_kg), fat_pct: String(g.fat_pct) })); setMessage(''); };

  const save = async (publish: boolean) => {
    if (saving.current) return;
    if (!parsed.success) { setError('Completá sexo, edad, peso y talla con valores reales.'); return; }
    if (revision === null) { setError('Recargá la meta antes de guardar.'); return; }
    saving.current = true; setBusy(true); setError(''); setMessage('');
    try {
      const workspace = await nutritionTargetApi.save(patientId, parsed.data, publish, revision);
      if (activePatient.current !== patientId) return;
      setStored(workspace.target); setPublished(workspace.published); setRevision(workspace.revision);
      setMessage(publish ? `Meta confirmada: ${patientName} ya la ve en su plan.` : 'Borrador guardado. La paciente conserva su última meta confirmada.');
    } catch (reason) { if (activePatient.current === patientId) setError(careErrorMessage(reason)); } finally { saving.current = false; setBusy(false); }
  };
  const askPatient = async () => {
    if (saving.current) return;
    saving.current = true;
    setBusy(true); setError(''); setMessage('');
    try { const updated = await bodyDataApi.request(patientId); if (activePatient.current === patientId) { setBody(updated); setMessage(`Le pedimos a ${patientName} que actualice sus datos.`); } }
    catch (reason) { if (activePatient.current === patientId) setError(careErrorMessage(reason)); } finally { saving.current = false; setBusy(false); }
  };
  const bodyNote = body?.data ? `Datos cargados por ${patientName} el ${new Date(body.data.updated_at).toLocaleDateString('es-AR')}.` : `${patientName} todavía no cargó sus datos.`;
  const onSubmit = (event: FormEvent) => { event.preventDefault(); void save(false); };
  const changedSincePublish = published && parsed.success && JSON.stringify(parsed.data) !== JSON.stringify(published.inputs);

  return <section className="nvt-card" aria-label={`Calorías y macros de ${patientName}`}>
    <header><div><p className="nv-eyebrow">Ecuación de Mifflin-St Jeor</p><h2>Calorías y macronutrientes de {patientName}</h2><p>Calculadas con una fórmula fija a partir de sus datos. Vos revisás y confirmás antes de que las vea.</p></div>{stored && <NvBadge tone={stored.published_at ? 'green' : 'gold'}>{stored.published_at ? 'Confirmada' : 'Borrador'}</NvBadge>}</header>
    <form className="nvt-layout" onSubmit={onSubmit}>
      <div className="nvt-form">
        <fieldset><legend>Datos de la paciente</legend>
          <p className="nvt-source nvt-wide">{bodyNote}{body?.requested_at ? ' Pedido enviado, esperando su respuesta.' : ''} <button type="button" className="nvt-link" onClick={() => void askPatient()} disabled={busy}>{body?.requested_at ? 'Volver a pedir' : 'Pedir que los cargue o actualice'}</button></p>
          <label>Sexo<select value={draft.sex} onChange={(e) => set('sex', e.target.value)}>{SEX_OPTIONS.map((s) => <option key={s} value={s}>{SEX_LABELS[s]}</option>)}</select></label>
          <label>Edad<input inputMode="numeric" value={draft.age} onChange={(e) => set('age', e.target.value)} placeholder="años" /></label>
          <label>Peso<input inputMode="decimal" value={draft.weight_kg} onChange={(e) => set('weight_kg', e.target.value)} placeholder="kg" /></label>
          <label>Talla<input inputMode="decimal" value={draft.height_cm} onChange={(e) => set('height_cm', e.target.value)} placeholder="cm" /></label>
        </fieldset>
        <fieldset><legend>Actividad y objetivo</legend>
          <label className="nvt-wide">Nivel de actividad<select value={draft.activity} onChange={(e) => set('activity', e.target.value)}>{ACTIVITY_LEVELS.map((a) => <option key={a} value={a}>{ACTIVITY_LABELS[a]} (×{ACTIVITY_FACTORS[a]})</option>)}</select></label>
          <label className="nvt-wide">Objetivo<select value={draft.goal} onChange={(e) => pickGoal(e.target.value as TargetGoal)}>{TARGET_GOALS.map((g) => <option key={g} value={g}>{GOAL_LABELS[g]}</option>)}</select></label>
        </fieldset>
        <fieldset><legend>Ajustes (podés cambiarlos)</legend>
          <label>Ajuste calórico %<input inputMode="decimal" value={draft.adjust_pct} onChange={(e) => set('adjust_pct', e.target.value)} /></label>
          <label>Proteína g/kg<input inputMode="decimal" value={draft.protein_g_per_kg} onChange={(e) => set('protein_g_per_kg', e.target.value)} /></label>
          <label>Grasas % de kcal<input inputMode="decimal" value={draft.fat_pct} onChange={(e) => set('fat_pct', e.target.value)} /></label>
        </fieldset>
      </div>
      <aside className="nvt-result" aria-live="polite">
        {revision === null && !error && <p role="status">Cargando meta guardada…</p>}
        {live && parsed.success ? <>
          <dl className="nvt-steps"><div><dt>Metabolismo basal</dt><dd>{live.bmr} kcal</dd></div><div><dt>Gasto total diario</dt><dd>{live.tdee} kcal</dd></div></dl>
          <TargetSummary target={{ patient_id: patientId, inputs: parsed.data, result: live, published_at: null, updated_at: '' }} heading="Meta propuesta" />
          {live.warnings.map((w) => <p key={w} className="nvt-warning" role="status">{w}</p>)}
        </> : <p className="nvt-empty">Completá edad, peso y talla para ver el cálculo.</p>}
        {published && <TargetSummary target={published} heading="Meta que ve la paciente" />}
        {error && <p className="nv-dialog-error" role="alert">{error} <button type="button" className="nvt-link" disabled={busy} onClick={() => setRefresh((r) => r + 1)}>Recargar meta</button></p>}
        {message && <p className="nvt-ok" role="status">{message}</p>}
        {changedSincePublish && <p className="nvt-warning" role="status">Cambiaste datos: la paciente sigue viendo la meta anterior hasta que confirmes de nuevo.</p>}
        <div className="nvt-actions"><NvButton type="submit" className="nv-ghost" disabled={busy || !live || revision === null}>Guardar borrador</NvButton><NvButton disabled={busy || !live || revision === null} onClick={() => void save(true)}>{busy ? 'Guardando…' : 'Confirmar y compartir'}</NvButton></div>
      </aside>
    </form>
  </section>;
}


/** La paciente carga (y actualiza) sus datos. Aparece si faltan, si la nutricionista los pidió o cuando ella quiere revisarlos. */
export function PatientBodyDataCard({ patientId, forceOpen = false, onSaved }: { patientId: string; forceOpen?: boolean; onSaved?: () => void }) {
  const [view, setView] = useState<BodyDataView | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ sex: 'femenino', birth_date: '', height_cm: '', weight_kg: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    bodyDataApi.get(patientId, false, controller.signal).then((r) => {
      setView(r);
      if (r.data) setForm({ sex: r.data.sex, birth_date: r.data.birth_date, height_cm: String(r.data.height_cm), weight_kg: String(r.data.weight_kg) });
    }).catch((e) => { if (!isAbortError(e)) setView(null); });
    return () => controller.abort();
  }, [patientId]);

  if (!view) return null;
  const missing = !view.data;
  const open = editing || forceOpen || missing || Boolean(view.requested_at);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = bodyDataSchema.safeParse({ sex: form.sex, birth_date: form.birth_date, height_cm: num(form.height_cm), weight_kg: num(form.weight_kg) });
    if (!parsed.success) { setError('Revisá la fecha de nacimiento, la talla (cm) y el peso (kg).'); return; }
    setBusy(true); setError('');
    try { setView(await bodyDataApi.save(patientId, parsed.data)); setEditing(false); onSaved?.(); }
    catch (reason) { setError(careErrorMessage(reason)); } finally { setBusy(false); }
  };

  if (!open) {
    const age = view.data ? ageFromBirthDate(view.data.birth_date) : null;
    return <section className="nvt-card nvt-body" aria-label="Tus datos para el plan"><header><div><p className="nv-eyebrow">Tus datos para el plan</p><h2>{view.data?.height_cm} cm · {view.data?.weight_kg} kg{age !== null ? ` · ${age} años` : ''}</h2></div><NvButton className="nv-ghost" onClick={() => setEditing(true)}>Actualizar</NvButton></header></section>;
  }
  return <section className="nvt-card nvt-body" aria-label="Tus datos para el plan">
    <header><div><p className="nv-eyebrow">{view.requested_at ? 'Tu nutricionista te pidió actualizarlos' : 'Tus datos para el plan'}</p><h2>Contale a tu nutricionista cómo estás hoy</h2><p>Los usa para calcular tus calorías y macros. Sólo los ve ella y podés cambiarlos cuando quieras.</p></div></header>
    <form className="nvt-form nvt-body-form" onSubmit={save} aria-busy={busy}>
      <fieldset>
        <label>Sexo<select value={form.sex} onChange={(e) => setForm({ ...form, sex: e.target.value })}>{SEX_OPTIONS.map((s) => <option key={s} value={s}>{SEX_LABELS[s]}</option>)}</select></label>
        <label>Fecha de nacimiento<input type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} /></label>
        <label>Talla (cm)<input inputMode="decimal" value={form.height_cm} onChange={(e) => setForm({ ...form, height_cm: e.target.value })} /></label>
        <label>Peso (kg)<input inputMode="decimal" value={form.weight_kg} onChange={(e) => setForm({ ...form, weight_kg: e.target.value })} /></label>
      </fieldset>
      {error && <p className="nv-dialog-error" role="alert">{error}</p>}
      <div className="nvt-actions">{!missing && !view.requested_at && <NvButton className="nv-ghost" onClick={() => setEditing(false)} disabled={busy}>Cancelar</NvButton>}<NvButton type="submit" disabled={busy}>{busy ? 'Guardando…' : 'Guardar mis datos'}</NvButton></div>
    </form>
  </section>;
}
