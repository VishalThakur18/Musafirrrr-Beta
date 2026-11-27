# Compare Trips persistence

Guest comparison uses the existing device-local ID list. Signed-in comparison uses one private row per Supabase Auth user. Guest selections remain separate and are restored on sign-out; they are not automatically imported into an account.

The database migration is [202610310001_compare_trips.sql](../../../supabase/migrations/202610310001_compare_trips.sql). It was applied to project `ovcjebdtehnobbcsmync`. It adds only `trip_comparisons`, its read policy, and `update_trip_comparison`; existing tables, policies, authentication and wishlist code are unchanged.

The RPC accepts `p_owner`, `p_action` (get/add/remove/clear), and optional `p_trip_id`. It verifies the current Auth user, locks that user's row, removes unavailable selections, enforces three unique publicly listed trips, and returns IDs. Add/remove are idempotent so retries are safe. Clients cannot write the table directly or access another account's row. No service key is used by the frontend.

[compare.service.js](./compare.service.js) confirms mutations before updating the UI and retains failed actions for retry. [compare.state.js](./compare.state.js) creates a separate controller on account changes and refreshes on focus/online. Trip details still use the existing public snapshot. Missing fields remain unspecified.

Validation: comparison unit tests cover guest storage, RPC arguments, confirmed saves, retry, request serialization, account-switch races, public filtering and script ordering. Live database checks covered ownership, RLS, limit, duplicate prevention, unavailable IDs, add/remove/clear and anonymous/direct-write denial in a rollback transaction. A signed-in browser acceptance check requires a test-account session. No test credentials are stored.

Run: `node --test tests/compare.test.cjs tests/compare-sync.test.cjs` from the project root. Frontend hosting must serve the updated files and script references; the Supabase migration is already live.
