import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import type { SourceNode } from './SourceView';

const manifest=JSON.parse(await readFile('design/figma-reference/manifest.json','utf8')) as {nodes:Array<{screen:string;viewport:string;width:number;nodeId:string;codeSha256:string}>};
const assets=JSON.parse(await readFile('design/figma-reference/source-assets.json','utf8')) as Array<{file:string;sha256:string;bytes:number}>;
describe('contrato de los originales capturados por el MCP',()=>{
  it('incluye las doce vistas en escritorio y celular',()=>{
    expect(manifest.nodes).toHaveLength(24);
    for(const screen of new Set(manifest.nodes.map((node:{screen:string})=>node.screen))){
      expect(manifest.nodes.filter((node:{screen:string})=>node.screen===screen).map((node:{width:number})=>node.width).sort()).toEqual([1440,390].sort());
    }
  });
  it.each(manifest.nodes)('$screen ($viewport) conserva fuente, clases y referencias originales',async(frame:{nodeId:string;codeSha256:string})=>{
    const key=frame.nodeId.replace(':','-');
    const original=await readFile(`design/figma-reference/original/${key}.tsx`,'utf8');
    expect(createHash('sha256').update(original).digest('hex')).toBe(frame.codeSha256);
    const syntax=ts.createSourceFile('original.tsx',original,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
    const classes=new Set<string>();
    function inspect(node:ts.Node){
      if(ts.isStringLiteral(node)||ts.isNoSubstitutionTemplateLiteral(node)||ts.isTemplateHead(node)||ts.isTemplateMiddle(node)||ts.isTemplateTail(node))
        for(const token of node.text.split(/\s+/))if(token)classes.add(token);
      ts.forEachChild(node,inspect);
    }
    inspect(syntax);
    const tree=JSON.parse(await readFile(`src/features/nutrigo/source/${key}.json`,'utf8')) as SourceNode;
    const seen:string[]=[];
    function walk(node:SourceNode|string|number){
      if(typeof node!=='object')return;
      for(const token of String(node.props.className??'').split(/\s+/))if(token)expect(classes.has(token),token).toBe(true);
      if(node.props.src){
        const src=String(node.props.src);expect(src.startsWith('asset:')).toBe(true);
        expect(original).toContain(src.slice(6));seen.push(src.slice(6));
      }
      for(const child of node.children)walk(child);
    }
    walk(tree);expect(seen.length).toBeGreaterThan(0);
  });
  it('verifica bytes locales de todos los recursos, sin depender de URLs temporales',async()=>{
    for(let offset=0;offset<assets.length;offset+=16){
      await Promise.all(assets.slice(offset,offset+16).map(async asset=>{
        const bytes=await readFile(`src/features/nutrigo/assets/${asset.file}`);
        expect(bytes.length).toBe(asset.bytes);expect(createHash('sha256').update(bytes).digest('hex')).toBe(asset.sha256);
      }));
    }
  },15000);
});
