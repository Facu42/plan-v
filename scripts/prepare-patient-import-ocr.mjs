import { copyFile,mkdir,readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

/** Self-host OCR assets; no clinical content is ever sent to a model download host. */
const root=resolve(import.meta.dirname,'..');
const output=resolve(root,'public/patient-import-ocr');await mkdir(output,{recursive:true});
await copyFile(resolve(root,'node_modules/tesseract.js/dist/worker.min.js'),resolve(output,'worker.min.js'));
for(const name of ['tesseract-core-lstm.wasm.js','tesseract-core-lstm.wasm'])await copyFile(resolve(root,'node_modules/tesseract.js-core',name),resolve(output,name));
const langRoot=resolve(root,'node_modules/@tesseract.js-data/spa');
const manifest=JSON.parse(await readFile(resolve(langRoot,'package.json'),'utf8'));
if(manifest.version!=='1.0.0')throw new Error('Revisá la versión de los datos OCR antes de publicar.');
await copyFile(resolve(langRoot,'4.0.0_best_int/spa.traineddata.gz'),resolve(output,'spa.traineddata.gz'));
console.log('Recursos locales de reconocimiento preparados.');
