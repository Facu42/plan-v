import { describe,expect,it,vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PatientImportOrganizer } from './PatientImportOrganizer';
import { organizerInputSchema,validateOrganizerProposals } from '../../types/document-organizer';
describe('organización de fuentes con revisión y vía manual',()=>{
 it('explica consentimiento, no importa automáticamente y deshabilita sin paciente',()=>{
  const callback=vi.fn(),html=renderToStaticMarkup(<PatientImportOrganizer patientId="" items={[]} onReviewed={callback}/>);
  expect(html).toContain('Nada se importa automáticamente');expect(html).toContain('permiso específico');expect(html).toContain('manualmente');expect(html).toContain('disabled');expect(callback).not.toHaveBeenCalled();
 });
 it('limita cuarenta fuentes y sesenta KB sin normalizar orígenes ni textos',()=>{
  const item={text:' Texto original ',category:'history' as const,origin:{file:' archivo.pdf ',fingerprint:'a'.repeat(64)}};
  expect(organizerInputSchema.parse({request_key:crypto.randomUUID(),items:[item]}).items).toEqual([item]);
  expect(organizerInputSchema.safeParse({request_key:crypto.randomUUID(),items:Array(41).fill(item)}).success).toBe(false);
  expect(organizerInputSchema.safeParse({request_key:crypto.randomUUID(),items:Array(30).fill({...item,text:'é'.repeat(3000)})}).success).toBe(false);
  expect(()=>validateOrganizerProposals([{index:0,category:'history',heading:'inventado'}],[item])).toThrow();
 });
});
