-- Metadatos reales observados antes de corregir el límite de las vistas.
-- Solo fixture temporal: no ejecutar contra el proyecto publicado.
alter view public.patients_patient_view set (security_invoker = true);
alter view public.patient_access_view set (security_invoker = true, security_barrier = true);
