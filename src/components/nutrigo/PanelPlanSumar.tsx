import { useEffect, useState } from 'react';
import { careErrorMessage } from '../../api/care';
import { recipesApi } from '../../api/recipes';
import type { PlanComponentView } from '../../types/plan-components';
import { publishedRecipeDetail } from '../../types/plan-recipe-selection';
import type { ProfessionalRecipe } from '../../types/recipes';
import { PlanExchangePicker } from './NutritionExchanges';
import { PlanFoodPicker } from './PlanFoodPicker';
import { PlanRecipePicker } from './PlanRecipePicker';

type Pestana = 'alimento' | 'receta' | 'intercambio';

/** Ventana del editor para sumar o cambiar lo que lleva una comida: alimentos, recetas o intercambios. */
export function PanelPlanSumar({ onElegir, onCerrar }: { onElegir: (componente: PlanComponentView) => void; onCerrar: () => void }) {
  const [pestana, setPestana] = useState<Pestana>('alimento');
  const [recetas, setRecetas] = useState<ProfessionalRecipe[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (pestana !== 'receta') return;
    let vigente = true;
    setCargando(true);
    setError('');
    recipesApi.list()
      .then(catalogo => { if (vigente) setRecetas(catalogo.recipes.filter(receta => receta.published)); })
      .catch(razon => { if (vigente) setError(careErrorMessage(razon)); })
      .finally(() => { if (vigente) setCargando(false); });
    return () => { vigente = false; };
  }, [pestana, intento]);

  if (pestana === 'intercambio') return <PlanExchangePicker onChoose={onElegir} onClose={onCerrar} onFood={() => setPestana('alimento')} />;
  if (pestana === 'receta') {
    return <PlanRecipePicker recipes={recetas} loading={cargando} error={error} onRetry={() => setIntento(valor => valor + 1)} initialPortions="1" onClose={onCerrar} onFood={() => setPestana('alimento')}
      onChoose={(receta, porciones) => {
        if (!receta.published) return;
        onElegir({ kind: 'recipe', id: crypto.randomUUID(), recipe_id: receta.id, recipe_version: receta.published.version, portions: porciones, public_note: '', recipe_snapshot: publishedRecipeDetail(receta) ?? undefined });
      }} />;
  }
  return <PlanFoodPicker onChoose={onElegir} onClose={onCerrar} onRecipe={() => setPestana('receta')} onExchange={() => setPestana('intercambio')} />;
}
