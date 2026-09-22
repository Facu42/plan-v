import { z } from 'zod';

export const EXERCISE_CATEGORIES = ['movilidad', 'fuerza', 'cardio', 'equilibrio', 'otro'] as const;
export type ExerciseCategory = (typeof EXERCISE_CATEGORIES)[number];
export const EXERCISE_CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  movilidad: 'Movilidad',
  fuerza: 'Fuerza',
  cardio: 'Cardio',
  equilibrio: 'Equilibrio',
  otro: 'Otro',
};

export const EXERCISE_INTENSITIES = ['suave', 'moderada', 'intensa'] as const;
export type ExerciseIntensity = (typeof EXERCISE_INTENSITIES)[number];

export const SEEDED_EXERCISES = [
  {
    id: '11111111-1111-4111-a111-000000000001',
    slug: 'movilidad-cadera',
    name: 'Movilidad de cadera',
    description: 'Círculos lentos de cadera, sin forzar el rango.',
    category: 'movilidad' as const,
    default_sets: 2,
    default_reps: 8,
    default_rest_seconds: 30,
  },
  {
    id: '11111111-1111-4111-a111-000000000002',
    slug: 'sentadilla-aire',
    name: 'Sentadilla al aire',
    description: 'Bajada controlada con talones apoyados. No es una orden médica.',
    category: 'fuerza' as const,
    default_sets: 3,
    default_reps: 10,
    default_rest_seconds: 60,
  },
  {
    id: '11111111-1111-4111-a111-000000000003',
    slug: 'puente-gluteos',
    name: 'Puente de glúteos',
    description: 'Elevación de cadera con pausa breve arriba.',
    category: 'fuerza' as const,
    default_sets: 3,
    default_reps: 8,
    default_rest_seconds: 45,
  },
  {
    id: '11111111-1111-4111-a111-000000000004',
    slug: 'caminata',
    name: 'Caminata',
    description: 'Caminata continua a ritmo cómodo. La duración la declara la paciente.',
    category: 'cardio' as const,
    default_sets: 1,
    default_reps: 1,
    default_rest_seconds: 0,
  },
  {
    id: '11111111-1111-4111-a111-000000000005',
    slug: 'equilibrio-unipodal',
    name: 'Equilibrio unipodal',
    description: 'Apoyo en un pie junto a un apoyo estable.',
    category: 'equilibrio' as const,
    default_sets: 2,
    default_reps: 6,
    default_rest_seconds: 30,
  },
  {
    id: '11111111-1111-4111-a111-000000000006',
    slug: 'estiramiento-posterior',
    name: 'Estiramiento posterior',
    description: 'Estiramiento suave de cadena posterior, sin rebotes.',
    category: 'movilidad' as const,
    default_sets: 2,
    default_reps: 8,
    default_rest_seconds: 20,
  },
] as const;

export const exerciseItemSchema = z.object({
  exercise_id: z.uuid(),
  sets: z.number().int().min(1).max(20),
  reps: z.number().int().min(1).max(200),
  rest_seconds: z.number().int().min(0).max(600),
  note: z.string().trim().max(200).optional(),
  sort: z.number().int().min(0).max(40).optional(),
}).strict();

export const assignRoutineSchema = z.object({
  title: z.string().trim().min(2).max(80),
  items: z.array(exerciseItemSchema).min(1).max(12),
}).strict();

export const routineFeedbackSchema = z.object({
  sets_completed: z.number().int().min(0).max(20),
  reps_completed: z.number().int().min(0).max(200),
  note: z.string().trim().max(500).optional(),
}).strict();

export const activityLogInputSchema = z.object({
  activity: z.string().trim().min(2).max(80),
  duration_minutes: z.number().int().min(1).max(600),
  intensity: z.enum(EXERCISE_INTENSITIES),
  note: z.string().trim().max(500).optional(),
  assignment_id: z.uuid().optional(),
  sets: z.number().int().min(1).max(20).optional(),
  reps: z.number().int().min(1).max(200).optional(),
}).strict();

export type ExerciseLibraryItem = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: ExerciseCategory;
  default_sets: number;
  default_reps: number;
  default_rest_seconds: number;
};

export type RoutineItemView = {
  id: string;
  exercise_id: string;
  name: string;
  category: ExerciseCategory;
  sets: number;
  reps: number;
  rest_seconds: number;
  note: string | null;
  sort: number;
};

export type RoutineAssignmentView = {
  id: string;
  patient_id: string;
  title: string;
  status: 'active' | 'paused' | 'completed';
  assigned_at: string;
  items: RoutineItemView[];
  feedback: { sets_completed: number; reps_completed: number; note: string | null; recorded_at: string } | null;
};

export type ActivityLogView = {
  id: string;
  patient_id: string;
  activity: string;
  duration_minutes: number;
  intensity: ExerciseIntensity;
  note: string | null;
  logged_at: string;
  assignment_id: string | null;
  sets: number | null;
  reps: number | null;
};

export type PatientExerciseView = {
  patient_id: string;
  can_assign: boolean;
  habilitation_verified: boolean;
  library: ExerciseLibraryItem[];
  assignments: RoutineAssignmentView[];
  activities: ActivityLogView[];
};
