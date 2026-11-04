export type ResendPage<T> = { data: T[]; has_more: boolean; next: string | null };
export type CampaignContact = { id: string; email: string; first_name: string; last_name: string; unsubscribed: boolean };
export type CampaignBroadcast = { id: string; name?: string; subject?: string; status: string; sent_at?: string | null; created_at?: string; opened?: number; html?: string; text?: string; from?: string; reply_to?: string[]; audience_id?: string | null; segment_id?: string | null };
/** Solo metadatos operativos: nunca contenido del aviso ni adjuntos clínicos. */
export type TransactionalMail = { id: string; from: string; created_at: string; last_event: string };
export type CampaignConfig = { campaigns_ready: boolean; mail_ready: boolean; from: string; reply_to: string };
export type CampaignDraft = { name: string; subject: string; html: string };
export type CampaignImport = { imported: number; failed_row: number | null; message?: string };
