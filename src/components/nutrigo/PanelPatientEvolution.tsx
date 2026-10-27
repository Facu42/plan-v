import { useState } from 'react';
import type { Patient } from '../../types';
import { CarePanel } from './CarePanel';
import { useCare } from './useCare';
import { ProfessionalMeasurements } from './ProfessionalMeasurements';
import { ClinicalPatientWorkspace } from './ClinicalPatientWorkspace';

/** Lo que cuelga debajo de la solapa Mediciones: todas las medidas con correcciones e importación, métodos clínicos y registros compartidos. */
export function PanelPatientMedicionesExtra({patientId,patientName}:{patientId:string;patientName:string}){
  const {data}=useCare(patientId,true);
  const [advanced,setAdvanced]=useState(false),[evaluations,setEvaluations]=useState(false),[reviews,setReviews]=useState(false);
  return <div className="pn-record-evolution">
    <details className="pn-record-card" onToggle={event=>setAdvanced(event.currentTarget.open)}><summary>Todas las medidas, correcciones e importación de balanza</summary>{advanced&&<ProfessionalMeasurements patientId={patientId} patientName={patientName}/>}</details>
    <details className="pn-record-card" onToggle={event=>setEvaluations(event.currentTarget.open)}><summary>Evaluaciones clínicas y métodos del consultorio</summary>{data&&!data.consented.includes('care_relationship')&&<p>Permiso de atención pendiente.</p>}{evaluations&&data?.consented.includes('care_relationship')&&<ClinicalPatientWorkspace patientId={patientId} mode="mediciones"/>}</details>
    <details className="pn-record-card" onToggle={event=>setReviews(event.currentTarget.open)}><summary>Registros compartidos por revisar</summary>{reviews&&<CarePanel patientId={patientId} mode="professional"/>}</details>
  </div>;
}
