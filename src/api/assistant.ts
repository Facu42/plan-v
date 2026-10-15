import { request } from './client';
import type { AssistantAnswer } from '../types/assistant';

export const assistantApi = {
  /** Sólo viaja la pregunta: el servidor decide el consultorio con la sesión. */
  ask: (question: string, signal?: AbortSignal) =>
    request<AssistantAnswer>('/api/crm/assistant', { method: 'POST', body: JSON.stringify({ question }), signal }),
};
