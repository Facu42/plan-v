export function dateLabel(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    if (date.toISOString().slice(0, 10) !== value) return value;
    return date.toLocaleDateString('es-AR', { timeZone: 'UTC' });
  }
  // Marca de tiempo: el día es el de Argentina, no el del dispositivo.
  return date.toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });
}
