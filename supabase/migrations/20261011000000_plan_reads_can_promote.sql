-- Un plan con vigencia pasa solo a «publicado» cuando llega su fecha, y eso ocurre
-- al abrir el plan. Esas dos lecturas estaban declaradas como de solo lectura
-- (stable) y PostgREST las corre en una transacción de solo lectura: el panel
-- recibía un 503 al abrir el plan. Pasan a ser normales.
begin;
alter function public.list_professional_meal_plan(uuid) volatile;
alter function public.list_published_meal_plan(uuid) volatile;
commit;
