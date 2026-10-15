import {createHash} from 'node:crypto';
import {readFile,readdir,lstat} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

export const HASH_SCHEME='sha256-utf8-lf-v1';
export const FIRST_VERSION='20261011140000';
// Exact MAIN migrations already observed in Supabase under these aliases; never a range exemption.
const APPLIED_BASELINE={
 '20261015210000_activity_kcal.sql':{version:'20261015210000',observedAppliedVersion:'20261015173356',observedAppliedName:'activity_kcal'},
 '20261015090000_patient_views_read_only.sql':{version:'20261015090000',observedAppliedVersion:'20261014215529',observedAppliedName:'patient_views_read_only'},
 '20261015100000_habit_symptoms.sql':{version:'20261015100000',observedAppliedVersion:'20261014215543',observedAppliedName:'habit_symptoms'},
};
const BASELINE_MAIN='9c568541a4c72633bfdb65090a231c3724a3588d',BASELINE_OBSERVED_ON='2026-10-15';
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
 if(!Array.isArray(manifest.baselineMigrations))throw new Error('Release baselineMigrations must be an explicit array.');
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
 actual.sort();const files=new Set(),versions=new Set(),pendingVersions=[],baselineVersions=[],appliedVersions=new Set(),appliedNames=new Set();
 function entry(item,baseline){
  if(!item||typeof item.file!=='string'||typeof item.version!=='string'||typeof item.sha256!=='string')throw new Error('Invalid migration entry.');
  const match=filename.exec(item.file);
  if(!match||match[1]!==item.version||item.version<FIRST_VERSION||!/^\d{14}$/.test(item.version)||!/^[a-f0-9]{64}$/.test(item.sha256))throw new Error(baseline?'Invalid baseline migration version, filename or hash.':'Invalid migration version, filename or hash.');
  if(files.has(item.file)||versions.has(item.version))throw new Error('Duplicate or overlapping baseline/release migration filename/version.');
  files.add(item.file);versions.add(item.version);
 }
 let previous='';
 for(const item of manifest.migrations){
  entry(item,false);
  if(previous&&item.version<=previous)throw new Error('Release migrations must be in increasing version order.');
  previous=item.version;pendingVersions.push(item.version);
 }
 previous='';
 for(const item of manifest.baselineMigrations){
  entry(item,true);
  const expected=APPLIED_BASELINE[item.file];
  if(!expected||Object.entries(expected).some(([key,value])=>item[key]!==value))throw new Error('Invalid baseline migration identity or observed applied alias.');
  if(previous&&item.version<=previous)throw new Error('Baseline migrations must be in increasing version order.');
  if(appliedVersions.has(item.observedAppliedVersion)||appliedNames.has(item.observedAppliedName))throw new Error('Duplicate baseline observed applied alias.');
  previous=item.version;baselineVersions.push(item.version);appliedVersions.add(item.observedAppliedVersion);appliedNames.add(item.observedAppliedName);
 }
 // The local inventory, not optional manifest metadata, requires known applied files to stay in baseline.
 if(manifest.baselineMigrations.length||manifest.mainBase===BASELINE_MAIN||actual.some(name=>Object.hasOwn(APPLIED_BASELINE,name))){
  if(manifest.baselineMigrations.length!==Object.keys(APPLIED_BASELINE).length||manifest.mainBase!==BASELINE_MAIN||manifest.observedOn!==BASELINE_OBSERVED_ON)throw new Error('Invalid baseline MAIN reference, observed date or exact migration inventory.');
 }
 if([...appliedVersions].some(version=>versions.has(version)))throw new Error('Baseline observed alias overlaps a local migration version.');
 const missing=[...files].filter(name=>!actual.includes(name)),extra=actual.filter(name=>!files.has(name));
 if(missing.length||extra.length)throw new Error(`Release migration inventory mismatch; missing: ${missing.join(', ')||'none'}; extra: ${extra.join(', ')||'none'}.`);
 for(const item of [...manifest.migrations,...manifest.baselineMigrations]){
  if(sqlDigest(await readFile(join(directory,item.file)))!==item.sha256)throw new Error(`Release migration hash mismatch: ${item.file}`);
 }
 return{count:pendingVersions.length,baselineCount:baselineVersions.length,totalCount:actual.length,hashScheme:HASH_SCHEME,versions:pendingVersions,baselineVersions};
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
 verifyReleaseManifest().then(result=>console.log(`Release manifest verified: ${result.count} pending migrations + ${result.baselineCount} exact applied baseline (${result.totalCount} local files; ${result.hashScheme}). Local files only; no database operation.`)).catch(error=>{console.error(error.message);process.exitCode=1;});
}
