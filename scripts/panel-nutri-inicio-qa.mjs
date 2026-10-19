/** Verificación de Inicio con /browse, exclusivamente contra la demostración local. */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const binary = process.env.BROWSE_BIN;
if (!binary) throw Error('Indicá BROWSE_BIN.');
const base = process.env.PANEL_QA_URL || 'http://127.0.0.1:5173';
if (!['127.0.0.1','localhost'].includes(new URL(base).hostname)) throw Error('Solo demostración local.');
const output = resolve('design/panel-nutri/fase-2'); mkdirSync(output, { recursive: true });
const env = { ...process.env, BROWSE_PARENT_PID: '0' };
const browse = (...args) => execFileSync(binary, args, { env, encoding: 'utf8', windowsHide: true, timeout: 30000 }).trim();
const js = source => browse('js', source);
const checks = [], measurements = [];
const check = (source, name) => { const result = js(source); if (result !== 'true') throw Error(`${name}: ${result}`); checks.push(name); };
const settle = () => js('Promise.all(document.getAnimations().map(a=>a.finished.catch(()=>{}))).then(()=>true)');
const home = () => { browse('click', '.pn-nav-row>a[href="/crm/inicio"]'); browse('wait', '.ph-home'); browse('wait', '.ph-pending ul>li:first-child>a'); settle(); };
const theme = value => { browse('click', 'button[aria-label="Opciones de la cuenta"]'); browse('click', `.nv-user-menu input[value="${value}"]`); browse('click', 'button[aria-label="Opciones de la cuenta"]'); settle(); };
const capture = name => { settle(); browse('screenshot', '--viewport', resolve(output, `${name}.png`)); };
browse('goto', `${base}/crm/inicio`);
if (js('Boolean(document.querySelector(".pn-panel"))') !== 'true') browse('click', 'text=Continuar en modo demo');
browse('wait', '.ph-home'); browse('wait', '.ph-pending ul>li:first-child>a');
browse('viewport', '1440x900');
browse('console', '--clear');
browse('network', '--clear');
for (const value of ['light','dark']) {
  browse('viewport','1440x900'); theme(value);
  for (const size of ['1440x900','390x844','1280x800','1680x900']) {
    browse('viewport',size); settle();
    const m = JSON.parse(js('JSON.stringify({width:innerWidth,height:innerHeight,pageWidth:document.documentElement.scrollWidth,pageHeight:document.documentElement.scrollHeight,main:document.querySelector(".nv-main").getBoundingClientRect().toJSON(),month:document.querySelector(".ph-month").getBoundingClientRect().toJSON(),monthClipped:document.querySelector(".ph-month").scrollHeight>document.querySelector(".ph-month").clientHeight+1})'));
    if (m.pageWidth > m.width + 1 || (m.width >= 800 && (m.pageHeight > m.height+1 || m.monthClipped || m.month.bottom > m.height))) throw Error(`Recorte en ${value} ${size}: ${JSON.stringify(m)}`);
    measurements.push({theme:value,...m});
    if (size==='1440x900'||size==='390x844') capture(`inicio-${value}-${m.width}`);
  }
}
browse('viewport','1440x900');
const before = js('document.querySelector(".ph-bottom>section:first-child .ph-scroll").textContent');
browse('click','.ph-tabs button:nth-child(2)'); browse('wait','.ph-pending ul>li:first-child>a');
check('[...document.querySelectorAll(".ph-pending .ph-task a")].every(a=>a.getAttribute("href").includes("seccion=alimentario"))','Comidas lleva al registro alimentario');
if (before !== js('document.querySelector(".ph-bottom>section:first-child .ph-scroll").textContent')) throw Error('Atención cambia con el filtro');
checks.push('Atención estable al filtrar pendientes');
browse('click','.ph-tabs button:nth-child(4)');
check('document.querySelector(".ph-pending").textContent.includes("No hay reservas por confirmar")','Reservas muestra su estado vacío real');
home();
browse('click','.ph-quick a[href="/crm/pacientes?accion=crear"]'); browse('wait','[role="dialog"]');
check('Boolean(document.querySelector("#nv-create-title"))','Nueva paciente abre alta real');
browse('click','button:text-is("Cancelar")'); home();
browse('click','.ph-quick a[href="/crm/plan?planes=todos"]');
check('location.pathname==="/crm/plan"&&location.search.includes("planes=todos")','Armar plan abre la elección real de paciente'); home();
browse('click','.ph-quick a[href="/crm/cobranzas"]'); browse('wait','.cbz-directory');
check('Boolean(document.querySelector(".cbz-directory"))','Registrar cobro abre cobranzas reales'); home();
browse('click','.ph-quick a[href="/crm/agenda?agenda=publica"]'); browse('wait','#pn-publica');
check('Boolean(document.querySelector("#pn-publica"))','Configurar reserva abre el editor de página pública'); home();
browse('click','.ph-next a.ph-ink'); browse('wait','.pw-record');
check('new URLSearchParams(location.search).get("seccion")==="notas"','Preparar consulta abre las notas de esa paciente'); home();
browse('press','Control+k'); check('document.activeElement?.getAttribute("aria-label")==="Buscar pacientes"','Ctrl K enfoca la búsqueda');
browse('fill','.ph-search input','Sofía'); browse('click','.ph-search button');
check(`location.pathname==="/crm/pacientes"&&document.querySelector('input[type="search"]').value==="Sofía"`,'Búsqueda de Inicio conserva el texto en Pacientes'); home();
browse('click','.ph-bottom>section:first-child .ph-notice:first-child>a'); browse('wait','.nm-layout');
check('location.pathname==="/crm/mensajes"','Escribir abre el chat sin enviar mensajes'); home();
// Página habilitada y copia real, sólo en memoria local; se restaura incluso si falla la comprobación.
const readScheduling=()=>JSON.parse(js('fetch("/api/scheduling?offset=0").then(r=>r.json()).then(v=>JSON.stringify(v))'));
const saveScheduling=(revision,config)=>js(`fetch("/api/scheduling/settings",{method:"PUT",headers:{"Content-Type":"application/json"},body:${JSON.stringify(JSON.stringify({expected_revision:revision,config}))}}).then(r=>r.status)`);
if (process.env.PANEL_QA_PUBLIC==='1') { const originalScheduling=readScheduling(); try {
  if (saveScheduling(originalScheduling.profile.revision,{...originalScheduling.profile.config,page:{...originalScheduling.profile.config.page,enabled:true}})!=='200') throw Error('No se pudo preparar la página pública ficticia');
  browse('click','.ph-pending>header button'); browse('wait','.ph-quick button');
  browse('click','.ph-quick button'); browse('wait','.ph-feedback');
  check('document.querySelector(".ph-feedback").textContent==="Link de reserva copiado."','Enlace público habilitado se copia al portapapeles real');
} finally {
  const latest=readScheduling();
  if (saveScheduling(latest.profile.revision,originalScheduling.profile.config)!=='200') throw Error('Restaurá los ajustes de agenda de la demostración local');
} }
home();
browse('viewport','390x844');
browse('click','.ph-preparation summary');
check('document.querySelector(".ph-preparation").open&&getComputedStyle(document.querySelector(".ph-facts")).display!=="none"','Preparación completa accesible en celular');
browse('viewport','1440x900');
const consoleErrors=browse('console','--errors');
const failedRequests=browse('network').split('\n').filter(line=>/→ [45]\d\d/.test(line));
const expectedDenials=failedRequests.filter(line=>line.includes('/consultations/completions?')&&line.includes('→ 403'));
if (failedRequests.length!==expectedDenials.length || consoleErrors.split('\n').filter(line=>line.includes('[error]')).some(line=>!line.includes('status of 403'))) throw Error(`${consoleErrors}\n${failedRequests.join('\n')}`);
checks.push('Inicio sin errores; completar consulta conserva bloqueo por permiso de atención ausente en demo');
writeFileSync(resolve(output,'resultados.json'),JSON.stringify({date:new Date().toISOString(),checks,measurements,expectedDenials,publicClipboardVerified:process.env.PANEL_QA_PUBLIC==='1'},null,2));
console.log(`${checks.length} comprobaciones y ${measurements.length} combinaciones aprobadas.`);
