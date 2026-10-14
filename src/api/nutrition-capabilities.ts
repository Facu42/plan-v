import { request } from './client';
import type { ExchangeGroup,ExchangeInput,NutritionSettings,NutritionSettingsView } from '../types/nutrition-capabilities';
import type { Food,FoodInput } from '../types/foods';
export type ExternalFoodPage={foods:Array<{fdc_id:number;name:string;data_type:string}>;total:number;page:number;page_size:number;source:string;license:string};
export const nutritionCapabilityApi={
  settings:(signal?:AbortSignal)=>request<NutritionSettingsView>('/api/nutrition/settings',{signal}),
  saveSettings:(settings:NutritionSettings,expected_revision:number)=>request<NutritionSettingsView>('/api/nutrition/settings',{method:'PUT',body:JSON.stringify({settings,expected_revision})}),
  exchanges:(signal?:AbortSignal)=>request<{groups:ExchangeGroup[]}>('/api/nutrition/exchanges',{signal}),
  saveExchange:(input:ExchangeInput)=>request<{group:ExchangeGroup}>('/api/nutrition/exchanges',{method:'POST',body:JSON.stringify(input)}),
  external:(q:string,page=1,signal?:AbortSignal)=>request<ExternalFoodPage>(`/api/nutrition/external-foods?${new URLSearchParams({q,page:String(page)})}`,{signal}),
  externalDetail:(id:number,signal?:AbortSignal)=>request<{food:FoodInput}>(`/api/nutrition/external-foods/${id}`,{signal}),
  importExternal:(fdc_id:number,expected_snapshot:FoodInput)=>request<{food:Food}>('/api/nutrition/external-foods',{method:'POST',body:JSON.stringify({fdc_id,expected_snapshot,reviewed:true})}),
};
