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
