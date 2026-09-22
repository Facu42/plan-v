-- PV-20: el snapshot publicado incluye el detalle inmutable de la receta (rinde, pasos, ingredientes, fuente).
-- Paciente y profesional leen la misma función JSON. No aplicar en un proyecto hospedado con pacientes.

create or replace function public.meal_plan_item_json(iid uuid)
returns jsonb language sql stable security definer set search_path='' as $$
  select jsonb_build_object(
    'id', i.id,
    'for_date', i.for_date,
    'slot', public.meal_plan_slot_label(i.slot),
    'recipe_id', rec.id,
    'recipe_version', v.version,
    'recipe_title', rec.title,
    'recipe', case when v.id is null then null else
      public.recipe_version_json(v.id) || jsonb_build_object('title', rec.title)
    end,
    'free_text', i.free_text,
    'portions', i.portions,
    'public_note', i.public_note
  )
  from public.meal_plan_items i
  left join public.recipe_versions v on v.id = i.recipe_version_id
  left join public.recipes rec on rec.id = v.recipe_id
  where i.id = iid;
$$;
