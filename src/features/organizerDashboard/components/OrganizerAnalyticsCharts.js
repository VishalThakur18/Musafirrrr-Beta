"use strict";

/** A single validated source for cards, graphs and table. Missing/invalid counts
 * are not silently converted to zero. Aggregate overflow is rejected too. */
function organizerAnalyticsModel(report, sort) {
    const keys = ['views', 'enquiries', 'whatsapp_clicks', 'instagram_clicks', 'enquiry_opens'];
    const totals = Object.fromEntries(keys.map(key => [key, 0]));
    if (!report) return { rows: [], totals, invalid: false };
    let invalid = false;
    const rows = report.trips.map(source => {
        const row = { ...source, title: String(source.title || 'Untitled trip') };
        keys.forEach(key => {
            const raw = source[key];
            const value = typeof raw === 'number' || (typeof raw === 'string' && /^\d+$/.test(raw)) ? Number(raw) : NaN;
            if (!Number.isSafeInteger(value) || value < 0) invalid = true;
            row[key] = value;
            totals[key] += value;
            if (!Number.isSafeInteger(totals[key])) invalid = true;
        });
        return row;
    });
    if (!Number.isSafeInteger(totals.whatsapp_clicks + totals.instagram_clicks)) invalid = true;
    rows.sort((a, b) => b[sort] - a[sort] || a.title.localeCompare(b.title) || String(a.id).localeCompare(String(b.id)));
    return { rows, totals, invalid };
}

function OrganizerAnalyticsCharts({ rows, totals, metric, days }) {
    const h = React.createElement;
    const label = { enquiries: 'Submitted enquiries', views: 'Trip page views', whatsapp_clicks: 'WhatsApp clicks', instagram_clicks: 'Instagram clicks', enquiry_opens: 'Enquiry form opens' }[metric] || 'Trip page views';
    // Bounded chart DOM even for large trip inventories. The table retains all rows.
    const visible = rows.slice(0, 10);
    const maximum = visible[0]?.[metric] || 0;
    const clicks = totals.whatsapp_clicks + totals.instagram_clicks;
    const share = clicks ? totals.whatsapp_clicks / clicks : 0;
    const format = value => value.toLocaleString('en-IN');
    return h('div', { className: 'od-analytics-charts' },
        h('figure', { className: 'od-analytics-chart' },
            h('figcaption', null, h('h3', null, label + ' by trip'), h('p', null, rows.length > 10 ? `Top 10 of ${rows.length} trips · All trips are available in Table view.` : `All ${rows.length} trips · Last ${days} days`)),
            maximum > 0 ? h('div', null,
                h('div', { className: 'od-chart-scale', 'aria-hidden': true }, h('span', null, '0'), h('span', null, `${label} · maximum ${format(maximum)}`)),
                h('ol', { className: 'od-chart-bars', 'aria-label': label + ' by trip; bars start at zero' }, visible.map(row => h('li', { key: row.id },
                    h('div', { className: 'od-chart-bar-label' }, h(Link, { to: '/organizer/edit/' + row.id }, row.title), h('strong', null, format(row[metric]))),
                    h('div', { className: 'od-chart-track', 'aria-hidden': true }, h('span', { style: { width: (row[metric] / maximum * 100) + '%' } }))))))
                : h('p', { className: 'od-chart-empty' }, `No ${label.toLowerCase()} recorded in this period.`)),
        h('figure', { className: 'od-analytics-chart' },
            h('figcaption', null, h('h3', null, 'Contact click breakdown'), h('p', null, 'Share of recorded clicks · All trips')),
            clicks > 0 ? h('div', null,
                h('div', { className: 'od-chart-donut-wrap' },
                    h('svg', { viewBox: '0 0 160 160', className: 'od-chart-donut', role: 'img', 'aria-label': `Contact clicks: WhatsApp ${format(totals.whatsapp_clicks)}, Instagram ${format(totals.instagram_clicks)}. Total ${format(clicks)}.` },
                        h('circle', { cx: 80, cy: 80, r: 58, fill: 'none', stroke: '#ad7850', strokeWidth: 24 }),
                        h('circle', { cx: 80, cy: 80, r: 58, fill: 'none', stroke: '#315746', strokeWidth: 24, pathLength: 100, strokeDasharray: `${share * 100} ${100 - share * 100}`, transform: 'rotate(-90 80 80)' })),
                    h('div', { className: 'od-chart-donut-total', 'aria-hidden': true }, h('strong', null, format(clicks)), h('span', null, 'contact clicks'))),
                h('dl', { className: 'od-chart-legend' }, [['WhatsApp', totals.whatsapp_clicks, '#315746'], ['Instagram', totals.instagram_clicks, '#ad7850']].map(([name, value, color]) => h('div', { key: name },
                    h('dt', null, h('span', { style: { background: color }, 'aria-hidden': true }), name),
                    h('dd', null, h('strong', null, format(value)), ` · ${(value / clicks * 100).toFixed(1)}%`)))),
                h('p', { className: 'od-chart-note' }, 'Percentages are rounded. Clicks do not confirm a conversation or booking.'))
                : h('p', { className: 'od-chart-empty' }, 'No contact clicks recorded in this period.')));
}
