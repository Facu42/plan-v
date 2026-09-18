export const ASSET_CATEGORIES = ['meal_photo', 'clinical_document', 'body_progress'] as const;
export type AssetCategory = (typeof ASSET_CATEGORIES)[number];

export type PatientAssetView = {
  id: string;
  category: AssetCategory;
  mime: string | null;
  byte_size: number;
  created_at: string;
};
