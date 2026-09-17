type DesignEntry = {
  development: boolean;
  demoMode: boolean;
  hasSession: boolean;
  supabaseEnabled: boolean;
  search: string;
};

export function shouldShowNutrigo(entry: DesignEntry): boolean {
  return entry.development && entry.demoMode && !entry.hasSession
    && new URLSearchParams(entry.search).get('design') !== 'legacy';
}
