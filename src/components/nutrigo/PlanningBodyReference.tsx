import { bodyMassReference } from '../../lib/body-mass-reference';
import { NvBadge } from './primitives';

const decimal = (value: number) => value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function PlanningBodyReference({ weight, height, age }: { weight: number; height: number; age: number }) {
  const reference = bodyMassReference(weight, height, age);
  if (!reference) return null;
  return <details className="nvt-body-reference">
    <summary><div><p className="nv-eyebrow">Estado nutricional</p><h3>Peso e índice de masa corporal</h3></div><span className="nvt-reference-preview">IMC {decimal(reference.bmi)} kg/m² · {reference.category ?? 'Sin clasificación por edad'}</span><NvBadge tone="gold">Ver referencias</NvBadge></summary>
    <div className="nvt-reference-layout">
      <div className="nvt-bmi-summary"><span>IMC calculado</span><strong>{decimal(reference.bmi)} <small>kg/m²</small></strong><p>{reference.category ?? 'Sin clasificación general de adultos'}</p><span>Peso ÷ talla en metros al cuadrado</span></div>
      <table><caption>Datos de la propuesta actual y referencia general</caption><thead><tr><th scope="col">Medida</th><th scope="col">Actual</th><th scope="col">Referencia</th></tr></thead><tbody>
        <tr><th scope="row">Peso</th><td>{decimal(weight)} kg</td><td>{reference.weightMin !== null && reference.weightUpperExclusive !== null ? `${decimal(reference.weightMin)} a menos de ${decimal(reference.weightUpperExclusive)} kg` : 'Requiere evaluación por edad'}</td></tr>
        <tr><th scope="row">IMC</th><td>{decimal(reference.bmi)} kg/m²</td><td>{reference.category ? '18,5 a menos de 25 kg/m²' : 'Requiere evaluación por edad'}</td></tr>
      </tbody></table>
    </div>
    <p className="nvt-note">{reference.category ? 'Referencia para adultos desde los 20 años. El IMC se interpreta junto con los antecedentes y la composición corporal; este intervalo no define una meta de peso.' : 'En menores de 20 años, el IMC requiere referencias por edad y sexo. Aquí se muestra el cálculo sin clasificarlo.'} La clasificación usa el valor sin redondear.</p>
    <a className="nvt-link" href="https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html" target="_blank" rel="noopener noreferrer">Consultar fuente: CDC · IMC</a>
  </details>;
}
