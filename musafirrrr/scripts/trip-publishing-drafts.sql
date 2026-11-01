begin;
-- Incomplete drafts can have missing dates. Public trips must have both.
alter table public.trips alter column start_date drop not null;
alter table public.trips alter column end_date drop not null;
alter table public.trips drop constraint if exists trips_public_dates_required;
alter table public.trips add constraint trips_public_dates_required
  check (status = 'draft' or (start_date is not null and end_date is not null)) not valid;
CREATE OR REPLACE FUNCTION public.save_trip(p_trip_id uuid, p jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare
  v_org     uuid;
  v_id      uuid;
  v_slug    text;
  v_current text;
  v_status  text := coalesce(p->>'status', 'draft');
  v_total   int  := (p->>'total_spots')::int;
  v_left    int  := least(coalesce((p->>'spots_left')::int, 0), (p->>'total_spots')::int);
  v_price   int  := (p->>'price')::int;
  v_adv     int  := nullif(p->>'advance_amount', '')::int;
begin
  select id into v_org from organizers where user_id = auth.uid();
  if v_org is null then raise exception 'Organizer profile not found'; end if;

  -- Partial drafts may omit dates and price; published listings must be complete.
  p := p || jsonb_build_object(
    'destination', coalesce(p->>'destination', ''),
    'start_date', nullif(p->>'start_date', ''),
    'end_date', nullif(p->>'end_date', ''),
    'duration_days', greatest(coalesce((p->>'duration_days')::int, 1), 1),
    'duration_nights', greatest(coalesce((p->>'duration_nights')::int, 0), 0)
  );
  if v_status = 'draft' then
    v_total := coalesce(v_total, 15);
    v_left := coalesce(v_left, v_total);
    v_price := coalesce(v_price, 0);
  end if;
  if v_status = 'published' then
    if nullif(p->>'start_date', '') is null or nullif(p->>'end_date', '') is null then
      raise exception 'Choose both trip dates before publishing';
    end if;
    if coalesce(trim(p->>'destination'), '') = '' or coalesce(trim(p->>'starting_location'), '') = '' then
      raise exception 'Destination and starting location are required before publishing';
    end if;
    if coalesce(length(trim(p->>'description')), 0) < 20 then
      raise exception 'Describe the trip before publishing';
    end if;
    if coalesce(jsonb_array_length(p->'itinerary'), 0) = 0 then
      raise exception 'Add an itinerary before publishing';
    end if;
    if v_price is null or v_price <= 0 then raise exception 'Enter a price before publishing'; end if;
  end if;
  if v_status not in ('draft', 'published') then raise exception 'Invalid trip status'; end if;
  if coalesce(trim(p->>'title'), '') = '' then raise exception 'Trip title is required'; end if;
  if (p->>'end_date')::date < (p->>'start_date')::date then raise exception 'The end date is before the start date'; end if;
  if v_total is null or v_total < 1 then raise exception 'Total spots must be at least 1'; end if;
  if v_price is null or v_price < 0 then raise exception 'Enter a valid price'; end if;
  if coalesce(v_adv, 0) > v_price then raise exception 'The advance can''t be more than the price'; end if;
  if v_status = 'published' and jsonb_array_length(coalesce(p->'images', '[]'::jsonb)) = 0 then
    raise exception 'Add at least one photo before publishing';
  end if;

  if p_trip_id is null then
    if v_status = 'published' and v_left = 0 then v_status := 'sold_out'; end if;

    v_slug := coalesce(nullif(trim(both '-' from lower(regexp_replace(p->>'title', '[^a-zA-Z0-9]+', '-', 'g'))), ''), 'trip')
              || '-' || substr(md5(random()::text), 1, 6);

    insert into trips (organizer_id, slug, title, destination, region, starting_location, category,
        group_type, description, start_date, end_date, duration_days, duration_nights, price,
        currency, advance_amount, total_spots, spots_left, meeting_point, status, cover_image_url, cancellation_policy, important_info)
    values (v_org, v_slug, p->>'title', p->>'destination', nullif(p->>'region', ''), p->>'starting_location',
        p->>'category', p->>'group_type', p->>'description', (p->>'start_date')::date, (p->>'end_date')::date,
        (p->>'duration_days')::int, (p->>'duration_nights')::int, v_price,
        coalesce(p->>'currency', 'INR'), v_adv, v_total, v_left, p->>'meeting_point', v_status,
        p->>'cover_image_url', p->>'cancellation_policy', p->>'important_info')
    returning id into v_id;
  else
    select status into v_current from trips where id = p_trip_id and organizer_id = v_org;
    if v_current is null then raise exception 'Trip not found'; end if;

    if v_current = 'completed' then v_status := 'completed';
    elsif v_status = 'published' and v_left = 0 then v_status := 'sold_out';
    end if;

    update trips set
        title = p->>'title', destination = p->>'destination', region = nullif(p->>'region', ''),
        starting_location = p->>'starting_location', category = p->>'category',
        group_type = p->>'group_type', description = p->>'description',
        start_date = (p->>'start_date')::date, end_date = (p->>'end_date')::date,
        duration_days = (p->>'duration_days')::int, duration_nights = (p->>'duration_nights')::int,
        price = v_price, currency = coalesce(p->>'currency', 'INR'), advance_amount = v_adv,
        total_spots = v_total, spots_left = v_left,
        meeting_point = p->>'meeting_point', status = v_status, cover_image_url = p->>'cover_image_url',
        cancellation_policy = case when p ? 'cancellation_policy' then p->>'cancellation_policy' else cancellation_policy end,
        important_info = case when p ? 'important_info' then p->>'important_info' else important_info end
    where id = p_trip_id and organizer_id = v_org
    returning id into v_id;

    delete from trip_images     where trip_id = v_id;
    delete from itinerary_days  where trip_id = v_id;
    delete from trip_inclusions where trip_id = v_id;
  end if;

  insert into trip_images (trip_id, image_url, position)
  select v_id, x.url, (x.ord - 1)::int
  from jsonb_array_elements_text(coalesce(p->'images', '[]'::jsonb)) with ordinality as x(url, ord);

  insert into itinerary_days (trip_id, day_number, title, description)
  select v_id, x.ord::int, x.e->>'title', x.e->>'description'
  from jsonb_array_elements(coalesce(p->'itinerary', '[]'::jsonb)) with ordinality as x(e, ord);

  insert into trip_inclusions (trip_id, item, kind)
  select v_id, x.t, 'included'
  from jsonb_array_elements_text(coalesce(p->'included', '[]'::jsonb)) as x(t)
  union all
  select v_id, x.t, 'excluded'
  from jsonb_array_elements_text(coalesce(p->'excluded', '[]'::jsonb)) as x(t);

  return v_id;
end;
$function$;

commit;
