import { randomUUID } from 'node:crypto';
import type { MealLog } from '../../src/types/index.js';
import { getRequestDb } from '../db/supabase-client.js';
import { CareError, validatePhoto } from './repository.js';

export async function uploadMealPhoto(patientId:string,dataUrl:string) {
  const {bytes,mime}=validatePhoto(dataUrl);
  const path=`patients/${patientId}/${randomUUID()}`;
  const {error}=await getRequestDb().storage.from('meal-photos').upload(path,bytes,{contentType:mime,upsert:false});
  if(error)throw new CareError(503,'No se pudo guardar la foto de comida.');
  return path;
}
export async function signMealPhotos(patientId:string,logs:MealLog[]) {
  const prefix=`patients/${patientId}/`;
  const paths=logs.flatMap(log=>log.photo_url?.startsWith(prefix)?[log.photo_url]:[]);
  if(!paths.length)return logs;
  const {data,error}=await getRequestDb().storage.from('meal-photos').createSignedUrls(paths,60);
  const urls=new Map((error?[]:data??[]).map(item=>[item.path,item.signedUrl]));
  return logs.map(log=>({...log,photo_url:log.photo_url?urls.get(log.photo_url)||null:null}));
}
