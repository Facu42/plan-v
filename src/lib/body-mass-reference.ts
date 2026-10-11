/** CDC: referencias generales para adultos de 20 años o más, no metas de tratamiento. */
export function bodyMassReference(weightKg: number, heightCm: number, age: number) {
  if (![weightKg, heightCm, age].every(Number.isFinite) || weightKg <= 0 || heightCm <= 0 || age <= 0) return null;
  const squaredHeight = (heightCm / 100) ** 2;
  const bmi = weightKg / squaredHeight;
  if (!Number.isFinite(bmi)) return null;
  const adult = age >= 20;
  const category = !adult ? null : bmi < 18.5 ? 'Por debajo del rango' : bmi < 25 ? 'En rango de referencia' : bmi < 30 ? 'Por encima del rango' : 'IMC elevado';
  return { bmi, category, weightMin: adult ? 18.5 * squaredHeight : null, weightUpperExclusive: adult ? 25 * squaredHeight : null };
}
