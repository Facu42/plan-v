import { buildRecipeCard } from '../../types/recipe-plate';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { PatientRecipe, ProfessionalRecipe } from '../../types/recipes';
import { AssignedRecipes, AssignedRecipesView, RecipeAiForm, RecipeAiNotices, RecipeCatalog, recipeEditorFromAi, recipeEditorFromStored, type RecipeCatalogState } from './RecipeCatalog';

const assigned: PatientRecipe = {
  id: 'r1',
  title: 'Bowl de lentejas',
  version: 1,
  yield_portions: 2,
  steps: ['Lavar.', 'Cocinar.'],
  nutrient_source: 'Tabla del consultorio',
  ingredients: [{ id: 'i1', name: 'Lentejas', quantity: 80, unit: 'g' }],
  assigned_at: '2026-09-21T12:00:00.000Z',
  published_at: '2026-09-21T11:00:00.000Z',
};

describe('Catálogo profesional y recetas asignadas', () => {
  it('una propuesta pendiente ofrece consulta y conserva la descripción sin generar otra', () => {
    const catalog = { busy: false, description: 'Tortilla de verduras', pendingAiJob: { id: 'job-1' }, aiProgress: '', aiWarnings: ['Revisar posible presencia de huevo.'], path: 'manual',
      setDescription: () => {}, closeEditor: () => {}, submitAi: () => {}, resumeAi: () => {} } as unknown as RecipeCatalogState;
    const form = renderToStaticMarkup(<RecipeAiForm catalog={catalog} />);
    expect(form).toContain('Consultar propuesta');
    expect(form).toContain('disabled=""');
    expect(form).toContain('Tortilla de verduras');
    const notices = renderToStaticMarkup(<RecipeAiNotices catalog={catalog} />);
    expect(notices).toContain('Revisar posible presencia de huevo.');
    expect(notices).toContain('Consultar propuesta');
  });
  it('reabrir y editar título/pasos conserva las calorías declaradas por porción',()=>{
    const recipe = {id:'11111111-1111-4111-8111-111111111111',title:'Bowl',current:{revision:'22222222-2222-4222-8222-222222222222',yield_portions:2,steps:['Cocinar.'],nutrient_source:'Tabla declarada',ingredients:[{id:'i1',name:'Arroz',quantity:100,unit:'g'}],card:{category:'Almuerzo',prep_minutes:20,macros:{kcal:200,protein_g:10,carbs_g:35,fat_g:3}}}} as ProfessionalRecipe;
    const editor=recipeEditorFromStored(recipe);
    expect(editor.expected_revision).toBe(recipe.current.revision);
    expect(buildRecipeCard({...editor,title:'Nuevo título',steps:['Cocinar y servir.']}).macros).toEqual(recipe.current.card!.macros);
    expect(editor.nutrient_source).toBe('Tabla declarada');
  });
  it('la edición asistida conserva la receta aplicada y su procedencia', () => {
    const payload = { id: '11111111-1111-4111-8111-111111111111', title: 'Bowl', yield_portions: 1,
      steps: ['Cocinar.'], nutrient_source: 'propuesta_ia.v1', items: [{ name: 'Arroz', quantity: 80, unit: 'g' }] };
    const draft = recipeEditorFromAi(payload);
    expect(draft.id).toBe(payload.id); expect(draft.nutrient_source).toBe('propuesta_ia.v1');
    expect(draft.protein_g).toBeUndefined(); expect(draft.cover_status).toBe('none');
    expect(() => recipeEditorFromAi({ ...payload, id: 'invalid' })).toThrow();
  });
  it('el catálogo profesional explica borrador vs publicada sin inventar macros', () => {
    const html = renderToStaticMarkup(<RecipeCatalog patientId="pat-sofia" />);
    expect(html).toContain('Recetas e ingredientes');
    expect(html).toContain('nutrientes estimados que requieren revisión');
    expect(html).toContain('Generar borrador con IA');
    expect(html).toContain('alergias');
    expect(html).toContain('borrador privado');
    expect(html).toContain('Cargando catálogo');
    expect(html).not.toMatch(/\bkcal\b|proteína|carbohidrato/i);
  });

  it('el vacío asignado no simula una receta completa', () => {
    const html = renderToStaticMarkup(<AssignedRecipes patientId="pat-sofia" />);
    expect(html).toContain('Todavía no hay recetas publicadas para vos');
    expect(html).not.toMatch(/ingredientes|preparación|porción|kcal|proteína|carbohidrato|grasa/i);
  });

  it('muestra rinde, ingredientes, pasos y fuente de una revisión asignada', () => {
    const html = renderToStaticMarkup(<AssignedRecipesView recipes={[assigned]} />);
    expect(html).toContain('Bowl de lentejas');
    expect(html).toContain('Ingredientes');
    expect(html).toContain('80 g Lentejas');
    expect(html).toContain('Pasos');
    expect(html).toContain('Cocinar.');
    expect(html).toContain('Tabla del consultorio');
    expect(html).toContain('Rinde 2');
    expect(html).not.toMatch(/\bkcal\b|proteína|carbohidrato/i);
  });
});
