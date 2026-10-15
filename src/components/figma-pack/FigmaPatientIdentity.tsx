import { createContext, useContext, type ReactNode } from 'react';
import type { ShowroomPatient } from '../nutrigo/showroom-model';

const PatientContext = createContext<ShowroomPatient | null>(null);

export function FigmaPatientIdentity({ patient, children }: { patient: ShowroomPatient; children: ReactNode }) {
  return <PatientContext.Provider value={patient}>{children}</PatientContext.Provider>;
}

export function useFigmaPatient() {
  const patient = useContext(PatientContext);
  if (patient === null) throw new Error('La pantalla Figma necesita los datos del paciente.');
  return patient;
}

export const useFigmaPatientName = () => useFigmaPatient().name;
