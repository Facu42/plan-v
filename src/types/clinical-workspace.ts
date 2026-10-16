import { z } from 'zod';
export const clinicBrandSchema=z.object({name:z.string().trim().min(2).max(120),contact:z.string().trim().max(240),license:z.string().trim().max(120),logo:z.string().max(700000).nullable().refine(s=>s===null||/^data:image\/(png|jpeg);base64,[a-zA-Z0-9+/]+={0,2}$/.test(s),'Usá un logo PNG/JPG local.')}).strict();
export type ClinicBrand=z.infer<typeof clinicBrandSchema>;
