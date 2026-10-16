import { foodQuantityUnit,normalizeFoodSearch } from '../../src/types/foods.js';
import { calculateRecipeCatalog,type RecipeCatalogItem } from '../../src/types/recipe-catalog-nutrition.js';
import { recipeNutritionSchema } from '../../src/types/ai-nutrition.js';
import { sara2Foods } from './sara2.js';

/** No species, state, density or approximate-name inference; no provider calls. */
export function linkSara2Recipe(draft:{yield_portions:number;items:RecipeCatalogItem[]}) {
  const foods=sara2Foods(),warnings:string[]=[];
  const items:RecipeCatalogItem[]=draft.items.map(item=>{
    const candidates=foods.filter(food=>normalizeFoodSearch(food.name)===normalizeFoodSearch(item.name));
    const food=candidates.length===1?candidates[0]:undefined;
    if(!food||item.unit!==foodQuantityUnit(food)){
      warnings.push(`«${item.name}»: elegí una referencia exacta, preparación y unidad del catálogo SARA 2 al revisar. Sin cifras inventadas.`);
      const {catalog_ref:_,...unlinked}=item;return unlinked;
    }
    return {...item,catalog_ref:{id:food.id,revision:1,measure:null}};
  });
  const analysis=calculateRecipeCatalog({...draft,items},foods);
  const p=analysis.per_portion,parsed=recipeNutritionSchema.safeParse({origin:'ai_estimate',source:'estimacion_ia.v2',per_portion:{kcal:p.kcal,protein_g:p.protein,carbs_g:p.carbs,fat_g:p.fat}});
  return {items,nutrition:parsed.success?parsed.data:null,warnings};
}
