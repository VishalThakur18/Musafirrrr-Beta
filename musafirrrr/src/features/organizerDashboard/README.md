# Organizer dashboard frontend

## Departure & seat management UI preview

[OrganizerDepartures.js](pages/OrganizerDepartures.js) provides the `/organizer/departures` screen, linked from navigation and the overview. It reads existing trip listings and keeps all edits in component state. Multiple dates, manual sold counts, status changes, enquiry pause/full controls and six preparation tasks are interactive previews only. Navigation or refresh discards them. There are no backend writes, localStorage persistence or changes to public enquiry availability. Existing remaining capacity is not treated as confirmed sales; sold counts start unknown. Marking Full closes preview enquiries without changing sold seats. Backend persistence and public departure selection remain future work.

## Trip performance analytics

The overview uses [OrganizerTripPerformance](components/OrganizerTripPerformance.js) and [analytics.service.js](services/analytics.service.js). Apply [001_trip_analytics.sql](migrations/001_trip_analytics.sql) in the Supabase SQL editor before deploying. It assumes UUID trip/organizer IDs and the existing `organizers.user_id` ownership column; verify these against the deployed schema first. No live database migration has been applied by this change.

The report aggregates on the server, checks organizer ownership, and supports rolling 7, 30 and 90 × 24-hour windows using server timestamps. It includes every current listing, even with zero activity. Enquiries come only from saved `enquiries` records, regardless of their later status; event tracking never creates enquiries or updates lead status. Rates with zero recorded views display a dash; rates can exceed 100% because repeat enquiries and untracked visits are possible.

Visible public trip-page navigations record a view once per mount/slug, including repeat visits and reloads. Background tabs wait until visible. Store refreshes and re-renders do not create extra views. WhatsApp, Instagram and enquiry-form buttons record separate click/open events only when associated with a real database trip. Signed-in owner traffic is excluded server-side. Failed telemetry never interrupts navigation and is not counted. There is no historical view backfill, local/demo analytics, visitor identity or confirmed-conversation inference.

Raw events are inaccessible to public clients. The write RPC validates published/sold-out trips, restricts event types, assigns server timestamps and deduplicates event UUIDs. Anonymous telemetry remains best-effort and can be blocked or spoofed; these counts are not audited unique visitors. For abuse resistance at scale, put collection behind a rate-limited server endpoint. Set an operational retention policy as event volume grows.

After installation, verify with two organizer accounts and a logged-out visitor: open a published trip, click each contact button, submit one enquiry, and inspect all periods. Only the owning organizer should read that trip's report. Verify a draft cannot collect events, a repeated event UUID counts once, an owner visit does not count, and events outside a period are excluded. The local tests exercise client behavior; database authorization and SQL must also be checked on the deployed schema.

- `pages/`: Overview, Leads, My Trips, trip editor, Profile and Settings.
- `components/`: the shared organizer shell and future organizer-only components.
- `styles/organizerDashboard.css`: all new organizer feature styles, scoped under `.organizer-workspace`.

Existing dashboard styling remains in [the global stylesheet](../../../../assets/css/styles.css). The new stylesheet loads after it. Do not duplicate the existing rules during feature work.

Pages are plain global React scripts, loaded explicitly by [index.html](../../../../index.html). Preserve script order when adding or moving files. Hash routes are unchanged.

Shared UI controls, authentication and backend services remain in their existing shared locations. The existing shared lead row stays in `pages/OrganizerDashboard.js`; no component logic was changed during this move.

## Deferred: complete Notes & Follow-up

User deferred this work on 2026-10-21. Keep the existing UI preview; do not treat this feature as complete or implement its backend without renewed approval.

- Current notes, last-contacted time and follow-up date are temporary page state, cleared on navigation or refresh.
- Complete organizer-private note saving/editing and persistent last-contacted/follow-up dates.
- Connect overdue, due-today and upcoming filters to saved records, and add dashboard reminders.
- Include saving, success, error and conflicting-edit feedback.
- First finish Phase 1A using actual Supabase schema, constraints, policies and trigger/function definitions. Database isolation has not yet been verified.
- Enforce organizer ownership in the database; travellers and other organizers must not access private notes.
- Opening WhatsApp or a phone link must not automatically record successful contact or change lead status.
- Preserve existing enquiry records, status meanings and seat availability. No backend changes have been made for this feature.
