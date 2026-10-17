export type PortfolioIntent = 'overview' | 'missing_records' | 'pending_review' | 'hydration';
export type PortfolioIndicators = {
  generated_at:string; days:number; patient_count:number; without_records:number; pending_review:number;
  rows:Array<{patient_id:string;name:string;meal_count:number;previous_meal_count:number;pending_review:number;adherence:number|null;source_ids:string[]}>;
};
export type PortfolioAnswer = {answer:string;ai_notice?:string;proposals:Array<{patient_id:string;text:string;source_ids:string[]}>;general_proposals?:string[];sources:PortfolioIndicators['rows'];excluded_without_consent:number;mode:'local'|'ai'};
