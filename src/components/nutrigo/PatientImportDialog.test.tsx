import { describe,expect,it,vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PatientImportDialog,buildReviewedImport } from './PatientImportDialog';
vi.mock('./FigmaPatientFront',()=>({FigmaRecordDialog:({children}:{children:React.ReactNode})=><dialog>{children}</dialog>}));
vi.mock('./primitives',()=>({NvButton:({children}:{children:React.ReactNode})=><button>{children}</button>}));
vi.mock('./unsaved-changes',()=>({useUnsavedChanges:()=>{},canLeaveWorkspace:()=>true}));

const origin={file:'a.csv',fingerprint:'a'.repeat(64),row:2};
const row=()=>({key:crypto.randomUUID(),name:'Ana Pérez',email:'',phone:'',action:'create' as const,patient_id:null,origins:[origin],measurements:[],history:[{category:'history' as const,text:'Dato privado',origin}],warnings:[],reviewed:true,includeClinical:true});
describe('revisión antes de importar',()=>{
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
});
