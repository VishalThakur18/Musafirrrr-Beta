
BEGIN;

-- 1. Add the enquiry-pause setting to existing trip listings.
ALTER TABLE public.trips
    ADD COLUMN IF NOT EXISTS enquiries_paused
    boolean NOT NULL DEFAULT false;

-- 2. Create a preparation checklist for each trip listing.
CREATE TABLE IF NOT EXISTS public.trip_preparation_checklist (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id uuid NOT NULL
        REFERENCES public.trips(id) ON DELETE CASCADE,
    item text NOT NULL
        CHECK (char_length(trim(item)) BETWEEN 1 AND 300),
    is_completed boolean NOT NULL DEFAULT false,
    position integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS
    idx_trip_preparation_checklist_trip_position
ON public.trip_preparation_checklist
    (trip_id, position, created_at);

-- 3. Restrict checklist access to the trip's owning organizer.
ALTER TABLE public.trip_preparation_checklist
    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS
    "Organizers read own trip checklist"
ON public.trip_preparation_checklist;

CREATE POLICY "Organizers read own trip checklist"
ON public.trip_preparation_checklist
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.trips t
        JOIN public.organizers o
            ON o.id = t.organizer_id
        WHERE t.id = trip_preparation_checklist.trip_id
          AND o.user_id = (SELECT auth.uid())
    )
);

DROP POLICY IF EXISTS
    "Organizers add own trip checklist items"
ON public.trip_preparation_checklist;

CREATE POLICY "Organizers add own trip checklist items"
ON public.trip_preparation_checklist
FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.trips t
        JOIN public.organizers o
            ON o.id = t.organizer_id
        WHERE t.id = trip_preparation_checklist.trip_id
          AND o.user_id = (SELECT auth.uid())
    )
);

DROP POLICY IF EXISTS
    "Organizers update own trip checklist"
ON public.trip_preparation_checklist;

CREATE POLICY "Organizers update own trip checklist"
ON public.trip_preparation_checklist
FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.trips t
        JOIN public.organizers o
            ON o.id = t.organizer_id
        WHERE t.id = trip_preparation_checklist.trip_id
          AND o.user_id = (SELECT auth.uid())
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.trips t
        JOIN public.organizers o
            ON o.id = t.organizer_id
        WHERE t.id = trip_preparation_checklist.trip_id
          AND o.user_id = (SELECT auth.uid())
    )
);

DROP POLICY IF EXISTS
    "Organizers delete own trip checklist"
ON public.trip_preparation_checklist;

CREATE POLICY "Organizers delete own trip checklist"
ON public.trip_preparation_checklist
FOR DELETE TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.trips t
        JOIN public.organizers o
            ON o.id = t.organizer_id
        WHERE t.id = trip_preparation_checklist.trip_id
          AND o.user_id = (SELECT auth.uid())
    )
);

GRANT SELECT, INSERT, UPDATE, DELETE
ON public.trip_preparation_checklist
TO authenticated;

-- 4. Preserve existing enquiry validations and add the pause check.
CREATE OR REPLACE FUNCTION public.enquiry_before_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_org uuid;
    v_status text;
    v_paused boolean;
    v_digits text;
BEGIN
    SELECT organizer_id, status, enquiries_paused
    INTO v_org, v_status, v_paused
    FROM public.trips
    WHERE id = NEW.trip_id;

    IF v_org IS NULL OR v_status IS DISTINCT FROM 'published' THEN
        RAISE EXCEPTION 'This trip is not open for enquiries';
    END IF;

    IF COALESCE(v_paused, false) THEN
        RAISE EXCEPTION 'Enquiries are paused for this trip';
    END IF;

    NEW.name := trim(coalesce(NEW.name, ''));
    NEW.phone := trim(coalesce(NEW.phone, ''));
    NEW.email := nullif(trim(coalesce(NEW.email, '')), '');
    NEW.message := nullif(trim(coalesce(NEW.message, '')), '');

    IF NEW.name = '' THEN
        RAISE EXCEPTION 'Please enter your name';
    END IF;

    v_digits := regexp_replace(NEW.phone, '\D', '', 'g');

    IF length(v_digits) < 10 OR length(v_digits) > 15 THEN
        RAISE EXCEPTION 'Enter a valid phone number';
    END IF;

    IF NEW.num_travellers IS NULL
       OR NEW.num_travellers < 1
       OR NEW.num_travellers > 50 THEN
        RAISE EXCEPTION
            'Number of travellers must be between 1 and 50';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.enquiries e
        WHERE e.trip_id = NEW.trip_id
          AND regexp_replace(e.phone, '\D', '', 'g') = v_digits
          AND e.created_at > now() - interval '24 hours'
    ) THEN
        RAISE EXCEPTION
            'You have already sent an enquiry for this trip. The organizer will contact you soon.';
    END IF;

    NEW.organizer_id := v_org;
    NEW.traveller_id := auth.uid();
    NEW.status := 'new';
    NEW.created_at := now();

    RETURN NEW;
END;
$function$;

COMMIT;
