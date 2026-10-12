import { request } from './client';
import type { Food, FoodInput } from '../types/foods';
export type FoodSearchPage={foods:Food[];total:number;page:number;page_size:number;summary?:{total:number;own:number;platform:number;supplements:number;foods:number};sources?:string[];categories?:string[]};
export const foodApi = {
  search:(filters:{q?:string;kind?:'food'|'supplement';scope?:'all'|'own'|'platform';source?:string;category?:string;order?:'name-asc'|'name-desc'|'kcal-asc'|'kcal-desc';page?:number;page_size?:number},signal?:AbortSignal)=>request<FoodSearchPage>(`/api/foods/search?${new URLSearchParams(Object.entries(filters).filter(([,value])=>value!==undefined).map(([key,value])=>[key,String(value)]))}`,{signal}),
  list: (signal?: AbortSignal) => request<{ foods: Food[]; total: number; source: string }>('/api/foods', { signal }),
  save: (food: FoodInput) => request<{ food: Food; source: string }>('/api/foods', { method: 'POST', body: JSON.stringify(food) }),
};
