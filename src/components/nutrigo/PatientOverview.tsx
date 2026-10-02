import { PatientBodyDataCard } from './ShowroomNutritionTarget';
import { useEffect, useState } from 'react';
import { bodyDataApi } from '../../api/nutrition-target';
import { exerciseApi } from '../../api/exercise';
import type { RoutineItemView } from '../../types/exercise';
import calorieRing from '../../assets/nutrigo/calorie-ring.svg?no-inline';
import weightGauge from '../../assets/nutrigo/weight-gauge.svg?no-inline';
import type { Macros } from '../../types';
import { Icon } from '../shared/Icon';
import { NvBadge, NvBars, NvButton, NvCard, NvMetric, NvProgress, NvState } from './primitives';
import type { ShowroomPatient } from './showroom-model';
import type { ShowroomPage } from './ShowroomPanels';

// Relative energy from recorded macros (4/4/9), never a prescribed daily target.
export function macroShares(macros: Macros) {
  const energy = [macros.protein_g * 4, macros.carbs_g * 4, macros.fat_g * 9];
  const total = energy.reduce((sum, value) => sum + value, 0);
  return energy.map((value) => total > 0 ? value / total * 100 : 0);
}

export function MealThumbnail({ slot }: { slot: string }) {
  return <span className="np-food-photo np-food-placeholder" aria-hidden="true" data-slot={slot} />;
}

export function PatientOverview({ patient: p, onNavigate, audience = 'patient' }: { patient: ShowroomPatient; onNavigate: (page: ShowroomPage) => void; audience?: 'patient' | 'professional' }) {
  const professional = audience === 'professional';
  const actorKey = `${p.id}:${professional}`;
  const [revision, setRevision] = useState(0);
  const [bodyResult, setBodyResult] = useState<{ key: string; weight: number | null; failed: boolean } | null>(null);
  const [routineResult, setRoutineResult] = useState<{ key: string; items: RoutineItemView[]; failed: boolean } | null>(null);
  const weight = bodyResult?.key === actorKey ? bodyResult.weight : null;
  const routine = routineResult?.key === actorKey ? routineResult.items : [];
  const bodyFailed = bodyResult?.key === actorKey && bodyResult.failed;
  const routineFailed = routineResult?.key === actorKey && routineResult.failed;
  useEffect(() => {
    const controller = new AbortController();
    bodyDataApi.get(p.id, professional, controller.signal).then((view) => {
      if (!controller.signal.aborted) setBodyResult({ key: actorKey, weight: view.data?.weight_kg ?? null, failed: false });
    }).catch(() => { if (!controller.signal.aborted) setBodyResult({ key: actorKey, weight: null, failed: true }); });
    exerciseApi.get(p.id, professional, controller.signal).then(({ exercise }) => {
      if (!controller.signal.aborted) setRoutineResult({ key: actorKey, items: exercise.assignments.filter((assignment) => assignment.status === 'active').flatMap((assignment) => assignment.items), failed: false });
    }).catch(() => { if (!controller.signal.aborted) setRoutineResult({ key: actorKey, items: [], failed: true }); });
    return () => controller.abort();
  }, [p.id, professional, actorKey, revision]);
  const followupTitle = professional ? 'Seguimiento del paciente' : 'Tu seguimiento';
  const shares = macroShares(p.macros);
  const hasNutrition = p.nutritionLogCount > 0;
  const totalMeals = p.journey.reviewedMeals + p.journey.pendingMeals;
  const reviewed = totalMeals ? p.journey.reviewedMeals / totalMeals * 100 : 0;
  return <div className="np-dashboard">
    <div className="nv-metrics np-metrics">
      <NvMetric label="Peso" value={<>{weight ?? '—'}<em>kg</em></>} note={bodyFailed ? 'No pudimos cargar el peso' : weight === null ? 'Sin peso declarado' : 'Último dato declarado'} icon="target" nvIcon="adherencia" onOpen={() => onNavigate('progreso')}>
        <div className="np-ruler np-ruler-empty" aria-hidden="true" />
      </NvMetric>
      <NvMetric label="Pasos" value="—" note="Sin pasos registrados" icon="check" nvIcon="pasos" tone="coral" onOpen={() => onNavigate('ejercicio')}>
        <div className="np-review-track np-steps-empty" aria-hidden="true" />
      </NvMetric>
      <NvMetric label="Descanso" value={p.sleep} note="Registro de hoy" icon="moon" nvIcon="descanso" tone="gold" onOpen={() => onNavigate('progreso')}>
        <NvBars label="Horas de sueño" values={p.journey.days.map((d) => ({ label: d.label, value: (d.sleepMinutes ?? 0) / 60 }))} />
      </NvMetric>
      <NvMetric label="Hidratación" value={<>{p.hydration}<em>vasos</em></>} note="Registro de hoy · sin meta prescrita" icon="drop" nvIcon="hidratacion" onOpen={() => onNavigate('progreso')}>
        <div className="np-water" aria-hidden="true"><Icon name="drop" size={19} /><span>{professional ? 'Agua registrada' : 'Tu registro de agua'}</span></div>
      </NvMetric>
    </div>
    <div className="np-chart-grid">
      <NvCard title="Datos de peso" className="np-goal" action={<Icon name="target" size={16} />}>
        <div className="np-gauge" role="img" aria-label={weight === null ? 'Sin peso declarado' : `Peso declarado: ${weight} kg. Sin meta de peso registrada.`}>
          <span className="np-gauge-source" aria-hidden="true" style={{ maskImage: `url("${weightGauge}")` }} />
          <span className="np-gauge-source np-gauge-source-left" aria-hidden="true" style={{ maskImage: `url("${weightGauge}")` }} />
          <div><strong>{weight ?? '—'}<small> kg</small></strong><span>Peso declarado</span></div>
          <span className="np-gauge-start">—</span><span className="np-gauge-end">—</span>
        </div>
        <div className="np-goal-note"><strong>{p.goal || 'Objetivo por definir'}</strong><p>{professional ? 'Avance del objetivo registrado en la ficha.' : <>Cada pequeño paso cuenta.<br />A tu ritmo, con acompañamiento.</>}</p></div>
      </NvCard>
      <NvCard title="Registro nutricional" className="np-nutrition-card" action={<NvBadge>Hoy</NvBadge>}>
        <div className="np-nutrition">
          <div className="np-calorie"><img className="np-calorie-source" src={calorieRing} alt="" /><Icon name="leaf" size={27} /><strong>{hasNutrition ? <>{p.kcal}<small> kcal</small></> : '—'}</strong><span>{hasNutrition ? 'Comidas revisadas' : 'Sin datos nutricionales'}</span></div>
          <div className="np-macros">
            <div className="np-macro-heading"><span className="nv-icon-tile"><Icon name={hasNutrition ? 'check' : 'clock'} size={17} /></span><div><strong>{hasNutrition ? professional ? 'Datos revisados' : 'Lo que registraste' : 'Registro pendiente'}</strong><small>{hasNutrition ? 'Distribución energética estimada' : 'Sin valores para calcular'}</small></div></div>
            {(['Proteínas', 'Carbohidratos', 'Grasas'] as const).map((label, i) => <div className="np-macro-row" key={label}>
              <strong>{hasNutrition ? <>{[p.macros.protein_g, p.macros.carbs_g, p.macros.fat_g][i]}<small> g</small></> : '—'}</strong>
              <div><span>{label}{hasNutrition && <b>{shares[i]}%</b>}</span><span className="np-macro-track" aria-hidden="true"><i style={{ width: `${shares[i]}%` }} /></span></div>
            </div>)}
          </div>
        </div>

      </NvCard>
    </div>
    <section className="np-followup" aria-label={followupTitle}>
      <header><h2>{followupTitle}</h2><NvButton className="nv-ghost" onClick={() => onNavigate('progreso')}>Ver períodos <Icon name="chevron" size={13} /></NvButton></header>
      <div className="np-followup-grid">
        <button type="button" onClick={() => onNavigate('diario')}><span className="np-action-icon"><Icon name="camera" size={25} /></span><span><span>Diario de comidas</span><strong>{p.journey.reviewedMeals} revisadas</strong><NvProgress value={reviewed} label="Registros revisados" /></span></button>
        <button type="button" onClick={() => onNavigate('progreso')}><span className="np-action-icon"><Icon name="drop" size={25} /></span><span><span>Hábitos de la semana</span><strong>Agua y descanso</strong><small>{professional ? 'Ver registros' : 'Ver mis registros'}</small></span></button>
        <button type="button" onClick={() => onNavigate('agenda')}><span className="np-action-icon"><Icon name="calendar" size={25} /></span><span><span>Próxima consulta</span><strong>{p.appointment?.when ?? 'Por coordinar'}</strong><small>{professional ? 'Consulta del paciente' : 'Con tu nutricionista'}</small></span></button>
      </div>
    </section>
    <div className="np-bottom-grid">
    <NvCard title={professional ? 'Plan asignado para hoy' : 'En tu plan de hoy'} className="np-menu-card" action={<NvButton className="nv-ghost" onClick={() => onNavigate('plan')}>Ver plan <Icon name="arrow" size={14} /></NvButton>}>
      <div className="np-plan-grid">{p.todayPlan.slice(0, 2).map((meal) => <button type="button" className="np-plan-meal" key={meal.slot} onClick={() => onNavigate('plan')}><MealThumbnail slot={meal.slot} /><span><NvBadge tone="gold">{meal.slot}</NvBadge><small><Icon name="clock" size={12} />{meal.time}</small></span><strong>{meal.title}</strong></button>)}</div>
      {!p.todayPlan.length ? <NvState title={professional ? 'Sin plan para hoy' : 'Tu plan está en camino'} description="Todavía no hay comidas publicadas para hoy." /> : null}
    </NvCard>
    <NvCard title="Ejercicios asignados" className="np-exercise-card" action={<NvButton className="nv-ghost" onClick={() => onNavigate('ejercicio')} aria-label="Ver ejercicio"><Icon name="arrow" size={14} /></NvButton>}>
      {routine.length ? routine.slice(0, 3).map((item) => <button className="np-routine-item" type="button" key={item.id} onClick={() => onNavigate('ejercicio')}><span className="np-food-photo np-food-placeholder" aria-hidden="true" /><span><strong>{item.name}</strong><small>{item.sets} series · {item.reps} repeticiones</small><NvBadge>{item.category}</NvBadge></span></button>) : <NvState kind={routineFailed ? 'error' : 'empty'} title={routineFailed ? 'No pudimos cargar la rutina' : 'Sin ejercicios asignados'} description={routineFailed ? 'Abrí Ejercicio para volver a cargarla.' : 'Acá aparecerá la rutina cuando una profesional habilitada la publique.'} />}
    </NvCard>
    </div>
    <details className="np-data-explanation"><summary>Cómo se calculan estos datos</summary><p className="np-data-note">{hasNutrition ? 'Solo comidas con datos nutricionales revisados. Sin meta calórica prescrita.' : p.journey.days[p.journey.days.length - 1]?.reviewedMeals ? 'Sin datos nutricionales en las comidas revisadas hoy.' : 'Sin comidas revisadas hoy. No se calcula consumo ni una meta.'}</p></details>
    {!professional && <PatientBodyDataCard patientId={p.id} onSaved={() => setRevision((value) => value + 1)} />}
  </div>;
}
