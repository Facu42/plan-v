import {createHash} from 'node:crypto';
import {readFile,readdir,lstat} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

export const HASH_SCHEME='sha256-utf8-lf-v1';
export const FIRST_VERSION='20261011140000';
const defaultRoot=fileURLToPath(new URL('../',import.meta.url));
const filename=/^(\d{14})_[A-Za-z0-9_-]+\.sql$/;
/** UTF-8 is validated; only CRLF/CR become LF. BOM, whitespace and final newline are retained. */
export function sqlDigest(value){
 const text=typeof value==='string'?value:new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(value);
 return createHash('sha256').update(text.replace(/\r\n|\r/g,'\n'),'utf8').digest('hex');
}
export async function verifyReleaseManifest({root=defaultRoot}={}){
 const workspace=resolve(root),directory=join(workspace,'supabase','migrations');
 const manifestPath=join(workspace,'docs','deployment','nutridesk-migrations-2026-10-13.json');
 const manifestStat=await lstat(manifestPath);if(!manifestStat.isFile()||manifestStat.isSymbolicLink())throw new Error('Release manifest must be a regular local file.');
 let manifest;try{manifest=JSON.parse(await readFile(manifestPath,'utf8'));}catch{throw new Error('Release manifest JSON is invalid.');}
 if(!manifest||typeof manifest!=='object'||Array.isArray(manifest))throw new Error('Release manifest object is invalid.');
 if(manifest.hashScheme!==HASH_SCHEME)throw new Error('Release manifest hash scheme must be sha256-utf8-lf-v1.');
 if(manifest.firstVersion!==FIRST_VERSION)throw new Error(`Release manifest firstVersion must be ${FIRST_VERSION}.`);
 if(!Array.isArray(manifest.migrations)||!manifest.migrations.length)throw new Error('Release manifest migrations must be a nonempty array.');
 const directoryStat=await lstat(directory);if(!directoryStat.isDirectory()||directoryStat.isSymbolicLink())throw new Error('Migration directory must be local and regular.');
 const actual=[];
 for(const entry of await readdir(directory,{withFileTypes:true})){
  if(!entry.name.endsWith('.sql'))continue;
  const match=filename.exec(entry.name);
  if(!match)throw new Error('Invalid SQL migration filename.');
  if(match[1]<FIRST_VERSION)continue;
  if(!entry.isFile()||entry.isSymbolicLink())throw new Error(`Migration must be a regular file: ${entry.name}`);
  actual.push(entry.name);
 }
 actual.sort();const files=new Set(),versions=new Set();let previous='';
 for(const item of manifest.migrations){
  if(!item||typeof item.file!=='string'||typeof item.version!=='string'||typeof item.sha256!=='string')throw new Error('Invalid migration entry.');
  const match=filename.exec(item.file);
  if(!match||match[1]!==item.version||item.version<FIRST_VERSION||!/^\d{14}$/.test(item.version)||!/^[a-f0-9]{64}$/.test(item.sha256))throw new Error('Invalid migration version, filename or hash.');
  if(files.has(item.file)||versions.has(item.version))throw new Error('Duplicate release migration filename/version.');
  if(previous&&item.version<=previous)throw new Error('Release migrations must be in increasing version order.');
  previous=item.version;files.add(item.file);versions.add(item.version);
 }
 const missing=[...files].filter(name=>!actual.includes(name)),extra=actual.filter(name=>!files.has(name));
 if(missing.length||extra.length)throw new Error(`Release migration inventory mismatch; missing: ${missing.join(', ')||'none'}; extra: ${extra.join(', ')||'none'}.`);
 for(const item of manifest.migrations){
  if(sqlDigest(await readFile(join(directory,item.file)))!==item.sha256)throw new Error(`Release migration hash mismatch: ${item.file}`);
 }
 return{count:actual.length,hashScheme:HASH_SCHEME,versions:[...versions]};
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
 verifyReleaseManifest().then(result=>console.log(`Release manifest verified: ${result.count} migrations (${result.hashScheme}). Local files only; no database operation.`)).catch(error=>{console.error(error.message);process.exitCode=1;});
}
