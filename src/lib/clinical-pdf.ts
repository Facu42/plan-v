import type { ClinicBrand } from '../types/clinical-workspace';
export type PdfSection={title:string;lines:string[]};
export type PdfChart={title:string;unit:string;points:{date:string;value:number}[]};
export async function buildClinicalPdf(input:{title:string;patientName:string;brand:ClinicBrand;sections:PdfSection[];charts?:PdfChart[];privateNotes?:boolean;fontBytes?:Uint8Array}){
  const [{PDFDocument,rgb},{default:fontkit}]=await Promise.all([import('pdf-lib'),import('@pdf-lib/fontkit')]);
  const document=await PDFDocument.create();document.registerFontkit(fontkit);
  const fontBytes=input.fontBytes??new Uint8Array(await(await fetch('/clinical-pdf/Poppins-Regular.ttf')).arrayBuffer());
  const font=await document.embedFont(fontBytes,{subset:true});
  document.setTitle(input.title);document.setAuthor(input.brand.name);document.setSubject(input.privateNotes?'Ficha del consultorio con notas privadas':'Documento revisado por la profesional');
  let logo:Awaited<ReturnType<typeof document.embedPng>>|null=null;
  if(input.brand.logo)logo=input.brand.logo.startsWith('data:image/png')?await document.embedPng(input.brand.logo):await document.embedJpg(input.brand.logo);
  const ink=rgb(39/255,41/255,50/255),line=rgb(225/255,225/255,226/255),green=rgb(194/255,230/255,110/255);let page=document.addPage([595.28,841.89]);let y=760;
  const addPage=()=>{page=document.addPage([595.28,841.89]);y=790;};
  const write=(text:string,size=10,width=510)=>{
    const normalized=String(text).replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g,'');
    for(const paragraph of normalized.split('\n')){
      const words=paragraph.split(/\s+/);let current='';
      const flush=()=>{if(y<65)addPage();page.drawText(current,{x:42,y,size,font,color:ink});y-=size*1.6;current='';};
      for(const word of words){if(font.widthOfTextAtSize(word,size)>width){if(current)flush();for(const char of word){if(font.widthOfTextAtSize(current+char,size)>width)flush();current+=char;}continue;}const next=current?`${current} ${word}`:word;if(font.widthOfTextAtSize(next,size)>width){flush();current=word;}else current=next;}flush();
    }
  };
  if(logo){const scale=Math.min(72/logo.width,48/logo.height);page.drawImage(logo,{x:480,y:775,width:logo.width*scale,height:logo.height*scale});}
  y=798;write(input.brand.name,16,400);y=Math.min(y,760);write(input.brand.contact,9);if(input.brand.license)write(`Matrícula: ${input.brand.license}`,9);
  y-=8;write(input.title,16);write(`Paciente: ${input.patientName}`,12);write(`Preparado el ${new Intl.DateTimeFormat('es-AR',{timeZone:'America/Argentina/Buenos_Aires'}).format(new Date())}`,9);
  if(input.privateNotes)write('Uso del consultorio: contiene notas privadas.',10);
  for(const chart of input.charts??[]){
    if(!chart.points.length)continue;if(y<220)addPage();y-=18;write(`${chart.title} (${chart.unit})`,12);
    const points=chart.points.filter(p=>Number.isFinite(p.value)).sort((a,b)=>a.date.localeCompare(b.date));if(!points.length)continue;
    const min=Math.min(...points.map(p=>p.value)),max=Math.max(...points.map(p=>p.value));const top=y,bottom=y-90;
    page.drawLine({start:{x:60,y:bottom},end:{x:540,y:bottom},color:line,thickness:1});
    const scaled=points.map((p,i)=>({x:60+(points.length===1?240:i/(points.length-1)*480),y:bottom+(max===min?45:(p.value-min)/(max-min)*80)}));
    scaled.forEach((p,i)=>{if(i)page.drawLine({start:scaled[i-1],end:p,color:ink,thickness:1.5});page.drawCircle({x:p.x,y:p.y,size:3,color:green,borderColor:ink,borderWidth:0.8});});
    page.drawText(`${max.toLocaleString('es-AR')} ${chart.unit}`,{x:42,y:top+2,size:8,font,color:ink});page.drawText(`${min.toLocaleString('es-AR')} ${chart.unit}`,{x:42,y:bottom-14,size:8,font,color:ink});
    y=bottom-28;write(`${points[0].date} — ${points[points.length-1].date}`,8);y-=8;
  }
  for(const section of input.sections){y-=12;write(section.title,12);for(const value of section.lines)write(value);}
  for(const [index,p]of document.getPages().entries()){
    const footer=`${input.brand.name} · ${index+1} / ${document.getPageCount()}`;
    const size=Math.min(8,510/Math.max(1,font.widthOfTextAtSize(footer,1)));
    p.drawText(footer,{x:42,y:30,size,font,color:ink});
  }
  return document.save();
}
export function downloadClinicalPdf(bytes:Uint8Array,filename:string){const blob=new Blob([bytes as Uint8Array<ArrayBuffer>],{type:'application/pdf'});const url=URL.createObjectURL(blob);const anchor=document.createElement('a');anchor.href=url;anchor.download=filename;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),60000);}
