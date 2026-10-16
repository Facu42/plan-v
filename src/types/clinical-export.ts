import type { ClinicBrand } from './clinical-workspace';
import type { ImportedHistory } from './patient-import';
import type { ImportedMeasurement } from './import-authorization';
export type ImportedClinicalExport = {
  patient: { id: string; name: string };
  imported_history: ImportedHistory[];
  imported_measurements: ImportedMeasurement[];
  brand: ClinicBrand | null;
};
