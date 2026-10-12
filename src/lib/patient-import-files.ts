import { MAX_IMPORT_TEXT, parseCsv, validateImportFile, type LocalDocument } from './patient-import';

/** Validate ZIP central-directory lengths before decompression, including encrypted/ZIP64 archives. */
export function inspectOfficeZip(data: Uint8Array) {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  let end = -1;
  for (let i = data.length - 22; i >= Math.max(0, data.length - 65557); i--) if (view.getUint32(i,true) === 0x06054b50) { end = i; break; }
  if (end < 0) throw new Error('El archivo de Office está dañado.');
  const count = view.getUint16(end+10,true); const size = view.getUint32(end+12,true); const start = view.getUint32(end+16,true);
  if (count > 5000 || count === 65535 || start + size > end || view.getUint16(end+4,true) || view.getUint16(end+6,true)) throw new Error('El archivo de Office es demasiado complejo.');
  let offset = start; let expanded = 0;
  for (let i=0;i<count;i++) {
    if (offset+46 > end || view.getUint32(offset,true)!==0x02014b50) throw new Error('El archivo de Office está dañado.');
    const bytes = view.getUint32(offset+24,true); expanded += bytes;
    if (view.getUint16(offset+8,true)&1 || bytes>20*1024*1024 || expanded>80*1024*1024) throw new Error('El archivo comprimido supera el límite seguro.');
    offset += 46 + view.getUint16(offset+28,true) + view.getUint16(offset+30,true) + view.getUint16(offset+32,true);
  }
  if (offset !== start+size) throw new Error('El archivo de Office está dañado.');
}
function xml(source: string): Document {
  if (/<!DOCTYPE|<!ENTITY/i.test(source)) throw new Error('El documento contiene instrucciones XML no permitidas.');
  const result = new DOMParser().parseFromString(source,'application/xml');
  if (result.getElementsByTagName('parsererror').length) throw new Error('El documento de Office está dañado.');
  return result;
}
const elements = (node: Document | Element, tag: string) => [...node.getElementsByTagNameNS('*',tag)];
const hash = async (data: Uint8Array) => [...new Uint8Array(await crypto.subtle.digest('SHA-256',data as Uint8Array<ArrayBuffer>))].map(b=>b.toString(16).padStart(2,'0')).join('');

async function office(data: Uint8Array, type: string, document: LocalDocument) {
  inspectOfficeZip(data);
  const { default: JSZip } = await import('jszip'); const zip = await JSZip.loadAsync(data);
  const read = async (path: string) => { const entry = zip.file(path); if (!entry) throw new Error('Falta una parte del documento de Office.'); return xml(await entry.async('text')); };
  if (type === 'docx') {
    const word = await read('word/document.xml');
    if(zip.file('docProps/app.xml')){const metadata=await read('docProps/app.xml');const pages=Number(elements(metadata,'Pages')[0]?.textContent??0);if(pages>40)throw new Error('El documento Word tiene más de 40 páginas. Dividilo antes de importar.');}
    let text='';let page=1;
    for(const paragraph of elements(word,'p')){
      text+=elements(paragraph,'t').map(t=>t.textContent??'').join('')+'\n';
      if(elements(paragraph,'lastRenderedPageBreak').length||elements(paragraph,'br').some(br=>br.getAttribute('w:type')==='page')){document.pages.push({page,text});text='';page++;if(page>40)throw new Error('El documento Word tiene más de 40 páginas.');}
    }
    if(text.trim())document.pages.push({page,text});
    return;
  }
  const workbook = await read('xl/workbook.xml'); const relations = await read('xl/_rels/workbook.xml.rels');
  const targets = new Map(elements(relations,'Relationship').filter(e=>e.getAttribute('TargetMode')!=='External').map(e=>[e.getAttribute('Id'),e.getAttribute('Target')??'']));
  const strings = zip.file('xl/sharedStrings.xml') ? elements(await read('xl/sharedStrings.xml'),'si').map(e=>elements(e,'t').map(t=>t.textContent??'').join('')) : [];
  const sheets = elements(workbook,'sheet');
  if (sheets.length>40) throw new Error('La planilla tiene más de 40 hojas.');
  for (const sheet of sheets) {
    const target = targets.get(sheet.getAttribute('r:id')); if (!target || /\.\.|^[a-z]+:/i.test(target)) throw new Error('La planilla contiene un enlace no permitido.');
    const path = target.startsWith('/') ? target.slice(1) : `xl/${target}`;
    const content = await read(path); const rows: string[][] = [];
    for (const row of elements(content,'row')) {
      const cells: string[] = [];
      for (const cell of elements(row,'c')) {
        const ref = cell.getAttribute('r')??''; const letters = ref.match(/^[A-Z]+/)?.[0]; if (!letters) throw new Error('La planilla contiene una celda inválida.');
        const index = [...letters].reduce((n,c)=>n*26+c.charCodeAt(0)-64,0)-1;
        if (index>250 || rows.length>=100000) throw new Error('Dividí la planilla en archivos más chicos.');
        const value = elements(cell,'v')[0]?.textContent??''; const kind = cell.getAttribute('t');
        cells[index] = kind==='s' ? strings[Number(value)]??'' : kind==='inlineStr' ? elements(cell,'t').map(t=>t.textContent??'').join('') : value;
      }
      // Preserve empty rows so source row numbers remain accurate.
      const number = Number(row.getAttribute('r'));
      if (!Number.isInteger(number)||number<1||number>100000) throw new Error('La planilla contiene una fila inválida.');
      while (rows.length < number-1) rows.push([]);
      rows.push(cells);
    }
    document.tables.push({sheet:sheet.getAttribute('name')??'Hoja',rows});
  }
}
async function recognize(image: File | HTMLCanvasElement): Promise<string> {
  const { createWorker } = await import('tesseract.js');
  const base=new URL('/patient-import-ocr/',window.location.origin).href;
  const worker = await createWorker('spa', 1, { logger:()=>{}, cacheMethod:'none',workerBlobURL:false,workerPath:`${base}worker.min.js`,corePath:`${base}tesseract-core-lstm.wasm.js`,langPath:base });
  try { return (await worker.recognize(image)).data.text; } finally { await worker.terminate(); }
}
async function pdf(data: Uint8Array, document: LocalDocument, progress: (text: string)=>void) {
  const [pdfjs,worker] = await Promise.all([import('pdfjs-dist'),import('pdfjs-dist/build/pdf.worker.min.mjs?url')]);
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const pdf = await pdfjs.getDocument({data,isEvalSupported:false}).promise;
  try {
    if (pdf.numPages>40) throw new Error('El PDF tiene más de 40 páginas. Dividilo antes de importar.');
    for (let pageNumber=1;pageNumber<=pdf.numPages;pageNumber++) {
      progress(`Leyendo página ${pageNumber} de ${pdf.numPages}…`);
      const page = await pdf.getPage(pageNumber); const content = await page.getTextContent();
      let text='';let lastY:number|null=null;
      for(const item of content.items){if(!('str'in item))continue;const y=item.transform[5];if(lastY!==null&&Math.abs(y-lastY)>3)text+='\n';text+=`${item.str}${item.hasEOL?'\n':' '}`;lastY=item.hasEOL?null:y;}
      if (!text.trim()) {
        const initial = page.getViewport({scale:1}); const scale = Math.min(2,2200/Math.max(initial.width,initial.height));
        const viewport = page.getViewport({scale}); const canvas = window.document.createElement('canvas'); canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
        try { await page.render({canvas,viewport}).promise; text = await recognize(canvas); } finally { canvas.width=0;canvas.height=0; }
      }
      document.pages.push({page:pageNumber,text}); page.cleanup();
      if (document.pages.reduce((n,p)=>n+p.text.length,0)>MAX_IMPORT_TEXT) throw new Error('El texto es demasiado extenso. Dividí el PDF.');
    }
  } finally { await pdf.destroy(); }
}
export async function extractImportFile(file: File, progress: (text: string)=>void = ()=>{}): Promise<LocalDocument> {
  const type = validateImportFile(file); const data = new Uint8Array(await file.arrayBuffer());
  const document: LocalDocument = {file:file.name,fingerprint:await hash(data),tables:[],pages:[]};
  if (type==='csv') {
    let text:string;try{const encoding=data[0]===255&&data[1]===254?'utf-16le':data[0]===254&&data[1]===255?'utf-16be':'utf-8';text=new TextDecoder(encoding,{fatal:true}).decode(data);}catch{throw new Error('Guardá el archivo como CSV UTF-8 o Unicode antes de importarlo.');}
    document.tables.push({sheet:'CSV',rows:parseCsv(text)});
  }
  else if (type==='xlsx'||type==='docx') await office(data,type,document);
  else if (type==='pdf') { if (new TextDecoder().decode(data.slice(0,5))!=='%PDF-') throw new Error('El archivo no es un PDF válido.'); await pdf(data,document,progress); }
  else {
    const png = data[0]===137&&data[1]===80&&data[2]===78&&data[3]===71; const jpeg=data[0]===255&&data[1]===216&&data[2]===255;
    if (!png&&!jpeg) throw new Error('El archivo no es una imagen JPG/PNG válida.');
    const bitmap = await createImageBitmap(file);
    try { if (bitmap.width*bitmap.height>25000000) throw new Error('La imagen es demasiado grande. Reducila a menos de 25 megapíxeles.'); } finally { bitmap.close(); }
    progress('Reconociendo el texto en tu computadora…'); document.pages.push({page:1,text:await recognize(file)});
  }
  if (JSON.stringify(document).length>MAX_IMPORT_TEXT) throw new Error('El documento es demasiado extenso. Dividilo antes de importar.');
  return document;
}
