import { runPersistentIngredientCover } from './ingredient-covers.js';
import { runPersistentDishCover } from './menu-covers.js';

/**
 * Una vuelta del trabajador de fotos. Platos e ingredientes comparten la misma cuota gratuita del proveedor:
 * los platos van primero y los ingredientes avanzan cuando no hay ningún plato pendiente.
 */
export async function runCoverWorkers(): Promise<void> {
  try {
    if (await runPersistentDishCover()) return;
    await runPersistentIngredientCover();
  } catch {
    // Cada trabajo registra sus propios fallos; aquí solo se evita frenar al resto del trabajador.
  }
}
