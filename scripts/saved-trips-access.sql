begin;
-- Preserve existing rows; restrict all client access to their traveller owner.
drop policy if exists "Users manage their own saved trips" on public.saved_trips;
drop policy if exists "Travellers manage own saved trips" on public.saved_trips;
alter table public.saved_trips enable row level security;
revoke all on public.saved_trips from anon, authenticated;
grant select, insert, delete on public.saved_trips to authenticated;
create policy "Travellers manage own saved trips" on public.saved_trips
for all to authenticated
using (
    user_id = (select auth.uid())
    and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role::text = 'traveller')
)
with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role::text = 'traveller')
);
commit;
