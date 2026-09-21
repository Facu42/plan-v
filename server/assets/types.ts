export const ASSET_CATEGORIES = ['meal_photo', 'clinical_document', 'body_progress', 'chat_attachment'] as const;
export type AssetCategory = (typeof ASSET_CATEGORIES)[number];

export const ASSET_STATUSES = ['reserved', 'quarantine', 'ready', 'rejected', 'withdrawn'] as const;
export type AssetStatus = (typeof ASSET_STATUSES)[number];

export const READY_BUCKETS = {
  meal_photo: 'meal-photos',
  body_progress: 'care-photos',
  clinical_document: 'care-documents',
  chat_attachment: 'care-documents',
} as const;

export const QUARANTINE_BUCKET = 'care-quarantine';
export const PRODUCT_BUCKETS = ['meal-photos', 'care-photos', 'care-documents', 'care-quarantine'] as const;

export const CONSENT_BY_CATEGORY = {
  meal_photo: 'meal_photo',
  body_progress: 'body_progress',
  clinical_document: 'clinical_document',
} as const;

export const MIME_BY_CATEGORY = {
  meal_photo: ['image/jpeg', 'image/png', 'image/webp'],
  body_progress: ['image/jpeg', 'image/png', 'image/webp'],
  clinical_document: ['application/pdf', 'image/jpeg', 'image/png'],
  chat_attachment: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
} as const;

export const BYTE_LIMIT_BY_CATEGORY = {
  meal_photo: 10 * 1024 * 1024,
  body_progress: 5 * 1024 * 1024,
  clinical_document: 20 * 1024 * 1024,
  chat_attachment: 10 * 1024 * 1024,
} as const;

export const PATIENT_QUOTA = {
  maxReadyBytes: 200 * 1024 * 1024,
  maxReadyFiles: 80,
  maxOpenIntents: 8,
  intentTtlMs: 15 * 60 * 1000,
  signedUrlSeconds: 60,
  maxPixels: 4096 * 4096,
  maxPdfPages: 40,
};

export type PrivateAsset = {
  id: string;
  patient_id: string;
  nutritionist_id: string;
  category: AssetCategory;
  bucket: string;
  object_path: string;
  mime: string;
  byte_size: number;
  checksum_sha256: string;
  status: AssetStatus;
  uploaded_by: string | null;
  created_at: string;
  withdrawn_at: string | null;
};

export type UploadIntent = {
  id: string;
  patient_id: string;
  nutritionist_id: string;
  category: AssetCategory;
  object_path: string;
  mime_declared: string;
  byte_limit: number;
  status: AssetStatus;
  asset_id: string | null;
  created_at: string;
  expires_at: string;
};

export type InspectedFile = {
  bytes: Buffer;
  mime: 'image/jpeg' | 'image/png' | 'image/webp' | 'application/pdf';
  checksum: string;
  width?: number;
  height?: number;
  pages?: number;
};
