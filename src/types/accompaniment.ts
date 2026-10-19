import type {MealLog} from './index';

export type AccompanimentDays=30|90|365;
export type AccompanimentMetrics={
 from:string;to:string;week_from:string;
 totals:{active:number;meals:number;pending:number;adherence:number|null;completed_goals:number;retained:number;weight_decreased:number;weight_comparable:number;water_glasses:number|null};
 week:Array<{id:string;name:string;days:boolean[];recorded_days:number}>;
 wellbeing:Array<{id:string;name:string;date:string;energy:string|null;sleep_minutes:number|null;symptoms:string[]}>;
 goals:Array<{id:string;name:string;goal:string;status:string;progress:number|null}>;
 trend:Array<{from:string;to:string;registered:number;patients:number;percentage:number|null}>;
 movements:Array<{month:string;joined:number;left:number}>;
 archive_reasons:Array<{reason:string;count:number}>;
 quiet:Array<{id:string;name:string;last_day:string|null}>;
};
export type AccompanimentMealPage={logs:Array<MealLog&{patient_name:string}>;has_more:boolean;next_offset:number|null;counts:{all:number;pending_review:number;reviewed:number};source:'memory'|'supabase'};
export type AssistantSpend={month:string;used_micros:number;cap_micros:number;scope:'plans-and-own-portfolio';source:'memory'|'supabase'};
