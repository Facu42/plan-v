import { DayAssignedMeals } from '../../../components/nutrigo/DayMeals';
import { useState } from 'react';
import { FramePair } from '../FramePair';
import { nodeName, sourceText, type SourceResolver } from '../SourceView';
import { api } from '../../../api/client';
import { useAppStore } from '../../../store/useAppStore';
import { dateId, dateLabel, descendants, errorText, fields, formatNumber, idEnds, leaf, objects, searchBinding, Stateful, timeLabel, type ScreenProps } from './shared';

type Props = ScreenProps & { onLogMeal?: (slot?: string) => void; onHydration?: () => void; onRest?: () => void };
export function NutrigoDiary({ patient, onNavigate, onSignOut, query = '', now = new Date(), onLogMeal, onHydration, onRest }: Props) {
  const [search, setSearch] = useState(query);
  const [days, setDays] = useState(7);
  const [pendingOnly, setPendingOnly] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const refresh = useAppStore(state => state.refreshPatient);
  const cutoff = new Date(now.getTime() - days * 86400000);
  const rows = patient.logs.filter(log => (!days || new Date(log.logged_at) >= cutoff) && (!pendingOnly || log.status === 'pending_review') && `${log.description} ${log.slot}`.toLocaleLowerCase('es').includes(search.toLocaleLowerCase('es'))).slice().sort((a, b) => b.logged_at.localeCompare(a.logged_at));
  const reviewed = rows.filter(row => row.status !== 'pending_review' && row.macros);
  const sum = (key: 'kcal' | 'carbs_g' | 'protein_g' | 'fat_g') => reviewed.reduce((total, row) => total + (row.macros?.[key] ?? 0), 0);
  const addWater = async () => { if (busy) return; setBusy(true); setError(''); try { await api.updateHabits(patient.id, { hydration: patient.hydration + 1 }); await refresh(patient.id); } catch (caught) { setError(errorText(caught)); } finally { setBusy(false); } };
  const resolver: SourceResolver = node => {
    const name = nodeName(node); const text = sourceText(node);
    if (name === 'Card Statistic - Food Diary') {
      const nutrient = text.startsWith('Total Calories') ? 'kcal' : text.startsWith('Total Carb') ? 'carbs_g' : text.startsWith('Total Proteins') ? 'protein_g' : 'fat_g';
      const label = nutrient === 'kcal' ? 'Calorías registradas' : nutrient === 'carbs_g' ? 'Carbohidratos registrados' : nutrient === 'protein_g' ? 'Proteínas registradas' : 'Grasas registradas';
      return { children: objects(node).map(child => fields(child, { '141:3445': label, '141:3447': reviewed.length ? formatNumber(sum(nutrient)) : '—', '141:3448': nutrient === 'kcal' ? 'kcal' : 'g' }, child => nodeName(child) === 'Section Percentage' ? { text: `${reviewed.length} revisados` } : leaf(child) && /^Total /.test(sourceText(child)) ? { text: label } : undefined)) };
    }
    if (name === 'Table-Body') {
      const prototype = descendants(node).find(child => nodeName(child) === 'Table-Row-Food Diary');
      if (!rows.length || !prototype) return { children: <Stateful empty="Todavía no hay comidas en este período." /> };
      return { children: rows.map(log => fields(prototype, {
        '141:4206': dateLabel(log.logged_at), '146:4576': timeLabel(log.logged_at), '141:4189': log.description || log.foods.map(food => food.name).join(', ') || 'Comida registrada', '141:4209': '—', '141:4208': '', '141:4202': log.status === 'pending_review' ? '—' : formatNumber(log.macros?.kcal), '143:5171': log.status === 'pending_review' ? '—' : formatNumber(log.macros?.carbs_g), '143:5032': log.status === 'pending_review' ? '—' : formatNumber(log.macros?.protein_g), '143:5084': log.status === 'pending_review' ? '—' : formatNumber(log.macros?.fat_g), '143:4245': '—', '143:4251': log.status === 'pending_review' ? 'Pendiente de revisión' : log.nutrition_origin === 'ai_estimate' ? 'Revisada · estimación de IA' : log.nutrition_origin === 'declared' ? 'Revisada · nutrientes declarados' : 'Revisada · origen sin registrar',
      }, child => idEnds(child, '143:4944') || idEnds(child, '143:4946') || idEnds(child, '143:4948') || idEnds(child, '143:4954') ? { text: log.slot } : /Button|Action/.test(nodeName(child)) ? { hidden: true } : undefined, log.id)) };
    }
    if (name === 'Footer' && descendants(node).some(child => nodeName(child) === 'Pagination')) return { text: `${rows.length} registros cargados en este período` };
    if (name === 'Pagination') return { hidden: true };
    if (name === 'Button Picker' && descendants(node).some(child => nodeName(child) === 'Icon/ChatTeardropDots')) return { onClick: () => onNavigate('mensajes'), label: 'Consultar sobre mi diario' };
    const input = searchBinding(node, search, setSearch, 'Buscar comida'); if (input) return input;
    if (/Button/.test(name) && text === 'Add') return { onClick: () => onLogMeal ? onLogMeal() : onNavigate('diario'), label: 'Registrar una comida', props: { disabled: !onLogMeal } };
    if (/Button/.test(name) && text === 'Filter') return { onClick: () => setPendingOnly(value => !value), props: { 'aria-pressed': pendingOnly }, label: 'Mostrar sólo pendientes' };
    if (/Button/.test(name) && text === 'This Week') return { onClick: () => setDays(value => value === 7 ? 30 : value === 30 ? 0 : 7), text: days ? `Últimos ${days} días` : 'Todos los registros cargados' };
    return undefined;
  };
  return <FramePair nodes={['105:2649', '492:14886']} resolve={resolver} patientName={patient.name} onNavigate={onNavigate} onSignOut={onSignOut}>
    <DayAssignedMeals patientId={patient.id} date={dateId(now)} />
    <section aria-label="Hábitos de hoy" className="mx-[24px] mb-[24px] rounded-[16px] bg-white p-[24px] text-[#272932]">
      <h2 className="text-[18px] font-medium">Hábitos de hoy</h2><p className="my-[8px] text-[14px]">{dateId(now)} · Agua: {patient.hydration} vasos · Descanso: {patient.sleep}</p>
      <div className="flex flex-wrap gap-[8px]"><button type="button" disabled={busy} onClick={onHydration ?? (() => void addWater())} className="rounded-[8px] bg-[#c2e66e] px-[16px] py-[10px] text-[#272932]">Registrar agua</button><button type="button" onClick={onRest ?? (() => onNavigate('progreso'))} className="rounded-[8px] border border-[#e1e1e2] px-[16px] py-[10px]">Registrar descanso</button></div>
      {error && <Stateful error={error} />}
    </section>
  </FramePair>;
}
