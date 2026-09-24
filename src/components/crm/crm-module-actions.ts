export type ModulePatientAction = {
  label: string;
  target: 'record' | 'appointments';
};

export function resolveModulePatientAction(module: string, hasAppointment: boolean): ModulePatientAction {
  if (module === 'agenda' || module === 'videollamadas') {
    return {
      label: hasAppointment ? 'Gestionar turno' : 'Agendar turno',
      target: 'appointments',
    };
  }
  return { label: 'Abrir ficha', target: 'record' };
}
