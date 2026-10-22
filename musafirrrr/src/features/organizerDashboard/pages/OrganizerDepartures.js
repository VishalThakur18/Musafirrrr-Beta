"use strict";

const DEPARTURE_CHECKLIST = ['Confirm transport', 'Confirm accommodation', 'Assign trip leader', 'Share meeting point and packing list', 'Check traveller details', 'Send departure reminder'];
const DEPARTURE_STATUSES = ['Upcoming', 'Filling Fast', 'Full', 'Completed', 'Cancelled'];

function departureRemaining(item) {
    return item.sold === null ? item.originalRemaining : Math.max(0, item.total - item.sold);
}
function departureStatus(item) {
    if (['Completed', 'Cancelled'].includes(item.status)) return item.status;
    if (item.status === 'Full' || departureRemaining(item) === 0) return 'Full';
    if (item.status === 'Filling Fast' || (departureRemaining(item) !== null && item.total > 0 && departureRemaining(item) / item.total <= .2)) return 'Filling Fast';
    return 'Upcoming';
}
function departureCountdown(item) {
    const status = departureStatus(item);
    if (status === 'Cancelled') return 'Departure cancelled';
    if (status === 'Completed') return 'Journey completed';
    if (!item.start) return 'Date not set';
    const days = daysUntil(item.start);
    if (days > 0) return `Leaves in ${days} ${days === 1 ? 'day' : 'days'}`;
    if (days === 0) return 'Leaves today';
    return item.end && daysUntil(item.end) >= 0 ? 'Journey in progress' : 'Departure has passed · review status';
}

function OrganizerDepartures() {
    const { user } = useAuth();
    const orgId = user?.organizer?.id;
    const { data, loading, error, reload } = useAsync(() => orgId ? organizerApi.trips(orgId) : Promise.resolve([]), [orgId]);
    if (loading) return React.createElement('p', { role: 'status' }, 'Loading your trip listings...');
    if (error) return React.createElement('div', { role: 'alert' }, 'Could not load trips. ', React.createElement(Btn, { onClick: reload }, 'Try again'));
    return React.createElement(DepartureWorkspace, { key: orgId, trips: data || [] });
}

/** Temporary page state only. No mutations to trips, enquiries or backend services. */
function DepartureWorkspace({ trips }) {
    const h = React.createElement;
    const [departures, setDepartures] = useState(() => trips.map(trip => ({
        id: 'listing-' + trip.id, tripId: trip.id, start: trip.startDate || '', end: trip.endDate || '',
        total: Number(trip.totalSpots) || 0, sold: null,
        originalRemaining: Number.isFinite(trip.availableSpots) ? trip.availableSpots : null,
        status: trip.status === 'COMPLETED' ? 'Completed' : trip.status === 'SOLD_OUT' ? 'Full' : 'Upcoming',
        paused: trip.status === 'DRAFT', checklist: [], source: true
    })));
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('All');
    const [editor, setEditor] = useState(null);
    const [notice, setNotice] = useState('');
    const [expanded, setExpanded] = useState({});
    const tripById = Object.fromEntries(trips.map(trip => [trip.id, trip]));
    const update = (id, patch, message) => {
        setDepartures(items => items.map(item => item.id === id ? { ...item, ...patch } : item));
        if (message) setNotice(message + ' — preview only.');
    };
    const visible = departures.filter(item => {
        const trip = tripById[item.tripId];
        return (filter === 'All' || departureStatus(item) === filter) &&
            `${trip.title} ${trip.destination}`.toLowerCase().includes(search.trim().toLowerCase());
    }).sort((a, b) => (a.start || '9999').localeCompare(b.start || '9999'));
    const active = departures.filter(item => !['Completed', 'Cancelled'].includes(departureStatus(item)));
    const groups = trips.map(trip => ({ trip, items: visible.filter(item => item.tripId === trip.id) })).filter(group => group.items.length);
    const openEditor = item => setEditor({ ...item, editKey: crypto.randomUUID() });
    const add = tripId => openEditor({ id: null, tripId: tripId || trips[0]?.id, start: '', end: '', total: '', sold: '', status: 'Upcoming', paused: false, checklist: [] });
    const reopen = item => {
        if (!(departureRemaining(item) > 0)) {
            openEditor({ ...item, status: 'Upcoming' });
            setNotice('Set total and confirmed sold seats so at least one seat remains, then apply to reopen this departure.');
            return;
        }
        update(item.id, { status: item.previousStatus || 'Upcoming' }, item.paused ? 'Departure reopened; enquiries remain paused' : 'Departure reopened');
    };
    return h('div', { className: 'od-departures' },
        h('div', { className: 'od-departures-heading' }, h('div', null,
            h('span', { className: 'od-kicker' }, 'PLAN EVERY DEPARTURE'),
            h('h1', null, 'Departures & seats'), h('p', null, 'One trip. More dates. A clear plan for every group.')),
            h(Btn, { icon: 'plus', disabled: !trips.length, onClick: () => add() }, 'Add departure')),
        h('div', { className: 'od-departure-preview', role: 'note' }, h('strong', null, 'UI preview · changes are temporary'),
            h('p', null, 'Existing dates and capacity come from your trip listings. New departures, seat changes, checklist progress and enquiry controls reset when you leave or refresh. Public listings and enquiries are not affected.')),
        h('div', { className: 'org-stat-grid' },
            h(Stat, { label: 'Active departures', value: active.length, sub: 'Excludes completed / cancelled', icon: 'cal' }),
            h(Stat, { label: 'Total seats', value: active.reduce((sum, item) => sum + item.total, 0), sub: 'Across active departures', icon: 'users' }),
            h(Stat, { label: 'Remaining seats', value: active.some(item => departureRemaining(item) === null) ? '\u2014' : active.reduce((sum, item) => sum + departureRemaining(item), 0), sub: 'Capacity, including paused dates', icon: 'grid' }),
            h(Stat, { label: 'Enquiries paused', value: active.filter(item => item.paused).length, sub: 'Preview settings only', icon: 'inbox' })),
        notice && h('p', { className: 'od-departure-notice', role: 'status' }, notice),
        editor && h(DepartureEditor, { key: editor.editKey, initial: editor, trips, departures,
            onCancel: () => setEditor(null), onApply: values => {
                if (values.id) update(values.id, values, 'Departure updated');
                else { setDepartures(items => [...items, { ...values, id: crypto.randomUUID(), source: false }]); setNotice('Departure added to this preview only.'); }
                setEditor(null);
                setSearch('');
                setFilter('All');
            } }),
        h('section', { className: 'org-panel od-departure-filters', 'aria-label': 'Filter departures' },
            h('label', null, h('span', null, 'Find a trip or destination'), h('input', { type: 'search', value: search, placeholder: 'Search your departures', onChange: e => setSearch(e.target.value) })),
            h('label', null, h('span', null, 'Departure status'), h('select', { value: filter, onChange: e => setFilter(e.target.value) }, ['All', ...DEPARTURE_STATUSES].map(status => h('option', { key: status }, status)))),
            h('p', null, `${visible.length} ${visible.length === 1 ? 'departure' : 'departures'}`)),
        !groups.length && h(EmptyState, { icon: 'cal', title: trips.length ? 'No matching departures' : 'Start with a trip listing', body: trips.length ? 'Try another search or add a new departure date.' : 'Create a trip before planning departure dates.', action: trips.length ? h(Btn, { variant: 'outline', onClick: () => { setSearch(''); setFilter('All'); } }, 'Clear filters') : h(Btn, { onClick: () => go('/organizer/create') }, 'Create trip') }),
        groups.map(({ trip, items }) => h('section', { key: trip.id, className: 'org-panel od-departure-group' },
            h('div', { className: 'od-departure-group-heading' },
                h('img', { src: tripCoverSrc(trip), alt: '' }),
                h('div', null, h('h2', null, h(Link, { to: '/organizer/trips?trip=' + encodeURIComponent(trip.id), className: 'od-departure-trip-link', title: 'View this listing in My trips' }, trip.title)), h('p', null, trip.destination, ' · ', items.length, items.length === 1 ? ' date shown' : ' dates shown')),
                h(Btn, { size: 'sm', variant: 'outline', icon: 'plus', onClick: () => add(trip.id) }, 'Add date')),
            items.map(item => {
                const status = departureStatus(item), remaining = departureRemaining(item);
                const closed = ['Full', 'Completed', 'Cancelled'].includes(status);
                const percent = item.total && remaining !== null ? Math.max(0, Math.min(100, (item.total - remaining) / item.total * 100)) : 0;
                return h('article', { key: item.id, className: 'od-departure-card', 'aria-label': trip.title + ' departure ' + item.start },
                    h('div', { className: 'od-departure-top' },
                        h('div', null, h('h3', null, item.start ? dateRange(item.start, item.end || item.start) : 'Dates to be set'), h('p', { className: 'od-departure-countdown' }, departureCountdown(item))),
                        h('div', { className: 'od-departure-badges' }, h('span', { className: 'od-departure-badge', 'data-status': status }, status), h('span', null, item.source ? 'From listing' : 'New preview date'))),
                    h('div', { className: 'od-departure-capacity' },
                        h('div', null, h('span', null, 'Total seats'), h('strong', null, item.total)),
                        h('div', null, h('span', null, 'Organizer-confirmed sold'), h('strong', null, item.sold === null ? '\u2014' : item.sold)),
                        h('div', null, h('span', null, 'Remaining seats'), h('strong', null, remaining === null ? '\u2014' : remaining))),
                    h('div', { className: 'od-departure-meter', role: 'img', 'aria-label': remaining === null ? 'Capacity unavailable' : `${remaining} of ${item.total} seats remaining` }, h('span', { style: { width: percent + '%' } })),
                    h('p', { className: 'od-departure-help' }, item.sold === null ? 'Sold count has not been confirmed. Remaining seats reflect the listing; enquiries are never counted as sales.' : 'Sold count is your manual preview entry, not a verified booking count.'),
                    h('div', { className: 'od-departure-actions' },
                        h(Btn, { size: 'sm', variant: 'outline', icon: 'edit', onClick: () => openEditor(item) }, 'Edit departure'),
                        h(Btn, { size: 'sm', variant: 'outline', disabled: closed, onClick: () => update(item.id, { paused: !item.paused }, item.paused ? 'Enquiries resumed' : 'Enquiries paused') }, item.paused ? 'Resume enquiries' : 'Pause enquiries'),
                        !['Completed', 'Cancelled'].includes(status) && h(Btn, { size: 'sm', variant: 'outline', onClick: () => status === 'Full' ? reopen(item) : update(item.id, { status: 'Full', previousStatus: item.status }, 'Departure marked full; sold count unchanged') }, status === 'Full' ? 'Reopen departure' : 'Mark full')),
                    h('p', { className: 'od-departure-enquiry-state' }, closed ? 'Enquiries closed in preview' : item.paused ? 'Enquiries paused in preview' : 'Accepting enquiries in preview'),
                    h('button', { type: 'button', className: 'od-checklist-toggle', 'aria-expanded': !!expanded[item.id], 'aria-controls': 'checklist-' + item.id, onClick: () => setExpanded(state => ({ ...state, [item.id]: !state[item.id] })) },
                        h('span', null, 'Preparation checklist'), h('span', null, `${item.checklist.length} / ${DEPARTURE_CHECKLIST.length} ready`, expanded[item.id] ? ' −' : ' +')),
                    expanded[item.id] && h('div', { id: 'checklist-' + item.id, className: 'od-departure-checklist' }, DEPARTURE_CHECKLIST.map((label, index) => h('label', { key: label },
                        h('input', { type: 'checkbox', checked: item.checklist.includes(index), onChange: e => update(item.id, { checklist: e.target.checked ? [...item.checklist, index] : item.checklist.filter(value => value !== index) }) }), h('span', null, label)))));
            }))),
        h('p', { className: 'od-departure-help' }, 'Filling Fast is suggested when 20% or fewer seats remain. Marking Full closes enquiries without increasing sold seats. Reopen departure restores availability; if no seats remain, update capacity first.'));
}

function DepartureEditor({ initial, trips, departures, onCancel, onApply }) {
    const h = React.createElement;
    const [form, setForm] = useState({ ...initial, sold: initial.sold === null ? '' : initial.sold });
    const [error, setError] = useState('');
    const ref = useRef(null);
    useEffect(() => { ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); ref.current?.querySelector('select:not(:disabled)')?.focus({ preventScroll: true }); }, [initial]);
    const change = (key, value) => { setError(''); setForm(state => ({ ...state, [key]: value })); };
    const field = (label, key, type, extra = {}) => h('label', null, h('span', null, label), h('input', { type, value: form[key], onChange: e => change(key, e.target.value), ...extra }));
    const submit = event => {
        event.preventDefault();
        const total = Number(form.total), sold = form.sold === '' ? null : Number(form.sold);
        if (!form.start || !form.end || form.end < form.start) return setError('Choose an end date on or after the departure date.');
        if (!Number.isInteger(total) || total < 1 || total > 10000 || (sold !== null && (!Number.isInteger(sold) || sold < 0 || sold > total))) return setError('Enter 1–10,000 total seats and a sold count between zero and total seats.');
        if (sold === null && (!initial.id || total !== initial.total)) return setError('Enter the organizer-confirmed sold count, including zero, to set capacity.');
        if (sold === null && initial.sold !== null && initial.sold !== '') return setError('Keep a confirmed sold count, including zero. Clearing it would restore outdated listing capacity.');
        if (departures.some(item => item.id !== form.id && item.tripId === form.tripId && item.start === form.start)) return setError('This trip already has a departure on that date. Edit the existing date instead.');
        // Preserve checklist changes made while the editor was open.
        const current = departures.find(item => item.id === form.id);
        onApply({ ...form, total, sold,
            checklist: current ? current.checklist : form.checklist,
            paused: current && form.paused === initial.paused ? current.paused : form.paused });
    };
    return h('form', { ref, onSubmit: submit, className: 'org-panel od-departure-editor' },
        h('h2', null, initial.id ? 'Edit departure' : 'Add a departure date'),
        h('p', null, 'Apply changes to this preview. Nothing is saved to your public listing.'),
        h('div', { className: 'od-departure-form-grid' },
            h('label', null, h('span', null, 'Trip listing'), h('select', { value: form.tripId, disabled: !!initial.id, onChange: e => change('tripId', e.target.value) }, trips.map(trip => h('option', { key: trip.id, value: trip.id }, trip.title)))),
            h('label', null, h('span', null, 'Status'), h('select', { 'aria-label': 'Status', value: form.status, onChange: e => change('status', e.target.value) }, DEPARTURE_STATUSES.map(status => h('option', { key: status }, status)))),
            field('Departure date', 'start', 'date', { required: true }), field('Return date', 'end', 'date', { required: true, min: form.start }),
            field('Total seats', 'total', 'number', { required: true, min: 1, max: 10000, step: 1 }), field('Organizer-confirmed seats sold', 'sold', 'number', { min: 0, max: form.total || 10000, step: 1, placeholder: 'Not confirmed' })),
        h('label', { className: 'od-departure-pause' }, h('input', { type: 'checkbox', checked: form.paused, onChange: e => change('paused', e.target.checked) }), 'Pause enquiries for this departure'),
        h('p', { className: 'od-departure-help' }, 'Full, Completed and Cancelled dates close enquiries in the preview. Zero remaining seats always displays Full.'),
        error && h('p', { role: 'alert', className: 'text-bad' }, error),
        h('div', { className: 'od-departure-actions' }, h(Btn, { type: 'submit' }, initial.id ? 'Apply preview changes' : 'Add to preview'), h(Btn, { type: 'button', variant: 'ghost', onClick: onCancel }, 'Cancel')));
}
