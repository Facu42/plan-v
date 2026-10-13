import {describe,expect,it} from 'vitest';
import {clinicalTextParts,hierarchicalConsultationSummary} from './summary.js';
describe('resumen íntegro por bytes UTF-8',()=>{
 it('conserva cada carácter y mantiene el límite aun con emojis y español',()=>{
  const text='á🟢 ñ información ficticia\n'.repeat(10000);const parts=clinicalTextParts(text);expect(parts.join('')).toBe(text);expect(parts.every(part=>Buffer.byteLength(part)<=60000)).toBe(true);expect(parts.some(part=>part.includes('\ufffd'))).toBe(false);
 });
 it('no recorta una transcripción que supera el máximo',async()=>{await expect(hierarchicalConsultationSummary({text:'á'.repeat(524289),requestKey:'fake',steps:[],summarize:async()=>'',save:async()=>{}})).rejects.toThrow('1 MB');});
});
