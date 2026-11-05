import { request } from './client';
import type { NutritionistAiUsageView } from '../types/ai-usage';

export const aiUsageApi = {
  mine: (signal?: AbortSignal) => request<{ usage: NutritionistAiUsageView }>('/api/ai/uso', { signal }),
};
