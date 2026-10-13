import {afterEach,beforeEach,describe,expect,it} from 'vitest';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,dirname,basename} from 'node:path';
import {createHash} from 'node:crypto';
// @ts-expect-error Local operator MJS; no credentials or remote database access.
import {verifyReleaseManifest,sqlDigest,HASH_SCHEME,FIRST_VERSION} from '../../scripts/check-release-manifest.mjs';
let root:string,manifest:Record<string,unknown>;
const name='20261011140000_first.sql',next='20261011150000_second.sql',content='-- Español: ñ\nselect 1;\n';
const knownHash=createHash('sha256').update(content).digest('hex');
const sql=(file:string)=>join(root,'supabase','migrations',file),json=()=>join(root,'docs','deployment','nutridesk-migrations-2026-10-13.json');
async function save(){await writeFile(json(),JSON.stringify(manifest));}
beforeEach(async()=>{root=await mkdtemp(join(tmpdir(),'plan-v-manifest-'));await mkdir(join(root,'supabase','migrations'),{recursive:true});await mkdir(dirname(json()),{recursive:true});await writeFile(sql(name),content);await writeFile(sql(next),'select 2;\n');await writeFile(sql('20261011000000_old.sql'),'select 0;\n');manifest={hashScheme:HASH_SCHEME,firstVersion:FIRST_VERSION,migrations:[{version:'20261011140000',file:name,sha256:knownHash},{version:'20261011150000',file:next,sha256:createHash('sha256').update('select 2;\n').digest('hex')}]};await save();});
afterEach(async()=>{const target=resolve(root);if(dirname(target)!==resolve(tmpdir())||!basename(target).startsWith('plan-v-manifest-'))throw new Error('Unsafe disposable test directory');await rm(target,{recursive:true,force:true});});
describe('manifiesto local inmutable y portable entre Windows/Linux',()=>{
 it('CRLF, CR y LF equivalentes conservan hash; otros bytes y espacios sí cambian',()=>{expect(sqlDigest(Buffer.from(content.replace(/\n/g,'\r\n')))).toBe(knownHash);expect(sqlDigest(Buffer.from(content.replace(/\n/g,'\r')))).toBe(knownHash);expect(sqlDigest(Buffer.from(content))).toBe(knownHash);expect(sqlDigest(content+' ')).not.toBe(knownHash);expect(()=>sqlDigest(Buffer.from([255]))).toThrow();});
 it('comprueba inventario nuevo exacto, versiones y hashes en LF o CRLF',async()=>{expect(await verifyReleaseManifest({root})).toMatchObject({count:2,hashScheme:HASH_SCHEME});await writeFile(sql(name),content.replace(/\n/g,'\r\n'));expect(await verifyReleaseManifest({root})).toMatchObject({count:2});});
 it('rechaza contenido alterado sin imprimir su contenido',async()=>{await writeFile(sql(name),content+'select 9;');await expect(verifyReleaseManifest({root})).rejects.toThrow(/hash.*20261011140000_first\.sql/i);});
 it('rechaza archivo faltante y migración extra aunque el resto coincida',async()=>{await rm(sql(next));await expect(verifyReleaseManifest({root})).rejects.toThrow(/missing/i);await writeFile(sql(next),'select 2;\n');await writeFile(sql('20261011160000_extra.sql'),'select 3;');await expect(verifyReleaseManifest({root})).rejects.toThrow(/extra/i);});
 it('rechaza alias de ruta, versión diferente, duplicación y orden SQL incorrecto',async()=>{const original=await readFile(json(),'utf8');for(const entries of [[{version:'20261011140000',file:'../private.env',sha256:knownHash}],[{version:'20261011140001',file:name,sha256:knownHash}],JSON.parse(original).migrations.concat(JSON.parse(original).migrations[0]),JSON.parse(original).migrations.reverse()]){manifest={hashScheme:HASH_SCHEME,firstVersion:FIRST_VERSION,migrations:entries};await save();await expect(verifyReleaseManifest({root})).rejects.toThrow();}});
 it('no permite cambiar esquema de hash ni excluir migraciones moviendo el inicio',async()=>{manifest.hashScheme='sha256-raw';await save();await expect(verifyReleaseManifest({root})).rejects.toThrow(/scheme/i);manifest.hashScheme=HASH_SCHEME;manifest.firstVersion='20261011150000';await save();await expect(verifyReleaseManifest({root})).rejects.toThrow(/firstVersion/i);});
 it('verifica el manifiesto real del candidato local completo',async()=>{expect(await verifyReleaseManifest()).toMatchObject({count:15,hashScheme:HASH_SCHEME});});
});
