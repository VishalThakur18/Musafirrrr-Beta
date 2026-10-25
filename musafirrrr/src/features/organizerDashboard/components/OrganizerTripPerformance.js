"use strict";

function OrganizerTripPerformance({ organizerId }) {
    const h = React.createElement;
    const [days, setDays] = useState(30);
    const [sort, setSort] = useState('enquiries');
    const [view, setView] = useState('graphs');
    const forceRefresh = useRef(false);
    const { data, loading, error, reload: reloadReport } = useAsync(() => {
        const force = forceRefresh.current; forceRefresh.current = false;
        return tripAnalytics.report(organizerId, days, { force });
    }, [organizerId, days], { keepPreviousData: true });
    const reload = () => { forceRefresh.current = true; reloadReport(); };
    useOrganizerLiveRefresh(organizerId, reload, loading);
    // Never display a previous period's response under the newly selected period.
    const response = data?.days === days ? data : null;
    const model = useMemo(() => organizerAnalyticsModel(response, sort), [response, sort]);
    const report = model.invalid ? null : response;
    const rows = model.rows;
    const total = key => model.totals[key];
    const rate = (enquiries, views) => views ? (enquiries / views * 100).toFixed(1) + '%' : '\u2014';
    const leader = key => {
        const max = rows.reduce((value, row) => Math.max(value, row[key]), 0);
        if (!max) return 'No activity yet';
        const leaders = rows.filter(row => row[key] === max);
        return leaders.slice(0, 3).map(row => row.title).join(', ') + (leaders.length > 3 ? ` and ${leaders.length - 3} more` : '') + ` (${max})`;
    };
    return h('section', { className: 'org-panel od-performance', 'aria-label': 'Trip performance analytics' },
        h('div', { className: 'od-analytics-heading' }, h('div', null, h('h2', null, 'Trip performance analytics'), h('p', null, 'See how travellers discover and engage with your trips.')),
            h('label', { className: 'od-analytics-filter' }, h('span', null, 'Period'), h('select', { value: days, onChange: e => setDays(Number(e.target.value)) },
                [7, 30, 90].map(value => h('option', { key: value, value }, `Last ${value} days`))))),
        loading && !response && h('div', { className: 'od-analytics-state', role: 'status' }, h('span', { className: 'od-analytics-state-icon', 'aria-hidden': true }, h(Icon, { name: 'chart', size: 22 })), h('div', { className: 'od-analytics-state-copy' }, h('strong', null, 'Loading trip performance'), h('p', null, 'Gathering activity for your selected period…'))),
        loading && response && h('p', { className: 'od-section-note', role: 'status' }, 'Updating analytics… Showing the last report until the latest data arrives.'),
        model.invalid && h('p', { role: 'alert', className: 'od-analytics-state' }, 'Some analytics counts are missing or invalid. Refresh analytics before using this report.', h(Btn, { variant: 'outline', onClick: reload }, 'Refresh analytics')),
        error && h('div', { className: 'od-analytics-state', role: 'alert' }, h('span', { className: 'od-analytics-state-icon', 'aria-hidden': true }, h(Icon, { name: 'info', size: 22 })), h('div', { className: 'od-analytics-state-copy' }, h('strong', null, 'Analytics is currently unavailable'), h('p', null, 'We couldn’t load your trip activity. Please try again in a moment.')), h(Btn, { variant: 'outline', onClick: reload }, 'Try again')),
        report && h(React.Fragment, null,
            h('div', { className: 'org-stat-grid' },
                h(Stat, { label: 'Trip page views', value: total('views'), sub: `Last ${days} days`, icon: 'compass' }),
                h(Stat, { label: 'Submitted enquiries', value: total('enquiries'), sub: 'Saved enquiry records', icon: 'inbox' }),
                h(Stat, { label: 'Enquiry rate', value: rate(total('enquiries'), total('views')), sub: 'Enquiries / page views', icon: 'grid' }),
                h(Stat, { label: 'Contact clicks', value: total('whatsapp_clicks') + total('instagram_clicks'), sub: 'WhatsApp + Instagram', icon: 'arrow' })),
            h('p', { className: 'od-section-note' }, 'Most viewed: ', leader('views')),
            h('p', { className: 'od-section-note' }, 'Most enquiries: ', leader('enquiries')),
            h('div', { className: 'od-analytics-toolbar' },
                h('label', { className: 'od-analytics-filter' }, h('span', null, view === 'graphs' ? 'Compare trips by' : 'Sort trips by'), h('select', { value: sort, onChange: e => setSort(e.target.value) },
                    h('option', { value: 'views' }, 'Page views'), h('option', { value: 'enquiries' }, 'Enquiries'), h('option', { value: 'whatsapp_clicks' }, 'WhatsApp clicks'), h('option', { value: 'instagram_clicks' }, 'Instagram clicks'), h('option', { value: 'enquiry_opens' }, 'Enquiry form opens'))),
            sort === 'enquiry_opens' && h('p', { className: 'od-section-note' }, 'Counts visible form openings, including reopening the form. Typing, validation and submitting do not add opens. These are not submitted enquiries or unique travellers; listing-owner previews are excluded.'),
                h('div', { className: 'od-analytics-view', role: 'group', 'aria-label': 'Analytics display' }, ['graphs', 'table'].map(mode => h('button', { type: 'button', key: mode, 'aria-pressed': view === mode, onClick: () => setView(mode) }, h(Icon, { name: mode === 'graphs' ? 'chart' : 'grid', size: 16 }), mode === 'graphs' ? 'Graphs' : 'Table')))),
            rows.length ? view === 'graphs' ? h(OrganizerAnalyticsCharts, { rows, totals: model.totals, metric: sort, days }) : h('div', { className: 'od-analytics-table', tabIndex: 0, role: 'region', 'aria-label': 'Performance by trip' },
                h('table', null, h('caption', null, `Trip activity in the last ${days} days`),
                    h('thead', null, h('tr', null, ['Trip / destination', 'Views', 'Enquiries', 'Enquiry rate', 'WhatsApp clicks', 'Instagram clicks', 'Enquiry form opens'].map(label => h('th', { key: label, scope: 'col' }, label)))),
                    h('tbody', null, rows.map(row => h('tr', { key: row.id },
                        h('th', { scope: 'row' }, h(Link, { to: '/organizer/edit/' + row.id }, row.title), h('small', null, row.destination)),
                        ...[row.views, row.enquiries, rate(row.enquiries, row.views), row.whatsapp_clicks, row.instagram_clicks, row.enquiry_opens].map((value, i) => h('td', { key: i }, value)))))))
                : h('p', { className: 'org-inline-empty' }, 'Create a trip to start measuring performance.'),
            h(Btn, { variant: 'ghost', onClick: reload }, 'Refresh analytics'),
            h('p', { className: 'od-availability-note' }, `Updated ${new Date(report.as_of).toLocaleString()}. Rolling ${days}-day window. Views count visible trip-page visits, including repeat visits. Tracking begins after installation; earlier views cannot be recovered. Enquiry rate is enquiries divided by recorded views, not a unique-visitor conversion rate. A dash means no views were recorded. Clicks and form opens do not confirm a conversation, enquiry or booking.`)));
}
