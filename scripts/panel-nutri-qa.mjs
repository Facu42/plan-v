/** QA local con /browse. Ejecutar con la app en modo demo y BROWSE_BIN configurado.
 * No abre sesiones ni modifica servicios remotos. Evidencia en .gstack/panel-qa/.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const binary = process.env.BROWSE_BIN;
if (!binary) throw Error('Indicá BROWSE_BIN con el ejecutable de /browse.');
const base = process.env.PANEL_QA_URL || 'http://127.0.0.1:5173';
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw Error('Esta verificación sólo admite la demostración local.');
const output = resolve('.gstack/panel-qa'); mkdirSync(output, { recursive: true });
const env = { ...process.env, BROWSE_PARENT_PID: '0', BROWSE_STATE_FILE: process.env.BROWSE_STATE_FILE || resolve('.gstack/qa-browser.json') };
const browse = (...args) => execFileSync(binary, args, { env, encoding: 'utf8', windowsHide: true, timeout: 30000 }).trim();
const js = source => browse('js', source);
const check = (source, message) => { const result = js(source); if (result !== 'true') throw Error(`${message}: ${result}`); checks.push(message); };
const checks = [];
const settle = () => { js('Promise.all(document.getAnimations().map(a=>a.finished.catch(()=>{}))).then(()=>true)'); };
const screenshot = name => { settle(); browse('screenshot', '--viewport', resolve(output, `${name}.png`)); };
const chooseTheme = value => {
  browse('click', 'button[aria-label="Opciones de la cuenta"]');
  browse('click', `.nv-user-menu input[value="${value}"]`);
  browse('click', 'button[aria-label="Opciones de la cuenta"]');
  settle();
};
const open = href => {
  if (href.startsWith('/crm/ficha')) { browse('click', '.pn-nav-row>a[href="/crm/pacientes"]'); browse('click', '.nv-clinic-shortcuts button:text-is("Ficha")'); }
  else browse('click', `.pn-nav-row>a[href="${href}"]`);
  settle();
};

browse('goto', `${base}/crm/inicio`);
if (!js('Boolean(document.querySelector(".pn-panel"))').includes('true')) browse('click', 'text=Continuar en modo demo');
browse('wait', '.pn-panel');
browse('viewport', '1440x900');
chooseTheme('light');
check('!document.querySelector(".pn-panel").classList.contains("nv-dark")', 'Tema claro elegido');
check('document.querySelector(".nv-sidebar").offsetWidth===288', 'Menú abierto de 288 px');
screenshot('inicio-claro-1440');
browse('click', 'button[aria-label="Plegar el menú"]'); settle();
check('document.querySelector(".nv-sidebar").offsetWidth===84', 'Menú plegado de 84 px');
check('document.querySelector(".pn-collapse").getAttribute("aria-expanded")==="false"', 'Estado accesible del menú plegado');
screenshot('menu-plegado-1440');
browse('press', 'Space'); settle();
check('document.querySelector(".nv-sidebar").offsetWidth===288', 'Menú recuperado con teclado');
open('/crm/pacientes');
browse('click', 'a[href="/crm/pacientes?filtro=archived"]'); settle();
check('document.querySelector(".nv-directory-filters button[aria-pressed=true]").textContent.includes("Archivados")', 'Submenú Archivadas filtra el directorio');
browse('click', 'a[href="/crm/pacientes?filtro=unlinked"]'); settle();
check('document.querySelector(".pw-work-filters select[aria-label]")?.value === "pending" || [...document.querySelectorAll(".pw-work-filters select")].some(e=>e.value==="pending")', 'Submenú Acceso pendiente filtra invitaciones');
open('/crm/cobranzas'); browse('click', 'a[href="/crm/cobranzas?filtro=deben"]'); browse('wait', '.cbz-directory'); settle();
check('[...document.querySelectorAll(".cbz-directory nav button")].some(e=>e.getAttribute("aria-pressed")==="true"&&e.textContent==="Deben")', 'Submenú Vencidas filtra cobranzas');
open('/crm/mensajes'); browse('click', 'a[href="/crm/mensajes?filtro=unread"]'); settle();
check('document.querySelector(".nmf-filter").getAttribute("aria-pressed")==="true"', 'Submenú Sin leer filtra conversaciones');
open('/crm/desarrollo?modulo=configuracion');
browse('click', 'button[aria-label="Opciones de la cuenta"]');
check('new Set([...document.querySelectorAll(".pn-theme-picker input")].map(e=>e.name)).size===2', 'Selectores de tema independientes para teclado');
browse('click', 'button[aria-label="Opciones de la cuenta"]');

chooseTheme('system');
check('document.querySelector(".pn-panel").classList.contains("nv-dark")===matchMedia("(prefers-color-scheme: dark)").matches', 'Tema del sistema coincide con la preferencia del equipo');

const pages = ['/crm/inicio','/crm/pacientes','/crm/ficha','/crm/agenda','/crm/cobranzas','/crm/desarrollo?modulo=asistente-ia','/crm/seguimiento','/crm/mensajes','/crm/progreso-global','/crm/plan','/crm/alimentos','/crm/biblioteca?biblioteca=recetas','/crm/desarrollo?modulo=equivalencias','/crm/modelos','/crm/biblioteca?biblioteca=recursos','/crm/desarrollo?modulo=ayuda','/crm/desarrollo?modulo=equipo','/crm/desarrollo?modulo=configuracion'];
const measurements = [];
for (const theme of ['light','dark']) {
  browse('viewport', '1440x900');
  chooseTheme(theme);
  for (const viewport of ['1440x900', '390x844']) {
    browse('viewport', viewport);
    if (viewport.startsWith('390')) {
      browse('click', '.nv-menu-toggle');
      check('document.querySelector(".nv-workspace").inert && document.querySelector(".nv-tabbar").inert', 'Cajón móvil aísla el contenido de fondo');
      browse('press', 'Escape');
      check('document.activeElement===document.querySelector(".nv-menu-toggle")', 'Escape devuelve el foco al botón del menú');
      check('[...document.querySelectorAll(".nv-tabbar button")].every(e=>e.getBoundingClientRect().width>=50)', 'Barra móvil reparte sus cinco destinos sin apiñarlos');
    }
    // En celular la navegación del menú está dentro del cajón.
    for (const href of pages) {
      if (viewport.startsWith('390')) browse('click', '.nv-menu-toggle');
      open(href);
      const m = JSON.parse(js('JSON.stringify({url:location.pathname+location.search,width:innerWidth,height:innerHeight,pageWidth:document.documentElement.scrollWidth,pageHeight:document.documentElement.scrollHeight,dark:document.querySelector(".pn-panel").classList.contains("nv-dark"),chatBottom:document.querySelector("#nm-message")?.getBoundingClientRect().bottom??null})'));
      if (href === '/crm/ficha') {
        check('[...document.querySelectorAll(".pw-tabs button[aria-current=page],.nv-badge.nv-gold,.nv-badge.nv-coral")].every(e=>getComputedStyle(e).color==="rgb(39, 41, 50)")', 'Ficha: texto tinta sobre lima, amarillo y naranja');
      }
      if (m.pageWidth > m.width + 1) throw Error(`Desborde horizontal: ${href} ${theme} ${viewport}`);
      if (viewport.startsWith('1440') && m.pageHeight > m.height + 1) throw Error(`Desplazamiento de página: ${href} ${theme}`);
      if (m.dark !== (theme === 'dark')) throw Error(`Tema incorrecto: ${href}`);
      if (viewport.startsWith('1440') && m.chatBottom && m.chatBottom > m.height) throw Error('Campo de mensajes fuera de pantalla');
      measurements.push(m);
      if (href === '/crm/inicio' || href === '/crm/pacientes' || href === '/crm/mensajes' || href === '/crm/ficha') screenshot(`${href.slice(5)}-${theme === 'light' ? 'claro' : 'oscuro'}-${m.width}`);
    }
  }
}
browse('viewport', '1440x900');
browse('reload');
if (!js('Boolean(document.querySelector(".pn-panel"))').includes('true')) browse('click', 'text=Continuar en modo demo');
browse('wait', '.pn-panel');
check('document.querySelector(".pn-panel").classList.contains("nv-dark")', 'Tema restaurado al recargar');
writeFileSync(resolve(output, 'resultados.json'), JSON.stringify({ date: new Date().toISOString(), checks, measurements }, null, 2));
console.log(`${checks.length} recorridos y ${measurements.length} combinaciones de pantalla, tema y tamaño aprobados. Evidencia: ${output}`);
