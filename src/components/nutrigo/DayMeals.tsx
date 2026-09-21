import { useEffect, useState } from 'react';
import { recipesApi } from '../../api/recipes';
import { careErrorMessage } from '../../api/care';
import type { RecipeDayAssignment } from '../../types/recipe-plate';
import { NvButton } from './primitives';
import { RecipePlateCard } from './RecipePlate';

export function DayAssignedMealsView({
  assignments,
  error = '',
  busy = false,
  onRegister,
}: {
  assignments: RecipeDayAssignment[];
  error?: string;
  busy?: boolean;
  onRegister?: (assignment: RecipeDayAssignment) => void;
}) {
  if (!assignments.length && !error) return null;
  return <section className="assigned-day-meals" aria-label="Comidas del día">
    <header>
      <span>COMIDAS DEL DÍA</span>
      <h2>Así te lo dejó tu nutricionista</h2>
    </header>
    {error && <p className="recipe-error" role="alert">{error}</p>}
    <div className="recipe-grid">
      {assignments.map((assignment) => <RecipePlateCard
        key={assignment.id}
        title={assignment.title}
        portions={assignment.yield_portions}
        card={assignment.card}
        ingredients={assignment.ingredients}
        actions={assignment.registered_meal_id
          ? <p role="status">Ya registraste esta comida.</p>
          : <NvButton disabled={busy} onClick={() => onRegister?.(assignment)}>Registrar esta comida</NvButton>}
      />)}
    </div>
  </section>;
}

export function DayAssignedMeals({ patientId, date }: { patientId: string; date?: string }) {
  const [assignments, setAssignments] = useState<RecipeDayAssignment[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function reload(signal?: AbortSignal) {
    const result = await recipesApi.days(patientId, date, signal);
    setAssignments(result.assignments);
  }

  useEffect(() => {
    const controller = new AbortController();
    reload(controller.signal).catch((caught) => {
      if (caught instanceof DOMException && caught.name === 'AbortError') return;
      setError(careErrorMessage(caught));
    });
    return () => controller.abort();
  }, [patientId, date]);

  return <DayAssignedMealsView
    assignments={assignments}
    error={error}
    busy={busy}
    onRegister={(assignment) => {
      setBusy(true);
      setError('');
      void recipesApi.registerDay(patientId, assignment.id, crypto.randomUUID())
        .then(() => reload())
        .catch((caught) => setError(careErrorMessage(caught)))
        .finally(() => setBusy(false));
    }}
  />;
}
