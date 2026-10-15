import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { ResourceAssignment } from '../../types';
import { RESOURCE_GUIDES, buildResourceShareUrl, filterResourceGuides, type ResourceGuide } from '../nutrigo/ShowroomResources';
import type { ShowroomPage } from '../nutrigo/ShowroomPanels';
import { useFigmaPatientName } from './FigmaPatientIdentity';
import { InsightsMainLayout, InsightsAsideLayout } from './FigmaInsightsLayout';
import { InsightDetailLayout } from './FigmaInsightDetailLayout';

type InsightsContextValue = {
  guides: ResourceGuide[];
  selected: ResourceGuide | null;
  assignments: ResourceAssignment[];
  query: string;
  setQuery: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  categories: string[];
  saved: string[];
  toggleSaved: (id: string) => void;
  open: (id: string) => void;
  close: () => void;
  navigate: (page: ShowroomPage) => void;
  share: (guide: ResourceGuide) => Promise<void>;
  status: string;
};
const InsightsContext = createContext<InsightsContextValue | null>(null);
const savedKey = (patientId: string) => `plan-v:resource-favorites:${patientId}`;
const readSaved = (patientId: string) => {
  if (typeof window === 'undefined') return [] as string[];
  try { const value: unknown = JSON.parse(window.localStorage.getItem(savedKey(patientId)) ?? '[]'); return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : []; }
  catch { return []; }
};

export function FigmaInsightsProvider({ patientId, assignments = [], selectedId, onSelect, onNavigate, onMarkRead, children }: {
  patientId: string;
  assignments?: ResourceAssignment[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onNavigate: (page: ShowroomPage) => void;
  onMarkRead?: (id: string) => Promise<void>;
  children: ReactNode;
}) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Todas');
  const [saved, setSaved] = useState<string[]>(() => readSaved(patientId));
  const [status, setStatus] = useState('');
  const marked = useRef(new Set<string>());
  const categories = useMemo(() => ['Todas', ...new Set(RESOURCE_GUIDES.map((guide) => guide.category))], []);
  const guides = useMemo(() => filterResourceGuides(RESOURCE_GUIDES, query, category), [query, category]);
  const selected = RESOURCE_GUIDES.find((guide) => guide.id === selectedId) ?? null;
  useEffect(() => {
    const assignment = assignments.find((item) => item.resource_id === selectedId);
    if (!selectedId || !assignment || assignment.read_at || marked.current.has(selectedId) || !onMarkRead) return;
    marked.current.add(selectedId);
    void onMarkRead(selectedId).catch(() => { marked.current.delete(selectedId); setStatus('No se pudo registrar la lectura.'); });
  }, [assignments, selectedId, onMarkRead]);
  const toggleSaved = (id: string) => {
    const next = saved.includes(id) ? saved.filter((value) => value !== id) : [...saved, id];
    setSaved(next);
    if (typeof window !== 'undefined') window.localStorage.setItem(savedKey(patientId), JSON.stringify(next));
  };
  const share = async (guide: ResourceGuide) => {
    if (typeof window === 'undefined') return;
    const url = buildResourceShareUrl(guide.id, window.location.href);
    try {
      if (navigator.share) { await navigator.share({ title: guide.title, text: guide.summary, url }); setStatus('Guía compartida.'); }
      else if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(url); setStatus('Enlace copiado.'); }
      else setStatus('Compartir no está disponible en este navegador.');
    } catch { setStatus('No se pudo compartir la guía.'); }
  };
  return <InsightsContext.Provider value={{ guides, selected, assignments, query, setQuery, category, setCategory, categories, saved, toggleSaved, open: (id) => { setStatus(''); onSelect(id); }, close: () => { setStatus(''); onSelect(null); }, navigate: onNavigate, share, status }}>{children}</InsightsContext.Provider>;
}
function useInsights() {
  const context = useContext(InsightsContext);
  if (!context) throw new Error('FigmaInsightsProvider is required');
  return context;
}
export function FigmaInsightsMain({ variant }: { variant: 'desktop' | 'tablet' | 'mobile' }) {
  return <InsightsMainLayout variant={variant} state={useInsights()} />;
}
export function FigmaInsightsAside({ variant = 'desktop', bellIcon }: { variant?: 'desktop' | 'tablet' | 'mobile'; bellIcon?: string }) {
  return <InsightsAsideLayout variant={variant} state={useInsights()} patientName={useFigmaPatientName()} bellIcon={bellIcon} />;
}
export function FigmaInsightDetail({ variant }: { variant: 'desktop' | 'tablet' | 'mobile' }) {
  return <InsightDetailLayout variant={variant} state={useInsights()} allGuides={RESOURCE_GUIDES} />;
}
