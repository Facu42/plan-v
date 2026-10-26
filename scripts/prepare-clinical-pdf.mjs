import { readFile,mkdir,writeFile,copyFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import wawoff2 from 'wawoff2';
const root=resolve(import.meta.dirname,'..');const output=resolve(root,'public/clinical-pdf');await mkdir(output,{recursive:true});
// PDF needs TrueType, not a web-font container. Same bundled Poppins/OFL glyphs.
const woff2=await readFile(resolve(root,'node_modules/@fontsource/poppins/files/poppins-latin-400-normal.woff2'));
await writeFile(resolve(output,'Poppins-Regular.ttf'),await wawoff2.decompress(woff2));
await copyFile(resolve(root,'node_modules/@fontsource/poppins/LICENSE'),resolve(output,'LICENSE-Poppins.txt'));
console.log('Tipografía local de documentos PDF preparada.');

const inter = await readFile(resolve(root,'node_modules/@fontsource/inter/files/inter-latin-400-normal.woff2'));
await writeFile(resolve(output,'Inter-Regular.ttf'),await wawoff2.decompress(inter));
await copyFile(resolve(root,'node_modules/@fontsource/inter/LICENSE'),resolve(output,'LICENSE-Inter.txt'));
