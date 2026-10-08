import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ dish: vi.fn(), ingredient: vi.fn() }));
vi.mock('./menu-covers.js', () => ({ runPersistentDishCover: mocks.dish }));
vi.mock('./ingredient-covers.js', () => ({ runPersistentIngredientCover: mocks.ingredient }));
import { runCoverWorkers } from './cover-workers.js';

beforeEach(() => { vi.resetAllMocks(); mocks.ingredient.mockResolvedValue(undefined); });

describe('reparto del proveedor gratuito entre platos e ingredientes', () => {
  it('los platos tienen prioridad: si trabajaron o están ocupados, los ingredientes esperan', async () => {
    mocks.dish.mockResolvedValue(true);
    await runCoverWorkers();
    expect(mocks.ingredient).not.toHaveBeenCalled();
  });

  it('cuando no hay platos pendientes, avanzan los ingredientes', async () => {
    mocks.dish.mockResolvedValue(false);
    await runCoverWorkers();
    expect(mocks.ingredient).toHaveBeenCalledOnce();
  });

  it('un error de los ingredientes no se propaga al trabajador', async () => {
    mocks.dish.mockResolvedValue(false); mocks.ingredient.mockRejectedValue(new Error('caído'));
    await expect(runCoverWorkers()).resolves.toBeUndefined();
  });
});
