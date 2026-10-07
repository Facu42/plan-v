import { useEffect, useId, useRef, useState } from 'react';
import { culinaryCategoriesSchema, RECIPE_CATEGORY_SUGGESTIONS } from '../../types/recipe-categories';
import { useUnsavedChanges } from './unsaved-changes';

export function RecipeCategoryEditor({ values, onChange }: { values: string[]; onChange: (values: string[]) => void }) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  useUnsavedChanges(Boolean(text.trim()));
  useEffect(() => { input.current?.setCustomValidity(text.trim() ? 'Agregá la categoría o borrá el texto antes de guardar.' : ''); }, [text]);
  function add() {
    const result = culinaryCategoriesSchema.safeParse([...values, text]);
    if (!result.success) { setError('Usá hasta 6 categorías distintas, de 1 a 50 caracteres.'); return; }
    onChange(result.data); setText(''); setError('');
  }
  return <fieldset className="recipe-category-editor"><legend>Categorías culinarias</legend>
    <p>Opcionales. Describen la preparación; el momento del día se elige por separado.</p>
    <div className="recipe-category-entry"><label htmlFor={id}>Agregar categoría<input ref={input} id={id} list={`${id}-suggestions`} value={text} maxLength={50} placeholder="Elegí una sugerencia o escribí otra" aria-describedby={error ? `${id}-error` : text.trim() ? `${id}-pending` : undefined} onChange={event => { setText(event.target.value); setError(''); }} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); add(); } }} /></label>
      <button type="button" className="recipe-cancel" disabled={!text.trim() || values.length >= 6} onClick={add}>Agregar</button>
    </div>
    <datalist id={`${id}-suggestions`}>{RECIPE_CATEGORY_SUGGESTIONS.map(value => <option key={value} value={value} />)}</datalist>
    {error && <p id={`${id}-error`} role="alert">{error}</p>}
    {text.trim() && <p id={`${id}-pending`}>Presioná Agregar o Enter para incluir esta categoría antes de guardar.</p>}
    {values.length ? <ul className="recipe-category-tags">{values.map(value => <li key={value}><span>{value}</span><button type="button" aria-label={`Quitar categoría ${value}`} onClick={() => { onChange(values.filter(item => item !== value)); setError(''); }}>×</button></li>)}</ul> : <p>Sin clasificar</p>}
  </fieldset>;
}
