-- Cierra una política legacy presente en la base publicada, ausente de la
-- instalación nueva. Con grants SELECT compartidos, exponía campos exclusivos
-- de la profesional a la paciente al consultar su fila cruda por PostgREST.
-- La paciente conserva patients_patient_view y patient_access_view; la API ya
-- usa esas vistas. La profesional conserva patients_nutri_all y sus grants.
-- No modifica datos, cuentas, vínculos, cobros ni las políticas de metas.

drop policy if exists patients_self_select on public.patients;
