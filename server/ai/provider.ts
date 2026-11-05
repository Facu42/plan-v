import { createOpenAI } from '@ai-sdk/openai';
import { AIUnavailableError } from './errors.js';
import { isFreeOpenRouterModel } from './cost-policy.js';
import { costMicroUsd, type ModelPrice } from './spend.js';
import { modelSettingFor, type AiFeature, type ModelSetting } from './model-settings.js';
import { recordModelCall } from './metering.js';

export const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
export const DEFAULT_OPENROUTER_MODEL = 'openrouter/free';

export type AiProvider = 'openrouter';

export type AiProviderConfig = {
  provider: AiProvider;
  apiKey: string;
  model: string;
};

export function resolveAiProvider(
  env: Record<string, string | undefined> = process.env,
): AiProviderConfig | null {
  if (env.OPENROUTER_API_KEY) {
    const model = env.OPENROUTER_MODEL || DEFAULT_OPENROUTER_MODEL;
    if (!isFreeOpenRouterModel(model)) return null;
    return {
      provider: 'openrouter',
      apiKey: env.OPENROUTER_API_KEY,
      model,
    };
  }

  return null;
}

/** Apply the price ceiling at the HTTP boundary, including SDK retries. No paid add-ons. */
export function createFreeOpenRouterFetch(fetchImpl: typeof globalThis.fetch = globalThis.fetch): typeof globalThis.fetch {
  return async (input, init) => {
    const url = input instanceof Request ? input.url : String(input);
    if (url !== `${OPENROUTER_BASE_URL}/chat/completions` || init?.method !== 'POST' || typeof init.body !== 'string') {
      throw new AIUnavailableError();
    }
    const body = JSON.parse(init.body);
    if (!isFreeOpenRouterModel(body.model) || body.models || body.plugins || body.tools || body.web_search_options
      || body.preset || body.route || body.service_tier) {
      throw new AIUnavailableError();
    }
    return fetchImpl(input, {
      ...init,
      body: JSON.stringify({
        ...body,
        // Replace preferences rather than inheriting an external preset or price override.
        provider: { max_price: { prompt: 0, completion: 0, request: 0, image: 0 }, require_parameters: true },
      }),
      redirect: 'error',
    });
  };
}

/**
 * Igual que el candado gratuito, pero para un modelo pago que el administrador eligió a propósito.
 * Solo sale ese modelo, nunca complementos, y el precio máximo es el que el administrador cargó:
 * si el proveedor sube el precio, el pedido falla en vez de gastar de más. Pide no guardar los datos.
 */
export function createPaidOpenRouterFetch(setting: Pick<ModelSetting, 'model' | 'input_usd_per_mtok' | 'output_usd_per_mtok'>, fetchImpl: typeof globalThis.fetch = globalThis.fetch): typeof globalThis.fetch {
  return async (input, init) => {
    const url = input instanceof Request ? input.url : String(input);
    if (url !== `${OPENROUTER_BASE_URL}/chat/completions` || init?.method !== 'POST' || typeof init.body !== 'string') {
      throw new AIUnavailableError();
    }
    const body = JSON.parse(init.body);
    if (body.model !== setting.model || body.models || body.plugins || body.tools || body.web_search_options
      || body.preset || body.route || body.service_tier) {
      throw new AIUnavailableError();
    }
    return fetchImpl(input, {
      ...init,
      body: JSON.stringify({
        ...body,
        provider: {
          max_price: { prompt: setting.input_usd_per_mtok, completion: setting.output_usd_per_mtok },
          require_parameters: true,
          data_collection: 'deny',
        },
      }),
      redirect: 'error',
    });
  };
}

type UsageResult = { usage?: { inputTokens?: { total?: number }; outputTokens?: { total?: number } } };

/**
 * Mide cada respuesta del modelo (tokens y costo) sin cambiar el modelo. Se envuelve con un Proxy y no
 * con wrapLanguageModel para no depender de más exportaciones del SDK. Solo mide doGenerate: hoy toda
 * la IA de texto usa generateText.
 */
function metered<T extends object>(model: T, feature: AiFeature, modelId: string, price: ModelPrice): T {
  return new Proxy(model, {
    get(target, prop) {
      const value = Reflect.get(target, prop, target);
      if (typeof value !== 'function') return value;
      if (prop !== 'doGenerate') return value.bind(target);
      return async (...args: unknown[]) => {
        const result = await value.apply(target, args) as UsageResult;
        const inputTokens = result?.usage?.inputTokens?.total ?? 0;
        const outputTokens = result?.usage?.outputTokens?.total ?? 0;
        await recordModelCall(feature, { model: modelId, inputTokens, outputTokens, costMicros: costMicroUsd({ inputTokens, outputTokens }, price) });
        return result;
      };
    },
  });
}

/**
 * Returns a language model for live AI calls.
 * Por defecto, sólo modelos gratis de OpenRouter. Si el administrador eligió un modelo para esta
 * función (panel /admin), se usa ese con su precio tope. Cada respuesta queda medida a nombre de la
 * nutri que activó la acción (ver withAiAction).
 */
export function getAiModel(feature: AiFeature = 'general') {
  const config = resolveAiProvider();
  if (!config) throw new AIUnavailableError();

  const setting = modelSettingFor(feature);
  const paid = setting && !isFreeOpenRouterModel(setting.model) ? setting : null;
  const model = paid ? paid.model : setting?.model ?? config.model;
  const price: ModelPrice = paid
    ? { inputUsdPerMTok: paid.input_usd_per_mtok, outputUsdPerMTok: paid.output_usd_per_mtok }
    : { inputUsdPerMTok: 0, outputUsdPerMTok: 0 };
  const provider = createOpenAI({
    apiKey: config.apiKey,
    baseURL: OPENROUTER_BASE_URL,
    name: 'openrouter',
    fetch: paid ? createPaidOpenRouterFetch(paid) : createFreeOpenRouterFetch(),
  });
  return metered(provider.chat(model), feature, model, price);
}

/** @deprecated Prefer getAiModel — kept as an alias for call sites already migrated. */
export const createAiModel = getAiModel;
