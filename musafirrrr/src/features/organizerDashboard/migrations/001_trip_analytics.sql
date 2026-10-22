-- Run once in the Supabase SQL editor before deploying the frontend.
-- Assumes the existing app schema: UUID trips.id / organizers.id, organizers.user_id.
begin;

create table public.trip_analytics_events (
    id uuid primary key,
    trip_id uuid not null references public.trips(id) on delete cascade,
    kind text not null check (kind in ('page_view', 'whatsapp_click', 'instagram_click', 'enquiry_open')),
    created_at timestamptz not null default now()
);
create index trip_analytics_events_trip_time on public.trip_analytics_events (trip_id, created_at);
alter table public.trip_analytics_events enable row level security;
revoke all on public.trip_analytics_events from anon, authenticated;

-- No client timestamps, organizer IDs, personal information or enquiry events accepted.
create function public.record_trip_event(p_trip_id uuid, p_kind text, p_event_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
    if p_kind is null or p_kind not in ('page_view', 'whatsapp_click', 'instagram_click', 'enquiry_open') then
        raise exception 'Invalid event kind';
    end if;
    if not exists (select 1 from public.trips t where t.id = p_trip_id and t.status::text in ('published', 'sold_out')) then
        return;
    end if;
    -- Exclude the listing owner's signed-in preview traffic.
    if exists (select 1 from public.trips t join public.organizers o on o.id = t.organizer_id
               where t.id = p_trip_id and o.user_id = auth.uid()) then return; end if;
    insert into public.trip_analytics_events(id, trip_id, kind)
        values (p_event_id, p_trip_id, p_kind) on conflict (id) do nothing;
end;
$$;
revoke all on function public.record_trip_event(uuid, text, uuid) from public;
grant execute on function public.record_trip_event(uuid, text, uuid) to anon, authenticated;

-- Aggregate server-side to avoid PostgREST row limits and enquiry/event join multiplication.
create function public.organizer_trip_performance(p_organizer_id uuid, p_days integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
    end_at timestamptz := now();
    start_at timestamptz;
    result jsonb;
begin
    if auth.uid() is null or not exists (
        select 1 from public.organizers o where o.id = p_organizer_id and o.user_id = auth.uid()
    ) then raise exception 'Not authorized' using errcode = '42501'; end if;
    if p_days is null or p_days not in (7, 30, 90) then raise exception 'Invalid period'; end if;
    start_at := end_at - p_days * interval '24 hours';
    select coalesce(jsonb_agg(jsonb_build_object(
        'id', t.id, 'title', t.title, 'destination', t.destination,
        'views', ev.views, 'whatsapp_clicks', ev.whatsapp_clicks,
        'instagram_clicks', ev.instagram_clicks, 'enquiry_opens', ev.enquiry_opens,
        'enquiries', en.total
    ) order by t.title), '[]'::jsonb) into result
    from public.trips t
    cross join lateral (
        select count(*) filter (where e.kind = 'page_view') as views,
               count(*) filter (where e.kind = 'whatsapp_click') as whatsapp_clicks,
               count(*) filter (where e.kind = 'instagram_click') as instagram_clicks,
               count(*) filter (where e.kind = 'enquiry_open') as enquiry_opens
        from public.trip_analytics_events e
        where e.trip_id = t.id and e.created_at >= start_at and e.created_at <= end_at
    ) ev
    cross join lateral (
        select count(*) as total from public.enquiries e
        where e.trip_id = t.id and e.organizer_id = p_organizer_id
          and e.created_at >= start_at and e.created_at <= end_at
    ) en
    where t.organizer_id = p_organizer_id;
    return jsonb_build_object('days', p_days, 'as_of', end_at, 'trips', result);
end;
$$;
revoke all on function public.organizer_trip_performance(uuid, integer) from public;
grant execute on function public.organizer_trip_performance(uuid, integer) to authenticated;
commit;
