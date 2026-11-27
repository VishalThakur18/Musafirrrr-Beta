# Revenue & Finance — current implementation report

## A. Files changed

| File | Stable anchor | Change and outcome |
| --- | --- | --- |
| [index.html](./index.html) | Organizer dashboard scripts | Loads model, form, traveller/report components, then page, before App; loads scoped CSS. |
| [constants.js](./src/config/constants.js) | ORG_NAV | Revenue & Finance sidebar link (initial implementation). |
| [App.js](./src/App.js) | Organizer route table | Finance route within organizer guard, keyed by organizer ID (initial implementation). |
| [finance.model.js](./src/features/organizerDashboard/finance/finance.model.js) | FinanceModel | Custom-trip and traveller contracts; search; contact validation; integer-minor-unit payment aggregation; safe CSV escaping. |
| [FinancialEntryForm.js](./src/features/organizerDashboard/finance/FinancialEntryForm.js) | FinancialEntryForm | Registered/custom trip choices, custom title input, existing traveller selection, manual name/contact, conditional validation and preview editing. |
| [TravellerPayments.js](./src/features/organizerDashboard/finance/TravellerPayments.js) | TravellerPayments, financeReportRows, FinanceRecordExport | New traveller breakdown and actual browser CSV generation for filtered transactions or traveller payment summaries. |
| [RevenueFinancePage.js](./src/features/organizerDashboard/pages/RevenueFinancePage.js) | RevenueFinancePage | Read-only existing organizer trip/enquiry integration, reusable custom trips, traveller details throughout, loading/error/retry handling. |
| [finance.css](./src/features/organizerDashboard/styles/finance.css) | .finance-ui | Scoped responsive layout, traveller cards and report styling. |
| [finance.test.cjs](./tests/finance.test.cjs) | Node test script | Extended tests for identity separation, repeated payments, currency/trip/organizer grouping, custom trip filtering and CSV data. |

## B. Exact modifications

The appendix contains the current complete implementation/test files and before/after diffs for the existing navigation, routing and loader files. These files were introduced in this session and remain uncommitted. No existing backend service was modified.

## C. Visual implementation summary

Revenue & Finance retains the organizer shell, fonts, shared buttons/icons/modal and ordered script architecture. Summary cards, filtering, chart, transaction management, trip disclosures and outstanding balance states remain available.

Related trip now offers registered trips, existing custom trips and Create custom trip title. Custom trips receive distinct finance-only IDs, are labelled custom throughout, and never become public platform listings. Creating another entry allows reusing the same custom trip.

Payment/refund entries have a Traveller selector plus name and phone/email fields. Registered trip contacts come from actual organizer enquiries. External travellers can be entered manually for either registered or custom trips. Previously entered travellers can be reused, preserving identity across payments. Existing contact snapshots are read-only when provided; choosing manual entry allows a new identity. A missing contact can be completed. Switching trips clears the selected traveller and booking/departure fields to prevent accidental attribution.

Transactions, mobile cards, details, per-trip disclosures, Payments by Traveller and CSV reports include traveller names/contacts. Traveller cards show payments and refunds separately, with underlying dated entries. Advances and partial payments count once. Same-name travellers are not silently merged; grouping uses stable identity, trip, organizer and currency. Missing records remain unavailable rather than inferred unpaid/zero balances.

## D. Functional UI status

Working: registered trip/contact database reads; loading/error/retry states; custom trip titles and reuse; traveller selection/manual entry; validation; review; preview editing; filters/search/sort; details; per-traveller payment totals; responsive views; filtered transaction and traveller-summary CSV generation.

Temporary: all financial entries, custom trips and manually entered traveller identities remain React-memory previews. They disappear on navigation/reload. They are clearly labelled not saved, including in exports. Exporting a CSV does not persist data to Musafirrrr.

Unavailable: financial database persistence; booking allocations; confirmed booking value, outstanding balances and estimated profit calculations; adjustments; connected financial record editing; accounting-dependent reports. No enquiry status or trip price is interpreted as an actual payment.

## E. Existing database and future integration map

| UI | Data operation | Current / future behavior |
| --- | --- | --- |
| RevenueFinancePage lookup effect | organizerApi.trips(organizerId), organizerApi.enquiries(organizerId) | Existing read-only Supabase service methods now used; organizer scope checked again on returned rows; cancelled effects ignored; independent failures and retry supported. |
| Traveller selector | Enquiry name, phone/email, travellerId, enquiry ID and trip ID | Contact lookup only. No booking confirmation or payment is inferred; enquiry and booking IDs remain separate. |
| FinancialEntryForm callback | Future createFinancialEntry/updateFinancialEntry | Currently React memory; no schema migration or guessed table is introduced. CustomTripId is separate from registered tripId. Traveller name/contact are entry snapshots. |
| Summary and trip data props | Future loadFinanceSummary/loadTripFinance | Controller must provide defined accounting results scoped to selected filters/currency. Summary reportingPeriod currently echoes the emitted filter object. |
| OutstandingBalances | Future loadOutstandingBalances | Requires actual agreed booking amounts and payment allocation/refund/adjustment policies. |
| FinanceRecordExport | financeReportRows + FinanceModel.csv | Generates a real CSV blob from currently filtered entries; names/contacts included, private notes excluded; formula-like cells escaped. No server export needed for these two reports. |

No financial ledger schema or payment service was found in the project. No financial database storage was invented. The next persistence phase needs an agreed schema/service for financial entries, custom trips and traveller identities, access policies, and accounting definitions. Currency conversion remains unsupported; reports never combine currencies into a single total.

## F. Verification

Passed:

- Node syntax checks for model, form, traveller/report components and page.
- `node tests/finance.test.cjs`: existing validation/filter/render checks plus repeated payments, decimal precision, refunds kept separate, identity/currency/trip/organizer separation, custom trip search/filter, contact validation, CSV quoting/formula neutralization and report traveller/contact/title/amount content.
- `git diff --check`.
- Browser: actual organizer trips and enquiry contacts loaded; selecting a registered trip's traveller populated name/contact. Switching to a custom trip cleared the prior identity.
- Browser: missing custom title/name/contact/amount rejected; custom trip and manual traveller created as labelled previews; reuse for a partial payment aggregated correctly; edit retained custom trip and traveller identity.
- Browser: CSV blob contained traveller name, contact, custom title, combined payment amount and unsaved status. The browser download action was invoked, but the shared browser did not emit a completed-download event, so delivery to disk is unverified.
- Browser: no page horizontal overflow at 1440, 768 or 390 pixels. Existing keyboard modal behavior retained.
- Temporary QA records were cleared by reload after verification.

Limits: no real financial save/payment processing test; no full screen-reader audit or device matrix. Existing Tailwind CDN warning and aborted sidebar enquiry-count request remain unrelated. Lightweight render smoke tests complement browser interaction checks.

## G. Final outcome

An organizer can track a manually entered payment against a platform trip or a custom external trip, select an actual enquiry contact or enter an external traveller, see each traveller's recorded payments/refunds, and generate a CSV containing names and contacts. Registered trip/contact data is real; financial entries remain explicitly temporary until financial persistence is implemented.

## Exact source appendix
### Existing files: before/after diff
```diff
diff --git a/musafirrrr/index.html b/musafirrrr/index.html
index bb169e5..c5961f8 100644
--- a/musafirrrr/index.html
+++ b/musafirrrr/index.html
@@ -18,6 +18,7 @@
 <!-- Global styles -->
 <link rel="stylesheet" href="assets/css/styles.css">
 <link rel="stylesheet" href="src/features/organizerDashboard/styles/organizerDashboard.css">
+<link rel="stylesheet" href="src/features/organizerDashboard/styles/finance.css">
 
 <!-- Tailwind (CDN) + our theme config (config must come right after the CDN script) -->
 <script src="https://cdn.tailwindcss.com"></script>
@@ -129,6 +130,10 @@
 <script src="src/features/organizerDashboard/components/OrganizerTripSheet.js"></script>
 <script src="src/features/organizerDashboard/pages/OrganizerTrips.js"></script>
 <script src="src/features/organizerDashboard/pages/OrganizerDepartures.js"></script>
+<script src="src/features/organizerDashboard/finance/finance.model.js"></script>
+<script src="src/features/organizerDashboard/finance/FinancialEntryForm.js"></script>
+<script src="src/features/organizerDashboard/finance/TravellerPayments.js"></script>
+<script src="src/features/organizerDashboard/pages/RevenueFinancePage.js"></script>
 <script src="src/features/organizerDashboard/pages/TripWizard.js"></script>
 <script src="src/features/organizerDashboard/pages/OrganizerProfileEdit.js"></script>
 <script src="src/features/organizerDashboard/pages/OrganizerSettings.js"></script>
diff --git a/musafirrrr/src/App.js b/musafirrrr/src/App.js
index 3bb4dc8..fdff808 100644
--- a/musafirrrr/src/App.js
+++ b/musafirrrr/src/App.js
@@ -84,6 +84,7 @@ function App() {
         const inner = path === '/organizer/dashboard' ? React.createElement(OrganizerDashboard, null) :
             path === '/organizer/trips' ? React.createElement(OrganizerTrips, { key: (params.trip || 'all') + ':' + (params.status || 'ALL'), selectedTripId: params.trip, initialStatus: params.status }) :
             path === '/organizer/departures' ? React.createElement(OrganizerDepartures, null) :
+            path === '/organizer/finance' ? React.createElement(RevenueFinancePage, { key: me?.organizer?.id }) :
                 path === '/organizer/create' ? React.createElement(TripWizard, null) :
                     parts[1] === 'edit' ? React.createElement(TripWizard, { tripId: parts[2] }) :
                         path === '/organizer/leads' ? React.createElement(OrganizerLeads, { key: params.status || 'ALL', initialStatus: params.status }) :
diff --git a/musafirrrr/src/config/constants.js b/musafirrrr/src/config/constants.js
index 0a7d141..b2da52f 100644
--- a/musafirrrr/src/config/constants.js
+++ b/musafirrrr/src/config/constants.js
@@ -26,7 +26,7 @@ const DURATIONS = [['', 'Any length'], ['1-3', '1–3 days'], ['4-7', '4–7 day
 
 /** Organizer sidebar links. */
 const ORG_NAV = [['/organizer/dashboard', 'chart', 'Dashboard'], ['/organizer/trips', 'grid', 'My trips'], ['/organizer/departures', 'cal', 'Departures'], ['/organizer/create', 'plus', 'Create trip'],
-    ['/organizer/leads', 'inbox', 'Leads'], ['/organizer/profile', 'user', 'Profile'], ['/organizer/settings', 'gear', 'Settings']];
+    ['/organizer/leads', 'inbox', 'Leads'], ['/organizer/finance', 'wallet', 'Revenue & Finance'], ['/organizer/profile', 'user', 'Profile'], ['/organizer/settings', 'gear', 'Settings']];
 
 /** Wizard step names. */
 const WIZARD = ['Basics', 'Dates', 'Pricing', 'Photos', 'Itinerary', 'Included', 'Not included', 'Contact', 'Preview'];
```
### Current file: [src/features/organizerDashboard/finance/finance.model.js](./src/features/organizerDashboard/finance/finance.model.js)
```
"use strict";
/** Frontend contracts only. All amounts are in major currency units; null means unknown.
 * @typedef {Object} FinancialEntry
 * @property {string} id
 * @property {string} organizerId
 * @property {string} type
 * @property {string} category
 * @property {number} amount Positive magnitude; adjustments require a future policy.
 * @property {string} currency
 * @property {string} date Local calendar date (YYYY-MM-DD), by entry event type.
 * @property {?string} tripId
 * @property {?string} customTripId Finance-only ID, never a trips-table foreign key.
 * @property {string} customTripTitle
 * @property {string} tripTitle Display snapshot for reports.
 * @property {string} travellerKey Stable platform/lead/manual identity; never grouped by name alone.
 * @property {?string} enquiryId Contact provenance only, never a booking confirmation.
 * @property {string} travellerName
 * @property {string} travellerContact Organizer-provided phone or email snapshot.
 * @property {?string} departureId
 * @property {?string} bookingId
 * @property {string} paymentMethod
 * @property {string} description
 * @property {string} referenceNumber
 * @property {string} notes
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {boolean} preview
 * @typedef {{bookingId:string,tripId:string,departureId:?string,agreedAmount:?number,currency:string,totalPayments:?number,totalRefunds:?number,adjustments:?number,outstandingAmount:?number,bookingStatus:string}} BookingFinanceSummary
 * @typedef {{reportingPeriod:Object,currency:string,confirmedBookingValue:?number,paymentsReceived:?number,outstandingBalances:?number,recordedExpenses:?number,recordedRefunds:?number,estimatedProfit:?number,cashFlow:?number}} FinanceDashboardSummary
 * Future adapter supplies {status, entries, summary, tripFinance, balances, departures, bookings}.
 * status: ready | loading | error | denied. Summary must match filters and currency.
 * Operations: loadFinanceSummary, listFinancialEntries, createFinancialEntry,
 * updateFinancialEntry, loadTripFinance, loadOutstandingBalances, exportFinanceReport.
 * No storage, network requests, booking mutations or inferred accounting rules here.
 */
const FinanceModel = (() => {
    const types = ['Payment Received', 'Advance Payment', 'Partial Payment', 'Expense', 'Refund Issued', 'Other Income', 'Adjustment'];
    const currencies = ['INR', 'USD', 'EUR', 'GBP'];
    const methods = ['UPI', 'Cash', 'Bank Transfer', 'Card', 'Other'];
    const paymentTypes = ['Payment Received', 'Advance Payment', 'Partial Payment'];
    const tripKey = entry => entry.customTripId || entry.tripId || '';
    const tripLabel = (entry, trips = []) => entry.customTripTitle || trips.find(t => t.id === entry.tripId)?.title || entry.tripTitle || (entry.tripId ? 'Trip unavailable' : 'General');
    const validContact = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || (/^[+\d\s().-]+$/.test(value) && value.replace(/\D/g, '').length >= 7 && value.replace(/\D/g, '').length <= 15);
    const expenses = ['Transport', 'Accommodation', 'Meals', 'Activities', 'Guides and Vendors', 'Permits', 'Marketing', 'Other Expenses'];
    const categories = type => type === 'Expense' ? expenses : type === 'Refund Issued' ? ['Traveller Refund'] : type === 'Other Income' ? ['Other Income'] : ['Traveller Payment'];
    const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
    const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value;
    const money = (amount, currency = 'INR') => amount == null || !Number.isFinite(amount) ? 'Not available yet' : new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(amount);
    const defaults = () => ({ period: '30', start: '', end: '', tripId: '', departureId: '', type: '', category: '', currency: 'INR', search: '', sort: 'desc' });
    function range(filters, now = today()) {
        if (filters.period === 'custom') return [filters.start, filters.end];
        if (filters.period === 'month') return [now.slice(0,8) + '01', now];
        const date = new Date(now + 'T12:00:00');
        date.setDate(date.getDate() - Number(filters.period) + 1);
        return [`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`, now];
    }
    function filter(entries, f) {
        const [start, end] = range(f);
        if (!validDate(start) || !validDate(end) || start > end) return [];
        return entries.filter(e => e.currency === f.currency && e.date >= start && e.date <= end &&
            (!f.tripId || tripKey(e) === f.tripId) && (!f.departureId || e.departureId === f.departureId) &&
            (!f.type || e.type === f.type) && (!f.category || e.category === f.category) &&
            [e.description, e.referenceNumber, e.bookingId, e.category, e.travellerName, e.travellerContact, e.customTripTitle, e.tripTitle].join(' ').toLowerCase().includes(f.search.trim().toLowerCase()))
            .sort((a,b) => (f.sort === 'asc' ? 1 : -1) * a.date.localeCompare(b.date));
    }
    function validate(entry) {
        const errors = {};
        if (!types.includes(entry.type) || entry.type === 'Adjustment') errors.type = 'Choose a supported entry type.';
        if (!/^\d+(\.\d{1,2})?$/.test(String(entry.amount)) || !Number.isFinite(Number(entry.amount)) || Number(entry.amount) <= 0 || Number(entry.amount) > 999999999999) errors.amount = 'Enter a positive amount with up to two decimal places (maximum 999,999,999,999).';
        if (!currencies.includes(entry.currency)) errors.currency = 'Choose a supported currency.';
        if (!validDate(entry.date) || entry.date > today()) errors.date = 'Choose a valid date on or before today.';
        if (!categories(entry.type).includes(entry.category)) errors.category = 'Choose a category for this entry type.';
        if (entry.paymentMethod && !methods.includes(entry.paymentMethod)) errors.paymentMethod = 'Choose an available payment method.';
        return errors;
    }
    /** Integer minor units avoid floating-point drift; identities, trip and currency remain separate. */
    function travellerPayments(entries) {
        const groups = new Map();
        entries.filter(e => paymentTypes.includes(e.type) || e.type === 'Refund Issued').forEach(e => {
            const key = JSON.stringify([e.organizerId, tripKey(e), e.travellerKey || 'unassigned:' + e.id, e.currency]);
            if (!groups.has(key)) groups.set(key, { key, ...e, paidMinor: 0, refundMinor: 0, paymentCount: 0, refundCount: 0, entries: [], preview: false });
            const row = groups.get(key);
            if (e.type === 'Refund Issued') { row.refundMinor += Math.round(e.amount * 100); row.refundCount++; }
            else { row.paidMinor += Math.round(e.amount * 100); row.paymentCount++; }
            row.entries.push(e); row.preview ||= !!e.preview;
        });
        return [...groups.values()].map(row => ({ ...row, paid: row.paymentCount ? row.paidMinor / 100 : null, refunded: row.refundCount ? row.refundMinor / 100 : null }));
    }
    // Quote cells and neutralize spreadsheet formula prefixes, including leading whitespace.
    const csvCell = value => {
        let text = String(value ?? '');
        if (/^[\s]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)) text = "'" + text;
        return '"' + text.replace(/"/g, '""') + '"';
    };
    const csv = rows => '\uFEFF' + rows.map(row => row.map(csvCell).join(',')).join('\r\n');
    return { types, currencies, methods, paymentTypes, tripKey, tripLabel, validContact, travellerPayments, csv, categories, today, validDate, money, defaults, range, filter, validate };
})();

```
### Current file: [src/features/organizerDashboard/finance/FinancialEntryForm.js](./src/features/organizerDashboard/finance/FinancialEntryForm.js)
```
"use strict";
/** Feature-local focus management supplements the shared Modal without changing it. */
function FinanceDialog({ title, onClose, children }) {
    const ref = useRef(null);
    useEffect(() => {
        const previous = document.activeElement;
        const dialog = ref.current.closest('[role="dialog"]');
        const controls = () => [...dialog.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]')];
        ref.current.querySelector('input, select, button')?.focus();
        const trap = e => {
            if (e.key !== 'Tab') return;
            const items = controls(), first = items[0], last = items[items.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        };
        dialog.addEventListener('keydown', trap);
        return () => { dialog.removeEventListener('keydown', trap); if (previous?.isConnected) previous.focus(); };
    }, []);
    return React.createElement(Modal, { open: true, onClose, label: title, size: 'lg' },
        React.createElement('div', { className: 'finance-ui finance-dialog', ref }, React.createElement('h2', null, title), children));
}

function FinancialEntryForm({ initial, organizerId, trips, contacts = [], entries = [], contactsLoading = false, contactsError = false, departures = [], bookings = [], onClose, onPreview }) {
    const h = React.createElement, m = FinanceModel;
    const [value, setValue] = useState(() => ({ type: 'Payment Received', amount: '', currency: 'INR', date: m.today(), category: 'Traveller Payment', tripId: '', customTripTitle: '', travellerKey: '', travellerName: '', travellerContact: '', enquiryId: null, departureId: '', bookingId: '', paymentMethod: '', description: '', referenceNumber: '', notes: '', ...initial, ...(initial ? { tripId: m.tripKey(initial) } : {}) }));
    const [errors, setErrors] = useState({});
    const [review, setReview] = useState(false);
    const [pending, setPending] = useState(false);
    const [failure, setFailure] = useState('');
    const set = (key, next) => { setValue(v => ({ ...v, [key]: next, ...(key === 'type' ? { category: m.categories(next)[0] } : {}), ...(key === 'tripId' ? { departureId: '', bookingId: '', customTripTitle: '', travellerKey: '', travellerName: '', travellerContact: '', enquiryId: null } : {}), ...(key === 'departureId' ? { bookingId: '' } : {}) })); setReview(false); };
    const field = (key, label, options, extra = {}) => h('label', { key }, h('span', null, label),
        h(options ? 'select' : 'input', { id: 'finance-' + key, 'aria-label': label, value: value[key] || '', onChange: e => set(key, e.target.value), 'aria-invalid': !!errors[key], 'aria-describedby': errors[key] ? 'finance-error-' + key : undefined, ...extra },
            options && options.map(o => h('option', { key: typeof o === 'string' ? o : o[0], value: typeof o === 'string' ? o : o[0] }, typeof o === 'string' ? o : o[1]))),
        errors[key] && h('small', { className: 'finance-error', id: 'finance-error-' + key }, errors[key]));
    const payment = ['Payment Received', 'Advance Payment', 'Partial Payment', 'Refund Issued'].includes(value.type);
    const custom = value.tripId === '__custom__' || !!trips.find(t => t.id === value.tripId)?.custom;
    const travellerOptions = new Map();
    if (!custom) contacts.filter(c => c.tripId === value.tripId).forEach(c => {
        const key = c.travellerId ? 'platform:' + c.travellerId : 'lead:' + c.id;
        if (!travellerOptions.has(key)) travellerOptions.set(key, { key, name: c.name || '', contact: c.phone || c.email || '', enquiryId: c.id });
    });
    entries.filter(e => m.tripKey(e) === value.tripId && e.travellerKey).forEach(e => {
        if (!travellerOptions.has(e.travellerKey)) travellerOptions.set(e.travellerKey, { key: e.travellerKey, name: e.travellerName, contact: e.travellerContact, enquiryId: e.enquiryId });
    });
    if (initial?.travellerKey && m.tripKey(initial) === value.tripId && !travellerOptions.has(initial.travellerKey)) travellerOptions.set(initial.travellerKey, { key: initial.travellerKey, name: initial.travellerName, contact: initial.travellerContact, enquiryId: initial.enquiryId });
    const chooseTraveller = event => {
        const person = travellerOptions.get(event.target.value);
        setValue(v => ({ ...v, travellerKey: person?.key || '', travellerName: person?.name || '', travellerContact: person?.contact || '', enquiryId: person?.enquiryId || null })); setReview(false);
    };
    const availableDepartures = departures.filter(d => d.tripId === value.tripId);
    const availableBookings = bookings.filter(b => b.tripId === value.tripId && (!value.departureId || b.departureId === value.departureId));
    const submit = e => {
        e.preventDefault(); const next = m.validate(value);
        if (value.tripId && value.tripId !== '__custom__' && !trips.some(t => t.id === value.tripId)) next.tripId = 'Choose an available trip.';
        if (value.tripId === '__custom__' && !value.customTripTitle.trim()) next.customTripTitle = 'Enter a title for this custom trip.';
        if (payment && !value.travellerName.trim()) next.travellerName = 'Select a traveller or enter their name.';
        if (payment && !m.validContact(value.travellerContact.trim())) next.travellerContact = 'Enter a valid phone number (7–15 digits) or email address.';
        if (value.departureId && !availableDepartures.some(d => d.id === value.departureId)) next.departureId = 'Choose a departure belonging to this trip.';
        if (payment && value.bookingId && !availableBookings.some(b => b.bookingId === value.bookingId)) next.bookingId = 'Choose a booking belonging to this trip and departure.';
        setErrors(next);
        if (Object.keys(next).length) { setReview(false); setTimeout(() => document.getElementById('finance-' + Object.keys(next)[0])?.focus(), 0); return; }
        setReview(true);
    };
    const apply = async () => {
        setPending(true); setFailure('');
        try {
            const stamp = new Date().toISOString();
            const selectedTrip = trips.find(t => t.id === value.tripId);
            const customTripId = custom ? (value.tripId === '__custom__' ? 'custom:' + crypto.randomUUID() : value.tripId) : null;
            await onPreview({ ...value, amount: Number(value.amount), organizerId, id: value.id || crypto.randomUUID(),
                tripId: custom ? null : value.tripId || null, customTripId, customTripTitle: custom ? (selectedTrip?.title || value.customTripTitle.trim()) : '', tripTitle: custom ? (selectedTrip?.title || value.customTripTitle.trim()) : selectedTrip?.title || '',
                travellerKey: payment ? value.travellerKey || 'manual:' + crypto.randomUUID() : null, travellerName: payment ? value.travellerName.trim() : '', travellerContact: payment ? value.travellerContact.trim() : '', enquiryId: payment ? value.enquiryId : null,
                departureId: custom ? null : value.departureId || null, bookingId: payment && !custom ? value.bookingId || null : null, createdAt: value.createdAt || stamp, updatedAt: stamp, preview: true });
        } catch (error) { setFailure('Could not add the preview. Your inputs are still here; please try again.'); }
        finally { setPending(false); }
    };
    return h(FinanceDialog, { title: initial ? 'Edit Financial Entry' : 'Add Financial Entry', onClose: pending ? () => {} : onClose },
        h('p', { className: 'finance-notice' }, 'Preview only · not saved. Entries disappear when you leave this page or reload. External payments are only recorded here; no money is processed.'),
        h('form', { onSubmit: submit, noValidate: true }, h('div', { className: 'finance-fields' },
            field('type', 'Entry type *', m.types.filter(t => t !== 'Adjustment')),
            field('amount', 'Amount *', null, { inputMode: 'decimal', placeholder: '0.00', required: true }),
            field('currency', 'Currency *', m.currencies), field('date', 'Date *', null, { type: 'date', max: m.today(), required: true }),
            field('category', 'Category *', m.categories(value.type)),
            field('paymentMethod', 'External payment method', [['', 'Not specified'], ...m.methods]),
            field('tripId', 'Related trip', [['', 'General / no trip'], ['__custom__', '+ Create custom trip title'], ...trips.map(t => [t.id, t.title + (t.custom ? ' · Custom trip' : ' · Registered trip')])]),
            value.tripId === '__custom__' && field('customTripTitle', 'Custom trip title *', null, { required: true, maxLength: 160, placeholder: 'e.g. Private Kerala group' }),
            custom && h('p', { className: 'finance-help finance-wide' }, 'Custom trips belong only to this finance preview. They are not published as platform listings. Reuse the same custom trip for later payments.'),
            !custom && field('departureId', 'Related departure', [['', availableDepartures.length ? 'No departure selected' : 'No departure records available'], ...availableDepartures.map(d => [d.id, d.date || d.id])], { disabled: !availableDepartures.length }),
            payment && h('label', { className: 'finance-wide' }, h('span', null, 'Traveller'), h('select', { value: value.travellerKey, onChange: chooseTraveller, 'aria-label': 'Traveller' }, h('option', { value: '' }, 'Enter a new traveller manually'), [...travellerOptions.values()].map(person => h('option', { key: person.key, value: person.key }, `${person.name || 'Unnamed traveller'} · ${person.contact || 'Contact missing'}`)))),
            payment && !custom && h('p', { className: 'finance-help finance-wide', role: contactsError ? 'alert' : 'status' }, contactsLoading ? 'Loading traveller contacts from your enquiries…' : contactsError ? 'Traveller contacts could not be loaded. You can enter details manually.' : 'Contacts come from your trip enquiries. Selecting a contact does not confirm a booking or record a payment automatically.'),
            payment && field('travellerName', 'Traveller name *', null, { maxLength: 120, required: true, readOnly: !!value.travellerKey && !!travellerOptions.get(value.travellerKey)?.name }),
            payment && field('travellerContact', 'Traveller contact (phone or email) *', null, { maxLength: 160, required: true, readOnly: !!value.travellerKey && !!travellerOptions.get(value.travellerKey)?.contact }),
            payment && !custom && field('bookingId', value.type === 'Refund Issued' ? 'Refund relates to booking' : 'Related confirmed booking', [['', availableBookings.length ? 'Unallocated' : 'Booking records not connected'], ...availableBookings.map(b => [b.bookingId, b.bookingId])], { disabled: !availableBookings.length }),
            field('description', 'Description', null, { maxLength: 300 }), field('referenceNumber', 'External reference number', null, { maxLength: 120 }),
            h('label', { className: 'finance-wide' }, h('span', null, 'Private notes'), h('textarea', { value: value.notes, maxLength: 2000, rows: 3, onChange: e => set('notes', e.target.value) }))),
            h('p', { className: 'finance-help' }, 'Adjustments require an agreed accounting policy and are unavailable in this preview.'),
            review && h('p', { className: 'finance-notice' }, `${custom ? 'Custom trip: ' : 'Trip: '}${trips.find(t => t.id === value.tripId)?.title || value.customTripTitle || 'General'}${payment ? ' · ' + value.travellerName + ' · ' + value.travellerContact : ''}`),
            review && h('div', { className: 'finance-notice', role: 'status' }, h('strong', null, 'Review your unsaved entry'), h('p', null, `${value.type} · ${m.money(Number(value.amount), value.currency)} · ${value.date} · ${value.category}`), h('p', null, value.description || 'No description')),
            failure && h('p', { role: 'alert', className: 'finance-error' }, failure),
            h('div', { className: 'finance-actions' }, h(Btn, { type: 'button', variant: 'outline', onClick: onClose, disabled: pending }, 'Cancel'),
                review ? h(Btn, { type: 'button', onClick: apply, disabled: pending, loading: pending }, pending ? 'Adding preview…' : initial ? 'Apply preview changes' : 'Add to temporary preview') : h(Btn, { type: 'submit' }, 'Review entry'))));
}

```
### Current file: [src/features/organizerDashboard/finance/TravellerPayments.js](./src/features/organizerDashboard/finance/TravellerPayments.js)
```
"use strict";
/** Paid amounts come only from entered receipts, never trip prices or enquiry statuses. */
function TravellerPayments({ entries, trips, compact = false }) {
    const h = React.createElement, m = FinanceModel, rows = m.travellerPayments(entries);
    return h('section', { className: compact ? 'finance-traveller-section' : 'finance-panel' },
        h(compact ? 'h3' : 'h2', null, 'Payments by Traveller'),
        h('p', { className: 'finance-help' }, 'Recorded payments and refunds for the current filters. Each traveller, trip and currency is kept separate. Missing records are not proof of an unpaid balance.'),
        !rows.length ? h('p', { className: 'finance-help' }, 'No traveller payment records for this selection.') : h('div', { className: 'finance-traveller-grid' }, rows.map(row =>
            h('article', { key: row.key, className: 'finance-traveller-card' },
                h('h3', null, row.travellerName || 'Traveller not linked'),
                h('p', { className: 'finance-contact' }, row.travellerContact || 'Contact not provided'),
                h('p', null, m.tripLabel(row, trips)),
                row.customTripId && h('span', { className: 'finance-badge' }, 'Custom trip'),
                row.preview && h('p', { className: 'finance-unsaved' }, 'Includes unsaved preview entries'),
                h('dl', null,
                    h('div', null, h('dt', null, 'Payments recorded'), h('dd', null, m.money(row.paid, row.currency))),
                    h('div', null, h('dt', null, 'Refunds recorded'), h('dd', null, m.money(row.refunded, row.currency)))),
                h('details', null, h('summary', null, `View ${row.entries.length} recorded entries`), row.entries.map(entry => h('p', { key: entry.id, className: 'finance-help' }, `${entry.date} · ${entry.type} · ${m.money(entry.amount, entry.currency)}${entry.preview ? ' · Not saved' : ''}`)))))));
}

function financeReportRows(entries, trips, type) {
    const m = FinanceModel;
    if (type === 'travellers') return [
        ['Traveller', 'Contact', 'Trip', 'Trip source', 'Currency', 'Payments recorded', 'Refunds recorded', 'Payment entry count', 'Refund entry count', 'Data status'],
        ...m.travellerPayments(entries).map(row => [row.travellerName || 'Not linked', row.travellerContact, m.tripLabel(row, trips), row.customTripId ? 'Custom' : row.tripId ? 'Registered' : 'General', row.currency, row.paid ?? 'Not available', row.refunded ?? 'Not available', row.paymentCount, row.refundCount, row.preview ? 'Includes unsaved preview' : 'Organizer-reported'])
    ];
    return [
        ['Date', 'Type', 'Traveller', 'Contact', 'Trip', 'Trip source', 'Category', 'Amount', 'Currency', 'External payment method', 'Description', 'Reference', 'Data status'],
        ...entries.map(e => [e.date, e.type, e.travellerName || 'Not linked', e.travellerContact, m.tripLabel(e, trips), e.customTripId ? 'Custom' : e.tripId ? 'Registered' : 'General', e.category, e.amount, e.currency, e.paymentMethod, e.description, e.referenceNumber, e.preview ? 'Not saved - preview' : 'Organizer-reported'])
    ];
}

function FinanceRecordExport({ entries, trips, filters }) {
    const h = React.createElement;
    const [type, setType] = useState('transactions');
    const [message, setMessage] = useState('');
    const rows = financeReportRows(entries, trips, type);
    const download = () => {
        let url;
        try {
            const blob = new Blob([FinanceModel.csv(rows)], { type: 'text/csv;charset=utf-8;' });
            url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url; link.download = `finance-${type}-${FinanceModel.today()}.csv`;
            document.body.appendChild(link); link.click(); link.remove();
            setMessage('CSV generated and download requested. Preview rows are labelled not saved; the download does not save them to Musafirrrr.');
        } catch (error) { setMessage('The CSV could not be generated. Please try again.'); }
        finally { if (url) setTimeout(() => URL.revokeObjectURL(url), 10000); }
    };
    return h('div', { className: 'finance-export' },
        h('p', { className: 'finance-help' }, 'Export the records currently shown using the reporting dates, trip, currency, type, category and search filters above. Traveller names and contacts are included; private notes are excluded.'),
        filters && h('p', { className: 'finance-help' }, `${FinanceModel.range(filters).join(' to ')} · ${filters.currency} · ${trips.find(t => t.id === filters.tripId)?.title || 'All trips'}`),
        h('div', { className: 'finance-transaction-tools' }, h('label', null, h('span', null, 'Available report'),
            h('select', { id: 'finance-report-type', value: type, onChange: e => { setType(e.target.value); setMessage(''); } }, h('option', { value: 'transactions' }, 'Financial transactions'), h('option', { value: 'travellers' }, 'Payments by traveller'))),
            h(Btn, { onClick: download, disabled: rows.length < 2, variant: 'outline' }, 'Download filtered CSV')),
        rows.length < 2 && h('p', { className: 'finance-help' }, 'Add or select matching records to enable the download.'),
        message && h('p', { role: 'status', className: 'finance-help' }, message));
}

```
### Current file: [src/features/organizerDashboard/pages/RevenueFinancePage.js](./src/features/organizerDashboard/pages/RevenueFinancePage.js)
```
"use strict";
function FinanceEmptyState({ title, body, action }) {
    return React.createElement('div', { className: 'finance-empty' }, React.createElement(Icon, { name: 'wallet', size: 26 }), React.createElement('h3', null, title), React.createElement('p', null, body), action);
}
function FinanceSummaryCard({ label, value, currency, description, icon }) {
    const h = React.createElement;
    return h('article', { className: 'finance-metric' }, h('div', null, h('span', null, label), h(Icon, { name: icon, size: 19 })), h('strong', null, FinanceModel.money(value, currency)), h('p', null, description));
}
function FinanceFilterBar({ filters: f, onChange, trips, departures, reset }) {
    const h = React.createElement, m = FinanceModel;
    const select = (key, label, options, disabled = false) => h('label', { key }, h('span', null, label), h('select', { value: f[key], disabled, onChange: e => onChange({ [key]: e.target.value, ...(key === 'tripId' ? { departureId: '' } : {}) }) }, options.map(([value, text]) => h('option', { key: value, value }, text))));
    const dates = m.range(f), valid = m.validDate(dates[0]) && m.validDate(dates[1]) && dates[0] <= dates[1];
    const deps = departures.filter(d => d.tripId === f.tripId);
    return h('section', { className: 'finance-panel', 'aria-label': 'Reporting filters' }, h('div', { className: 'finance-filters' },
        select('period', 'Reporting period', [['7', 'Last 7 days'], ['30', 'Last 30 days'], ['90', 'Last 90 days'], ['month', 'This month'], ['custom', 'Custom date range']]),
        select('tripId', 'Trip', [['', trips.length ? 'All trips' : 'Trip data unavailable'], ...trips.map(t => [t.id, t.title + (t.custom ? ' · Custom trip' : ' · Registered trip')])], !trips.length),
        select('departureId', 'Departure', [['', deps.length ? 'All departures' : 'No departure records'], ...deps.map(d => [d.id, d.date || d.id])], !deps.length),
        select('currency', 'Currency', m.currencies.map(c => [c,c])),
        select('type', 'Transaction type', [['', 'All types'], ...m.types.map(t => [t,t])]),
        select('category', 'Category', [['', 'All categories'], ...[...new Set(m.types.flatMap(m.categories))].map(c => [c,c])]),
        f.period === 'custom' && ['start', 'end'].map(key => h('label', { key }, h('span', null, key === 'start' ? 'From date' : 'To date'), h('input', { type: 'date', value: f[key], 'aria-describedby': 'finance-range-help', onChange: e => onChange({ [key]: e.target.value }) })))),
        h('div', { className: 'finance-section-heading' }, h('p', { id: 'finance-range-help', className: valid ? 'finance-help' : 'finance-error', role: valid ? undefined : 'alert' }, valid ? `${dates[0]} → ${dates[1]} · ${f.currency} · Filters apply to provided entries by their recorded event date. No server fetch.` : 'Choose both dates with the end on or after the start.'), h(Btn, { variant: 'ghost', onClick: reset }, 'Reset filters')));
}
/** Direct event amounts, never booking commitments or profit. Currency is filtered upstream. */
function FinanceChart({ entries, currency }) {
    const h = React.createElement;
    const series = [['Payments received', ['Payment Received', 'Advance Payment', 'Partial Payment'], '#315746'], ['Recorded expenses', ['Expense'], '#997143'], ['Recorded refunds', ['Refund Issued'], '#a4534b']];
    const relevant = entries.filter(e => series.some(s => s[1].includes(e.type)));
    if (!relevant.length) return h(FinanceEmptyState, { title: 'Your financial picture starts here', body: 'Payments, expenses and refunds will appear by recorded date. No financial activity is available for this selection.' });
    const dates = [...new Set(relevant.map(e => e.date))].sort();
    const points = dates.map(date => series.map(s => {
        const records = relevant.filter(e => e.date === date && s[1].includes(e.type));
        return records.length ? records.reduce((sum,e) => sum + e.amount, 0) : null;
    }));
    const max = Math.max(1, ...points.flat());
    return h('div', null, h('p', { className: 'finance-help' }, 'Recorded event amounts only. Temporary entries are included as unsaved previews. Other income and adjustments are excluded.'),
        h('div', { className: 'finance-chart-scroll', tabIndex: 0, role: 'region', 'aria-label': 'Financial chart; scroll horizontally for additional dates' },
            h('svg', { viewBox: `0 0 ${Math.max(600, dates.length * 80 + 110)} 270`, role: 'img', 'aria-label': `Recorded payments, expenses and refunds by date in ${currency}. Exact values follow in the chart data.` },
                h('text', { x: 8, y: 18 }, `Amount (${currency})`),
                [0, .5, 1].map(fraction => h('g', { key: fraction }, h('line', { x1: 90, x2: Math.max(590, dates.length * 80 + 100), y1: 220 - fraction * 170, y2: 220 - fraction * 170, stroke: '#e5e9e2' }), h('text', { x: 5, y: 225 - fraction * 170 }, new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(max * fraction)))),
                dates.map((date, i) => h('g', { key: date }, points[i].map((amount,j) => amount !== null && h('rect', { key: j, x: 100 + i * 80 + j * 18, y: 220 - amount / max * 170, width: 14, height: amount / max * 170, rx: 3, fill: series[j][2] }, h('title', null, `${date}: ${series[j][0]} ${FinanceModel.money(amount,currency)}`))), h('text', { x: 100 + i * 80, y: 240 }, date.slice(5)))), h('text', { x: 260, y: 264 }, 'Recorded date'))),
        h('div', { className: 'finance-legend' }, series.map(s => h('span', { key: s[0] }, h('i', { style: { background: s[2] } }), s[0]))),
        h('details', null, h('summary', null, 'View accessible chart data'), dates.map((date,i) => h('p', { key: date, className: 'finance-help' }, date, ' — ', series.map((s,j) => `${s[0]}: ${FinanceModel.money(points[i][j],currency)}`).join(' · ')))));
}
function FinancialTransactionsTable({ entries, trips, onView, onEdit, onAdd, hasEntries }) {
    const h = React.createElement;
    if (!entries.length) return h(FinanceEmptyState, { title: hasEntries ? 'No matching entries' : 'No financial records yet', body: hasEntries ? 'Try resetting your filters or choosing another currency or date range.' : 'Start organizing your trip finances by adding your first financial entry.', action: h(Btn, { onClick: onAdd, icon: 'plus' }, 'Add Financial Entry') });
    const headings = ['Date', 'Transaction Type', 'Description', 'Related Trip', 'Traveller / Contact', 'Related Booking', 'Category', 'Amount', 'Payment Method', 'Actions'];
    return h('div', { className: 'finance-table-wrap', tabIndex: 0, role: 'region', 'aria-label': 'Financial transactions' }, h('table', { className: 'finance-table' },
        h('caption', { className: 'finance-help' }, `${entries.length} entries · Preview records are not saved`), h('thead', null, h('tr', null, headings.map(label => h('th', { key: label, scope: 'col' }, label)))),
        h('tbody', null, entries.map(e => h('tr', { key: e.id }, [e.date,
            h('span', { className: 'finance-badge', 'data-tone': e.type === 'Expense' ? 'expense' : e.type === 'Refund Issued' ? 'refund' : e.type === 'Adjustment' ? 'neutral' : 'income' }, e.type),
            h('span', null, e.description || 'No description', e.preview && h('small', { className: 'finance-unsaved' }, 'Not saved · preview')),
            h('span', null, FinanceModel.tripLabel(e, trips), e.customTripId && h('small', { className: 'finance-unsaved' }, 'Custom trip')),
            h('span', null, e.travellerName || 'Not linked', h('small', { className: 'finance-contact' }, e.travellerContact || '')), e.bookingId || 'Unallocated', e.category, FinanceModel.money(e.amount,e.currency), e.paymentMethod || 'Not specified',
            h('div', { className: 'finance-actions' }, h(Btn, { variant: 'ghost', size: 'sm', onClick: () => onView(e), 'aria-label': `View ${e.description || e.type} on ${e.date}` }, 'View'), h(Btn, { variant: 'outline', size: 'sm', disabled: !e.preview, title: e.preview ? 'Edit temporary preview' : 'Editing connected records requires integration', onClick: () => onEdit(e) }, 'Edit'))
        ].map((value,i) => h('td', { key: headings[i], 'data-label': headings[i] }, value)))))));
}
function TripFinanceSummary({ trips, rows, entries = [], currency, selectedTripId, onSelect }) {
    const h = React.createElement;
    const metrics = [['confirmedBookingValue', 'Confirmed booking value'], ['paymentsReceived', 'Recorded payments received'], ['recordedExpenses', 'Recorded expenses'], ['recordedRefunds', 'Recorded refunds'], ['outstandingBalances', 'Outstanding balances'], ['estimatedProfit', 'Estimated profit']];
    return h('section', { className: 'finance-panel' }, h('h2', null, 'Financial Performance by Trip'), h('p', { className: 'finance-help' }, 'Trip metrics await defined reporting rules. Missing expenses are never assumed to be zero.'),
        !trips.length ? h(FinanceEmptyState, { title: 'No trip information available', body: 'Your already-loaded trip listings will appear here when available.' }) :
            h('div', { className: 'finance-trip-grid' }, trips.filter(t => !selectedTripId || t.id === selectedTripId).map(trip => {
                const data = rows.filter(r => r.tripId === trip.id && r.currency === currency);
                return h('details', { key: trip.id, className: 'finance-trip' }, h('summary', null, h('strong', null, trip.title), h('span', null, trip.destination || 'Destination not available'), h('small', null, 'View financial details')),
                    trip.custom && h('span', { className: 'finance-badge' }, 'Custom trip · finance only'),
                    h(TravellerPayments, { entries: entries.filter(e => FinanceModel.tripKey(e) === trip.id), trips, compact: true }),
                    !data.length && h('p', { className: 'finance-help' }, 'Awaiting organizer-entered records. Insufficient data for estimated profit.'),
                    (data.length ? data : [{}]).map((row,i) => h('div', { key: row.departureId || i }, h('p', { className: 'finance-help' }, row.departureDate || 'Departure financial information unavailable'), h('dl', null, metrics.map(([key,label]) => h('div', { key }, h('dt', null, label), h('dd', null, FinanceModel.money(row[key],currency))))))),
                    h(Btn, { variant: 'outline', size: 'sm', onClick: () => onSelect(trip.id) }, 'Filter entries to this trip'));
            })));
}
function OutstandingBalances({ balances, currency }) {
    const h = React.createElement;
    return h('section', { className: 'finance-panel' }, h('h2', null, 'Outstanding Balances'), h('p', { className: 'finance-help' }, 'Confirmed booking allocations only. Refunds do not automatically restore the amount owed.'),
        !balances.length ? h(FinanceEmptyState, { title: 'Balances are not available yet', body: 'Agreed amounts, allocated payments and adjustment rules must be connected before balances can be shown.' }) : balances.map(b => h('article', { key: b.bookingId, className: 'finance-trip' }, h('h3', null, b.bookingId), h('p', null, b.tripTitle || b.tripId), h('span', { className: 'finance-badge' }, b.bookingStatus), h('dl', null,
            [['agreedAmount','Agreed booking amount'],['totalPayments','Payments allocated'],['totalRefunds','Recorded refunds'],['adjustments','Adjustments'],['outstandingAmount','Outstanding amount']].map(([key,label]) => h('div', { key }, h('dt', null, label), h('dd', null, FinanceModel.money(b[key],currency))))))));
}
function FinanceReports({ trips, entries = [], filters }) {
    const h = React.createElement;
    return h('section', { className: 'finance-panel', id: 'finance-reports' }, h('h2', null, 'Reports & Exports'),
        h(FinanceRecordExport, { entries, trips, filters }),
        h('p', { id: 'finance-export-help', className: 'finance-help' }, 'Booking-value, outstanding-balance and accounting summaries still require integration. These additional report controls remain unavailable.'),
        h('fieldset', { disabled: true, 'aria-describedby': 'finance-export-help', className: 'finance-filters' }, h('legend', { className: 'finance-help' }, 'Prepare a financial report'),
            h('label', null, 'Report type', h('select', null, ['Monthly financial summary','Trip-wise financial summary','Recorded payment report','Outstanding balance report','Expense report','Refund report'].map(t => h('option', { key: t }, t)))),
            h('label', null, 'Trip', h('select', null, h('option', null, 'All trips'), trips.map(t => h('option', { key: t.id }, t.title)))),
            h('label', null, 'From date', h('input', { type: 'date' })), h('label', null, 'To date', h('input', { type: 'date' })), h(Btn, { disabled: true, variant: 'outline' }, 'Export CSV')));
}
/** Integration boundary: provided data is already scoped to this organizer and reporting filters.
 * onFiltersChange lets a future controller obtain matching summary/trip/balance responses.
 */
function RevenueFinancePage({ data = {}, onFiltersChange }) {
    const h = React.createElement, m = FinanceModel;
    const { user } = useAuth(); const organizerId = user?.organizer?.id;
    const [lookup, setLookup] = useState({ organizerId: null, trips: [], contacts: [], loading: true, tripsError: false, contactsError: false });
    const [lookupVersion, setLookupVersion] = useState(0);
    const [temporary, setTemporary] = useState([]), [filters, setFilters] = useState(m.defaults);
    const [editor, setEditor] = useState(null), [detail, setDetail] = useState(null), [notice, setNotice] = useState('');
    useEffect(() => { onFiltersChange?.(filters); }, [filters, onFiltersChange]);
    useEffect(() => {
        if (!organizerId || data.status === 'denied') return;
        let cancelled = false;
        setLookup({ organizerId, trips: [], contacts: [], loading: true, tripsError: false, contactsError: false });
        Promise.allSettled([organizerApi.trips(organizerId), organizerApi.enquiries(organizerId)]).then(([tripResult, contactResult]) => {
            if (cancelled) return;
            setLookup({ organizerId, trips: tripResult.status === 'fulfilled' ? tripResult.value.filter(t => t.organizerId === organizerId) : [], contacts: contactResult.status === 'fulfilled' ? contactResult.value.filter(c => c.organizerId === organizerId) : [], loading: false, tripsError: tripResult.status === 'rejected', contactsError: contactResult.status === 'rejected' });
        });
        return () => { cancelled = true; };
    }, [organizerId, lookupVersion, data.status]);
    const entries = [...(data.entries || []).filter(e => e.organizerId === organizerId), ...temporary];
    const customTrips = [...new Map(entries.filter(e => e.customTripId).map(e => [e.customTripId, { id: e.customTripId, title: e.customTripTitle, custom: true, destination: 'Outside platform / private trip' }])).values()];
    const trips = [...(lookup.organizerId === organizerId ? lookup.trips : []), ...customTrips];
    const contacts = lookup.organizerId === organizerId ? lookup.contacts : [];
    const visible = m.filter(entries, filters);
    const add = () => setEditor({ initial: null, key: crypto.randomUUID() });
    const update = patch => setFilters(f => ({ ...f, ...patch }));
    const summary = data.summary && data.summary.currency === filters.currency && JSON.stringify(data.summary.reportingPeriod) === JSON.stringify(filters) ? data.summary : {};
    const metrics = [
        ['confirmedBookingValue', 'Confirmed Booking Value', 'Organizer-reported agreed value; not cash received.', 'wallet'],
        ['paymentsReceived', 'Payments Received', 'External payments recorded as received. Advances and partial payments count once.', 'wallet'],
        ['outstandingBalances', 'Outstanding Balances', 'Requires confirmed bookings and payment allocation rules.', 'clock'],
        ['recordedExpenses', 'Recorded Expenses', 'Organizer-maintained expense records.', 'bag'],
        ['recordedRefunds', 'Recorded Refunds', 'Refunds recorded as issued externally.', 'arrow'],
        ['estimatedProfit', 'Estimated Profit', 'Requires a defined income and expense model.', 'chart']
    ];
    if (data.status === 'denied') return h('div', { className: 'finance-ui' }, h('h1', null, 'Revenue & Finance'), h('p', { role: 'alert' }, 'You do not have permission to view financial records.'));
    if (data.status === 'loading') return h('div', { className: 'finance-ui', 'aria-busy': true }, h('h1', null, 'Revenue & Finance'), h('p', { role: 'status' }, 'Loading financial information…'));
    if (data.status === 'error') return h('div', { className: 'finance-ui' }, h('h1', null, 'Revenue & Finance'), h('p', { role: 'alert' }, 'Financial information could not be loaded. Please try again later.'));
    return h('div', { className: 'finance-ui finance-page' },
        h('header', { className: 'finance-header' }, h('div', null, h('span', { className: 'finance-kicker' }, 'YOUR BUSINESS, IN PERSPECTIVE'), h('h1', null, 'Revenue & Finance'), h('p', null, 'Manage your trip finances, track recorded payments, and review your business performance.')),
            h('div', { className: 'finance-actions' }, h(Btn, { variant: 'outline', onClick: () => document.getElementById('finance-report-type')?.focus() }, 'Export Report'), h(Btn, { icon: 'plus', onClick: add }, 'Add Financial Entry'))),
        h('div', { className: 'finance-notice', role: 'note' }, h('strong', null, 'Organizer-maintained financial records'), h('p', null, 'Financial information is maintained by organizers and is not verified or processed by Musafirrrr.'), h('p', null, 'UI preview · entries are not saved and disappear when you leave this page or reload. Summary metrics await integration; temporary entries do not establish booking value, balances or profit.')),
        h('div', { className: 'finance-notice', role: lookup.tripsError || lookup.contactsError ? 'alert' : 'status' }, lookup.loading ? 'Loading your registered trips and traveller contacts…' : lookup.tripsError || lookup.contactsError ? 'Some registered trip or traveller contact data could not be loaded. Custom trips and manual traveller entry remain available.' : 'Registered trips and traveller contacts loaded from your organizer records. Financial amounts are entered separately.',
            (lookup.tripsError || lookup.contactsError) && h(Btn, { variant: 'outline', size: 'sm', onClick: () => setLookupVersion(v => v + 1) }, 'Retry trip and contact loading')),
        h('div', { className: 'finance-metrics' }, metrics.map(([key,label,description,icon]) => h(FinanceSummaryCard, { key, label, description, icon, value: summary[key], currency: filters.currency }))),
        h(FinanceFilterBar, { filters, onChange: update, trips, departures: data.departures || [], reset: () => setFilters(m.defaults()) }),
        h('section', { className: 'finance-panel' }, h('div', { className: 'finance-section-heading' }, h('h2', null, 'Financial Overview'), h('span', { className: 'finance-badge' }, filters.currency + ' · recorded activity')), h(FinanceChart, { entries: visible, currency: filters.currency })),
        h('section', { className: 'finance-panel' }, h('div', { className: 'finance-section-heading' }, h('div', null, h('h2', null, 'Financial Transactions'), h('p', { className: 'finance-help' }, 'A clear record of externally received and spent money.')), h('span', { className: 'finance-badge' }, `${visible.length} entries`)),
            h('div', { className: 'finance-transaction-tools' }, h('label', null, h('span', null, 'Search entries'), h('input', { type: 'search', value: filters.search, placeholder: 'Traveller, contact, trip or reference', onChange: e => update({ search: e.target.value }) })), h('label', null, h('span', null, 'Sort by date'), h('select', { value: filters.sort, onChange: e => update({ sort: e.target.value }) }, h('option', { value: 'desc' }, 'Newest first'), h('option', { value: 'asc' }, 'Oldest first')))),
            notice && h('p', { className: 'finance-notice', role: 'status' }, notice),
            h(FinancialTransactionsTable, { entries: visible, trips, onAdd: add, hasEntries: !!entries.length, onView: setDetail, onEdit: e => setEditor({ initial: e, key: e.id }) })),
        h(TravellerPayments, { entries: visible, trips }),
        h(TripFinanceSummary, { trips, entries: visible, rows: summary.reportingPeriod ? data.tripFinance || [] : [], currency: filters.currency, selectedTripId: filters.tripId, onSelect: tripId => update({ tripId, departureId: '' }) }),
        h(OutstandingBalances, { balances: (data.balances || []).filter(b => b.currency === filters.currency && (!filters.tripId || b.tripId === filters.tripId) && (!filters.departureId || b.departureId === filters.departureId)), currency: filters.currency }),
        h(FinanceReports, { trips, entries: visible, filters }),
        editor && h(FinancialEntryForm, { key: editor.key, initial: editor.initial, organizerId, trips, contacts, entries, contactsLoading: lookup.loading, contactsError: lookup.contactsError, departures: data.departures || [], bookings: data.bookings || [], onClose: () => setEditor(null), onPreview: entry => {
            setTemporary(items => [...items.filter(e => e.id !== entry.id), entry]); setEditor(null);
            setNotice('Entry added to the temporary preview — not saved. It may be hidden by your current filters.');
        } }),
        detail && h(FinanceDialog, { title: 'Financial entry details', onClose: () => setDetail(null) }, h('p', { className: 'finance-notice' }, detail.preview ? 'Not saved · temporary preview' : 'Organizer-reported record'),
            h('p', null, m.tripLabel(detail, trips), detail.customTripId ? ' · Custom trip' : ''),
            h('dl', { className: 'finance-detail' }, [['travellerName','Traveller'],['travellerContact','Contact'],['date','Date'],['type','Type'],['description','Description'],['category','Category'],['paymentMethod','External payment method'],['tripId','Registered trip ID'],['customTripId','Custom trip ID'],['departureId','Departure ID'],['bookingId','Booking ID'],['referenceNumber','Reference number'],['notes','Private notes']].map(([key,label]) => h('div', { key }, h('dt', null, label), h('dd', null, detail[key] || 'Not specified'))), h('div', null, h('dt', null, 'Amount'), h('dd', null, m.money(detail.amount,detail.currency)))), h(Btn, { onClick: () => setDetail(null) }, 'Close')));
}

```
### Current file: [src/features/organizerDashboard/styles/finance.css](./src/features/organizerDashboard/styles/finance.css)
```
/* Finance-only scope also covers the shared modal's portalled content. */
.finance-ui { color: #263c32; font-size: 14px; line-height: 1.6; min-width: 0; }
.finance-page { display: grid; gap: 24px; }
.finance-ui h1 { font-size: clamp(26px, 3vw, 34px); font-weight: 800; letter-spacing: -.035em; margin: 6px 0 10px; }
.finance-ui h2 { font-size: 19px; font-weight: 750; letter-spacing: -.02em; }
.finance-ui h3 { font-size: 16px; font-weight: 700; }
.finance-header { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 20px; align-items: center; }
.finance-header > div:first-child { flex: 1 1 360px; }
.finance-header p, .finance-help { color: #607075; font-size: 12px; line-height: 1.8; }
.finance-kicker { font-size: 10px; letter-spacing: .16em; font-weight: 750; color: #63755e; }
.finance-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.finance-notice { background: #f4f2e9; border: 1px solid #e5dfce; border-radius: 15px; padding: 16px 20px; font-size: 12px; color: #62583f; }
.finance-notice p + p { margin-top: 6px; }
.finance-metrics { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 14px; }
.finance-metric { padding: 22px; background: #fffefa; border: 1px solid #e5e5dc; border-radius: 18px; box-shadow: 0 3px 12px #253b3004; transition: border-color .15s; }
.finance-metric:hover { border-color: #a5b79e; }
.finance-metric > div { display: flex; justify-content: space-between; gap: 10px; font-size: 12px; font-weight: 650; }
.finance-metric svg { flex-shrink: 0; color: #627b59; }
.finance-metric > strong { display: block; font-size: clamp(17px,1.8vw,23px); line-height: 1.4; margin: 20px 0 10px; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
.finance-metric p { font-size: 11px; color: #607075; }
.finance-panel { border: 1px solid #e3e6dd; background: #fff; padding: 24px; border-radius: 20px; min-width: 0; }
.finance-section-heading { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin: 8px 0 18px; }
.finance-filters, .finance-fields { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 16px; }
.finance-ui label { display: grid; align-content: start; gap: 7px; font-size: 12px; font-weight: 600; min-width: 0; }
.finance-ui input, .finance-ui select, .finance-ui textarea { width: 100%; min-width: 0; padding: 10px 12px; min-height: 44px; border: 1px solid #d9dfd4; border-radius: 10px; background: #fafbf8; color: #263c32; font: inherit; font-weight: 400; }
.finance-ui :disabled { cursor: not-allowed; opacity: .6; }
.finance-ui :focus-visible { outline: 2px solid #315746; outline-offset: 3px; }
.finance-ui [aria-invalid="true"] { border-color: #a3443d; }
.finance-error { color: #a3443d; font-size: 12px; }
.finance-empty { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px; padding: 40px 16px; background: #fbfcf9; border: 1px dashed #dde4d7; border-radius: 14px; margin-top: 20px; }
.finance-empty > svg { color: #7b9170; }
.finance-empty p { max-width: 480px; font-size: 12px; color: #607075; }
.finance-badge { display: inline-block; padding: 5px 10px; background: #f0f3ec; border-radius: 20px; font-size: 11px; color: #315746; }
.finance-badge[data-tone="expense"] { background: #f7efdf; color: #795d32; }
.finance-badge[data-tone="refund"] { background: #faece9; color: #984b43; }
.finance-badge[data-tone="neutral"] { background: #edf0f2; color: #52606a; }
.finance-transaction-tools { display: grid; grid-template-columns: minmax(0,2fr) minmax(0,1fr); gap: 16px; margin: 20px 0; }
.finance-table-wrap { overflow-x: auto; }
.finance-table { width: 100%; min-width: 960px; border-collapse: collapse; text-align: left; font-size: 12px; }
.finance-table caption { text-align: left; padding: 10px 0; }
.finance-table th { background: #f7f8f3; color: #607075; font-weight: 600; }
.finance-table th, .finance-table td { padding: 14px 12px; border-bottom: 1px solid #e9ece4; max-width: 220px; overflow-wrap: anywhere; }
.finance-table td[data-label="Amount"] { font-variant-numeric: tabular-nums; font-weight: 700; }
.finance-contact { display: block; color: #607075; font-size: 12px; overflow-wrap: anywhere; }
.finance-traveller-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(min(100%,260px),1fr)); gap: 14px; margin-top: 18px; }
.finance-traveller-card { border: 1px solid #dde5d7; background: #fafbf8; border-radius: 14px; padding: 18px; min-width: 0; overflow-wrap: anywhere; }
.finance-traveller-card dl > div { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-top: 12px; }
.finance-traveller-card dd { font-weight: 700; font-variant-numeric: tabular-nums; }
.finance-traveller-section { margin-top: 18px; }
.finance-export { border-bottom: 1px solid #e5e9e0; margin-bottom: 20px; padding-bottom: 16px; }
.finance-unsaved { display: block; color: #80633b; font-size: 10px; margin-top: 5px; }
.finance-trip-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 16px; margin-top: 20px; }
.finance-trip { padding: 18px; border: 1px solid #e2e7dc; border-radius: 14px; margin-top: 12px; }
.finance-trip summary { cursor: pointer; min-height: 44px; }
.finance-trip summary span, .finance-trip summary small { display: block; font-size: 12px; color: #607075; }
.finance-trip dl, .finance-detail { margin: 18px 0; }
.finance-trip dl > div, .finance-detail > div { display: flex; justify-content: space-between; gap: 20px; padding: 9px 0; border-bottom: 1px solid #edf0e9; font-size: 12px; }
.finance-ui dd { text-align: right; overflow-wrap: anywhere; min-width: 0; }
.finance-ui dt { color: #607075; }
.finance-chart-scroll { overflow-x: auto; margin-top: 18px; }
.finance-chart-scroll svg { display: block; width: 100%; min-width: 600px; max-height: 330px; }
.finance-chart-scroll text { font-size: 11px; fill: #607075; }
.finance-legend { display: flex; flex-wrap: wrap; gap: 16px; font-size: 11px; margin: 16px 0; }
.finance-legend i { display: inline-block; width: 9px; height: 9px; margin-right: 6px; border-radius: 2px; }
.finance-ui details > summary { cursor: pointer; min-height: 44px; padding: 10px 0; }
.finance-dialog { padding: 30px; }
.finance-dialog h2 { margin: 4px 40px 20px 0; }
.finance-dialog .finance-notice { margin-bottom: 20px; }
.finance-fields { grid-template-columns: repeat(2,minmax(0,1fr)); margin-bottom: 18px; }
.finance-wide { grid-column: 1 / -1; }
.finance-dialog .finance-actions { justify-content: flex-end; margin-top: 20px; }
@media (max-width: 1050px) { .finance-filters { grid-template-columns: repeat(2,minmax(0,1fr)); } }
@media (max-width: 700px) {
  .finance-metrics { grid-template-columns: repeat(2,minmax(0,1fr)); }
  .finance-panel { padding: 18px; }
  .finance-metric { padding: 16px; }
  .finance-trip-grid { grid-template-columns: minmax(0,1fr); }
  .finance-table { min-width: 0; }
  .finance-table thead { display: none; }
  .finance-table, .finance-table tbody, .finance-table tr, .finance-table td { display: block; width: 100%; max-width: none; }
  .finance-table tr { margin: 12px 0; padding: 14px; border: 1px solid #dfe5d9; border-radius: 14px; }
  .finance-table td { padding: 8px 0; }
  .finance-table td::before { content: attr(data-label); display: block; color: #607075; font-size: 10px; font-weight: 400; margin-bottom: 3px; }
  .finance-table td:last-child { border: 0; }
}
@media (max-width: 480px) {
  .finance-filters, .finance-fields, .finance-transaction-tools { grid-template-columns: minmax(0,1fr); }
  .finance-dialog { padding: 22px 18px; }
  .finance-header .finance-actions { width: 100%; }
  .finance-header .finance-actions > button { flex: 1 1 150px; }
  .finance-metric > strong { font-size: 17px; }
}
@media (prefers-reduced-motion: reduce) { .finance-ui *, .finance-ui *::before { transition: none !important; animation: none !important; } }

```
### Current file: [tests/finance.test.cjs](./tests/finance.test.cjs)
```
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const context = vm.createContext({ console, Intl, Date, crypto: require('node:crypto').webcrypto });
for (const name of ['finance/finance.model.js', 'finance/FinancialEntryForm.js', 'finance/TravellerPayments.js', 'pages/RevenueFinancePage.js']) {
    vm.runInContext(fs.readFileSync(path.join(root, 'src/features/organizerDashboard', name), 'utf8'), context);
}
vm.runInContext(`
globalThis.m = FinanceModel;
globalThis.React = { createElement: (type, props, ...children) => ({ type, props: props || {}, children }) };
globalThis.useState = initial => [typeof initial === 'function' ? initial() : initial, () => {}];
globalThis.useEffect = () => {};
globalThis.useRef = () => ({ current: null });
globalThis.useAuth = () => ({ user: { organizer: { id: 'org' } } });
globalThis.useStore = () => ({ trips: [{ id: 'trip', organizerId: 'org', title: 'Real supplied trip' }] });
globalThis.Btn = 'button'; globalThis.Icon = 'svg'; globalThis.Modal = 'dialog';
`, context);
const m = context.m;
const entry = { id: 'test', organizerId: 'org', type: 'Advance Payment', amount: '1234.50', currency: 'INR', date: '2026-10-10', category: 'Traveller Payment', tripId: 'trip', description: 'Deposit', paymentMethod: 'Cash' };
assert.equal(Object.keys(m.validate(entry)).length, 0);
for (const amount of ['', '0', '-1', 'Infinity', '1.001', '1e4']) assert.ok(m.validate({ ...entry, amount }).amount);
assert.ok(m.validate({ ...entry, currency: 'INVALID' }).currency);
assert.ok(m.validate({ ...entry, date: '2026-02-30' }).date);
assert.ok(m.validate({ ...entry, type: 'Expense' }).category);
assert.ok(m.validate({ ...entry, type: 'Adjustment' }).type);
assert.equal(m.money(null), 'Not available yet');
assert.notEqual(m.money(0), 'Not available yet');
assert.equal(m.range({ period: '7' }, '2026-03-01')[0], '2026-02-23');
const filters = { ...m.defaults(), period: 'custom', start: '2026-10-01', end: '2026-10-31' };
const records = [entry, { ...entry, id: 'usd', currency: 'USD' }, { ...entry, id: 'old', date: '2026-09-30' }];
assert.equal(m.filter(records, filters).length, 1, 'Never mix currencies or outside dates');
assert.equal(m.filter(records, { ...filters, search: 'DEPOSIT' }).length, 1);
assert.equal(m.filter(records, { ...filters, tripId: 'other' }).length, 0);
assert.equal(m.filter(records, { ...filters, departureId: 'other' }).length, 0);
assert.equal(m.filter(records, { ...filters, start: '2026-11-01' }).length, 0);
assert.equal(m.filter(records, { ...filters, type: 'Payment Received' }).length, 0, 'Payment classifications remain distinct entries');
assert.equal(m.filter([{ ...entry, date: '2026-10-20' }, entry], { ...filters, sort: 'asc' })[0].date, '2026-10-10');
const custom = { ...entry, amount: 0.1, tripId: null, customTripId: 'custom:a', customTripTitle: 'Private trip', travellerKey: 'manual:a', travellerName: 'Test traveller', travellerContact: 'test@example.com' };
const payments = [custom, { ...custom, id: 'second', amount: 0.2, type: 'Partial Payment' }, { ...custom, id: 'refund', amount: 0.05, type: 'Refund Issued' }];
const totals = m.travellerPayments(payments);
assert.equal(totals.length, 1);
assert.equal(totals[0].paid, 0.3);
assert.equal(totals[0].refunded, 0.05);
assert.equal(m.travellerPayments([custom])[0].refunded, null);
assert.equal(m.travellerPayments([custom, { ...custom, travellerKey: 'manual:b' }]).length, 2, 'Same names do not merge identities');
assert.equal(m.travellerPayments([custom, { ...custom, currency: 'USD' }]).length, 2);
assert.equal(m.travellerPayments([custom, { ...custom, customTripId: 'custom:b' }]).length, 2);
assert.equal(m.travellerPayments([custom, { ...custom, organizerId: 'other' }]).length, 2);
assert.equal(m.travellerPayments([{ ...custom, type: 'Expense' }]).length, 0);
assert.equal(m.filter([custom], { ...filters, tripId: 'custom:a' }).length, 1);
assert.equal(m.filter([custom], { ...filters, search: 'test@example.com' }).length, 1);
assert.equal(m.tripLabel(custom), 'Private trip');
assert.ok(m.validContact('+91 98765 43210'));
assert.ok(m.validContact('test@example.com'));
assert.equal(m.validContact('123'), false);
assert.equal(m.validContact('not a contact'), false);
const csv = m.csv([['=1+1', 'quoted "value"', 'line\nbreak']]);
assert.ok(csv.includes("' =1+1".replace(' ', '')));
assert.ok(csv.includes('quoted ""value""'));
const report = context.financeReportRows(payments, [], 'travellers');
assert.equal(report[1][0], 'Test traveller');
assert.equal(report[1][1], 'test@example.com');
assert.equal(report[1][2], 'Private trip');
assert.equal(report[1][5], 0.3);
// Expand all functional components for render-time errors without external dependencies.
function render(node) {
    if (node == null || typeof node !== 'object') return;
    if (Array.isArray(node)) return node.forEach(render);
    if (typeof node.type === 'function') return render(node.type({ ...node.props, children: node.children }));
    node.children.forEach(render);
}
for (const status of ['ready', 'loading', 'error', 'denied']) render(context.RevenueFinancePage({ data: { status } }));
render(context.FinancialEntryForm({ organizerId: 'org', trips: [], onClose() {}, onPreview() {} }));
const populated = { ...entry, amount: 1234.5, preview: true };
render(context.FinanceChart({ entries: [populated], currency: 'INR' }));
render(context.FinancialTransactionsTable({ entries: [populated], trips: [], onView() {}, onEdit() {} }));
render(context.TripFinanceSummary({ trips: [{ id: 'trip', title: 'Trip' }], rows: [{ tripId: 'trip', currency: 'INR', paymentsReceived: 1234.5 }], currency: 'INR', onSelect() {} }));
render(context.OutstandingBalances({ balances: [{ bookingId: 'b', tripId: 'trip', agreedAmount: 2000, outstandingAmount: 765.5 }], currency: 'INR' }));
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map(x => x[1]).filter(x => !x.startsWith('http'));
scripts.forEach(file => assert.ok(fs.existsSync(path.join(root, file)), file));
assert.ok(scripts.indexOf('src/features/organizerDashboard/finance/finance.model.js') < scripts.indexOf('src/features/organizerDashboard/pages/RevenueFinancePage.js'));
assert.ok(scripts.indexOf('src/features/organizerDashboard/pages/RevenueFinancePage.js') < scripts.indexOf('src/App.js'));
console.log('PASS: finance validation, currencies, date boundaries, filtering, sorting, component render smoke checks and ordered script references.');

```
