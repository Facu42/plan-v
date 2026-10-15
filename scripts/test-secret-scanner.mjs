import {createHash} from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,join,dirname,basename} from 'node:path';

// Synthetic controls only: no provider key is generated or contacted.
const scanner=process.argv[2];
if(!scanner)throw new Error('Gitleaks executable required');
const directory=await mkdtemp(join(tmpdir(),'plan-v-scanner-fixture-'));
try{
  const marker=createHash('sha256').update('Plan V fictional scanner positive control').digest('hex');
  const fixture=['GROQ_API_KEY=','GROQ_ZDR_VERIFIED=0',`SCANNER_CANARY_API_KEY=${marker}`].join('\n')+'\n';
  await writeFile(join(directory,'.env.example'),fixture);
  const report=join(directory,'findings.json');
  const result=spawnSync(scanner,['dir',directory,'--config',resolve('.gitleaks.toml'),'--redact','--no-banner','--report-format','json','--report-path',report],{stdio:'ignore',timeout:30_000});
  if(result.error)throw new Error('Synthetic secret scan could not run');
  const findings=JSON.parse(await readFile(report,'utf8'));
  if(result.status!==1||findings.length!==1||findings[0].RuleID!=='generic-api-key'||findings[0].StartLine!==3)throw new Error('Scanner must ignore only the disabled flag and still reject the synthetic canary');
  await writeFile(join(directory,'.env.example'),'GROQ_API_KEY=""\nGROQ_ZDR_VERIFIED=0\n');
  execFileSync(scanner,['dir',directory,'--config',resolve('.gitleaks.toml'),'--redact','--no-banner'],{stdio:'ignore',timeout:30_000});
  console.log('Synthetic scanner controls passed: disabled flag ignored; generic canary detected.');
}finally{
  const target=resolve(directory);
  if(dirname(target)!==resolve(tmpdir())||!basename(target).startsWith('plan-v-scanner-fixture-'))throw new Error('Unsafe scanner fixture path');
  await rm(target,{recursive:true,force:true});
}
