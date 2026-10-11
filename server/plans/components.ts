import { listFoods } from '../foods/repository.js';
import { CareError } from '../care/errors.js';
import { readPublishedMemory, getRecipeSnapshot } from '../recipes/repository.js';
import { retainProposalEstimate } from '../../src/types/ai-nutrition.js';
import { componentGrams, type PlanComponentInput, type PlanComponentView } from '../../src/types/plan-components.js';

export async function resolvePlanComponents(owner: string, inputs: PlanComponentInput[], prior: PlanComponentView[]) {
  const foods = inputs.some(item => item.kind === 'food') ? await listFoods(owner, false) : [];
  return inputs.map(input => {
    if (input.kind === 'food') {
      const frozen = prior.find(item => item.kind === 'food' && item.food_id === input.food_id && item.food_revision === input.food_revision)?.food_snapshot;
      const food = frozen ?? foods.find(food => food.id === input.food_id && food.revision === input.food_revision);
      if (!food) throw new CareError(409, 'El alimento cambió o no está disponible. Volvé a elegirlo.');
      const component = { ...input, food_snapshot: structuredClone(food) };
      if (componentGrams(component) === null) throw new CareError(400, 'Revisá la cantidad y medida del alimento.');
      return component;
    }
    if (input.kind === 'recipe') {
      const version = readPublishedMemory(owner, input.recipe_id, input.recipe_version);
      const snapshot = version ? getRecipeSnapshot(version.versionId) : null;
      if (!snapshot) throw new CareError(400, 'La versión publicada de la receta no está disponible.');
      return { ...input, recipe_snapshot: structuredClone(snapshot) };
    }
    const old = prior.find(item => item.id === input.id && item.kind === 'text') ?? prior.find(item => item.kind === 'text' && item.recipe_proposal?.title === input.recipe_proposal?.title);
    return { ...input, ...(input.recipe_proposal ? { recipe_proposal: retainProposalEstimate(input.recipe_proposal, old?.kind === 'text' ? old.recipe_proposal : undefined) } : {}) };
  });
}
