import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { progressApi } from '../../api/progress';
import { isAbortError } from '../../api/client';
import { Icon } from '../shared/Icon';
import { buildRecentActivity, activityWhen } from './recent-activity';
import type { ShowroomPatient } from './showroom-model';
import type { ShowroomPage } from './ShowroomPanels';
import speedometer from '../../assets/figma-mobile/427-14410-imgIconSpecialSpeedometer.svg';
import footsteps from '../../assets/figma-mobile/427-14410-imgIconSpecialFootprints.svg';
import moonStars from '../../assets/figma-mobile/427-14410-imgIconSpecialMoonStars.svg';
import pintGlass from '../../assets/figma-mobile/427-14410-imgIconSpecialPintGlass.svg';
import dots from '../../assets/figma-mobile/427-14552-imgIconDotsThree.svg';
import weightRing from '../../assets/figma-mobile/427-14552-imgDonutBase.svg';
import lightning from '../../assets/figma-mobile/427-14572-imgIconSpecialLightning.svg';
import fire from '../../assets/figma-mobile/427-14618-imgIconSpecialFire.svg';
import bread from '../../assets/figma-mobile/427-14618-imgIconSpecialBread.svg';
import fish from '../../assets/figma-mobile/427-14618-imgIconSpecialFish.svg';
import drop from '../../assets/figma-mobile/427-14618-imgIconSpecialDrop.svg';
import run from '../../assets/figma-mobile/427-14611-imgIconSpecialPersonSimpleRun.svg';
import strength from '../../assets/figma-mobile/427-14611-imgIconSpecialPersonSimpleDeadlifts.svg';
import stretch from '../../assets/figma-mobile/427-14611-imgIconSpecialPersonSimpleTaiChi.svg';
import chevronLeft from '../../assets/figma-mobile/427-14629-imgIconCaretLeft.svg';
import chevronRight from '../../assets/figma-mobile/427-14629-imgIconCaretRight.svg';
import facebook from '../../assets/figma-mobile/427-14667-imgFacebookLogo.svg';
import twitter from '../../assets/figma-mobile/427-14667-imgTwitterLogo.svg';
import instagram from '../../assets/figma-mobile/427-14667-imgInstagramLogo.svg';
import youtube from '../../assets/figma-mobile/427-14667-imgYoutubeLogo.svg';
import linkedin from '../../assets/figma-mobile/427-14667-imgLinkedinLogo.svg';
import './figma-mobile-dashboard.css';

type Props = { patient: ShowroomPatient; onNavigate: (page: ShowroomPage) => void };

const SLOT_LABELS: Record<string, string> = {
  Desayuno: 'Desayuno', Almuerzo: 'Almuerzo', Merienda: 'Merienda', Cena: 'Cena',
};
const SLOT_COLORS: Record<string, string> = {
  Desayuno: 'green', Almuerzo: 'gold', Merienda: 'gold', Cena: 'coral',
};
const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const formatNumber = (value: number) => new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 }).format(value);
const percent = (value: number) => `${Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0))}%`;
function macroShares(protein: number, carbs: number, fat: number) {
  const energy = [protein * 4, carbs * 4, fat * 9];
  const total = energy.reduce((sum, value) => sum + value, 0);
  return energy.map((value) => total > 0 ? value / total * 100 : 0);
}

function FigmaSectionHead({ title, onOpen }: { title: string; onOpen?: () => void }) {
  return <header className="fm-section-head"><h2>{title}</h2>{onOpen && <button type="button" aria-label={`Abrir ${title}`} onClick={onOpen}><img src={dots} alt="" width="24" height="24" /></button>}</header>;
}

function FigmaMacro({ label, value, share }: { label: string; value: number | null; share: number }) {
  return <div className="fm-macro"><span className="fm-macro-amount"><strong>{value === null ? '—' : formatNumber(value)}</strong><small>g</small></span><span className="fm-macro-body"><span>{label}<b>{value === null ? '—' : `${Math.round(share)}%`}</b></span><i><em style={{ width: value === null ? '0%' : percent(share) }} /></i></span></div>;
}

function FigmaMealCard({ meal, onOpen }: { meal: { slot: string; title: string }; onOpen: () => void }) {
  const tone = SLOT_COLORS[meal.slot] ?? 'green';
  return <button type="button" className="fm-recommended-card" onClick={onOpen}>
    <span className="fm-recommended-image"><span className={`fm-slot fm-${tone}`}>{SLOT_LABELS[meal.slot] ?? meal.slot}</span></span>
    <span className="fm-recommended-body">
      <span className="fm-nutrient-pills"><span><img src={bread} alt="" width="12" height="12" />HC —</span><span><img src={fish} alt="" width="12" height="12" />P —</span><span><img src={drop} alt="" width="12" height="12" />G —</span></span>
      <strong>{meal.title}</strong><small>Esta comida forma parte de tu plan publicado.</small>
    </span>
  </button>;
}

export function FigmaMobileDashboard({ patient: p, onNavigate }: Props) {
  const now = useMemo(() => new Date(), []);
  const today = (now.getDay() + 6) % 7;
  const [selectedDay, setSelectedDay] = useState(today);
  const [weekOffset, setWeekOffset] = useState(0);
  const [weight, setWeight] = useState<{ value: number; unit: string } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setWeight(null);
    progressApi.get(p.id, 7, controller.signal).then(({ progress }) => {
      if (!progress.measurements_included) return;
      const series = progress.series.find((item) => item.kind === 'weight');
      const points = series ? [...series.previous, ...series.current] : [];
      const latest = points.sort((a, b) => b.captured_on.localeCompare(a.captured_on))[0];
      if (latest && series) setWeight({ value: latest.value, unit: series.unit });
    }).catch((error) => { if (!isAbortError(error)) setWeight(null); });
    return () => controller.abort();
  }, [p.id]);

  const shares = macroShares(p.macros.protein_g, p.macros.carbs_g, p.macros.fat_g);
  const hasNutrition = p.nutritionLogCount > 0;
  const recent = buildRecentActivity(p, now);
  const startOfWeek = new Date(now);
  startOfWeek.setHours(12, 0, 0, 0);
  startOfWeek.setDate(now.getDate() - today + weekOffset * 7);
  const weekDates = WEEKDAYS.map((_, index) => { const date = new Date(startOfWeek); date.setDate(startOfWeek.getDate() + index); return date; });
  const selectedMeals = weekOffset === 0 ? p.weekPlan[selectedDay]?.meals ?? [] : [];
  const planRows = ['Desayuno', 'Almuerzo', 'Merienda', 'Cena'].map((slot) => selectedMeals.find((meal) => meal.slot === slot) ?? { slot, title: 'Sin indicación' });
  const recommended = p.todayPlan.length ? p.todayPlan.slice(0, 2) : p.weekPlan.flatMap((day) => day.meals).slice(0, 2);
  const recentActivities = [...p.activities].sort((a, b) => b.logged_at.localeCompare(a.logged_at)).slice(0, 3);
  const sleepDays = p.journey.days.slice(-8);
  const maxSleep = Math.max(1, ...sleepDays.map((day) => day.sleepMinutes ?? 0));

  return <div className="fm-dashboard" data-figma-frame="427:14405">
    <header className="fm-greeting" data-figma-node="427:14408"><h2>Hola, {p.name.split(' ')[0]}! 👋</h2><p>Empecemos hoy con hábitos que te hacen bien.</p></header>

    <section className="fm-statistics" aria-label="Resumen de salud" data-figma-node="427:14410">
      <button type="button" className="fm-stat" onClick={() => onNavigate('progreso')} data-figma-node="427:14411"><span className="fm-stat-head">Peso<span className="fm-stat-icon"><img src={speedometer} alt="" width="14" height="14" /></span></span><span className="fm-weight-stat"><strong>{weight ? formatNumber(weight.value) : '—'}</strong><small>{weight?.unit ?? 'kg'}</small></span><span className="fm-ruler" aria-hidden="true">{Array.from({ length: 21 }, (_, index) => <i key={index} />)}</span><span className="fm-ruler-labels"><small>{weight ? 'Último registro' : 'Sin registro'}</small><small>Ver medidas</small></span></button>
      <button type="button" className="fm-stat" onClick={() => onNavigate('ejercicio')} data-figma-node="427:14476"><span className="fm-stat-head">Pasos<span className="fm-stat-icon"><img src={footsteps} alt="" width="14" height="14" /></span></span><span className="fm-stat-value"><strong>—</strong><small>pasos</small></span><span className="fm-steps-track" /><span className="fm-stat-foot"><small>Sin registro</small><small>Ver actividad</small></span></button>
      <button type="button" className="fm-stat" onClick={() => onNavigate('progreso')} data-figma-node="427:15408"><span className="fm-stat-head">Descanso<span className="fm-stat-icon"><img src={moonStars} alt="" width="14" height="14" /></span></span><span className="fm-stat-value"><strong>{p.sleepMinutes === null ? '—' : formatNumber(p.sleepMinutes / 60)}</strong><small>horas</small></span><span className="fm-sleep-chart" aria-label="Descanso de los últimos días">{Array.from({ length: 8 }, (_, index) => { const minutes = sleepDays[index]?.sleepMinutes ?? null; return <i key={index} style={{ '--fm-bar': minutes === null ? '0%' : percent(minutes / maxSleep * 100) } as CSSProperties} />; })}</span></button>
      <button type="button" className="fm-stat" onClick={() => onNavigate('progreso')} data-figma-node="427:15450"><span className="fm-stat-head">Agua<span className="fm-stat-icon"><img src={pintGlass} alt="" width="14" height="14" /></span></span><span className="fm-stat-value"><strong>{p.hydration}</strong><small>vasos</small></span><span className="fm-water-track"><i /></span><span className="fm-stat-foot"><small>Registro de hoy</small><small>Sin meta indicada</small></span></button>
    </section>

    <section className="fm-weight-widget fm-panel" data-figma-node="427:14552"><FigmaSectionHead title="Datos de peso" onOpen={() => onNavigate('progreso')} /><div className="fm-weight-chart"><img src={weightRing} alt="" width="248" height="247" /><div><strong>{weight ? `${formatNumber(weight.value)} ${weight.unit}` : '—'}</strong><small>Peso declarado</small></div></div><p className="fm-weight-note">{weight ? 'Tus medidas declaradas aparecen en Progreso.' : 'Cuando cargues una medida, aparecerá acá.'}</p></section>

    <section className="fm-calories-widget fm-panel" data-figma-node="427:14572"><FigmaSectionHead title="Registro de calorías" onOpen={() => onNavigate('diario')} /><div className="fm-calorie-ring"><img src={lightning} alt="" width="32" height="32" /><strong>{hasNutrition ? formatNumber(p.kcal) : '—'}<small> kcal</small></strong><span>{hasNutrition ? 'Calorías registradas' : 'Sin datos revisados'}</span></div><div className="fm-calorie-facts"><span><img src={fish} alt="" width="16" height="16" /><strong>{hasNutrition ? formatNumber(p.kcal) : '—'} kcal</strong><small>Comidas revisadas</small></span><span><img src={fire} alt="" width="16" height="16" /><strong>— kcal</strong><small>Actividad registrada</small></span></div><div className="fm-macro-list"><FigmaMacro label="Carbohidratos" value={hasNutrition ? p.macros.carbs_g : null} share={shares[1]} /><FigmaMacro label="Proteínas" value={hasNutrition ? p.macros.protein_g : null} share={shares[0]} /><FigmaMacro label="Grasas" value={hasNutrition ? p.macros.fat_g : null} share={shares[2]} /></div></section>

    <section className="fm-workout" data-figma-node="427:14611"><div className="fm-workout-heading"><FigmaSectionHead title="Actividad física" /><button type="button" onClick={() => onNavigate('ejercicio')}>Esta semana <Icon name="chevron" size={14} /></button></div><div className="fm-workout-list">{[run, strength, stretch].map((asset, index) => { const entry = recentActivities[index]; return <button type="button" key={index} className={`fm-workout-card fm-workout-${index}`} onClick={() => onNavigate('ejercicio')}><span className="fm-workout-icon"><img src={asset} alt="" width="32" height="32" /></span><span className="fm-workout-info"><span>{entry?.activity ?? ['Cardio', 'Fuerza', 'Movilidad'][index]}</span><span><strong>{entry ? `${entry.duration_minutes} min` : 'Sin registro'}</strong><small>{entry?.intensity ?? 'Ver actividad'}</small></span><i><em style={{ width: '0%' }} /></i></span></button>; })}</div></section>

    <section className="fm-menu-widget fm-panel" data-figma-node="427:14618"><FigmaSectionHead title="Menú recomendado" onOpen={() => onNavigate('recetas')} /><div className="fm-menu-list">{recommended.length ? recommended.map((meal, index) => <FigmaMealCard key={`${meal.title}:${index}`} meal={meal} onOpen={() => onNavigate('plan')} />) : <p className="fm-empty">Todavía no hay comidas publicadas en tu plan.</p>}</div></section>

    <section className="fm-exercises" data-figma-node="427:14623"><FigmaSectionHead title="Ejercicios recomendados" onOpen={() => onNavigate('ejercicio')} /><div className="fm-exercise-list">{[0, 1, 2].map((index) => { const entry = recentActivities[index]; return <button type="button" key={index} className="fm-exercise-card" onClick={() => onNavigate('ejercicio')}><span className="fm-exercise-image" /><span><strong>{entry?.activity ?? ['Actividad aeróbica', 'Fuerza', 'Movilidad'][index]}</strong><small><img src={fire} alt="" width="14" height="14" />{entry ? `${entry.duration_minutes} min` : 'Sin recomendación asignada'}</small><em>{entry?.intensity ?? 'Ver ejercicios'}</em></span></button>; })}</div></section>

    <section className="fm-plan-widget fm-panel" data-figma-node="427:14629"><FigmaSectionHead title="Plan de comidas" onOpen={() => onNavigate('plan')} /><div className="fm-calendar"><div className="fm-calendar-head"><strong>{new Intl.DateTimeFormat('es-AR', { month: 'long' }).format(weekDates[0])} <small>{weekDates[0].getFullYear()}</small></strong><span><button type="button" aria-label="Semana anterior" onClick={() => setWeekOffset((offset) => offset - 1)}><img src={chevronLeft} alt="" width="18" height="18" /></button><button type="button" aria-label="Semana siguiente" onClick={() => setWeekOffset((offset) => offset + 1)}><img src={chevronRight} alt="" width="18" height="18" /></button></span></div><div className="fm-calendar-days">{weekDates.map((date, index) => <button type="button" key={date.toISOString()} aria-pressed={selectedDay === index} onClick={() => setSelectedDay(index)}><small>{WEEKDAYS[index]}</small><strong>{date.getDate()}</strong></button>)}</div></div><div className="fm-plan-meals">{planRows.map((meal, index) => <button type="button" className="fm-plan-meal" key={`${meal.slot}:${index}`} onClick={() => onNavigate('plan')}><span className="fm-plan-meal-head"><span className={`fm-slot fm-${SLOT_COLORS[meal.slot] ?? 'green'}`}>{meal.slot}</span><small><img src={fire} alt="" width="14" height="14" /> — kcal</small></span><span className="fm-plan-meal-body"><i /><span><strong>{meal.title}</strong><small>HC — · P — · G —</small></span></span></button>)}</div></section>

    <section className="fm-recent fm-panel" data-figma-node="427:14659"><FigmaSectionHead title="Actividad reciente" onOpen={() => onNavigate('progreso')} />{recent.length ? <ol>{recent.map((item, index) => <li key={item.id}><span className={`fm-recent-icon fm-recent-${index % 3}`}><Icon name={item.icon} size={16} /></span><span><small>{activityWhen(item.at, now)}</small><strong>{item.text}</strong></span></li>)}</ol> : <p className="fm-empty">Todavía no hay actividad registrada.</p>}</section>
    <footer className="fm-footer" data-figma-node="427:14667"><strong>Copyright © {now.getFullYear()} Plan V</strong><span>Privacidad　 Condiciones　 Contacto</span><span className="fm-social" aria-hidden="true">{[facebook, twitter, instagram, youtube, linkedin].map((src) => <img key={src} src={src} alt="" width="20" height="20" />)}</span></footer>
  </div>;
}
