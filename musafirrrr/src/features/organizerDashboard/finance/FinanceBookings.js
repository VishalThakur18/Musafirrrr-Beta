"use strict";

function FinanceBookingForm({ initial, trips, contacts, onClose, onSave }) {
    const h = React.createElement;
    const [value, setValue] = useState(() => ({ tripId: '', enquiryId: '', travellerId: null, travellerName: '', travellerContact: '', agreedAmount: '', currency: 'INR', status: 'confirmed', notes: '', ...initial }));
    const [errors, setErrors] = useState({});
    const [review, setReview] = useState(false);
    const [pending, setPending] = useState(false);
    const [failure, setFailure] = useState('');
    const locked = useRef(false);
    const set = (key, next) => { setReview(false); setFailure(''); setValue(v => ({ ...v, [key]: next, ...(key === 'tripId' ? { enquiryId: '', travellerId: null, travellerName: '', travellerContact: '' } : {}) })); };
    const field = (key, label, options, props = {}) => h('label', { key }, h('span', null, label), h(options ? 'select' : 'input', {
        value: value[key] ?? '', onChange: e => set(key, e.target.value), 'aria-label': label, 'aria-invalid': !!errors[key], 'aria-describedby': errors[key] ? 'booking-error-' + key : undefined, ...props
    }, options?.map(([id, text]) => h('option', { key: id, value: id }, text))), errors[key] && h('small', { className: 'finance-error', id: 'booking-error-' + key }, errors[key]));
    const submit = async event => {
        event.preventDefault(); if (locked.current) return;
        const next = {};
        if (!initial && !trips.some(t => t.id === value.tripId)) next.tripId = 'Choose a registered trip.';
        if (!value.travellerName.trim()) next.travellerName = 'Enter the traveller name.';
        if (!initial && !FinanceModel.validContact(value.travellerContact.trim())) next.travellerContact = 'Enter a valid phone or email.';
        if (!/^\d+(\.\d{1,2})?$/.test(String(value.agreedAmount)) || Number(value.agreedAmount) > 999999999999) next.agreedAmount = 'Enter an amount from 0 to 999,999,999,999 with at most two decimals.';
        if (!FinanceModel.currencies.includes(value.currency)) next.currency = 'Select a supported currency.';
        setErrors(next);
        if (Object.keys(next).length) { setReview(false); return; }
        if (!review) { setReview(true); return; }
        locked.current = true; setPending(true); setFailure('');
        try { await onSave({ ...value, agreedAmount: Number(value.agreedAmount) }); }
        catch (error) { setFailure(error.message || 'Booking could not be saved. Your inputs are retained.'); }
        finally { locked.current = false; setPending(false); }
    };
    const people = contacts.filter(c => c.tripId === value.tripId);
    return h(FinanceDialog, { title: initial ? 'Manage finance booking' : 'Create finance booking', onClose: () => { if (!locked.current) onClose(); } },
        h('p', { className: 'finance-notice' }, 'A booking records the agreed total price. It does not record a payment or change your enquiry status. Custom-trip bookings are not supported by the existing database.'),
        h('form', { onSubmit: submit, noValidate: true }, h('fieldset', { disabled: pending, className: 'finance-fields' },
            initial ? h('p', { className: 'finance-wide' }, `${trips.find(t => t.id === value.tripId)?.title || 'Registered trip'} · ${value.travellerName} · ${value.travellerContact} · ${value.currency}`) : h(React.Fragment, null,
                field('tripId', 'Registered trip *', [['', 'Select a trip'], ...trips.map(t => [t.id, t.title])]),
                h('label', null, 'Traveller from enquiries', h('select', { value: value.enquiryId || '', onChange: event => {
                    const person = people.find(p => p.id === event.target.value); setReview(false);
                    setValue(v => ({ ...v, enquiryId: person?.id || '', travellerId: person?.travellerId || null, travellerName: person?.name || '', travellerContact: person?.phone || person?.email || '' }));
                } }, h('option', { value: '' }, 'Enter manually'), people.map(p => h('option', { key: p.id, value: p.id }, `${p.name} · ${p.phone || p.email || 'Contact unavailable'}`)))),
                field('travellerName', 'Traveller name *', null, { maxLength: 120 }),
                field('travellerContact', 'Traveller contact *', null, { maxLength: 160 }),
                field('currency', 'Booking currency *', FinanceModel.currencies.map(c => [c, c]))),
            field('agreedAmount', 'Total agreed booking amount *', null, { inputMode: 'decimal' }),
            initial && field('status', 'Booking status', [['confirmed', 'Confirmed'], ['completed', 'Completed'], ['cancelled', 'Cancelled']]),
            field('notes', 'Reason / booking notes', null, { maxLength: 2000 })),
            h('p', { className: 'finance-help' }, 'Completing a trip does not waive unpaid balances. Cancelling closes its outstanding balance but preserves payments and refunds. Refunds do not automatically create a new debt; revise the agreed amount explicitly if your agreement changes.'),
            review && h('div', { role: 'status', className: 'finance-notice' }, `Please confirm: ${value.travellerName} · agreed amount ${FinanceModel.money(Number(value.agreedAmount), value.currency)} · ${value.status}. This will be saved to the database. Existing payments will not be changed.`),
            failure && h('p', { role: 'alert', className: 'finance-error' }, failure),
            h('div', { className: 'finance-actions' }, h(Btn, { type: 'button', variant: 'outline', disabled: pending, onClick: onClose }, 'Cancel'), h(Btn, { type: 'submit', disabled: pending, loading: pending }, pending ? 'Saving…' : review ? 'Confirm and save booking' : 'Review booking'))));
}

function FinanceBookingBalances({ balances, bookings, entries, trips, currency, ready, onCreate, onManage, onPayment, onEditEntry }) {
    const h = React.createElement;
    const [exportMessage, setExportMessage] = useState('');
    const exportBalances = () => {
        let url;
        try {
            const rows = [['Booking reference', 'Traveller', 'Contact', 'Trip', 'Currency', 'Booking status', 'Payment status', 'Agreed amount', 'Payments allocated', 'Refunds recorded separately', 'Outstanding amount', 'Snapshot date'],
                ...balances.map(b => [b.bookingId, b.travellerName, b.travellerContact, trips.find(t => t.id === b.tripId)?.title || b.tripId, currency, b.bookingStatus, b.paymentStatus, b.agreedAmount, b.totalPayments, b.totalRefunds, b.outstandingAmount, FinanceModel.today()])];
            url = URL.createObjectURL(new Blob([FinanceModel.csv(rows)], { type: 'text/csv;charset=utf-8;' }));
            const link = document.createElement('a'); link.href = url; link.download = 'booking-balances-' + FinanceModel.today() + '.csv';
            document.body.appendChild(link); link.click(); link.remove();
            setExportMessage('Current booking balance CSV generated; download requested.');
        } catch (error) { setExportMessage('Could not generate the balance report. Please try again.'); }
        finally { if (url) setTimeout(() => URL.revokeObjectURL(url), 10000); }
    };
    const unlinked = entries.filter(e => FinanceModel.paymentTypes.includes(e.type) && !e.bookingId);
    return h('section', { className: 'finance-panel', id: 'finance-bookings' },
        h('div', { className: 'finance-section-heading' }, h('div', null, h('h2', null, 'Bookings & Outstanding Balances'), h('p', { className: 'finance-help' }, '1. Create the agreed booking → 2. Link each payment → 3. Review what is still due.')), h('div', { className: 'finance-actions' }, h(Btn, { variant: 'outline', onClick: exportBalances, disabled: !ready || !balances.length }, 'Download balances CSV'), h(Btn, { onClick: onCreate, disabled: !ready || !trips.some(t => !t.custom), icon: 'plus' }, 'Create finance booking'))),
        exportMessage && h('p', { role: 'status', className: 'finance-help' }, exportMessage),
        h('p', { className: 'finance-help' }, 'Current booking balances use all linked payments, across all dates. Only trip, departure and currency filters apply here; transaction type, category, date and search filters do not change the amount owed.'),
        !ready ? h('p', { role: 'status' }, 'Load financial records before managing booking balances.') : h(React.Fragment, null,
            unlinked.length > 0 && h('details', { className: 'finance-notice' }, h('summary', null, `${unlinked.length} payment entries are not linked to a booking`),
                h('p', null, 'These payments count as received money but cannot reduce a booking balance until linked. Edit an entry and choose its matching booking. Do not add the same payment again.'),
                unlinked.map(e => h('div', { key: e.id, className: 'finance-section-heading' }, h('span', null, `${e.travellerName || 'Traveller not specified'} · ${FinanceModel.tripLabel(e, trips)} · ${FinanceModel.money(e.amount, e.currency)}`), h(Btn, { variant: 'outline', size: 'sm', onClick: () => onEditEntry(e) }, 'Link existing payment')))),
            !balances.length && h(FinanceEmptyState, { title: 'No finance bookings for this selection', body: 'Create a booking with the agreed total, then link payments. No bookings does not mean everyone has fully paid. Custom trips can still have payment records, but the existing booking table only supports registered trips.' }),
            h('div', { className: 'finance-trip-grid' }, balances.map(b => {
                const booking = bookings.find(item => item.bookingId === b.bookingId);
                return h('article', { className: 'finance-trip', key: b.bookingId },
                    h('h3', null, b.travellerName || 'Traveller'), h('p', { className: 'finance-contact' }, b.travellerContact || 'Contact unavailable'),
                    h('p', null, trips.find(t => t.id === b.tripId)?.title || 'Trip unavailable'),
                    h('span', { className: 'finance-badge' }, b.paymentStatus), h('p', { className: 'finance-help' }, `Booking ${b.bookingId.slice(0, 8)} · ${b.bookingStatus}`),
                    h('dl', null, [['agreedAmount', 'Agreed booking amount'], ['totalPayments', 'Payments allocated'], ['totalRefunds', 'Refunds recorded separately'], ['outstandingAmount', 'Outstanding amount']].map(([key, label]) => h('div', { key }, h('dt', null, label), h('dd', null, FinanceModel.money(b[key], currency))))),
                    b.overpayment > 0 && h('p', { className: 'finance-help' }, `Payments exceed the agreed amount by ${FinanceModel.money(b.overpayment, currency)}. Review payments and refunds; this is not an automatic refund instruction.`),
                    b.bookingStatus === 'cancelled' && h('p', { className: 'finance-help' }, 'Balance closed. The database does not accept new entries linked to cancelled bookings. Record any later refund separately against this traveller and trip.'),
                    h('div', { className: 'finance-actions' }, h(Btn, { variant: 'outline', size: 'sm', onClick: () => onManage(booking) }, 'Manage booking'), b.bookingStatus !== 'cancelled' && h(Btn, { size: 'sm', onClick: () => onPayment(booking) }, 'Record payment')));
            }))));
}
