type PatientPage<T> = { patients: T[]; page: { has_more: boolean } };

/** El callback conserva el JWT y el consultorio; no se usa la clave de servicio para listar. */
export async function collectPatientPages<T>(load: (offset: number, limit: number) => Promise<PatientPage<T>>): Promise<T[]> {
  const patients: T[] = [];
  const limit = 100;
  for (let offset = 0; ; offset += limit) {
    const result = await load(offset, limit);
    if (result.page.has_more && result.patients.length === 0) throw new Error('La cartera no se pudo cargar completa.');
    patients.push(...result.patients);
    if (!result.page.has_more) return patients;
  }
}
