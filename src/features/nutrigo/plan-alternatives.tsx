import type { PlanAlternativeSlot, PlanChoice } from '../../types/plan-alternatives';

const amount = (quantity: number, unit: string) => `${quantity.toLocaleString('es-AR')} ${unit}`;

/** Alternativas que la nutri aprobó para un alimento del plan; la paciente elige y el plan aprobado no cambia. */
export function ComponentAlternatives({ slot, choice, original, busy, error, onChoose }: {
  slot: PlanAlternativeSlot;
  choice?: PlanChoice;
  original: string;
  busy: boolean;
  error: string;
  onChoose: (foodId: string | null) => void;
}) {
  const name = `alternativa-${slot.component_id}`;
  return <fieldset disabled={busy} aria-busy={busy} className="mt-[8px] flex flex-col gap-[6px] border-0 p-0 text-[14px] text-[#272932]">
    <legend className="font-['Poppins:SemiBold']">Alternativas aprobadas por tu nutricionista</legend>
    <label className="flex items-center gap-[8px]"><input type="radio" name={name} checked={!choice} onChange={() => onChoose(null)} />Lo indicado en tu plan: {original}</label>
    {slot.options.map(option => <label key={option.food_id} className="flex items-center gap-[8px]">
      <input type="radio" name={name} checked={choice?.food_id === option.food_id} onChange={() => onChoose(option.food_id)} />
      {option.name} · {amount(option.quantity, option.unit)}{option.kcal === null ? '' : ` · ${Math.round(option.kcal).toLocaleString('es-AR')} kcal`}
    </label>)}
    {choice && <p role="status">Elegiste {choice.name} ({amount(choice.quantity, choice.unit)}) en lugar de {original}.</p>}
    {error && <p role="alert">{error}</p>}
  </fieldset>;
}
