-- Read-only keyset pagination. Every page revalidates the current assignment;
-- a newly inserted note cannot shift earlier pages or hide historical notes.
create function public.scheduling_shared_notes(pid uuid,before_version integer default null,page_limit integer default 50) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare nid uuid; result jsonb; more boolean; cursor_version integer;
begin
 if page_limit is null or page_limit<1 or page_limit>100 or (before_version is not null and before_version<1) then raise exception 'notes_page_invalid' using errcode='22023'; end if;
 select nutritionist_id into nid from public.patients where id=pid and deactivated_at is null and anonymized_at is null;
 if nid is null or not coalesce(public.scheduling_owns(nid) or public.scheduling_can_read_shared(pid),false) then raise exception 'shared_forbidden' using errcode='42501'; end if;
 select coalesce(jsonb_agg(row_to_json(x) order by x.version desc,x.id),'[]'::jsonb) into result from (
  select id,body,created_at,version from public.clinical_notes where patient_id=pid and (before_version is null or version<before_version)
  order by version desc,id limit page_limit
 )x;
 select exists(select 1 from public.clinical_notes where patient_id=pid and (before_version is null or version<before_version) order by version desc,id offset page_limit limit 1) into more;
 if more then cursor_version=(result->(jsonb_array_length(result)-1)->>'version')::integer; end if;
 return jsonb_build_object('notes',result,'has_more',more,'next_before_version',cursor_version);
end; $$;
revoke all on function public.scheduling_shared_notes(uuid,integer,integer) from public,anon,authenticated;
grant execute on function public.scheduling_shared_notes(uuid,integer,integer) to authenticated;
