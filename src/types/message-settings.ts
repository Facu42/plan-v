import {z} from 'zod';
export const savedReplySchema=z.object({id:z.uuid(),title:z.string().trim().min(1).max(100),body:z.string().trim().min(1).max(2000)}).strict();
const contents={replies:z.array(savedReplySchema).max(50).refine(replies=>new Set(replies.map(r=>r.id)).size===replies.length),starred_patient_ids:z.array(z.string().min(1).max(100)).max(500).refine(ids=>new Set(ids).size===ids.length)};
export const messageSettingsSchema=z.object({revision:z.uuid().nullable(),...contents}).strict();
export const saveMessageSettingsSchema=z.object({expected_revision:z.uuid().nullable(),...contents}).strict();
export type SavedReply=z.infer<typeof savedReplySchema>;
export type MessageSettings=z.infer<typeof messageSettingsSchema>;
export type SaveMessageSettings=z.infer<typeof saveMessageSettingsSchema>;
