import type { PortfolioIndicators } from '../types/portfolio';
function cell(value:string|number|null) {
  let text=String(value??'');
  if(/^[\s\u0000-\u001f]*[=+@-]/.test(text))text=`'${text}`;
  return `"${text.replace(/"/g,'""')}"`;
}
export function indicatorsCsv(data:PortfolioIndicators) {
  return '\uFEFF'+[['Paciente','Registros','Período anterior','En revisión','Indicador actual (sin recalcular)'],...data.rows.map(r=>[r.name,r.meal_count,r.previous_meal_count,r.pending_review,r.adherence])].map(row=>row.map(cell).join(';')).join('\r\n');
}
