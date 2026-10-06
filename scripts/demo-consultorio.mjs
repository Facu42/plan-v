import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { homedir } from 'node:os';
import { demoConsultorioEnv } from './demo-consultorio-env.mjs';

const cwd=process.cwd();
const stateFile=resolve(process.env.LOCALAPPDATA||resolve(homedir(),'.local/share'),'PlanV','simulacion-consultorio','demo-state.bin');
const env=demoConsultorioEnv(process.env,stateFile);
const children=[spawn(process.execPath,['--import','tsx','server/index.ts'],{cwd,env,stdio:'inherit',windowsHide:true}),spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5606','--strictPort'],{cwd,env,stdio:'inherit',windowsHide:true})];
let closing=false;
function close(code=0){if(closing)return;closing=true;for(const child of children)child.kill();setTimeout(()=>process.exit(code),100).unref();}
for(const child of children){child.on('error',error=>{console.error(error.message);close(1);});child.on('exit',code=>{if(!closing)close(code??1);});}
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>close());
console.log('Simulación local con datos ficticios y guardado automático.');
console.log('Paciente: http://127.0.0.1:5606/app/inicio');
console.log('Nutricionista: http://127.0.0.1:5606/crm/inicio');
console.log('En el acceso elegí “Continuar en modo demo”. Los datos se conservan al reiniciar con este mismo comando.');
