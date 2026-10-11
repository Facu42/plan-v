/** Lee el texto de un PDF en el navegador de la profesional: el archivo no sale de su computadora. */
export const MAX_PDF_BYTES = 8 * 1024 * 1024;
const MAX_PAGES = 6;

/** Error de entrada que se le puede mostrar tal cual a la profesional. */
export class PdfInputError extends Error {}

export async function extractPdfText(file: File): Promise<string> {
  if (file.size > MAX_PDF_BYTES) throw new PdfInputError('El archivo pesa más de 8 MB.');
  const [pdfjs, worker] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ]);
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const document = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const lines: string[] = [];
  for (let number = 1; number <= Math.min(document.numPages, MAX_PAGES); number += 1) {
    const content = await (await document.getPage(number)).getTextContent();
    let current = '';
    let lastY: number | null = null;
    for (const item of content.items) {
      if (!('str' in item)) continue;
      const y = item.transform[5] as number;
      if (lastY !== null && Math.abs(y - lastY) > 3) { lines.push(current); current = ''; }
      current += `${current && item.str ? ' ' : ''}${item.str}`;
      lastY = y;
    }
    lines.push(current);
  }
  return lines.map((line) => line.trim()).filter(Boolean).join('\n');
}
