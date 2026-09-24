type DesignEntry = {
  development: boolean;
  demoMode: boolean;
  hasSession: boolean;
  supabaseEnabled: boolean;
  search: string;
};

export function shouldShowNutrigo(entry: DesignEntry): boolean {
  if (entry.hasSession) return true;
  if (!entry.demoMode) return false;
  return new URLSearchParams(entry.search).get('design') !== 'legacy';
}

export function canUseDemoRoleSwitch(entry: Pick<DesignEntry, 'demoMode' | 'hasSession'>): boolean {
  return entry.demoMode && !entry.hasSession;
}
