
begin;

-- Support organizer-scoped trip references.
create unique index if not exists trips_id_organizer_id_uidx
    on public.trips (id, organizer_id);

-- Confirmed booking commitments are separate from enquiries.
create table if not exists public.finance_bookings (
    id uuid primary key default gen_random_uuid(),
    organizer_id uuid not null references public.organizers(id) on delete cascade,
    trip_id uuid not null,
    enquiry_id uuid references public.enquiries(id) on delete set null,
    traveller_id uuid,
    traveller_name text not null,
    traveller_contact text,
    agreed_amount numeric(14,2) not null check (agreed_amount >= 0),
    currency text not null default 'INR'
        check (currency in ('INR', 'USD', 'EUR', 'GBP')),
    status text not null default 'confirmed'
        check (status in ('confirmed', 'cancelled', 'completed')),
    notes text not null default '',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint finance_bookings_trip_owner_fk
        foreign key (trip_id, organizer_id)
        references public.trips(id, organizer_id)
        on delete cascade
);

create table if not exists public.finance_entries (
    id uuid primary key default gen_random_uuid(),
    organizer_id uuid not null references public.organizers(id) on delete cascade,
    trip_id uuid,
    booking_id uuid references public.finance_bookings(id) on delete set null,
    enquiry_id uuid references public.enquiries(id) on delete set null,
    traveller_id uuid,
    traveller_name text,
    traveller_contact text,
    transaction_type text not null check (
        transaction_type in (
            'Payment Received',
            'Advance Payment',
            'Partial Payment',
            'Expense',
            'Refund Issued',
            'Other Income'
        )
    ),
    category text not null,
    amount numeric(14,2) not null check (amount > 0),
    currency text not null default 'INR'
        check (currency in ('INR', 'USD', 'EUR', 'GBP')),
    event_date date not null default current_date
        check (event_date <= current_date),
    payment_method text check (
        payment_method is null or payment_method in
            ('UPI', 'Cash', 'Bank Transfer', 'Card', 'Other')
    ),
    description text not null default '',
    reference_number text not null default '',
    notes text not null default '',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint finance_entries_trip_owner_fk
        foreign key (trip_id, organizer_id)
        references public.trips(id, organizer_id)
        on delete set null
);

-- Validate booking ownership and matching trip/currency on every write.
create or replace function public.validate_finance_entry()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
    b record;
begin
    if new.booking_id is not null then
        select id, organizer_id, trip_id, currency, status
        into b
        from public.finance_bookings
        where id = new.booking_id;

        if not found
           or b.organizer_id <> new.organizer_id
           or b.trip_id is distinct from new.trip_id
           or b.currency <> new.currency
           or b.status = 'cancelled' then
            raise exception 'Booking does not match this organizer, trip, currency or status';
        end if;

        if new.transaction_type not in (
            'Payment Received', 'Advance Payment',
            'Partial Payment', 'Refund Issued'
        ) then
            raise exception 'Only payments and refunds can be linked to a booking';
        end if;
    end if;

    if new.enquiry_id is not null and not exists (
        select 1 from public.enquiries e
        where e.id = new.enquiry_id
          and e.organizer_id = new.organizer_id
          and e.trip_id is not distinct from new.trip_id
    ) then
        raise exception 'Enquiry does not belong to this organizer and trip';
    end if;

    new.updated_at := now();
    return new;
end;
$$;

drop trigger if exists finance_entries_validate on public.finance_entries;
create trigger finance_entries_validate
before insert or update on public.finance_entries
for each row execute function public.validate_finance_entry();

create index if not exists finance_entries_owner_date_idx
    on public.finance_entries (organizer_id, event_date desc);

create index if not exists finance_entries_owner_trip_idx
    on public.finance_entries (organizer_id, trip_id, event_date desc);

create index if not exists finance_entries_booking_idx
    on public.finance_entries (booking_id, transaction_type);

create index if not exists finance_bookings_owner_trip_idx
    on public.finance_bookings (organizer_id, trip_id, status);

alter table public.finance_entries enable row level security;
alter table public.finance_bookings enable row level security;

drop policy if exists finance_entries_select_own on public.finance_entries;
create policy finance_entries_select_own
on public.finance_entries for select to authenticated
using (
    exists (
        select 1 from public.organizers o
        where o.id = finance_entries.organizer_id
          and o.user_id = (select auth.uid())
    )
);

drop policy if exists finance_entries_insert_own on public.finance_entries;
create policy finance_entries_insert_own
on public.finance_entries for insert to authenticated
with check (
    exists (
        select 1 from public.organizers o
        where o.id = finance_entries.organizer_id
          and o.user_id = (select auth.uid())
    )
);

drop policy if exists finance_entries_update_own on public.finance_entries;
create policy finance_entries_update_own
on public.finance_entries for update to authenticated
using (
    exists (
        select 1 from public.organizers o
        where o.id = finance_entries.organizer_id
          and o.user_id = (select auth.uid())
    )
)
with check (
    exists (
        select 1 from public.organizers o
        where o.id = finance_entries.organizer_id
          and o.user_id = (select auth.uid())
    )
);

drop policy if exists finance_entries_delete_own on public.finance_entries;
create policy finance_entries_delete_own
on public.finance_entries for delete to authenticated
using (
    exists (
        select 1 from public.organizers o
        where o.id = finance_entries.organizer_id
          and o.user_id = (select auth.uid())
    )
);

drop policy if exists finance_bookings_select_own on public.finance_bookings;
create policy finance_bookings_select_own
on public.finance_bookings for select to authenticated
using (
    exists (
        select 1 from public.organizers o
        where o.id = finance_bookings.organizer_id
          and o.user_id = (select auth.uid())
    )
);

drop policy if exists finance_bookings_insert_own on public.finance_bookings;
create policy finance_bookings_insert_own
on public.finance_bookings for insert to authenticated
with check (
    exists (
        select 1 from public.organizers o
        where o.id = finance_bookings.organizer_id
          and o.user_id = (select auth.uid())
    )
);

drop policy if exists finance_bookings_update_own on public.finance_bookings;
create policy finance_bookings_update_own
on public.finance_bookings for update to authenticated
using (
    exists (
        select 1 from public.organizers o
        where o.id = finance_bookings.organizer_id
          and o.user_id = (select auth.uid())
    )
)
with check (
    exists (
        select 1 from public.organizers o
        where o.id = finance_bookings.organizer_id
          and o.user_id = (select auth.uid())
    )
);

drop policy if exists finance_bookings_delete_own on public.finance_bookings;
create policy finance_bookings_delete_own
on public.finance_bookings for delete to authenticated
using (
    exists (
        select 1 from public.organizers o
        where o.id = finance_bookings.organizer_id
          and o.user_id = (select auth.uid())
    )
);

grant select, insert, update, delete
    on public.finance_entries, public.finance_bookings
    to authenticated;

commit;
