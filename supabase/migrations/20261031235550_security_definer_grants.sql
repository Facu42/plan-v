-- Relevamiento completo: docs/seguridad-definer-2026-10-31.md.
-- Ambas funciones sólo se invocan dentro de otras SECURITY DEFINER; el dueño
-- conserva EXECUTE. No son RPC de la app ni helpers usados en RLS/vistas.
-- Todas las 403 definer relevadas ya tienen search_path fijo: no se altera
-- la resolución de nombres de ningún RPC. El test exige que siga siendo así.
-- Reversión acotada: GRANT EXECUTE de estas dos firmas a authenticated.
-- No se eliminan funciones ni datos. Sólo ensayo local; sin aplicación remota.
begin;
revoke execute on function
  public.set_recipe_cover(uuid, text, text, text),
  public.scheduling_can_read_shared(uuid)
from public, anon, authenticated;
commit;
