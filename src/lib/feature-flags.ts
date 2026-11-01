import { useEffect, useState } from 'react';
import { api, FEATURES_OFF, readFeatureFlags, type FeatureFlags } from '../api/client';

let cache: Promise<FeatureFlags> | null = null;

export function loadFeatureFlags(): Promise<FeatureFlags> {
  if (!cache) cache = api.features().then(readFeatureFlags).catch(() => FEATURES_OFF);
  return cache;
}

export function resetFeatureFlagsCache() {
  cache = null;
}

/** Arranca apagado. Si la consulta falla, sigue apagado. */
export function useFeatureFlags(): FeatureFlags {
  const [flags, setFlags] = useState<FeatureFlags>(FEATURES_OFF);
  useEffect(() => {
    let live = true;
    void loadFeatureFlags().then(next => { if (live) setFlags(next); });
    return () => { live = false; };
  }, []);
  return flags;
}
