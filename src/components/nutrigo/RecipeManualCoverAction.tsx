import { useRef, useState, type ChangeEvent } from 'react';
import type { ProfessionalRecipe } from '../../types/recipes';
import { recipeCoverApi } from '../../api/recipe-cover';
import { careErrorMessage } from '../../api/care';

export function RecipeManualCoverAction({ recipe, disabled = false, className = 'nv-button nv-ghost', onSaved }: {
  recipe: ProfessionalRecipe; disabled?: boolean; className?: string; onSaved: () => void | Promise<void>;
}) {
  const input = useRef<HTMLInputElement>(null);
  const inFlight = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  if (!recipe.published) return <small>Publicá la receta para subir su foto.</small>;

  async function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || inFlight.current) return;
    inFlight.current = true; setBusy(true); setError(''); setStatus('');
    try {
      const saved = await recipeCoverApi.upload(recipe, file);
      if (saved.recipe.published?.card?.cover_status !== 'ready') throw new Error('No se pudo confirmar la foto guardada.');
      await onSaved();
      setStatus('Foto guardada en la receta publicada.');
    } catch (reason) { setError(careErrorMessage(reason)); }
    finally { inFlight.current = false; setBusy(false); }
  }
  return <div className="recipe-manual-cover">
    <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" aria-label={`Foto del plato ${recipe.published?.title ?? recipe.title}`} hidden onChange={(event) => void selectFile(event)} />
    <button type="button" className={className} disabled={disabled || busy} onClick={() => input.current?.click()}>{busy ? 'Guardando foto…' : recipe.published.card?.cover_status === 'ready' ? 'Cambiar foto' : 'Subir foto'}</button>
    <small>JPG, PNG o WebP · hasta 5 MB. Subí sólo el plato: la foto será pública.</small>
    {error && <p role="alert">{error}</p>}
    {status && <p role="status">{status}</p>}
  </div>;
}
