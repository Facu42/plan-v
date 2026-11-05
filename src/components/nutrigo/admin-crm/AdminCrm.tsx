import { CentroMando } from './CentroMando';
import './nd-unslop.css';
import './nd-unslop-etiquetas.css';

/**
 * Centro de mando en /admin: mismas secciones que Nutridash, con datos reales
 * de solo lectura (resumen, nutris, pacientes, cobros, salud y seguridad).
 */
export function AdminCrm({ adminName }: { adminName?: string }) {
  return <CentroMando adminName={adminName} />;
}
