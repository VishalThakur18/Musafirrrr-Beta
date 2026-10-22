"use strict";

function OrganizerTripPerformance({ organizerId }) {
    const h = React.createElement;
    const [days, setDays] = useState(30);
    const [sort, setSort] = useState('views');
    const { data, loading, error, reload } = useAsync(() => tripAnalytics.report(organizerId, days), [organizerId, days]);
    // Never display a previous period's response under the newly selected period.
    const report = !loading && !error && data?.days === days ? data : null;
    const rows = report ? [...report.trips].sort((a, b) => b[sort] - a[sort] || a.title.localeCompare(b.title)) : [];
    const total = key => rows.reduce((sum, row) => sum + Number(row[key]), 0);
    const rate = (enquiries, views) => views ? (enquiries / views * 100).toFixed(1) + '%' : '\u2014';
    const leader = key => {
        const max = Math.max(0, ...rows.map(row => row[key]));
        return max ? rows.filter(row => row[key] === max).map(row => row.title).join(', ') + ` (${max})` : 'No activity yet';
    };
    return h('section', { className: 'org-panel od-performance', 'aria-label': 'Trip performance analytics' },
        h('div', { className: 'org-panel__heading' }, h('h2', null, 'Trip performance analytics'),
            h('label', { className: 'od-analytics-filter' }, h('span', null, 'Period'), h('select', { value: days, onChange: e => setDays(Number(e.target.value)) },
                [7, 30, 90].map(value => h('option', { key: value, value }, `Last ${value} days`))))),
        loading && h('p', { role: 'status' }, 'Loading performance...'),
        error && h('div', { role: 'alert' }, h('p', null, 'Analytics is unavailable. Check your connection and ensure the analytics database migration is installed.'), h(Btn, { onClick: reload }, 'Try again')),
        report && h(React.Fragment, null,
            h('div', { className: 'org-stat-grid' },
                h(Stat, { label: 'Trip page views', value: total('views'), sub: `Last ${days} days`, icon: 'compass' }),
                h(Stat, { label: 'Submitted enquiries', value: total('enquiries'), sub: 'Saved enquiry records', icon: 'inbox' }),
                h(Stat, { label: 'Enquiry rate', value: rate(total('enquiries'), total('views')), sub: 'Enquiries / page views', icon: 'grid' }),
                h(Stat, { label: 'Contact clicks', value: total('whatsapp_clicks') + total('instagram_clicks'), sub: 'WhatsApp + Instagram', icon: 'arrow' })),
            h('p', { className: 'od-section-note' }, 'Most viewed: ', leader('views')),
            h('p', { className: 'od-section-note' }, 'Most enquiries: ', leader('enquiries')),
            h('label', { className: 'od-analytics-filter' }, h('span', null, 'Sort trips by'), h('select', { value: sort, onChange: e => setSort(e.target.value) },
                h('option', { value: 'views' }, 'Page views'), h('option', { value: 'enquiries' }, 'Enquiries'))),
            rows.length ? h('div', { className: 'od-analytics-table', tabIndex: 0, role: 'region', 'aria-label': 'Performance by trip' },
                h('table', null, h('caption', null, `Trip activity in the last ${days} days`),
                    h('thead', null, h('tr', null, ['Trip / destination', 'Views', 'Enquiries', 'Enquiry rate', 'WhatsApp clicks', 'Instagram clicks', 'Enquiry form opens'].map(label => h('th', { key: label, scope: 'col' }, label)))),
                    h('tbody', null, rows.map(row => h('tr', { key: row.id },
                        h('th', { scope: 'row' }, h(Link, { to: '/organizer/edit/' + row.id }, row.title), h('small', null, row.destination)),
                        ...[row.views, row.enquiries, rate(row.enquiries, row.views), row.whatsapp_clicks, row.instagram_clicks, row.enquiry_opens].map((value, i) => h('td', { key: i }, value)))))))
                : h('p', { className: 'org-inline-empty' }, 'Create a trip to start measuring performance.'),
            h(Btn, { variant: 'ghost', onClick: reload }, 'Refresh analytics'),
            h('p', { className: 'od-availability-note' }, `Updated ${new Date(report.as_of).toLocaleString()}. Rolling ${days}-day window. Views count visible trip-page visits, including repeat visits. Tracking begins after installation; earlier views cannot be recovered. Enquiry rate is enquiries divided by recorded views, not a unique-visitor conversion rate. A dash means no views were recorded. Clicks and form opens do not confirm a conversation, enquiry or booking.`)));
}
