export type RecipeCoverContext = { title: string; items: Array<{ name: string }> };
export type RecipeCoverResult =
  | { status: 'ready'; bytes: Buffer; mime: 'image/png' | 'image/jpeg' | 'image/webp'; alt: string }
  | { status: 'failed' };

/** No free image provider has been verified. Manual upload remains available. */
export function recipeCoverEnabled(): boolean { return false; }
export async function generateRecipeCoverImage(_context: RecipeCoverContext): Promise<RecipeCoverResult> {
  return { status: 'failed' };
}
