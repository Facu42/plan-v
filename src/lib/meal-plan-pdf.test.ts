import { beforeAll,describe,expect,it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { PDFDocument } from 'pdf-lib';
import { buildPlanPdf,planPdfLines } from './meal-plan-pdf';
import type { PlanPrintCopy } from '../components/nutrigo/PlanPrintDocument';
const copy={patientName:'Paciente ficticia',professionalName:'Profesional',demo:true,brand:{name:'Consultorio',contact:'Contacto',logo:''},version:{id:'v1',version:3,period_start:'2026-10-12',period_end:'2026-10-12',published_at:null,meal_labels:{Desayuno:'Primera comida'},items:[{id:'i',for_date:'2026-10-12',slot:'Desayuno',free_text:'Avena <script>literal</script> & fruta',public_note:'Indicación revisada'}]}} as PlanPrintCopy;
beforeAll(()=>execFileSync(process.execPath,['scripts/prepare-clinical-pdf.mjs'],{stdio:'pipe'}));
describe('descarga del plan como PDF local',()=>{
  it('conserva copia, versión, cantidades y textos escapados sin CSS ni código de la vista',()=>{
    const lines=planPdfLines(copy).join('\n');
    expect(lines).toContain('BORRADOR GUARDADO');expect(lines).toContain('v3');expect(lines).toContain('Primera comida');
    expect(lines).toContain('Avena <script>literal</script> & fruta');expect(lines).not.toContain('@page');expect(lines).not.toContain('&lt;');
  });
  it('fuerza un salto por semana en el PDF real',async()=>{
    const fontBytes=await readFile(new URL('../../public/clinical-pdf/Inter-Regular.ttf',import.meta.url));
    const longCopy={...copy,version:{...copy.version,period_end:'2026-10-20'}};
    const options={logo:false,caseras:false,compras:false,recetas:false,hoja:true};
    const on=await PDFDocument.load(await buildPlanPdf({...longCopy,options},{fontBytes}));
    const off=await PDFDocument.load(await buildPlanPdf({...longCopy,options:{...options,hoja:false}},{fontBytes}));
    expect(on.getPageCount()).toBeGreaterThanOrEqual(2);
    expect(off.getPageCount()).toBeGreaterThan(0);
    expect(planPdfLines({...longCopy,options})).toContain('__WEEK_BREAK__');
    expect(planPdfLines({...longCopy,options:{...options,hoja:false}})).not.toContain('__WEEK_BREAK__');
    const {getDocument}=await import('pdfjs-dist/legacy/build/pdf.mjs');
    const parsed=await getDocument({data:await on.save(),useSystemFonts:true}).promise;
    const text=await (await parsed.getPage(2)).getTextContent();
    expect(text.items.map(item=>'str' in item?item.str:'').join(' ')).toContain('19/10/2026');
    await parsed.destroy();
  });
  it('genera bytes PDF reales sin diálogo de impresión y no modifica la copia',async()=>{
    const original=JSON.stringify(copy);
    const fontBytes=await readFile(new URL('../../public/clinical-pdf/Inter-Regular.ttf',import.meta.url));
    const bytes=await buildPlanPdf(copy,{fontBytes});
    expect(new TextDecoder().decode(bytes.slice(0,5))).toBe('%PDF-');
    const pdf=await PDFDocument.load(bytes);expect(pdf.getPageCount()).toBeGreaterThan(0);expect(pdf.getTitle()).toContain('v3');expect(JSON.stringify(copy)).toBe(original);
  });
});
