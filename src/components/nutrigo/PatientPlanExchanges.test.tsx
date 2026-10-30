import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PatientExchangeList } from './PatientPlanExchanges';

describe('equivalencias visibles para la paciente', () => {
  it('conserva cantidades nativas revisadas y no modifica ni ofrece reemplazar el plan', () => {
    const html = renderToStaticMarkup(<PatientExchangeList groups={[{id:'grupo',name:'Colación revisada',revision:2,items:[{quantity:150,unit:'ml',food:{id:'leche',name:'Leche',nutrients:{kcal:50,protein:3,carbs:5,fat:2},portions:[]}}]}]}/>);
    expect(html).toContain('Leche · 150 ml');
    expect(html).not.toContain('150 g');
    expect(html).not.toContain('<button');
    expect(renderToStaticMarkup(<PatientExchangeList groups={[]}/>)).toContain('todavía no cargó grupos revisados');
  });
});
