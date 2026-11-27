-- Allow authenticated organizers to delete only notes attached to their own enquiries.
-- Matches the ownership checks in the existing SELECT/INSERT/UPDATE policies.
-- Does not delete any records or change table structure.
BEGIN;

CREATE POLICY "Organizers can delete their own enquiry notes"
ON public.organizer_enquiry_notes
FOR DELETE TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.organizers o
        JOIN public.enquiries e ON e.id = organizer_enquiry_notes.enquiry_id
        WHERE o.id = organizer_enquiry_notes.organizer_id
          AND o.user_id = (SELECT auth.uid())
          AND e.organizer_id = o.id
    )
);

COMMIT;
