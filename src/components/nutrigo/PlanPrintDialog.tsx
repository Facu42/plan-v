import type { OpcionesPdf } from './PanelPlanAsistente';
import { useEffect, useState } from 'react';
import type { ProfessionalMealPlan } from '../../types/plans';
import { FigmaRecordDialog } from './FigmaPatientFront';
import { NvButton } from './primitives';
import { PlanPrintPreview } from './PlanPrintPreview';
import './plan-print.css';
import { nutritionCapabilityApi } from '../../api/nutrition-capabilities';
import type { ClinicBrand } from '../../types/nutrition-capabilities';

export function PlanPrintDialog({ plan, patientName, professionalName = '', demo, currentAllowed, onClose, options, action }: { options?: OpcionesPdf; action?: 'download' | 'print'; plan: ProfessionalMealPlan; patientName: string; professionalName?: string; demo: boolean; currentAllowed: boolean; onClose: () => void }) {
  const [selection, setSelection] = useState<'current' | 'published'>(currentAllowed ? 'current' : 'published');
  const [name, setName] = useState(professionalName), [ready, setReady] = useState(false), [error, setError] = useState('');
  const [html, setHtml] = useState('');
  const [downloading,setDownloading]=useState(false);
  const[brand,setBrand]=useState<ClinicBrand|undefined>(),[brandReady,setBrandReady]=useState(false),[brandError,setBrandError]=useState('');
  useEffect(()=>{const controller=new AbortController();nutritionCapabilityApi.settings(controller.signal).then(view=>{if(!controller.signal.aborted)setBrand(view.settings.brand);}).catch(()=>{if(!controller.signal.aborted)setBrandError('No pudimos consultar la marca del consultorio. Esta copia conserva la identidad de Plan V.');}).finally(()=>{if(!controller.signal.aborted)setBrandReady(true);});return()=>controller.abort();},[]);
  const version = selection === 'published' ? plan.published : currentAllowed ? plan.current : null;
  useEffect(() => {
    let active = true;
    setReady(false); setHtml(''); setError('');
    if (version&&brandReady) void import('./PlanPrintDocument').then(({ planPrintHtml }) => {
      const document = planPrintHtml({ version, patientName, professionalName: name, demo, brand, options });
      if (active) setHtml(document);
    }).catch(() => { if (active) setError('No pudimos preparar la vista. Cerrala y volvé a intentar.'); });
    return () => { active = false; };
  }, [version, patientName, name, demo,brand,brandReady,options]);
  function print() {
    if (!html || !ready) return;
    let target: Window | null = null;
    try {
      target = window.open('', '_blank');
      if (!target) { setError('El navegador bloqueó la impresión. Permití ventanas emergentes para Plan V y volvé a intentar.'); return; }
      const printWindow = target;
      printWindow.opener = null;
      printWindow.document.open();
      printWindow.addEventListener('load', () => {
        try { void printWindow.document.fonts.ready.then(() => { printWindow.focus(); printWindow.print(); }); }
        catch { printWindow.close(); setError('No pudimos abrir la impresión. Volvé a intentar desde esta vista.'); }
      }, { once: true });
      printWindow.addEventListener('afterprint', () => printWindow.close(), { once: true });
      // Trusted, escaped React document; no scripts, external services or patient URLs.
      printWindow.document.write(html);
      printWindow.document.close();
      setError('');
    } catch { target?.close(); setError('No pudimos abrir la impresión. Volvé a intentar desde esta vista.'); }
  }
  async function download() {
    if(!version||!ready||downloading)return;
    setDownloading(true);setError('');
    try {
      const [{buildPlanPdf},{downloadClinicalPdf}]=await Promise.all([import('../../lib/meal-plan-pdf'),import('../../lib/clinical-pdf')]);
      const bytes=await buildPlanPdf({version,patientName,professionalName:name,demo,brand,options});
      downloadClinicalPdf(bytes,`plan-v${version.version}-${version.period_start}.pdf`);
    }catch{setError('No pudimos preparar la descarga. Conservá la vista y volvé a intentar.');}
    finally{setDownloading(false);}
  }
  return <FigmaRecordDialog title="Imprimir o guardar el plan como PDF" className="plan-print-dialog" onClose={onClose} closeLabel="Cerrar vista de impresión">
    <p>Elegí la copia a entregar y revisala. En la ventana de impresión podés elegir «Guardar como PDF». Esta acción no publica ni envía el plan.</p>
    {!currentAllowed && <p role="status">El formulario y el borrador guardado no coinciden. Guardá o recuperá los cambios antes de imprimir el borrador; la copia publicada sigue disponible.</p>}
    <div className="plan-print-options"><label>Copia del plan<select value={selection} onChange={event => { setReady(false); setSelection(event.target.value as 'current' | 'published'); }}><option value="current" disabled={!currentAllowed}>{plan.current.published_at ? 'Versión actual publicada' : 'Borrador guardado'} · v{plan.current.version}</option><option value="published" disabled={!plan.published}>Copia publicada{plan.published ? ` · v${plan.published.version}` : ' · no disponible'}</option></select></label><label>Nombre del profesional en el documento<input maxLength={160} value={name} placeholder="Opcional" onChange={event => { setReady(false); setName(event.target.value); }} /></label></div>
    <p>El nombre profesional se usa en esta copia. El logo y contacto se toman de tu configuración nutricional.</p>
    {brandError&&<p role="status">{brandError}</p>}
    {error && <p role="alert">{error}</p>}
    {version ? html ? <PlanPrintPreview html={html} title={`Vista previa del plan ${version.published_at ? 'publicado' : 'en borrador'} versión ${version.version}`} onReady={setReady} /> : <p role="status">Preparando la vista previa…</p> : <p>No hay una copia disponible para imprimir.</p>}
    <footer>{action !== 'print' && <NvButton type="button" disabled={!version || !ready||downloading} onClick={()=>void download()}>{downloading?'Preparando PDF…':'Descargar PDF'}</NvButton>}{action !== 'download' && <NvButton type="button" className="nv-ghost" disabled={!version || !ready} onClick={print}>Imprimir</NvButton>}<NvButton type="button" className="nv-ghost" onClick={onClose}>Cerrar</NvButton></footer>
  </FigmaRecordDialog>;
}
