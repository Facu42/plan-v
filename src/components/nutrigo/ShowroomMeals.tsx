import { useMemo } from 'react';
import { Users } from '@phosphor-icons/react';
import type { ActivityLog, HabitLog, MealLog, Patient } from '../../types';
import { FoodDiaryBoard, type DiaryRow } from './ShowroomPatientDiary';
import './showroom-meals.css';
import './agenda-diario-fig.css';

export type MealDiary = {
  logs: MealLog[];
  habits: HabitLog[];
  activities: ActivityLog[];
  pending: number;
  reviewed: number;
};

export function buildMealDiary(patient: Patient): MealDiary {
  const logs = patient.meal_logs
    .filter((log) => log.patient_id === patient.id)
    .slice()
    .sort((a, b) => Date.parse(b.logged_at) - Date.parse(a.logged_at));
  const habits = patient.habit_logs
    .filter((habit) => habit.patient_id === patient.id)
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date));
  return {
    logs,
    habits,
    activities: (patient.activity_logs ?? []).filter((entry) => entry.patient_id === patient.id).slice()
      .sort((a, b) => Date.parse(b.logged_at) - Date.parse(a.logged_at)),
    pending: logs.filter((log) => log.status === 'pending_review').length,
    reviewed: logs.filter((log) => log.status !== 'pending_review').length,
  };
}

/** Filas del frame Food Diary a partir de los registros de la paciente seleccionada. */
export function mealDiaryRows(patient: Patient): DiaryRow[] {
  return buildMealDiary(patient).logs.map((log) => ({
    id: log.id,
    slot: log.slot,
    description: log.description,
    foods: log.foods.map((food) => food.name).filter(Boolean),
    macros: log.macros,
    status: log.status,
    logged_at: log.logged_at,
    note: log.note_for_nutri,
  }));
}

export function ShowroomMeals({ patient, patients = [], query, onSelect, onReview, now = new Date() }: {
  patient: Patient;
  patients?: Patient[];
  query: string;
  onSelect: (id: string) => void;
  onReview: (log: MealLog) => void;
  now?: Date;
}) {
  const rows = useMemo(() => mealDiaryRows(patient), [patient]);
  const picker = patients.length > 0 ? <label className="nvfd-picker nvfd-patient">
    <Users size={14} aria-hidden="true" /><span>{patient.name}</span>
    <select aria-label="Paciente del diario" value={patient.id} onChange={(event) => onSelect(event.target.value)}>
      {patients.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
    </select>
  </label> : null;

  return <section className="nvfd-page" aria-label={`Diario de comidas de ${patient.name}`}>
    <FoodDiaryBoard key={patient.id} rows={rows} now={now} audience="professional" query={query} defaultScope="all" patientPicker={picker}
      emptyWeekTitle="Sin registros para mostrar"
      onReview={(id) => { const log = patient.meal_logs.find((entry) => entry.id === id); if (log) onReview(log); }} />
  </section>;
}
