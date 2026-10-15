import {createHash} from 'node:crypto';
import type {ConsultationSummaryStep} from '../../src/types/consultations.js';
export const clinicalTextDigest=(text:string)=>createHash('sha256').update(text).digest('hex');
/** Split at code points: never cut a UTF-8 sequence or silently omit the tail. */
export function clinicalTextParts(text:string,maxBytes=60000):string[]{
  const result:string[]=[];let part='',bytes=0;
  for(const char of text){const size=Buffer.byteLength(char);if(bytes+size>maxBytes){result.push(part);part='';bytes=0;}part+=char;bytes+=size;}
  if(part)result.push(part);return result;
}
export async function hierarchicalConsultationSummary(input:{text:string;requestKey:string;steps:ConsultationSummaryStep[];summarize:(text:string,key:string,mode:'part'|'final')=>Promise<string>;save:(step:ConsultationSummaryStep)=>Promise<void>}):Promise<string>{
  if(Buffer.byteLength(input.text)>1048576)throw new Error('La transcripción supera 1 MB. Conservá los originales y dividí la consulta.');
  let text=input.text,level=0;
  while(Buffer.byteLength(text)>60000){
    if(level>=8)throw new Error('No se pudo reducir la consulta de forma verificable. Conservamos las etapas.');
    const outputs:string[]=[];
    for(const [index,part]of clinicalTextParts(text).entries()){
      const digest=clinicalTextDigest(part),old=input.steps.find(s=>s.level===level&&s.index===index);
      if(old&&old.digest!==digest)throw new Error('Los datos de una etapa cambiaron.');
      let output=old?.text;
      if(!output){output=await input.summarize(part,`${input.requestKey}:${level}:${index}:${digest.slice(0,16)}`,'part');if(!output.trim()||Buffer.byteLength(output)>8000)throw new Error('El resumen parcial no es válido.');const step={level,index,digest,text:output};await input.save(step);input.steps.push(step);}
      outputs.push(output);
    }
    const next=outputs.map((part,i)=>`Fragmento ${i+1} de ${outputs.length}:\n${part}`).join('\n\n');
    if(Buffer.byteLength(next)>=Buffer.byteLength(text))throw new Error('La etapa no redujo el texto. Conservamos los resultados para revisión.');
    text=next;level++;
  }
  return input.summarize(text,input.requestKey,'final');
}
