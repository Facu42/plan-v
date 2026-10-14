import { readFile } from 'node:fs/promises';
import { expect, it } from 'vitest';
it('habilita WASM local para OCR sin evaluación JavaScript ni rutas de entregas futuras',async()=>{
  const config=JSON.parse(await readFile(new URL('../../vercel.json',import.meta.url),'utf8'));
  const csp=config.headers[0].headers.find((h:{key:string})=>h.key==='Content-Security-Policy').value;
  expect(csp).toContain("'wasm-unsafe-eval'");expect(csp).not.toContain("'unsafe-eval'");
  expect(csp).toContain("worker-src 'self'");
  const reader=await readFile(new URL('../../src/lib/patient-import-files.ts',import.meta.url),'utf8');
  expect(reader).toContain("workerBlobURL:false");expect(reader).toContain("window.location.origin");
  expect(reader).not.toMatch(/https?:\/\/.*(?:cdn|unpkg|jsdelivr)/);
  const history=await readFile(new URL('../../src/components/nutrigo/PatientImportedHistory.tsx',import.meta.url),'utf8');
  expect(history).not.toContain('ImportHistoryPdfExport');
  const index=await readFile(new URL('../index.ts',import.meta.url),'utf8');
  for(const future of ['clinical-workspace/routes','nutrition-capabilities/routes','scheduling/routes','communications/channel-routes','portfolio/routes'])expect(index).not.toContain(future);
});
