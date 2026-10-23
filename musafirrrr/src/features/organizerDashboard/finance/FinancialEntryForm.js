"use strict";
/** Feature-local focus management supplements the shared Modal without changing it. */
function FinanceDialog({ title, onClose, children }) {
    const ref = useRef(null);
    useEffect(() => {
        const previous = document.activeElement;
        const dialog = ref.current.closest('[role="dialog"]');
        const controls = () => [...dialog.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]')];
        ref.current.querySelector('input, select, button')?.focus();
        const trap = e => {
            if (e.key !== 'Tab') return;
            const items = controls(), first = items[0], last = items[items.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        };
        dialog.addEventListener('keydown', trap);
        return () => { dialog.removeEventListener('keydown', trap); if (previous?.isConnected) previous.focus(); };
    }, []);
    return React.createElement(Modal, { open: true, onClose, label: title, size: 'lg' },
        React.createElement('div', { className: 'finance-ui finance-dialog', ref }, React.createElement('h2', null, title), children));
}

function FinancialEntryForm({ initial, organizerId, trips, contacts = [], entries = [], contactsLoading = false, contactsError = false, departures = [], bookings = [], onClose, onPreview }) {
    const h = React.createElement, m = FinanceModel;
    const [value, setValue] = useState(() => ({ type: 'Payment Received', amount: '', currency: 'INR', date: m.today(), category: 'Traveller Payment', tripId: '', customTripTitle: '', travellerKey: '', travellerName: '', travellerContact: '', enquiryId: null, departureId: '', bookingId: '', paymentMethod: '', description: '', referenceNumber: '', notes: '', ...initial, ...(initial ? { tripId: m.tripKey(initial) } : {}) }));
    const [errors, setErrors] = useState({});
    const [review, setReview] = useState(false);
    const [pending, setPending] = useState(false);
    const [failure, setFailure] = useState('');
    const set = (key, next) => { setValue(v => ({ ...v, [key]: next, ...(key === 'type' ? { category: m.categories(next)[0] } : {}), ...(key === 'tripId' ? { departureId: '', bookingId: '', customTripTitle: '', travellerKey: '', travellerName: '', travellerContact: '', enquiryId: null } : {}), ...(key === 'departureId' ? { bookingId: '' } : {}) })); setReview(false); };
    const field = (key, label, options, extra = {}) => h('label', { key }, h('span', null, label),
        h(options ? 'select' : 'input', { id: 'finance-' + key, 'aria-label': label, value: value[key] || '', onChange: e => set(key, e.target.value), 'aria-invalid': !!errors[key], 'aria-describedby': errors[key] ? 'finance-error-' + key : undefined, ...extra },
            options && options.map(o => h('option', { key: typeof o === 'string' ? o : o[0], value: typeof o === 'string' ? o : o[0] }, typeof o === 'string' ? o : o[1]))),
        errors[key] && h('small', { className: 'finance-error', id: 'finance-error-' + key }, errors[key]));
    const payment = ['Payment Received', 'Advance Payment', 'Partial Payment', 'Refund Issued'].includes(value.type);
    const custom = value.tripId === '__custom__' || !!trips.find(t => t.id === value.tripId)?.custom;
    const travellerOptions = new Map();
    if (!custom) contacts.filter(c => c.tripId === value.tripId).forEach(c => {
        const key = c.travellerId ? 'platform:' + c.travellerId : 'lead:' + c.id;
        if (!travellerOptions.has(key)) travellerOptions.set(key, { key, name: c.name || '', contact: c.phone || c.email || '', enquiryId: c.id });
    });
    entries.filter(e => m.tripKey(e) === value.tripId && e.travellerKey).forEach(e => {
        if (!travellerOptions.has(e.travellerKey)) travellerOptions.set(e.travellerKey, { key: e.travellerKey, name: e.travellerName, contact: e.travellerContact, enquiryId: e.enquiryId });
    });
    if (initial?.travellerKey && m.tripKey(initial) === value.tripId && !travellerOptions.has(initial.travellerKey)) travellerOptions.set(initial.travellerKey, { key: initial.travellerKey, name: initial.travellerName, contact: initial.travellerContact, enquiryId: initial.enquiryId });
    const chooseTraveller = event => {
        const person = travellerOptions.get(event.target.value);
        setValue(v => ({ ...v, travellerKey: person?.key || '', travellerName: person?.name || '', travellerContact: person?.contact || '', enquiryId: person?.enquiryId || null })); setReview(false);
    };
    const availableDepartures = departures.filter(d => d.tripId === value.tripId);
    const availableBookings = bookings.filter(b => b.tripId === value.tripId && (!value.departureId || b.departureId === value.departureId));
    const submit = e => {
        e.preventDefault(); const next = m.validate(value);
        if (value.tripId && value.tripId !== '__custom__' && !trips.some(t => t.id === value.tripId)) next.tripId = 'Choose an available trip.';
        if (value.tripId === '__custom__' && !value.customTripTitle.trim()) next.customTripTitle = 'Enter a title for this custom trip.';
        if (payment && !value.travellerName.trim()) next.travellerName = 'Select a traveller or enter their name.';
        if (payment && !m.validContact(value.travellerContact.trim())) next.travellerContact = 'Enter a valid phone number (7–15 digits) or email address.';
        if (value.departureId && !availableDepartures.some(d => d.id === value.departureId)) next.departureId = 'Choose a departure belonging to this trip.';
        if (payment && value.bookingId && !availableBookings.some(b => b.bookingId === value.bookingId)) next.bookingId = 'Choose a booking belonging to this trip and departure.';
        setErrors(next);
        if (Object.keys(next).length) { setReview(false); setTimeout(() => document.getElementById('finance-' + Object.keys(next)[0])?.focus(), 0); return; }
        setReview(true);
    };
    const apply = async () => {
        setPending(true); setFailure('');
        try {
            const stamp = new Date().toISOString();
            const selectedTrip = trips.find(t => t.id === value.tripId);
            const customTripId = custom ? (value.tripId === '__custom__' ? 'custom:' + crypto.randomUUID() : value.tripId) : null;
            await onPreview({ ...value, amount: Number(value.amount), organizerId, id: value.id || crypto.randomUUID(),
                tripId: custom ? null : value.tripId || null, customTripId, customTripTitle: custom ? (selectedTrip?.title || value.customTripTitle.trim()) : '', tripTitle: custom ? (selectedTrip?.title || value.customTripTitle.trim()) : selectedTrip?.title || '',
                travellerKey: payment ? value.travellerKey || 'manual:' + crypto.randomUUID() : null, travellerName: payment ? value.travellerName.trim() : '', travellerContact: payment ? value.travellerContact.trim() : '', enquiryId: payment ? value.enquiryId : null,
                departureId: custom ? null : value.departureId || null, bookingId: payment && !custom ? value.bookingId || null : null, createdAt: value.createdAt || stamp, updatedAt: stamp, preview: true });
        } catch (error) { setFailure('Could not add the preview. Your inputs are still here; please try again.'); }
        finally { setPending(false); }
    };
    return h(FinanceDialog, { title: initial ? 'Edit Financial Entry' : 'Add Financial Entry', onClose: pending ? () => {} : onClose },
        h('p', { className: 'finance-notice' }, 'Preview only · not saved. Entries disappear when you leave this page or reload. External payments are only recorded here; no money is processed.'),
        h('form', { onSubmit: submit, noValidate: true }, h('div', { className: 'finance-fields' },
            field('type', 'Entry type *', m.types.filter(t => t !== 'Adjustment')),
            field('amount', 'Amount *', null, { inputMode: 'decimal', placeholder: '0.00', required: true }),
            field('currency', 'Currency *', m.currencies), field('date', 'Date *', null, { type: 'date', max: m.today(), required: true }),
            field('category', 'Category *', m.categories(value.type)),
            field('paymentMethod', 'External payment method', [['', 'Not specified'], ...m.methods]),
            field('tripId', 'Related trip', [['', 'General / no trip'], ['__custom__', '+ Create custom trip title'], ...trips.map(t => [t.id, t.title + (t.custom ? ' · Custom trip' : ' · Registered trip')])]),
            value.tripId === '__custom__' && field('customTripTitle', 'Custom trip title *', null, { required: true, maxLength: 160, placeholder: 'e.g. Private Kerala group' }),
            custom && h('p', { className: 'finance-help finance-wide' }, 'Custom trips belong only to this finance preview. They are not published as platform listings. Reuse the same custom trip for later payments.'),
            !custom && field('departureId', 'Related departure', [['', availableDepartures.length ? 'No departure selected' : 'No departure records available'], ...availableDepartures.map(d => [d.id, d.date || d.id])], { disabled: !availableDepartures.length }),
            payment && h('label', { className: 'finance-wide' }, h('span', null, 'Traveller'), h('select', { value: value.travellerKey, onChange: chooseTraveller, 'aria-label': 'Traveller' }, h('option', { value: '' }, 'Enter a new traveller manually'), [...travellerOptions.values()].map(person => h('option', { key: person.key, value: person.key }, `${person.name || 'Unnamed traveller'} · ${person.contact || 'Contact missing'}`)))),
            payment && !custom && h('p', { className: 'finance-help finance-wide', role: contactsError ? 'alert' : 'status' }, contactsLoading ? 'Loading traveller contacts from your enquiries…' : contactsError ? 'Traveller contacts could not be loaded. You can enter details manually.' : 'Contacts come from your trip enquiries. Selecting a contact does not confirm a booking or record a payment automatically.'),
            payment && field('travellerName', 'Traveller name *', null, { maxLength: 120, required: true, readOnly: !!value.travellerKey && !!travellerOptions.get(value.travellerKey)?.name }),
            payment && field('travellerContact', 'Traveller contact (phone or email) *', null, { maxLength: 160, required: true, readOnly: !!value.travellerKey && !!travellerOptions.get(value.travellerKey)?.contact }),
            payment && !custom && field('bookingId', value.type === 'Refund Issued' ? 'Refund relates to booking' : 'Related confirmed booking', [['', availableBookings.length ? 'Unallocated' : 'Booking records not connected'], ...availableBookings.map(b => [b.bookingId, b.bookingId])], { disabled: !availableBookings.length }),
            field('description', 'Description', null, { maxLength: 300 }), field('referenceNumber', 'External reference number', null, { maxLength: 120 }),
            h('label', { className: 'finance-wide' }, h('span', null, 'Private notes'), h('textarea', { value: value.notes, maxLength: 2000, rows: 3, onChange: e => set('notes', e.target.value) }))),
            h('p', { className: 'finance-help' }, 'Adjustments require an agreed accounting policy and are unavailable in this preview.'),
            review && h('p', { className: 'finance-notice' }, `${custom ? 'Custom trip: ' : 'Trip: '}${trips.find(t => t.id === value.tripId)?.title || value.customTripTitle || 'General'}${payment ? ' · ' + value.travellerName + ' · ' + value.travellerContact : ''}`),
            review && h('div', { className: 'finance-notice', role: 'status' }, h('strong', null, 'Review your unsaved entry'), h('p', null, `${value.type} · ${m.money(Number(value.amount), value.currency)} · ${value.date} · ${value.category}`), h('p', null, value.description || 'No description')),
            failure && h('p', { role: 'alert', className: 'finance-error' }, failure),
            h('div', { className: 'finance-actions' }, h(Btn, { type: 'button', variant: 'outline', onClick: onClose, disabled: pending }, 'Cancel'),
                review ? h(Btn, { type: 'button', onClick: apply, disabled: pending, loading: pending }, pending ? 'Adding preview…' : initial ? 'Apply preview changes' : 'Add to temporary preview') : h(Btn, { type: 'submit' }, 'Review entry'))));
}
