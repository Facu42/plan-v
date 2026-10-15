import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createStore, BoardError } from './model.mjs';
import { documents } from './catalog.mjs';

const folder = dirname(fileURLToPath(import.meta.url));
const root = resolve(folder, '..');
const staticFiles = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
]);
const escapeHtml = value => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

export function createDashboardServer({ statePath = resolve(root, 'tasks/implementation-status.json'), planPath = resolve(root, documents.find(doc => doc.id === 'plan').path) } = {}) {
  const store = createStore({ planPath, statePath });
  return createServer(async (req, res) => {
    const port = req.socket.localPort;
    const allowedHosts = [`127.0.0.1:${port}`, `localhost:${port}`];
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self'; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
    const send = (status, body, type = 'application/json; charset=utf-8') => { res.writeHead(status, { 'Content-Type': type }); res.end(type.startsWith('application/json') ? JSON.stringify(body) : body); };
    try {
      if (!allowedHosts.includes(req.headers.host)) throw new BoardError('Host no permitido.', 403);
      const url = new URL(req.url, `http://${req.headers.host}`);
      if (req.method === 'PATCH' && /^\/api\/tasks\/PV-\d{2}$/.test(url.pathname)) {
        if (req.headers.origin !== `http://${req.headers.host}` || !req.headers['content-type']?.startsWith('application/json')) throw new BoardError('Origen o formato no permitido.', 403);
        req.setEncoding('utf8');
        let body = '';
        for await (const chunk of req) { body += chunk; if (Buffer.byteLength(body) > 40000) throw new BoardError('El contenido excede el límite.', 413); }
        let input;
        try { input = JSON.parse(body); } catch { throw new BoardError('JSON inválido.'); }
        return send(200, await store.update(url.pathname.split('/').at(-1), input));
      }
      if (req.method !== 'GET') throw new BoardError('Método no permitido.', 405);
      if (url.pathname === '/api/board') return send(200, await store.read());
      if (url.pathname === '/api/export') { res.setHeader('Content-Disposition', 'attachment; filename="plan-v-implementacion.json"'); return send(200, await store.read()); }
      const doc = documents.find(d => url.pathname === `/docs/${d.id}`);
      if (doc) {
        const markdown = await readFile(resolve(root, doc.path), 'utf8');
        return send(200, `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${doc.title} · Plan V</title><link rel="stylesheet" href="/styles.css"><body class="document"><a href="/">← Volver al tablero</a><h1>${doc.title}</h1><pre>${escapeHtml(markdown)}</pre></body></html>`, 'text/html; charset=utf-8');
      }
      if (url.pathname === '/logo.png') return send(200, await readFile(resolve(root, 'src/assets/plan-v-logo-256.png')), 'image/png');
      const font = url.pathname.match(/^\/fonts\/poppins-(400|500|600|700)\.woff2$/);
      if (font) return send(200, await readFile(resolve(root, `node_modules/@fontsource/poppins/files/poppins-latin-${font[1]}-normal.woff2`)), 'font/woff2');
      const file = staticFiles.get(url.pathname);
      if (file) return send(200, await readFile(resolve(folder, file[0])), file[1]);
      throw new BoardError('Página inexistente.', 404);
    } catch (error) {
      if (!res.headersSent) send(error.status ?? 500, { error: error.status ? error.message : `No se pudo leer o guardar el tablero: ${error.message}` });
      else res.end();
    }
  });
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const port = Number(process.env.PLAN_V_DASHBOARD_PORT || 4317);
  const server = createDashboardServer({ statePath: process.env.PLAN_V_DASHBOARD_STATE ? resolve(process.env.PLAN_V_DASHBOARD_STATE) : undefined });
  server.on('error', error => { console.error(`No se pudo iniciar el tablero: ${error.message}`); process.exitCode = 1; });
  server.listen(port, '127.0.0.1', () => console.log(`Plan V · implementación: http://127.0.0.1:${port}`));
}
