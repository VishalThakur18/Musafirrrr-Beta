const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const context = vm.createContext({ console, Date, Intl, window: {} });
vm.runInContext(fs.readFileSync(path.join(root, 'src/features/organizerDashboard/finance/finance.model.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(root, 'src/backend/services/finance.service.js'), 'utf8') + '\nglobalThis.api = financeApi; globalThis.model = FinanceModel;', context);
const api = context.api;
const filters = { ...context.model.defaults(), period: 'custom', start: '2026-10-01', end: '2026-10-31' };
const booking = { bookingId: 'b', organizerId: 'org', tripId: 'trip', travellerName: 'Traveller', travellerContact: 'test@example.com', currency: 'INR', status: 'confirmed', agreedAmount: 15000 };
const entry = { id: 'e', organizerId: 'org', tripId: 'trip', bookingId: 'b', travellerName: 'Traveller', travellerContact: 'test@example.com', currency: 'INR', date: '2026-10-10', type: 'Advance Payment', category: 'Traveller Payment', amount: 5000 };
const summary = (entries, bookings = [booking], f = filters) => api.summary('org', f, entries, bookings);
assert.equal(summary([]).balances[0].paymentStatus, 'Unpaid');
assert.equal(summary([entry]).outstandingBalances, 10000);
assert.equal(summary([entry]).balances[0].paymentStatus, 'Partially paid');
assert.equal(summary([entry, { ...entry, id: 'second', amount: 10000 }]).balances[0].paymentStatus, 'Paid');
assert.equal(summary([entry, { ...entry, id: 'refund', type: 'Refund Issued', amount: 2000 }]).outstandingBalances, 10000, 'Refund is not a new obligation');
assert.equal(summary([entry], [{ ...booking, status: 'cancelled' }]).outstandingBalances, 0);
assert.equal(summary([entry], [{ ...booking, status: 'cancelled' }]).confirmedBookingValue, 0);
assert.equal(summary([entry], [{ ...booking, status: 'cancelled' }]).tripFinance[0].confirmedBookingValue, 0);
assert.equal(summary([entry], [{ ...booking, status: 'completed' }]).outstandingBalances, 10000);
assert.equal(summary([{ ...entry, bookingId: '' }]).outstandingBalances, 15000, 'Unallocated money does not pay a booking');
assert.equal(summary([entry], []).outstandingBalances, null, 'No bookings is unavailable, not zero owed');
assert.equal(summary([{ ...entry, amount: 16000 }]).balances[0].overpayment, 1000);
assert.equal(summary([{ ...entry, currency: 'USD' }, { ...entry, organizerId: 'other' }]).outstandingBalances, 15000);
assert.equal(summary([entry], [booking], { ...filters, start: '2026-10-20', type: 'Expense' }).outstandingBalances, 10000, 'Balance uses all-time linked payments');
assert.equal(summary([{ ...entry, amount: .1 }, { ...entry, amount: .2 }], [{ ...booking, agreedAmount: .3 }]).outstandingBalances, 0);
assert.equal(summary([{ ...entry, amount: .1 }, { ...entry, amount: .2 }]).estimatedProfit, .3);
assert.equal(context.financeBookingMatchesTraveller(booking, entry), true);
assert.equal(context.financeBookingMatchesTraveller({ ...booking, travellerContact: '' }, { ...entry, travellerKey: 'booking:b' }), true);
assert.equal(context.financeBookingMatchesTraveller(booking, { ...entry, travellerContact: 'different@example.com' }), false);
assert.equal(context.financeBookingMatchesTraveller({ ...booking, travellerId: 'one' }, { ...entry, travellerId: 'two' }), false);

// Mock database contract: no existing records are modified by these tests.
const operations = []; let result = { id: 'b', organizer_id: 'org', trip_id: 'trip', currency: 'INR', status: 'confirmed', traveller_name: 'Traveller', traveller_contact: 'test@example.com', agreed_amount: 15000 };
context.window.sbClient = { from(table) {
    const query = { select() { return this; }, eq(key, value) { operations.push(['eq', key, value]); return this; },
        insert(payload) { operations.push(['insert', table, payload]); return this; }, update(payload) { operations.push(['update', table, payload]); return this; },
        async single() { return { data: result, error: null }; } };
    return query;
} };
(async () => {
    await api.createBooking(booking, 'org');
    const payload = operations.find(o => o[0] === 'insert')[2];
    assert.equal(payload.agreed_amount, 15000);
    assert.ok(!('departure_id' in payload), 'Do not write columns absent from the existing booking schema');
    await api.updateBooking('b', { agreedAmount: 12000, status: 'cancelled' }, 'org');
    const patch = operations.find(o => o[0] === 'update')[2];
    assert.deepEqual(Object.keys(patch).sort(), ['agreed_amount', 'notes', 'status']);
    assert.ok(operations.some(o => o[0] === 'eq' && o[1] === 'organizer_id' && o[2] === 'org'));
    await api.validateAllocation(entry, 'org');
    await assert.rejects(api.validateAllocation({ ...entry, currency: 'USD' }, 'org'));
    result = { ...result, status: 'cancelled' };
    await assert.rejects(api.validateAllocation(entry, 'org'));
    let pages = 0;
    context.window.sbClient = { from() { return { select() { return this; }, eq() { return this; }, order() { return this; }, async range(start, end) { pages++; return { data: Array.from({ length: start === 0 ? 500 : 1 }, (_, i) => ({ id: start + i })), error: null }; } }; } };
    assert.equal((await api.readAll('finance_entries', 'org', 'event_date')).length, 501);
    assert.equal(pages, 2);
    console.log('PASS: booking balance lifecycle, refunds, currencies, unallocated payments, decimal arithmetic, existing-schema writes, allocation validation and pagination.');
})().catch(error => { console.error(error); process.exitCode = 1; });
