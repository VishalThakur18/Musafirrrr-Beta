"use strict";

const FINANCE_METRIC_FORMULAS = {
    confirmedBookingValue: 'Add the agreed amounts of confirmed and completed finance bookings. Cancelled bookings are excluded. This is a booking commitment, not cash received.',
    paymentsReceived: 'Add Payment Received + Advance Payment + Partial Payment entries. Each transaction is counted once. Refunds are reported separately and do not reduce this gross receipt total.',
    outstandingBalances: 'For each non-cancelled booking: maximum of (agreed amount − all linked payments) and zero. Add those balances. Cancelled bookings contribute zero. Refunds do not automatically create a new debt; expenses and unallocated payments do not affect this calculation.',
    recordedExpenses: 'Add all Expense entries matching the selected filters. Refunds are separate from expenses.',
    recordedRefunds: 'Add all Refund Issued entries matching the selected filters. The original payments remain in Payments Received.',
    estimatedProfit: 'Payments Received + Other Income − Recorded Expenses − Recorded Refunds. This is the cash surplus of recorded transactions, not final business profit; missing costs and future commitments are not included.'
};

function financeBreakdownTotal(breakdown) {
    return (breakdown?.rows || []).reduce((total, row) => {
        const amount = breakdown.kind === 'bookings' ? row.agreedAmount : breakdown.kind === 'balances' ? row.outstandingAmount : row.amount;
        const sign = breakdown.kind === 'cash' && ['Expense', 'Refund Issued'].includes(row.type) ? -1 : 1;
        return total + sign * Math.round(amount * 100);
    }, 0) / 100;
}

function FinanceMetricBreakdown({ snapshot, onClose }) {
    const h = React.createElement, m = FinanceModel;
    const { metric, label, value, breakdown, filters, trips } = snapshot;
    const money = amount => m.money(amount, filters.currency);
    const rows = breakdown?.rows || [];
    const reconciled = financeBreakdownTotal(breakdown);
    const bookingMetric = ['bookings', 'balances'].includes(breakdown?.kind);
    const names = { payments: 'Payments received', otherIncome: 'Other income', expenses: 'Recorded expenses', refunds: 'Recorded refunds' };
    return h(FinanceDialog, { title: label + ' — breakdown', onClose, focusTitle: true },
        h('div', { className: 'finance-notice' }, h('strong', null, 'How this amount is calculated'), h('p', null, FINANCE_METRIC_FORMULAS[metric])),
        h('div', { className: 'finance-breakdown-total' }, h('span', null, 'Total shown on the card'), h('strong', null, money(value))),
        h('p', { className: 'finance-help' }, `${filters.currency} · ${trips.find(t => t.id === filters.tripId)?.title || (filters.tripId ? 'Selected trip' : 'All trips')} · ${filters.departureId ? 'Departure: ' + filters.departureId : 'All departures'}`),
        h('p', { className: 'finance-help' }, bookingMetric
            ? 'Current booking snapshot using all linked payment dates. Date range, transaction type, category and search do not limit this total.'
            : `${m.range(filters).join(' to ')} by transaction date · ${filters.type || 'All transaction types'} · ${filters.category || 'All categories'}. Transaction search does not change summary totals.`),
        h('p', { className: 'finance-help' }, 'Snapshot taken when this breakdown was opened. Amounts are organizer-reported. Close and reopen after changing records or filters.'),
        value == null ? h(FinanceEmptyState, { title: 'Amount not available', body: 'No matching finance bookings are available. This does not mean all travellers have paid.' }) : h(React.Fragment, null,
            breakdown?.components && h('dl', { className: 'finance-detail' }, Object.entries(breakdown.components).map(([key, amount]) => h('div', { key }, h('dt', null, (['expenses', 'refunds'].includes(key) ? '− ' : '+ ') + names[key]), h('dd', null, money(amount)))), h('div', null, h('dt', null, 'Recorded cash surplus'), h('dd', null, money(value)))),
            !!breakdown?.excludedCancelled && h('p', { className: 'finance-help' }, `${breakdown.excludedCancelled} cancelled bookings excluded.`),
            h('h3', null, `${rows.length} contributing ${bookingMetric ? 'bookings' : 'transactions'}`),
            !rows.length && h('p', { className: 'finance-help' }, 'No matching records contribute to this total.'),
            h('div', { className: 'finance-breakdown-list' }, rows.map(row => {
                if (bookingMetric) return h('article', { key: row.bookingId, className: 'finance-trip' },
                    h('h3', null, row.travellerName || 'Traveller not specified'), h('p', { className: 'finance-contact' }, row.travellerContact || 'Contact unavailable'),
                    h('p', null, trips.find(t => t.id === row.tripId)?.title || row.tripId),
                    h('p', { className: 'finance-help' }, `Booking ${row.bookingId} · ${row.bookingStatus || row.status}`),
                    breakdown.kind === 'bookings' ? h('strong', null, money(row.agreedAmount)) : h(React.Fragment, null,
                        h('p', null, row.bookingStatus === 'cancelled' ? 'Cancelled: ' + money(0) + ' outstanding' : `${money(row.agreedAmount)} agreed − ${money(row.totalPayments)} allocated = ${money(row.outstandingAmount)} outstanding (minimum zero)`),
                        h('p', { className: 'finance-help' }, `Refunds recorded separately: ${money(row.totalRefunds)}. Payment status: ${row.paymentStatus}.`),
                        h('details', null, h('summary', null, `Inspect ${row.payments.length} linked payments`), row.payments.length ? row.payments.map(e => h('p', { key: e.id, className: 'finance-help' }, `${e.date} · ${e.type} · ${money(e.amount)} · ${e.referenceNumber || e.id}`)) : h('p', null, 'No allocated payments.'))));
                const outgoing = breakdown.kind === 'cash' && ['Expense', 'Refund Issued'].includes(row.type);
                return h('article', { key: row.id, className: 'finance-trip' },
                    h('div', { className: 'finance-section-heading' }, h('strong', null, row.type), h('strong', null, `${breakdown.kind === 'cash' ? outgoing ? '− ' : '+ ' : ''}${money(row.amount)}`)),
                    h('p', null, row.description || row.category), h('p', { className: 'finance-help' }, `${row.date} · ${m.tripLabel(row, trips)}${row.customTripId ? ' · Custom trip' : ''}`),
                    h('p', { className: 'finance-contact' }, `${row.travellerName || 'No traveller linked'}${row.travellerContact ? ' · ' + row.travellerContact : ''}`),
                    h('p', { className: 'finance-help' }, `${row.category} · ${row.paymentMethod || 'Method not specified'} · ${row.bookingId ? 'Booking ' + row.bookingId : 'Unallocated'}`),
                    h('p', { className: 'finance-help' }, `Entry ${row.id}${row.referenceNumber ? ' · Reference: ' + row.referenceNumber : ''}`));
            })),
            h('div', { className: 'finance-breakdown-total' }, h('span', null, 'Total of the contributions above'), h('strong', null, money(reconciled))),
            Math.round(reconciled * 100) !== Math.round(value * 100) && h('p', { role: 'alert', className: 'finance-error' }, 'These records do not reconcile to the card. Close this view and refresh financial records before relying on the total.')),
        h('div', { className: 'finance-actions' }, h(Btn, { onClick: onClose }, 'Close breakdown')));
}
