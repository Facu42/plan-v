import { beforeAll,describe,expect,it } from 'vitest';
import { DOMParser } from '@xmldom/xmldom';
import JSZip from 'jszip';
import { extractImportFile,inspectOfficeZip } from './patient-import-files';
import { mapImportRows } from './patient-import';

beforeAll(()=>{globalThis.DOMParser=DOMParser as unknown as typeof globalThis.DOMParser;});
const file=(name:string,data:Uint8Array)=>({name,size:data.length,arrayBuffer:async()=>data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength)}) as File;
describe('extracción de documentos real y local',()=>{
  it('mantiene la fila de origen al extraer CSV y XLSX con filas vacías',async()=>{
    const csv=await extractImportFile(file('blank.csv',new TextEncoder().encode('Nombre;Antecedentes\n\nAna;Historia original')));
    const csvCandidates=mapImportRows(csv.tables[0].rows.slice(1),{name:0,history:1},{file:csv.file,fingerprint:csv.fingerprint,sheet:'CSV'});
    expect(csvCandidates[0].history[0].origin.row).toBe(3);
    const zip=new JSZip();zip.file('xl/workbook.xml','<workbook xmlns:r="r"><sheets><sheet name="Históricos" r:id="rId1"/></sheets></workbook>');
    zip.file('xl/_rels/workbook.xml.rels','<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>');
    zip.file('xl/worksheets/sheet1.xml','<worksheet><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>Nombre</t></is></c></row><row r="5"><c r="A5" t="inlineStr"><is><t>Ana</t></is></c><c r="B5" t="inlineStr"><is><t>Historia original</t></is></c></row></sheetData></worksheet>');
    const xlsx=await extractImportFile(file('blank.xlsx',await zip.generateAsync({type:'uint8array'})));
    const candidates=mapImportRows(xlsx.tables[0].rows.slice(1),{name:0,history:1},{file:xlsx.file,fingerprint:xlsx.fingerprint,sheet:'Históricos'});
    expect(candidates[0].history[0].origin).toEqual({file:'blank.xlsx',fingerprint:xlsx.fingerprint,sheet:'Históricos',row:5});
  });
  it('lee un CSV real y conserva el hash y nombre del origen',async()=>{
    const doc=await extractImportFile(file('a.csv',new TextEncoder().encode('Nombre;Email\nAna;a@example.test')));
    expect(doc.tables[0].rows[1]).toEqual(['Ana','a@example.test']);expect(doc.fingerprint).toMatch(/^[a-f0-9]{64}$/);
  });
  it('lee XLSX con shared strings y posiciones vacías sin ejecutar fórmula',async()=>{
    const zip=new JSZip();zip.file('xl/workbook.xml','<workbook xmlns:r="r"><sheets><sheet name="Contactos" r:id="rId1"/></sheets></workbook>');
    zip.file('xl/_rels/workbook.xml.rels','<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>');
    zip.file('xl/sharedStrings.xml','<sst><si><t>Nombre</t></si><si><t>Ana Pérez</t></si></sst>');
    zip.file('xl/worksheets/sheet1.xml','<worksheet><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="C1" t="inlineStr"><is><t>Email</t></is></c></row><row r="2"><c r="A2" t="s"><v>1</v></c><c r="C2" t="inlineStr"><is><t>a@example.test</t></is></c><c r="D2"><f>HYPERLINK("http://invalid")</f><v>42</v></c></row></sheetData></worksheet>');
    const doc=await extractImportFile(file('a.xlsx',await zip.generateAsync({type:'uint8array'})));
    expect(doc.tables[0].rows[1][0]).toBe('Ana Pérez');expect(doc.tables[0].rows[1][2]).toBe('a@example.test');expect(doc.tables[0].rows[1][3]).toBe('42');
  });
  it('lee Word real y rechaza páginas excesivas, enlaces externos y XML con entidades',async()=>{
    const zip=new JSZip();zip.file('word/document.xml','<w:document xmlns:w="word"><w:body><w:p><w:r><w:t>Paciente ficticia</w:t></w:r></w:p></w:body></w:document>');
    let data=await zip.generateAsync({type:'uint8array'});expect((await extractImportFile(file('a.docx',data))).pages[0].text).toContain('Paciente ficticia');
    zip.file('docProps/app.xml','<Properties><Pages>41</Pages></Properties>');data=await zip.generateAsync({type:'uint8array'});await expect(extractImportFile(file('a.docx',data))).rejects.toThrow('40');
    zip.remove('docProps/app.xml');zip.file('word/document.xml','<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///secret">]><a>&xxe;</a>');data=await zip.generateAsync({type:'uint8array'});await expect(extractImportFile(file('a.docx',data))).rejects.toThrow('XML');
  });
  it('rechaza un ZIP que declara expansión excesiva antes de descomprimir',async()=>{
    const zip=new JSZip();zip.file('word/document.xml','<document/>');const data=await zip.generateAsync({type:'uint8array'});const view=new DataView(data.buffer);
    for(let i=0;i<data.length-46;i++)if(view.getUint32(i,true)===0x02014b50){view.setUint32(i+24,90*1024*1024,true);break;}
    expect(()=>inspectOfficeZip(data)).toThrow('seguro');
  });
});
