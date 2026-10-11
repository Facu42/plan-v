import { request } from './client';
import type { Food, FoodInput } from '../types/foods';
export const foodApi = {
  list: (signal?: AbortSignal) => request<{ foods: Food[]; total: number; source: string }>('/api/foods', { signal }),
  save: (food: FoodInput) => request<{ food: Food; source: string }>('/api/foods', { method: 'POST', body: JSON.stringify(food) }),
};
