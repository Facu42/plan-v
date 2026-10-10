export type SearchPatientHit = { id: string; name: string; href: string };
export type SearchRecipeHit = { id: string; title: string; href: string };
export type SearchFoodHit = { id: string; name: string; detail: string; own: boolean; href: string };

/** Resultados agrupados del buscador de la barra superior. Sólo metadata: sin notas ni datos clínicos. */
export type WorkspaceSearchResponse = {
  query: string;
  patients: SearchPatientHit[];
  recipes: SearchRecipeHit[];
  foods: SearchFoodHit[];
  /** Cantidad total por grupo antes de recortar a la muestra mostrada. */
  totals: { patients: number; recipes: number; foods: number };
  source: 'memory' | 'supabase';
};
