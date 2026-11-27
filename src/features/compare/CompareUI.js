"use strict";
function CompareSyncStatus({ path }) {
    const c = useCompare();
    if (path.startsWith('/organizer') || ['/login', '/signup'].includes(path)) return null;
    if (!c.syncError && !c.busy) return null;
    return React.createElement('div', { className: 'compare-sync max-w-shell mx-auto px-5 py-3', role: c.syncError ? 'alert' : 'status' },
        c.syncError || 'Syncing comparison…',
        c.syncError && React.createElement('button', { type: 'button', disabled: c.busy, className: 'compare-secondary', onClick: c.retry }, 'Retry comparison'));
}

function CompareTray({ path }) {
    const c = useCompare();
    const { user } = useAuth();
    const ref = useRef(null);
    const visible = c.ids.length > 0 && !path.startsWith('/organizer') && !['/login', '/signup', '/compare'].includes(path);
    useEffect(() => {
        if (!visible || !ref.current) return;
        const update = () => document.documentElement.style.setProperty('--compare-space', (ref.current.offsetHeight + 28) + 'px');
        update();
        const observer = new ResizeObserver(update); observer.observe(ref.current);
        return () => { observer.disconnect(); document.documentElement.style.removeProperty('--compare-space'); };
    }, [visible]);
    if (!visible) return null;
    return React.createElement(React.Fragment, null,
        React.createElement('div', { className: 'compare-spacer', 'aria-hidden': true }),
        React.createElement('aside', { ref, className: cls('compare-tray', user?.role === 'TRAVELLER' && 'compare-tray--tabs', path.startsWith('/trip/') && 'compare-tray--detail'), 'aria-label': 'Selected trips for comparison' },
            React.createElement('div', { className: 'compare-tray__top' }, React.createElement('strong', { 'aria-live': 'polite' }, 'Compare trips · ' + c.ids.length + '/3'),
                React.createElement('button', { type: 'button', disabled: c.disabled, onClick: c.clear }, 'Clear all')),
            React.createElement('div', { className: 'compare-tray__body' },
                React.createElement('ul', { className: 'compare-tray__list' }, c.ids.map(id => {
                    const trip = c.trips.find(t => t.id === id);
                    const title = trip?.title || (c.loading ? 'Loading trip…' : c.error ? 'Trip unavailable offline' : 'Trip no longer available');
                    return React.createElement('li', { key: id }, trip && React.createElement('img', { src: tripCoverSrc(trip), alt: '' }),
                        React.createElement('span', { title }, title), React.createElement('button', { type: 'button', disabled: c.disabled, onClick: () => c.remove(id), 'aria-label': 'Remove ' + title }, '×'));
                })),
                React.createElement('button', { type: 'button', className: 'compare-primary', disabled: c.disabled || c.trips.length < 2, onClick: () => go('/compare') }, 'Compare now')),
            c.ids.length === 1 && React.createElement('p', { className: 'compare-tray__hint' }, 'Add one more trip to compare.')));
}
function compareText(value) {
    if (Array.isArray(value)) return value.map(compareText).filter(v => v !== 'Not specified').join('\n') || 'Not specified';
    return (typeof value === 'string' && value.trim()) || typeof value === 'number' ? String(value) : 'Not specified';
}
function comparePrice(trip) {
    if (trip.price == null || trip.price === '' || !Number.isFinite(Number(trip.price))) return 'Not specified';
    if (trip.currency === 'INR') return INR(trip.price);
    return (trip.currency ? trip.currency + ' ' : '') + Number(trip.price).toLocaleString('en-IN');
}
const COMPARE_SECTIONS = [
    ['Trip basics', [
        ['Destination', t => [t.destination, t.region].filter(Boolean).join(', ')],
        ['Price per person', comparePrice],
        ['Duration', t => t.days != null ? t.days + ' days' + (t.nights != null ? ' / ' + t.nights + ' nights' : '') : null],
        ['Departure date', t => t.startDate && !isNaN(d(t.startDate)) ? fmtLong(t.startDate) : null],
        ['Starting location', t => t.startingFrom || t.startingLocation],
        ['Group type', t => t.groupType], ['Available spots', t => t.availableSpots]
    ]],
    ['Experience', [
        ['Trip category', t => t.category],
        ['Day-wise itinerary', t => t.itinerary?.map(day => 'Day ' + day.day + ': ' + [day.title, day.detail].filter(Boolean).join(' — '))],
        ['Activities', t => t.activities], ['Accommodation', t => t.accommodation], ['Transport', t => t.transport]
    ]],
    ['Inclusions & policies', [
        ["What's included", t => t.included], ["What's excluded", t => t.excluded], ['Cancellation policy', t => t.cancellationPolicy]
    ]],
    ['Organizer', [
        ['Organizer name', t => t.organizer?.name],
        ['Verification status', t => typeof t.organizer?.verified === 'boolean' ? (t.organizer.verified ? 'Verified' : 'Not verified') : null],
        ['Organizer rating', t => t.organizer?.rating > 0 ? t.organizer.rating + ' / 5' : null],
        ['Organizer reviews', t => t.organizer?.ratingCount],
        ['Trip rating', t => t.rating > 0 ? t.rating + ' / 5' : null], ['Trip reviews', t => t.reviews]
    ]]
];
function ComparePage() {
    const c = useCompare();
    const h = React.createElement;
    const missing = c.ids.filter(id => !c.trips.some(t => t.id === id));
    return h('main', { className: 'compare-page max-w-shell mx-auto px-5 lg:px-8 py-10 md:py-14' },
        h(Link, { to: '/explore', className: 'compare-back' }, '← Explore trips'),
        h('div', { className: 'compare-heading' }, h('div', null,
            h('p', { className: 'compare-kicker' }, 'YOUR NEXT ADVENTURE, SIDE BY SIDE'),
            h('h1', null, 'Compare trips'), h('p', null, 'Find the trip that feels right for you. Compare up to three adventures.'), h('p', { className: 'compare-account-hint' }, c.account ? 'Your selection is saved to your account.' : 'Your selection is saved on this device.')),
            c.ids.length > 0 && h('button', { type: 'button', className: 'compare-secondary', disabled: c.disabled, onClick: c.clear }, 'Clear all')),
        c.loading && h('p', { role: 'status' }, 'Loading selected trips…'),
        c.error && h('p', { role: 'alert' }, 'Trip updates are unavailable. Any details below are from the last loaded results. Use Retry above to refresh.'),
        !c.loading && missing.length > 0 && h('div', { className: 'compare-notice' },
            h('p', null, c.error ? 'Some selected trips could not be loaded.' : 'Some selected trips are no longer publicly available.'),
            h('button', { type: 'button', className: 'compare-secondary', disabled: c.disabled, onClick: c.removeUnavailable }, 'Remove unavailable selections')),
        !c.loading && c.trips.length < 2 && h('div', { className: 'compare-notice' }, h('h2', null, c.trips.length ? 'Add another adventure' : 'Your comparison starts here'),
            h('p', null, 'Choose Compare on trip cards, then return here to see the details side by side.'), h(Link, { to: '/explore', className: 'compare-primary' }, 'Explore trips')),
        c.trips.length > 0 && h(React.Fragment, null,
            h('div', { className: 'compare-toolbar' },
                h('div', { className: 'compare-toolbar__selection' }, h('span', { className: 'compare-count' }, c.trips.length + ' / 3 trips'),
                    c.ids.length < 3 && h(Link, { to: '/explore', className: 'compare-add' }, '+ Add a trip')),
                h('p', { className: 'compare-guide' }, h('span', { className: 'compare-legend', 'aria-hidden': true }), 'Shaded rows show differences')),
            h('p', { className: 'compare-swipe-hint' }, 'Swipe across to see each trip →'),
            h('div', { className: 'compare-scroll', tabIndex: 0, role: 'region', 'aria-label': 'Trip comparison table; scroll horizontally to see all trips' },
                h('table', { className: 'compare-table', style: { minWidth: (180 + c.trips.length * 260) + 'px' } },
                    h('caption', { className: 'sr-only' }, 'Selected trip details grouped by topic'),
                    h('colgroup', null, h('col', { style: { width: '180px' } }), c.trips.map(t => h('col', { key: t.id }))),
                    h('thead', null, h('tr', null, h('th', { scope: 'col', className: 'compare-overview' }, h('span', null, 'THE SHORTLIST'), h('strong', null, 'Your next adventure'), h('p', null, 'A closer look at the details that matter.')), c.trips.map(t => h('th', { key: t.id, scope: 'col' },
                        h('img', { className: 'compare-cover', src: tripCoverSrc(t), alt: t.destination || '', loading: 'lazy' }),
                        h('h2', { title: t.title }, t.title), h('p', { className: 'compare-org', title: compareText(t.organizer?.name) }, compareText(t.organizer?.name)), h('div', { className: 'compare-price-block' }, h('strong', { className: 'compare-price' }, comparePrice(t)), h('span', null, 'per person')),
                        h('div', { className: 'compare-actions' }, h(Link, { to: '/trip/' + t.slug, className: 'compare-primary' }, 'View trip & enquire'),
                            h('div', { className: 'compare-contact-slot' }, t.organizer?.whatsapp ? h(WhatsAppButton, { trip: t, org: t.organizer, size: 'sm', label: 'WhatsApp organizer', className: 'compare-contact' }) : h('span', { className: 'compare-contact-unavailable' }, 'WhatsApp not provided')),
                            h('div', { className: 'compare-manage' },
                            h('button', { type: 'button', className: 'compare-secondary', disabled: c.disabled, onClick: () => c.remove(t.id), 'aria-label': 'Remove ' + t.title }, 'Remove'),
                            h('button', { type: 'button', className: 'compare-secondary', disabled: c.disabled, onClick: async () => { if (await c.remove(t.id)) go('/explore'); }, 'aria-label': 'Replace ' + t.title }, 'Replace'))))))),
                    COMPARE_SECTIONS.map(([section, rows]) => h('tbody', { key: section },
                        h('tr', { className: 'compare-section' }, h('th', { colSpan: c.trips.length + 1, scope: 'colgroup' }, section)),
                        rows.map(([label, get]) => {
                            const values = c.trips.map(t => compareText(get(t)));
                            const different = new Set(values.filter(v => v !== 'Not specified')).size > 1;
                            return h('tr', { key: label, className: different ? 'compare-different' : '' }, h('th', { scope: 'row' }, label),
                                values.map((value, i) => h('td', { key: c.trips[i].id, className: value === 'Not specified' ? 'compare-missing' : '' }, value)));
                        })))))));
}
