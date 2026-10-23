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
