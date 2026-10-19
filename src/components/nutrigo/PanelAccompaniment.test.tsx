import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {ProgressOverview,accompanimentCsv} from './PanelProgress';
import {FollowupSummary} from './PanelFollowup';
import {proposalPreview} from './PanelAssistant';
import {buildAccompanimentMetrics} from '../../../server/crm/accompaniment';

describe('Acompañamiento: datos sin inventar',()=>{
 it('no convierte ausencias en cero ni llama adherencia histórica al registro semanal',()=>{
  const data=buildAccompanimentMetrics({patients:[],meals:[],habits:[],measurements:[],permissions:{}},30,new Date('2026-10-20T01:00:00Z'));
  const html=renderToStaticMarkup(<ProgressOverview data={data} onOpen={()=>{}}/>);
  expect(html).toContain('Sin datos');expect(html).toContain('comidas registradas por semana');expect(html).not.toContain('+4');
  expect(renderToStaticMarkup(<FollowupSummary data={data} onOpen={()=>{}}/>)).toContain('Sin registros compartidos');
 });
 it('exporta CSV protegido contra fórmulas y conserva textos con comas y comillas',()=>{
  const data=buildAccompanimentMetrics({patients:[],meals:[],habits:[],measurements:[],permissions:{}},30,new Date('2026-10-20T01:00:00Z'));
  data.goals=[{id:'p',name:'=SUM(1,2)',goal:'"Objetivo", propio',status:'active',progress:null}];
  const csv=accompanimentCsv(data);expect(csv).toContain("'=SUM(1,2)");expect(csv).toContain('""Objetivo""');expect(csv).toContain('Sin datos');
 });
 it('sólo previsualiza propuestas de menú válidas y privadas',()=>{
  expect(proposalPreview(null)).toBeNull();
  expect(proposalPreview({status:'succeeded',applied_at:null,artifact:{kind:'menu_draft',payload:{items:[{free_text:'fake'}]}}} as never)).toBeNull();
 });
});
