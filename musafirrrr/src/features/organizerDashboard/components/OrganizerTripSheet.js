"use strict";

/** Quoting handles commas/newlines; prefixing neutralizes spreadsheet formulas. */
function organizerSheetCsvCell(value) {
    let text = String(value == null ? '' : value);
    if (/^[\s\uFEFF]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
}

function organizerTripSheetCsv(trip, rows) {
    const header = ['Trip', 'Departure', 'Traveller contact', 'Phone', 'Email', 'Requested party size', 'Enquiry status (organizer-reported)', 'Enquiry received'];
    return '\uFEFF' + [header, ...rows.map(e => [trip.title, trip.startDate || '', e.name, e.phone, e.email, e.travellerCount, e.status, e.createdAt])]
        .map(row => row.map(organizerSheetCsvCell).join(',')).join('\r\n');
}

/** Uses only the organizer's already-loaded trips and enquiries. */
function OrganizerTripSheet({ trips, enquiries }) {
    const h = React.createElement;
    const [selected, setSelected] = useState('');
    const [confirmedOnly, setConfirmedOnly] = useState(false);
    const [search, setSearch] = useState('');
    const ordered = [...trips].sort((a, b) => {
        const visible = t => ['PUBLISHED', 'SOLD_OUT'].includes(t.status) ? 0 : 1;
        return visible(a) - visible(b) || String(a.startDate).localeCompare(String(b.startDate));
    });
    const trip = ordered.find(t => t.id === selected) || ordered[0];
    const allRows = trip ? enquiries.filter(e => e.tripId === trip.id && e.organizerId === trip.organizerId) : [];
    const query = search.trim().toLowerCase();
    const rows = allRows.filter(e => (!confirmedOnly || e.status === 'CONFIRMED') && (!query || [e.name, e.phone, e.email].some(v => String(v || '').toLowerCase().includes(query))))
        .sort((a,b) => String(a.name).localeCompare(String(b.name)));
    const download = () => {
        if (!trip) return;
        const url = URL.createObjectURL(new Blob([organizerTripSheetCsv(trip, rows)], { type: 'text/csv;charset=utf-8;' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = (trip.slug || 'trip').replace(/[^a-zA-Z0-9_-]/g, '_') + (confirmedOnly ? '-confirmed-enquiries' : '-enquiries') + '.csv';
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
    return h('section', { className: 'od-trip-sheet', 'aria-label': 'Trip-wise enquiry sheets' },
        h('div', { className: 'org-panel__heading' },
            h('div', null, h('h2', null, 'Trip-wise traveller sheets'), h('p', { className: 'od-section-note' }, 'One place for every trip’s traveller enquiries. Download the visible rows as a spreadsheet.')),
            h(Btn, { size: 'sm', variant: 'outline', disabled: !trip, onClick: download }, 'Download CSV')),
        !trip ? h('p', { className: 'od-section-note' }, 'Create a trip to start its sheet. Published trips appear here even before the first enquiry.') : h(React.Fragment, null,
            h('div', { className: 'od-sheet-controls' },
                h(Field, { label: 'Trip sheet' }, h(Select, { value: trip.id, onChange: e => { setSelected(e.target.value); setSearch(''); } }, ordered.map(t => h('option', { key: t.id, value: t.id }, `${t.title} · ${t.startDate || 'Date not set'} · ${t.status.replace(/_/g, ' ').toLowerCase()}`)))),
                h(Field, { label: 'Find a traveller in this sheet' }, h(Input, { type: 'search', value: search, onChange: e => setSearch(e.target.value), placeholder: 'Name, phone or email' }))),
            h('div', { className: 'od-sheet-summary' },
                h('label', null, h('input', { type: 'checkbox', checked: confirmedOnly, onChange: e => setConfirmedOnly(e.target.checked) }), ' Organizer-confirmed only'),
                h('span', { role: 'status', 'aria-live': 'polite' }, `${rows.length} of ${allRows.length} enquiries shown`),
                h(StatusTag, { status: trip.status })),
            h('p', { className: 'od-sheet-disclaimer' }, 'Each row is an enquiry contact, not an individual passenger. Party size is the number requested. Confirmation is organizer-reported; this is not a verified passenger manifest.'),
            h('div', { className: 'od-sheet-scroll', tabIndex: 0, role: 'region', 'aria-label': 'Traveller sheet, scroll horizontally for all columns' },
                h('table', null,
                    h('caption', null, `${trip.title} · Departure: ${trip.startDate ? fmtLong(trip.startDate) : 'Not set'}`),
                    h('thead', null, h('tr', null, ['Traveller contact', 'Phone', 'Email', 'Requested party size', 'Status', 'Received'].map(label => h('th', { key: label, scope: 'col' }, label)))),
                    h('tbody', null, rows.length ? rows.map(e => h('tr', { key: e.id }, h('th', { scope: 'row' }, e.name), h('td', null, e.phone || '—'), h('td', null, e.email || '—'), h('td', null, e.travellerCount), h('td', null, h(StatusTag, { status: e.status })), h('td', null, fmtLong(e.createdAt)))) : h('tr', null, h('td', { colSpan: 6, className: 'od-sheet-empty' }, allRows.length ? 'No enquiries match these filters. Adjust the search or confirmed-only filter.' : 'No enquiries for this trip yet. Its sheet is ready when travellers get in touch.'))))),
            h('p', { className: 'od-section-note' }, 'CSV opens in Excel or Google Sheets. Empty sheets download column headings only. Temporary notes and follow-up previews are not included.')));
}
