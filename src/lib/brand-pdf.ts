export const DEFAULT_BRAND_INK = '#272832';
export const DEFAULT_BRAND_ACCENT = '#C2E66E';

export function brandHex(value: string | null | undefined, fallback: string): string {
  return value && /^#[0-9A-Fa-f]{6}$/.test(value) ? value : fallback;
}

export function hexToRgb01(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export async function embedBrandLogo<T extends { embedPng: (src: string) => Promise<unknown>; embedJpg: (src: string) => Promise<unknown> }>(
  document: T,
  logo: string | null | undefined,
): Promise<Awaited<ReturnType<T['embedPng']>> | null> {
  if (!logo) return null;
  try {
    if (logo.startsWith('data:image/png')) return await document.embedPng(logo) as Awaited<ReturnType<T['embedPng']>>;
    if (logo.startsWith('data:image/jpeg') || logo.startsWith('data:image/jpg')) return await document.embedJpg(logo) as Awaited<ReturnType<T['embedPng']>>;
  } catch {
    return null;
  }
  return null;
}
