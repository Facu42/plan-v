import type {Hono} from 'hono';

/** Banderas de producto. Apagadas si la variable no es exactamente "true". No incluyen secretos. */
export function featureFlags(env:NodeJS.ProcessEnv=process.env){
  return {
    reactivation_campaigns:env.REACTIVATION_CAMPAIGNS_ENABLED==='true',
    bioimpedance:env.BIOIMPEDANCE_ENABLED==='true',
    lab_draft:env.LAB_DRAFT_ENABLED==='true',
  };
}

export function registerFeatureRoutes(app:Hono){
  app.get('/api/features',c=>c.json(featureFlags()));
}
