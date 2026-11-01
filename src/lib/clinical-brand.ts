import type { ClinicBrand as NutritionBrand } from '../types/nutrition-capabilities';
import type { ClinicBrand } from '../types/clinical-workspace';
/** Nutrición es la única marca; una configuración borrada no revive copias anteriores. */
export function clinicalBrandFromNutrition(brand:NutritionBrand,license:string):ClinicBrand|null {
  if(brand.name.trim().length<2)return null;
  return {name:brand.name,contact:brand.contact,logo:brand.logo||null,license};
}
