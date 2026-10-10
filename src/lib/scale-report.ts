import { isMetricKind, metricDefinition, parseMetricValue, type MetricKind } from './body-metrics';
import type { Measurement } from '../types/care';

/**
 * Lee el texto de un informe de balanza (por ejemplo InBody o femmto) y propone mediciones para revisar.
 * Reconoce rótulos en español e inglés. No promete leer cualquier marca: lo que no reconoce se carga a mano.
 */
export type ScaleLineStatus = 'ready' | 'duplicate' | 'invalid';
export interface ScaleCandidate {
  kind: MetricKind;
  value: number;
  /** Texto del renglón de donde salió, para que la profesional lo compare. */
  source: string;
  status: ScaleLineStatus;
  /** Por qué no se puede guardar, o aviso de duplicado. */
  note: string | null;
}
export interface ScaleReading { date: string | null; candidates: ScaleCandidate[] }

interface Alias { words: string[]; kinds: Partial<Record<string, MetricKind>> }
// Cada rótulo admite una o dos métricas según la unidad que lo acompaña (% o kg).
const ALIASES: Alias[] = [
  { words: ['masa muscular esqueletica', 'skeletal muscle mass', 'masa muscular', 'muscle mass', 'musculo', 'muscle'], kinds: { kg: 'muscle_mass', '%': 'muscle_pct' } },
  { words: ['masa grasa corporal', 'body fat mass', 'masa grasa', 'fat mass'], kinds: { kg: 'fat_mass' } },
  { words: ['porcentaje de grasa corporal', 'porcentaje de grasa', 'percent body fat', 'body fat', 'grasa corporal', '% grasa', 'pbf'], kinds: { '%': 'body_fat_pct', kg: 'fat_mass' } },
  { words: ['grasa visceral', 'visceral fat'], kinds: { nivel: 'visceral_fat', '': 'visceral_fat' } },
  { words: ['agua corporal total', 'total body water', 'agua corporal', 'body water', '% agua'], kinds: { '%': 'body_water_pct' } },
  { words: ['proteina', 'protein'], kinds: { kg: 'protein_mass' } },
  { words: ['metabolismo basal', 'basal metabolic rate', 'tmb', 'bmr'], kinds: { kcal: 'bmr', '': 'bmr' } },
  { words: ['edad metabolica', 'metabolic age'], kinds: { anos: 'metabolic_age', '': 'metabolic_age', years: 'metabolic_age' } },
  { words: ['estatura', 'altura', 'height'], kinds: { cm: 'height', '': 'height' } },
  { words: ['peso corporal', 'peso', 'weight'], kinds: { kg: 'weight' } },
];

const normalize = (text: string) => text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ñ/g, 'n');
const NUMBER_AFTER = /(-?\d{1,4}(?:[.,]\d{1,2})?)\s*(%|kg|kcal|cm|lbs?|nivel|level|anos|years)?/;

function readDate(text: string): string | null {
  for (const match of text.matchAll(/\b(\d{4})[-/](\d{1,2})[-/](\d{1,2})\b|\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})\b/g)) {
    const [year, month, day] = match[1] ? [match[1], match[2], match[3]] : [match[6], match[5], match[4]];
    const iso = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    const parsed = new Date(`${iso}T12:00:00Z`);
    if (!Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(iso)) return iso;
  }
  return null;
}

export function parseScaleReport(text: string, existing: readonly Pick<Measurement, 'kind' | 'value_numeric' | 'captured_on'>[] = [], today?: string): ScaleReading {
  const date = readDate(text);
  const candidates: ScaleCandidate[] = [];
  const seen = new Set<MetricKind>();
  for (const rawLine of text.split(/\r?\n/)) {
    const line = normalize(rawLine).replace(/\s+/g, ' ').trim();
    if (!line) continue;
    for (const alias of ALIASES) {
      const word = alias.words.find((candidate) => line.includes(candidate));
      if (!word) continue;
      const rest = line.slice(line.indexOf(word) + word.length);
      const found = NUMBER_AFTER.exec(rest);
      if (!found) break;
      const unit = found[2] ?? '';
      const normalizedUnit = unit === 'level' ? 'nivel' : unit;
      const kind = alias.kinds[normalizedUnit];
      const source = rawLine.trim().slice(0, 120);
      if (!kind) {
        // La unidad no es la del catálogo (por ejemplo libras): se muestra para que no pase inadvertido.
        const guess = Object.values(alias.kinds)[0];
        if (guess && !seen.has(guess)) { seen.add(guess); candidates.push({ kind: guess, value: Number(found[1].replace(',', '.')), source, status: 'invalid', note: `Unidad ${unit} no admitida: cargala a mano en ${metricDefinition(guess).unit}.` }); }
        break;
      }
      if (seen.has(kind)) break;
      seen.add(kind);
      const parsed = parseMetricValue(kind, found[1]);
      const value = Number(found[1].replace(',', '.'));
      if (!parsed.ok || parsed.empty) candidates.push({ kind, value, source, status: 'invalid', note: parsed.ok ? 'Sin valor.' : parsed.message });
      else {
        const duplicate = date !== null && existing.some((row) => row.kind === kind && row.captured_on === date && row.value_numeric === parsed.value);
        candidates.push({ kind, value: parsed.value, source, status: duplicate ? 'duplicate' : 'ready', note: duplicate ? 'Ya está cargada con esa fecha.' : null });
      }
      break;
    }
  }
  const futureDate = date !== null && today !== undefined && date > today;
  return { date: futureDate ? null : date, candidates: candidates.filter((candidate) => isMetricKind(candidate.kind)) };
}
