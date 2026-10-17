import { beforeAll,describe,expect,it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { PDFDocument } from 'pdf-lib';
import { buildClinicalPdf } from './clinical-pdf';
beforeAll(()=>{execFileSync(process.execPath,['scripts/prepare-clinical-pdf.mjs'],{stdio:'pipe'});});
describe('PDF clínico descargable',()=>{
  it('produce un PDF real, paginado, con datos españoles y gráfica',async()=>{
    const fontBytes=await readFile(new URL('../../public/clinical-pdf/Poppins-Regular.ttf',import.meta.url));
    const bytes=await buildClinicalPdf({title:'Ficha clínica',patientName:'Paciente ficticia',brand:{name:'Consultorio ficticio',contact:'Contacto del consultorio',license:'Declarada',logo:null},fontBytes,sections:[{title:'Evolución',lines:Array.from({length:80},(_,i)=>`Medición ${i+1}: sólo datos ficticios; hemoglobina y evolución.`)}],charts:[{title:'Peso',unit:'kg',points:[{date:'2026-09-01',value:70},{date:'2026-10-01',value:68}]}]});
    expect(new TextDecoder().decode(bytes.slice(0,5))).toBe('%PDF-');const pdf=await PDFDocument.load(bytes);expect(pdf.getPageCount()).toBeGreaterThan(1);expect(pdf.getTitle()).toBe('Ficha clínica');
  });
});
