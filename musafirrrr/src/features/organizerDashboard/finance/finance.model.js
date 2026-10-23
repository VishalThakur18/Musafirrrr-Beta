"use strict";
/** Frontend contracts only. All amounts are in major currency units; null means unknown.
 * @typedef {Object} FinancialEntry
 * @property {string} id
 * @property {string} organizerId
 * @property {string} type
 * @property {string} category
 * @property {number} amount Positive magnitude; adjustments require a future policy.
 * @property {string} currency
 * @property {string} date Local calendar date (YYYY-MM-DD), by entry event type.
 * @property {?string} tripId
 * @property {?string} customTripId Finance-only ID, never a trips-table foreign key.
 * @property {string} customTripTitle
 * @property {string} tripTitle Display snapshot for reports.
 * @property {string} travellerKey Stable platform/lead/manual identity; never grouped by name alone.
 * @property {?string} enquiryId Contact provenance only, never a booking confirmation.
 * @property {string} travellerName
 * @property {string} travellerContact Organizer-provided phone or email snapshot.
 * @property {?string} departureId
 * @property {?string} bookingId
 * @property {string} paymentMethod
 * @property {string} description
 * @property {string} referenceNumber
 * @property {string} notes
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {boolean} preview
 * @typedef {{bookingId:string,tripId:string,departureId:?string,agreedAmount:?number,currency:string,totalPayments:?number,totalRefunds:?number,adjustments:?number,outstandingAmount:?number,bookingStatus:string}} BookingFinanceSummary
 * @typedef {{reportingPeriod:Object,currency:string,confirmedBookingValue:?number,paymentsReceived:?number,outstandingBalances:?number,recordedExpenses:?number,recordedRefunds:?number,estimatedProfit:?number,cashFlow:?number}} FinanceDashboardSummary
 * Future adapter supplies {status, entries, summary, tripFinance, balances, departures, bookings}.
 * status: ready | loading | error | denied. Summary must match filters and currency.
 * Operations: loadFinanceSummary, listFinancialEntries, createFinancialEntry,
 * updateFinancialEntry, loadTripFinance, loadOutstandingBalances, exportFinanceReport.
 * No storage, network requests, booking mutations or inferred accounting rules here.
 */
const FinanceModel = (() => {
    const types = ['Payment Received', 'Advance Payment', 'Partial Payment', 'Expense', 'Refund Issued', 'Other Income', 'Adjustment'];
    const currencies = ['INR', 'USD', 'EUR', 'GBP'];
    const methods = ['UPI', 'Cash', 'Bank Transfer', 'Card', 'Other'];
    const paymentTypes = ['Payment Received', 'Advance Payment', 'Partial Payment'];
    const tripKey = entry => entry.customTripId || entry.tripId || '';
    const tripLabel = (entry, trips = []) => entry.customTripTitle || trips.find(t => t.id === entry.tripId)?.title || entry.tripTitle || (entry.tripId ? 'Trip unavailable' : 'General');
    const validContact = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || (/^[+\d\s().-]+$/.test(value) && value.replace(/\D/g, '').length >= 7 && value.replace(/\D/g, '').length <= 15);
    const expenses = ['Transport', 'Accommodation', 'Meals', 'Activities', 'Guides and Vendors', 'Permits', 'Marketing', 'Other Expenses'];
    const categories = type => type === 'Expense' ? expenses : type === 'Refund Issued' ? ['Traveller Refund'] : type === 'Other Income' ? ['Other Income'] : ['Traveller Payment'];
    const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
    const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value;
    const money = (amount, currency = 'INR') => amount == null || !Number.isFinite(amount) ? 'Not available yet' : new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(amount);
    const defaults = () => ({ period: '30', start: '', end: '', tripId: '', departureId: '', type: '', category: '', currency: 'INR', search: '', sort: 'desc' });
    function range(filters, now = today()) {
        if (filters.period === 'custom') return [filters.start, filters.end];
        if (filters.period === 'month') return [now.slice(0,8) + '01', now];
        const date = new Date(now + 'T12:00:00');
        date.setDate(date.getDate() - Number(filters.period) + 1);
        return [`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`, now];
    }
    function filter(entries, f) {
        const [start, end] = range(f);
        if (!validDate(start) || !validDate(end) || start > end) return [];
        return entries.filter(e => e.currency === f.currency && e.date >= start && e.date <= end &&
            (!f.tripId || tripKey(e) === f.tripId) && (!f.departureId || e.departureId === f.departureId) &&
            (!f.type || e.type === f.type) && (!f.category || e.category === f.category) &&
            [e.description, e.referenceNumber, e.bookingId, e.category, e.travellerName, e.travellerContact, e.customTripTitle, e.tripTitle].join(' ').toLowerCase().includes(f.search.trim().toLowerCase()))
            .sort((a,b) => (f.sort === 'asc' ? 1 : -1) * a.date.localeCompare(b.date));
    }
    function validate(entry) {
        const errors = {};
        if (!types.includes(entry.type) || entry.type === 'Adjustment') errors.type = 'Choose a supported entry type.';
        if (!/^\d+(\.\d{1,2})?$/.test(String(entry.amount)) || !Number.isFinite(Number(entry.amount)) || Number(entry.amount) <= 0 || Number(entry.amount) > 999999999999) errors.amount = 'Enter a positive amount with up to two decimal places (maximum 999,999,999,999).';
        if (!currencies.includes(entry.currency)) errors.currency = 'Choose a supported currency.';
        if (!validDate(entry.date) || entry.date > today()) errors.date = 'Choose a valid date on or before today.';
        if (!categories(entry.type).includes(entry.category)) errors.category = 'Choose a category for this entry type.';
        if (entry.paymentMethod && !methods.includes(entry.paymentMethod)) errors.paymentMethod = 'Choose an available payment method.';
        return errors;
    }
    /** Integer minor units avoid floating-point drift; identities, trip and currency remain separate. */
    function travellerPayments(entries) {
        const groups = new Map();
        entries.filter(e => paymentTypes.includes(e.type) || e.type === 'Refund Issued').forEach(e => {
            const key = JSON.stringify([e.organizerId, tripKey(e), e.travellerKey || 'unassigned:' + e.id, e.currency]);
            if (!groups.has(key)) groups.set(key, { key, ...e, paidMinor: 0, refundMinor: 0, paymentCount: 0, refundCount: 0, entries: [], preview: false });
            const row = groups.get(key);
            if (e.type === 'Refund Issued') { row.refundMinor += Math.round(e.amount * 100); row.refundCount++; }
            else { row.paidMinor += Math.round(e.amount * 100); row.paymentCount++; }
            row.entries.push(e); row.preview ||= !!e.preview;
        });
        return [...groups.values()].map(row => ({ ...row, paid: row.paymentCount ? row.paidMinor / 100 : null, refunded: row.refundCount ? row.refundMinor / 100 : null }));
    }
    // Quote cells and neutralize spreadsheet formula prefixes, including leading whitespace.
    const csvCell = value => {
        let text = String(value ?? '');
        if (/^[\s]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)) text = "'" + text;
        return '"' + text.replace(/"/g, '""') + '"';
    };
    const csv = rows => '\uFEFF' + rows.map(row => row.map(csvCell).join(',')).join('\r\n');
    return { types, currencies, methods, paymentTypes, tripKey, tripLabel, validContact, travellerPayments, csv, categories, today, validDate, money, defaults, range, filter, validate };
})();
