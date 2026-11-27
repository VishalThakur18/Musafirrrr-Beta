const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const c = vm.createContext({ Intl, Date });
for (const file of ['src/features/organizerDashboard/finance/finance.model.js', 'src/backend/services/finance.service.js', 'src/features/organizerDashboard/finance/FinanceMetricBreakdown.js']) vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), c);
vm.runInContext('globalThis.api=financeApi; globalThis.m=FinanceModel;', c);
const filter = { ...c.m.defaults(), period: 'custom', start: '2026-10-01', end: '2026-10-31' };
const booking = { bookingId: 'b', organizerId: 'org', tripId: 'trip', agreedAmount: 200, currency: 'INR', status: 'confirmed' };
const base = { organizerId: 'org', tripId: 'trip', bookingId: 'b', currency: 'INR', date: '2026-10-10', category: 'Traveller Payment' };
const entries = [['Payment Received', 100], ['Advance Payment', 20], ['Partial Payment', .1], ['Other Income', .2], ['Expense', 30], ['Refund Issued', 40], ['Adjustment', 999]].map(([type, amount], i) => ({ ...base, id: String(i), type, amount }));
entries.push({ ...base, id: 'older', type: 'Payment Received', amount: 10, date: '2026-09-01' });
entries.push({ ...base, id: 'other-owner', organizerId: 'other', type: 'Payment Received', amount: 1000 });
entries.push({ ...base, id: 'foreign', currency: 'USD', type: 'Payment Received', amount: 1000 });
const bookings = [booking, { ...booking, bookingId: 'cancelled', status: 'cancelled', agreedAmount: 500 }];
for (const selected of [filter, { ...filter, type: 'Expense' }, { ...filter, category: 'missing' }, { ...filter, search: 'not-matched' }, { ...filter, currency: 'USD' }, { ...filter, tripId: 'missing' }]) {
    const summary = c.api.summary('org', selected, entries, bookings);
    for (const [key, breakdown] of Object.entries(summary.breakdowns)) {
        if (summary[key] !== null) assert.equal(c.financeBreakdownTotal(breakdown), summary[key], key + ' must reconcile');
        assert.ok(breakdown.rows.every(r => r.organizerId === undefined || r.organizerId === 'org'));
    }
}
const summary = c.api.summary('org', filter, entries, bookings);
assert.equal(summary.breakdowns.confirmedBookingValue.excludedCancelled, 1);
assert.equal(summary.breakdowns.confirmedBookingValue.rows.length, 1);
assert.equal(summary.breakdowns.paymentsReceived.rows.length, 3);
assert.equal(summary.breakdowns.outstandingBalances.rows[0].payments.length, 4, 'All-time allocations include earlier payments');
assert.equal(summary.outstandingBalances, 69.9);
assert.equal(summary.estimatedProfit, 50.3);
assert.equal(summary.breakdowns.estimatedProfit.rows.length, 6, 'Adjustments excluded from cash surplus');
const negative = c.api.summary('org', filter, [{ ...base, id: 'expense', type: 'Expense', amount: 50 }], []);
assert.equal(c.financeBreakdownTotal(negative.breakdowns.estimatedProfit), -50);
assert.equal(negative.confirmedBookingValue, null);
console.log('PASS: all six breakdowns reconcile across dates, types, categories, search, currencies and trip filters; cancellations, negatives and missing bookings covered.');
