import type { MealLog } from '../../src/types/index.js';
import { getRequestDb } from '../db/supabase-client.js';
import { parseDataUrl } from '../assets/inspect.js';
import { ingestReadyAsset } from '../assets/repository.js';
import { DEMO_NUTRITIONIST_ID } from '../store.js';
import * as sb from '../db/supabase-repo.js';

export async function uploadMealPhoto(patientId:string,dataUrl:string) {
  parseDataUrl(dataUrl);
  const resource = await sb.sbGetPatientResource(patientId);
  const asset = await ingestReadyAsset({
    patientId,
    nutritionistId: resource?.nutritionistId ?? DEMO_NUTRITIONIST_ID,
    category: 'meal_photo',
    dataUrl,
    persistent: true,
  });
  return asset.object_path;
}
export async function signMealPhotos(patientId:string,logs:MealLog[]) {
  const prefix=`patients/${patientId}/`;
  const paths=logs.flatMap(log=>log.photo_url?.startsWith(prefix)?[log.photo_url]:[]);
  if(!paths.length)return logs;
  const {data,error}=await getRequestDb().storage.from('meal-photos').createSignedUrls(paths,60);
  const urls=new Map((error?[]:data??[]).map(item=>[item.path,item.signedUrl]));
  return logs.map(log=>({...log,photo_url:log.photo_url?urls.get(log.photo_url)||null:null}));
}
