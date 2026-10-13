import { describe,expect,it,vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PatientImportDialog,buildReviewedImport,reviewedOrganizerSources,applyOrganizerReview,continueCreatedImport } from './PatientImportDialog';
vi.mock('./FigmaPatientFront',()=>({FigmaRecordDialog:({children}:{children:React.ReactNode})=><dialog>{children}</dialog>}));
vi.mock('./primitives',()=>({NvButton:({children}:{children:React.ReactNode})=><button>{children}</button>}));
vi.mock('./unsaved-changes',()=>({useUnsavedChanges:()=>{},canLeaveWorkspace:()=>true}));

const origin={file:'a.csv',fingerprint:'a'.repeat(64),row:2};
const row=()=>({key:crypto.randomUUID(),name:'Ana Pérez',email:'',phone:'',action:'create' as const,patient_id:null,origins:[origin],measurements:[],history:[{category:'history' as const,text:'Dato privado',origin}],warnings:[],reviewed:true,includeClinical:true});
describe('revisión antes de importar',()=>{
  it('conserva el texto clínico revisado al continuar desde un contacto nuevo sin cuenta',()=>{
    const original=row(),target=crypto.randomUUID();
    const pending=continueCreatedImport([original],[{key:original.key,status:'created',patient_id:target,message:'Contacto creado'}]);
    expect(pending).toHaveLength(1);expect(pending[0]).toMatchObject({action:'append',patient_id:target,reviewed:false,includeClinical:true,history:original.history});
    expect(pending[0].key).not.toBe(original.key);expect(original.action).toBe('create');
    expect(continueCreatedImport([original],[{key:original.key,status:'error',patient_id:null,message:'Error'}])).toEqual([]);
  });
  it('ofrece todos los formatos y explica lectura local y alta sin invitación',()=>{
    const html=renderToStaticMarkup(<PatientImportDialog onClose={()=>{}}/>);
    expect(html).toContain('.xlsx,.csv,.docx,.pdf,.jpg,.jpeg,.png');expect(html).toContain('No se crean cuentas');expect(html).toContain('20 MB');
  });
  it('no envía datos clínicos para una ficha nueva ni sin elección explícita',()=>{
    expect(buildReviewedImport(crypto.randomUUID(),[row()]).candidates[0].history).toEqual([]);
    const candidate={...row(),action:'append' as const,patient_id:'patient-1',includeClinical:false};
    expect(buildReviewedImport(crypto.randomUUID(),[candidate]).candidates[0].history).toEqual([]);
    expect(()=>buildReviewedImport(crypto.randomUUID(),[{...candidate,reviewed:false}])).toThrow();
  });
  it('sólo envía historia de una ficha asociada, revisada y seleccionada',()=>{
    const candidate={...row(),action:'append' as const,patient_id:'patient-1'};
    expect(buildReviewedImport(crypto.randomUUID(),[candidate]).candidates[0].history).toHaveLength(1);
  });
  it('requiere ficha existente, revisión y permiso específico antes de organizar',()=>{
    const candidate={...row(),action:'append' as const,patient_id:'patient-1'},contacts=[{patient_id:'patient-1',name:'Ana',email:'',phone:''}];
    expect(reviewedOrganizerSources(candidate,contacts,['care_relationship','ai_document_import'])).toEqual(candidate.history);
    for(const [r,c,consents] of [[row(),contacts,['care_relationship','ai_document_import']],[candidate,[],['care_relationship','ai_document_import']],[{...candidate,reviewed:false},contacts,['care_relationship','ai_document_import']],[candidate,contacts,['care_relationship']]] as const)
      expect(reviewedOrganizerSources(r,[...c],[...consents])).toEqual([]);
  });
  it('aplica sólo categorías revisadas, conserva fuentes y exige confirmar otra vez antes de guardar',()=>{
    const candidate={...row(),action:'append' as const,patient_id:'patient-1',history:[{category:'history' as const,text:'Dato privado exacto',origin},{category:'history' as const,text:'Segundo antecedente',origin:{...origin,row:3}}],origins:[origin,{...origin,row:3}]};
    const context={patientId:'patient-1',items:structuredClone(candidate.history)};
    const proposed=applyOrganizerReview(candidate,context,[{...candidate.history[0],category:'study',heading:'Dato privado'}]);
    expect(proposed.reviewed).toBe(false);expect(proposed.history).toEqual([{...candidate.history[0],category:'study'},candidate.history[1]]);
    expect(()=>buildReviewedImport(crypto.randomUUID(),[proposed])).toThrow();
    expect(buildReviewedImport(crypto.randomUUID(),[{...proposed,reviewed:true}]).candidates[0].history).toEqual(proposed.history);
    expect(proposed.history.every(item=>!('heading' in item))).toBe(true);
    expect(()=>applyOrganizerReview({...candidate,patient_id:'patient-2'},context,[{...candidate.history[0],heading:'Dato'}])).toThrow();
    expect(()=>applyOrganizerReview(candidate,context,[{...candidate.history[0],text:'Texto modificado',heading:'Texto'}])).toThrow();
    expect(()=>applyOrganizerReview(candidate,context,[{...candidate.history[0],origin:{...origin,row:9},heading:'Dato'}])).toThrow();
    expect(()=>applyOrganizerReview({...candidate,history:[{...candidate.history[0],text:'Nuevo texto'},candidate.history[1]]},context,[{...candidate.history[0],heading:'Dato'}])).toThrow();
  });
});
