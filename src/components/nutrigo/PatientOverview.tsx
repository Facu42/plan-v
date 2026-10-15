import type { Macros } from '../../types';
import { Icon } from '../shared/Icon';
import { NvBadge, NvBars, NvButton, NvCard, NvMetric, NvProgress, NvState } from './primitives';
import type { ShowroomPatient } from './showroom-model';
import type { ShowroomPage } from './ShowroomPanels';
import breakfast from '../../assets/showroom/breakfast.webp';
import lunch from '../../assets/showroom/lunch.webp';
import snack from '../../assets/showroom/snack.webp';
import { useCare } from './useCare';

// Relative energy from recorded macros (4/4/9), never a prescribed daily target.
export function macroShares(macros: Macros) {
  const energy = [macros.protein_g * 4, macros.carbs_g * 4, macros.fat_g * 9];
  const total = energy.reduce((sum, value) => sum + value, 0);
  return energy.map((value) => total > 0 ? value / total * 100 : 0);
}

export function MealThumbnail({ slot }: { slot: string }) {
  const image = slot === 'Desayuno' ? breakfast : slot === 'Merienda' ? snack : ['Almuerzo', 'Cena'].includes(slot) ? lunch : null;
  return image ? <img className="np-food-photo" src={image} alt="Imagen ilustrativa del archivo de Plan V" width={480} height={360} loading="lazy" /> : <span className="np-food-fallback"><Icon name="leaf" /></span>;
}

export function PatientOverview({ patient: p, onNavigate, audience = 'patient' }: { patient: ShowroomPatient; onNavigate: (page: ShowroomPage) => void; audience?: 'patient' | 'professional' }) {
  const professional = audience === 'professional';
  const care = useCare(p.id, professional);
  const followupTitle = professional ? 'Seguimiento del paciente' : 'Tu seguimiento';
  const shares = macroShares(p.macros);
  const hasNutrition = p.nutritionLogCount > 0;
  const progress = Math.min(100, Math.max(0, p.goalProgress));
  const totalMeals = p.journey.reviewedMeals + p.journey.pendingMeals;
  const reviewed = totalMeals ? p.journey.reviewedMeals / totalMeals * 100 : 0;
  const latest = p.messages[p.messages.length - 1];
  const latestWeight = care.data?.records.slice().reverse().find((record) => record.data.kind === 'weight');
  const lastWeightUnit = latestWeight?.data.kind === 'weight' ? latestWeight.data.unit : null;
  const weightEntries = care.data?.records
    .filter((record) => record.data.kind === 'weight' && (!lastWeightUnit || record.data.unit === lastWeightUnit))
    .sort((a, b) => a.recorded_on.localeCompare(b.recorded_on))
    .slice(-7) ?? [];
  const weightValues = weightEntries.flatMap((record) => record.data.kind === 'weight' ? [record.data.value] : []);
  const weightMin = weightValues.length ? Math.min(...weightValues) : 0;
  const weightRange = weightValues.length ? Math.max(...weightValues) - weightMin : 0;
  const weightPoints = weightValues.map((value, index) => ({
    x: weightValues.length === 1 ? 150 : 18 + (index / (weightValues.length - 1)) * 264,
    y: 76 - (weightRange ? (value - weightMin) / weightRange * 48 : 24),
    value,
    entry: weightEntries[index],
  }));
  const recentActivities = p.activities.slice().sort((a, b) => Date.parse(b.logged_at) - Date.parse(a.logged_at)).slice(0, 3);
  return <div className="np-dashboard">
    <div className="nv-metrics np-metrics">
      {professional ? <>
      <NvMetric label="Adherencia" value={<>{p.adherence}<em> %</em></>} note="Últimos 7 días" icon="target" onOpen={() => onNavigate('progreso')}>
        <div className="np-ruler" aria-hidden="true"><i style={{ left: `${Math.min(100, Math.max(0, p.adherence))}%` }} /><span>0</span><span>50</span><span>100</span></div>
      </NvMetric>
      <NvMetric label="Comidas revisadas" value={p.journey.reviewedMeals} note={`${p.journey.pendingMeals} pendientes de revisión`} icon="check" tone="coral" onOpen={() => onNavigate('diario')}>
        <div className="np-review-track" role="img" aria-label={`${p.journey.reviewedMeals} de ${totalMeals} registros revisados`}><i style={{ width: `${reviewed}%` }} /></div>
      </NvMetric>
      </> : <>
      <NvMetric label="Peso" value="Sin registro" note="Todavía no hay una medición" icon="trend" onOpen={() => onNavigate('progreso')} />
      <NvMetric label="Pasos" value="Sin registro" note="Todavía no hay un conteo" icon="heart" onOpen={() => onNavigate('ejercicio')} />
      </>}
      <NvMetric label={professional ? 'Descanso' : 'Sueño'} value={p.sleep} note="Registro de hoy" icon="moon" tone="gold" onOpen={() => onNavigate('progreso')}>
        <NvBars label="Horas de sueño" values={p.journey.days.map((d) => ({ label: d.label, value: (d.sleepMinutes ?? 0) / 60 }))} />
      </NvMetric>
      <NvMetric label={professional ? 'Hidratación' : 'Agua'} value={<>{p.hydration}<em> vasos</em></>} note="Registro de hoy · sin meta prescrita" icon="drop" onOpen={() => onNavigate('progreso')}>
        <div className="np-water" aria-hidden="true"><Icon name="drop" size={19} /><span>{professional ? 'Agua registrada' : 'Tu registro de agua'}</span></div>
      </NvMetric>
    </div>
    <div className="np-chart-grid">
      <NvCard title={professional ? 'Objetivo del paciente' : 'Peso'} className={professional ? 'np-goal' : 'np-weight-card'} action={professional ? <Icon name="target" size={16} /> : <NvButton className="nv-ghost" onClick={() => onNavigate('progreso')}>Ver registro <Icon name="arrow" size={13} /></NvButton>}>
        {!professional ? <>
          {weightPoints.length ? <div className="np-weight-chart" role="img" aria-label={`Registros de peso: ${weightPoints.map((point) => `${point.value} ${lastWeightUnit}, ${point.entry?.recorded_on}`).join('; ')}`}>
            <svg viewBox="0 0 300 100" aria-hidden="true"><path className="np-weight-gridline" d="M16 28H292M16 52H292M16 76H292" /><polyline points={weightPoints.map((point) => `${point.x},${point.y}`).join(' ')} />{weightPoints.map((point, index) => <circle key={point.entry?.id ?? index} cx={point.x} cy={point.y} r="4" />)}</svg>
            <div className="np-weight-labels">{weightPoints.map((point, index) => <span key={point.entry?.id ?? index}>{point.entry?.recorded_on.slice(5) ?? ''}</span>)}</div>
            <strong>{weightPoints[weightPoints.length - 1].value} <small>{lastWeightUnit}</small></strong>
          </div> : <div className="np-weight-empty"><Icon name="trend" size={22} /><strong>Sin registro</strong><span>Cuando cargues una medición, vas a verla acá.</span></div>}
          <p className="np-data-note">Registro opcional · no se estima desde fotos.</p>
        </> : <>
        <div className="np-gauge" role="img" aria-label={`Avance del objetivo: ${progress}%`}>
          <svg viewBox="0 0 244 150" aria-hidden="true"><path className="np-gauge-track" d="M22 122 A100 100 0 0 1 222 122" /><path className="np-gauge-value" d="M22 122 A100 100 0 0 1 222 122" pathLength="100" strokeDasharray={`${progress} 100`} /></svg>
          <div><strong>{progress}<small>%</small></strong><span>Avance registrado</span></div>
          <span className="np-gauge-start">0</span><span className="np-gauge-end">100</span>
        </div>
        <div className="np-goal-note"><strong>{p.goal || 'Objetivo por definir'}</strong><p>{professional ? 'Avance del objetivo registrado en la ficha.' : <>Cada pequeño paso cuenta.<br />A tu ritmo, con acompañamiento.</>}</p></div>
        </>}
      </NvCard>
      <NvCard title={professional ? 'Registro nutricional' : 'Calorías y nutrientes'} className="np-nutrition-card" action={<NvBadge>Hoy</NvBadge>}>
        <div className="np-nutrition">
          <div className="np-calorie"><Icon name="leaf" size={27} /><strong>{hasNutrition ? <>{p.kcal}<small> kcal</small></> : '—'}</strong><span>{hasNutrition ? 'Comidas revisadas' : 'Sin datos nutricionales'}</span></div>
          <div className="np-macros">
            <div className="np-macro-heading"><span className="nv-icon-tile"><Icon name={hasNutrition ? 'check' : 'clock'} size={17} /></span><div><strong>{hasNutrition ? professional ? 'Datos revisados' : 'Lo que registraste' : 'Registro pendiente'}</strong><small>{hasNutrition ? 'Distribución energética estimada' : 'Sin valores para calcular'}</small></div></div>
            {(['Proteínas', 'Carbohidratos', 'Grasas'] as const).map((label, i) => <div className="np-macro-row" key={label}>
              <strong>{hasNutrition ? <>{[p.macros.protein_g, p.macros.carbs_g, p.macros.fat_g][i]}<small> g</small></> : '—'}</strong>
              <div><span>{label}</span><span className="np-macro-track" aria-hidden="true"><i style={{ width: `${shares[i]}%` }} /></span></div>
            </div>)}
          </div>
        </div>
        <p className="np-data-note">{hasNutrition ? 'Solo comidas con datos nutricionales revisados. Sin meta calórica prescrita.' : p.journey.days[p.journey.days.length - 1]?.reviewedMeals ? 'Sin datos nutricionales en las comidas revisadas hoy.' : 'Sin comidas revisadas hoy. No se calcula consumo ni una meta.'}</p>
      </NvCard>
    </div>
    <section className="np-followup" aria-label={followupTitle}>
      <header><h2>{professional ? followupTitle : 'Tu progreso de esta semana'}</h2><NvButton className="nv-ghost" onClick={() => onNavigate('progreso')}>Últimos 7 días <Icon name="chevron" size={13} /></NvButton></header>
      <div className="np-followup-grid">
        <button type="button" onClick={() => onNavigate('diario')}><span className="np-action-icon"><Icon name="camera" size={25} /></span><span><span>Diario de comidas</span><strong>{p.journey.reviewedMeals} revisadas</strong><NvProgress value={reviewed} label="Registros revisados" /></span></button>
        <button type="button" onClick={() => onNavigate('progreso')}><span className="np-action-icon"><Icon name="drop" size={25} /></span><span><span>Hábitos de la semana</span><strong>Agua y descanso</strong><small>{professional ? 'Ver registros' : 'Ver mis registros'}</small></span></button>
        <button type="button" onClick={() => onNavigate('agenda')}><span className="np-action-icon"><Icon name="calendar" size={25} /></span><span><span>Próxima consulta</span><strong>{p.appointment?.when ?? 'Por coordinar'}</strong><small>{professional ? 'Consulta del paciente' : 'Con tu nutricionista'}</small></span></button>
      </div>
    </section>
    <div className="np-bottom-grid">
    <NvCard title={professional ? 'Plan asignado para hoy' : 'En tu plan de hoy'} className="np-menu-card" action={<NvButton className="nv-ghost" onClick={() => onNavigate('plan')}>Ver plan <Icon name="arrow" size={14} /></NvButton>}>
      <div className="np-plan-grid">{p.todayPlan.slice(0, 2).map((meal) => <button type="button" className="np-plan-meal" key={meal.slot} onClick={() => onNavigate('plan')}>{professional ? <MealThumbnail slot={meal.slot} /> : <span className="np-plan-placeholder" aria-hidden="true" />}<span><NvBadge tone="gold">{meal.slot}</NvBadge><small><Icon name="clock" size={12} />{meal.time}</small></span><strong>{meal.title}</strong></button>)}</div>
      {!p.todayPlan.length ? <NvState title={professional ? 'Sin plan para hoy' : 'Tu plan está en camino'} description="Todavía no hay comidas publicadas para hoy." /> : professional ? <p className="np-data-note">Imágenes ilustrativas de Plan V, no fotografías de registros del paciente.</p> : null}
    </NvCard>
    {professional ? <NvCard title={`Conversación con ${p.name}`} className="np-contact-card" action={<Icon name="message" size={16} />}>
      <div className="nv-professional"><span className="nv-avatar">{professional ? p.initials : 'VT'}</span><div><strong>{professional ? p.name : 'Verónica Trenti'}</strong><small>{professional ? 'Paciente · Plan V' : 'Nutricionista · Plan V'}</small></div></div>
      {latest && <small className="nv-caption">{latest.from === 'patient' ? p.name : 'Verónica'} · Último mensaje enviado</small>}
      <p className="nv-message-preview">{latest?.text ?? (professional ? 'Todavía no hay mensajes enviados en este seguimiento.' : 'Los mensajes de tu nutricionista aparecerán acá.')}</p>
      <NvButton className="nv-soft" onClick={() => onNavigate('mensajes')}>Ver conversación <Icon name="arrow" size={15} /></NvButton>
    </NvCard> : <NvCard title="Tu actividad física" className="np-exercise-card" action={<NvButton className="nv-ghost" onClick={() => onNavigate('ejercicio')}>Ver actividad <Icon name="arrow" size={13} /></NvButton>}>
      {recentActivities.length ? <div className="np-exercise-list">{recentActivities.map((activity) => <article key={activity.id}><span className="np-exercise-icon"><Icon name="heart" size={16} /></span><div><strong>{activity.activity}</strong><small>{activity.duration_minutes} min · Intensidad {activity.intensity}</small></div></article>)}</div> : <div className="np-exercise-empty"><Icon name="heart" size={20} /><strong>Sin actividad registrada</strong><span>Cuando registres una actividad, aparecerá en este resumen.</span></div>}
      <NvButton className="nv-soft" onClick={() => onNavigate('ejercicio')}>Registrar actividad <Icon name="arrow" size={14} /></NvButton>
    </NvCard>}
    </div>
  </div>;
}
