"use strict";

/**
 * Finance data access for the organizer dashboard.
 * Database columns are mapped to camelCase before reaching the UI.
 */
const financeApi = {
    async readAll(table, organizerId, order) {
        const rows = [];
        for (let offset = 0; ; offset += 500) {
            const { data, error } = await this.client().from(table).select('*')
                .eq('organizer_id', organizerId).order(order, { ascending: false })
                .order('id', { ascending: true }).range(offset, offset + 499);
            if (error) throw error;
            rows.push(...(data || []));
            if (!data || data.length < 500) return rows;
        }
    },
    client() {
        if (!window.sbClient) {
            throw new Error("Supabase is not initialized.");
        }
        return window.sbClient;
    },

    async list(organizerId) {
        if (!organizerId) throw new Error("Organizer not found.");

        const data = await this.readAll('finance_entries', organizerId, 'event_date');
        return (data || []).map(row => this.fromDb(row));
    },

    fromDb(row) {
        if (!row) return null;

        return {
            id: row.id,
            organizerId: row.organizer_id,
            tripId: row.trip_id || null,
            customTripId: row.custom_trip_id || null,
            customTripTitle: row.custom_trip_title || "",
            tripTitle: row.custom_trip_title || "",
            departureId: row.departure_id || "",
            bookingId: row.booking_id || "",
            enquiryId: row.enquiry_id || null,
            travellerId: row.traveller_id || null,
            travellerKey: row.traveller_id
                ? "platform:" + row.traveller_id
                : row.enquiry_id
                  ? "lead:" + row.enquiry_id
                  : row.booking_id ? 'booking:' + row.booking_id : row.id,
            travellerName: row.traveller_name || "",
            travellerContact: row.traveller_contact || "",
            type: row.transaction_type,
            category: row.category,
            amount: Number(row.amount || 0),
            currency: row.currency || "INR",
            date: row.event_date,
            paymentMethod: row.payment_method || "",
            description: row.description || "",
            referenceNumber: row.reference_number || "",
            notes: row.notes || "",
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            preview: false
        };
    },

    toDb(entry, organizerId) {
        if (!organizerId) throw new Error("Organizer not found.");

        const amount = Number(entry.amount);

        if (!Number.isFinite(amount) || amount <= 0) {
            throw new Error("Enter a valid amount greater than zero.");
        }

        return {
            organizer_id: organizerId,
            trip_id: entry.tripId || null,
            custom_trip_id: entry.customTripId || null,
            custom_trip_title: entry.customTripId ? entry.customTripTitle || entry.tripTitle || null : null,
            departure_id: entry.departureId || null,
            booking_id: entry.bookingId || null,
            enquiry_id: entry.enquiryId || null,
            traveller_id: entry.travellerId || null,
            traveller_name: entry.travellerName || null,
            traveller_contact: entry.travellerContact || null,
            transaction_type: entry.type,
            category: entry.category,
            amount,
            currency: entry.currency,
            event_date: entry.date,
            payment_method: entry.paymentMethod || null,
            description: entry.description || "",
            reference_number: entry.referenceNumber || "",
            notes: entry.notes || ""
        };
    },

    async create(entry, organizerId) {
        await this.validateAllocation(entry, organizerId);
        const payload = this.toDb(entry, organizerId);

        const { data, error } = await this.client()
            .from("finance_entries")
            .insert(payload)
            .select("*")
            .single();

        if (error) throw error;
        return this.fromDb(data);
    },

    async update(id, entry, organizerId) {
        if (!id || !organizerId) {
            throw new Error("Entry or organizer could not be identified.");
        }

        await this.validateAllocation(entry, organizerId);
        const payload = this.toDb(entry, organizerId);

        const { data, error } = await this.client()
            .from("finance_entries")
            .update(payload)
            .eq("id", id)
            .eq("organizer_id", organizerId)
            .select("*")
            .single();

        if (error) throw error;
        return this.fromDb(data);
    },

    async remove(id, organizerId) {
        if (!id || !organizerId) {
            throw new Error("Entry or organizer could not be identified.");
        }

        const { data, error } = await this.client()
            .from("finance_entries")
            .delete()
            .eq("id", id)
            .eq("organizer_id", organizerId)
            .select("id");

        if (error) throw error;

        if (!data || !data.length) {
            throw new Error(
                "Entry not found or you do not have permission to delete it."
            );
        }
    },

    bookingFromDb(row) {
        return {
            id: row.id,
            bookingId: row.id,
            organizerId: row.organizer_id,
            tripId: row.trip_id || null,
            departureId: row.departure_id || "",
            enquiryId: row.enquiry_id || null,
            travellerId: row.traveller_id || null,
            travellerName: row.traveller_name || "",
            travellerContact: row.traveller_contact || "",
            agreedAmount: Number(row.agreed_amount || 0),
            currency: row.currency || "INR",
            status: row.status || "confirmed",
            notes: row.notes || "",
            createdAt: row.created_at
        };
    },

    async listBookings(organizerId) {
        if (!organizerId) throw new Error("Organizer not found.");

        const data = await this.readAll('finance_bookings', organizerId, 'created_at');

        return (data || []).map(row => this.bookingFromDb(row));
    },

    async createBooking(booking, organizerId) {
        if (!organizerId) throw new Error("Organizer not found.");

        const agreedAmount = Number(booking.agreedAmount);

        if (!/^\d+(\.\d{1,2})?$/.test(String(booking.agreedAmount)) || !Number.isFinite(agreedAmount) || agreedAmount < 0 || agreedAmount > 999999999999 || !FinanceModel.currencies.includes(booking.currency || 'INR')) {
            throw new Error("Enter a valid agreed booking amount.");
        }

        const payload = {
            organizer_id: organizerId,
            trip_id: booking.tripId,
            enquiry_id: booking.enquiryId || null,
            traveller_id: booking.travellerId || null,
            traveller_name: (booking.travellerName || "").trim(),
            traveller_contact: booking.travellerContact || null,
            agreed_amount: agreedAmount,
            currency: booking.currency || "INR",
            status: "confirmed",
            notes: booking.notes || ""
        };

        if (!payload.trip_id) {
            throw new Error("Choose a registered trip for this booking.");
        }

        if (!payload.traveller_name) {
            throw new Error("Enter the traveller's name.");
        }

        const { data, error } = await this.client()
            .from("finance_bookings")
            .insert(payload)
            .select("*")
            .single();

        if (error) throw error;
        return this.bookingFromDb(data);
    },

    async updateBooking(id, changes, organizerId) {
        if (!id || !organizerId) throw new Error('Booking or organizer missing.');
        const amount = Number(changes.agreedAmount);
        if (!/^\d+(\.\d{1,2})?$/.test(String(changes.agreedAmount)) || !Number.isFinite(amount) || amount < 0 || amount > 999999999999) throw new Error('Enter a valid amount with up to two decimals.');
        if (!['confirmed', 'completed', 'cancelled'].includes(changes.status)) throw new Error('Choose a valid booking status.');
        // Trip, currency and identity are immutable here: historical allocations remain valid.
        const { data, error } = await this.client().from('finance_bookings')
            .update({ agreed_amount: amount, status: changes.status, notes: changes.notes || '' })
            .eq('id', id).eq('organizer_id', organizerId).select('*').single();
        if (error) throw error;
        return this.bookingFromDb(data);
    },

    async validateAllocation(entry, organizerId) {
        if (!entry.bookingId) return;
        const { data, error } = await this.client().from('finance_bookings').select('*')
            .eq('id', entry.bookingId).eq('organizer_id', organizerId).single();
        if (error) throw error;
        const booking = this.bookingFromDb(data);
        if (booking.status === 'cancelled' || entry.customTripId || booking.tripId !== entry.tripId || booking.currency !== entry.currency ||
            ![...FinanceModel.paymentTypes, 'Refund Issued'].includes(entry.type) || !financeBookingMatchesTraveller(booking, entry)) {
            throw new Error('Choose an active booking for the same trip, traveller and currency. Cancelled bookings cannot accept new linked entries.');
        }
    },

    /**
     * Synchronous because the page uses this result directly during render.
     * entries and bookings must already be loaded by list() and listBookings().
     */
    summary(organizerId, filters, entries = [], bookings = []) {
        if (!organizerId || !filters) return {};

        const [start, end] = FinanceModel.range(filters);
        const paymentTypes = FinanceModel.paymentTypes;

        entries = entries.filter(entry => entry.organizerId === organizerId);
        const matchesFilters = entry =>
            entry.currency === filters.currency &&
            entry.date >= start &&
            entry.date <= end &&
            (!filters.tripId ||
                FinanceModel.tripKey(entry) === filters.tripId) &&
            (!filters.departureId ||
                entry.departureId === filters.departureId) &&
            (!filters.type || entry.type === filters.type) &&
            (!filters.category || entry.category === filters.category);

        const inRange = entries.filter(matchesFilters);

        const sum = types =>
            inRange
                .filter(entry => types.includes(entry.type))
                .reduce((total, entry) => total + Math.round(Number(entry.amount || 0) * 100), 0) / 100;

        const relevantBookings = bookings.filter(booking =>
            booking.organizerId === organizerId &&
            booking.currency === filters.currency &&
            (!filters.tripId || booking.tripId === filters.tripId) &&
            (!filters.departureId ||
                booking.departureId === filters.departureId)
        );

        const balances = relevantBookings.map(booking => {
            const linkedEntries = entries.filter(
                entry => entry.bookingId === booking.bookingId && entry.tripId === booking.tripId && entry.currency === booking.currency
            );

            const totalPayments = linkedEntries
                .filter(entry => paymentTypes.includes(entry.type))
                .reduce((total, entry) => total + Math.round(Number(entry.amount || 0) * 100), 0) / 100;

            const totalRefunds = linkedEntries
                .filter(entry => entry.type === "Refund Issued")
                .reduce((total, entry) => total + Math.round(Number(entry.amount || 0) * 100), 0) / 100;

            const adjustments = linkedEntries
                .filter(entry => entry.type === "Adjustment")
                .reduce((total, entry) => total + Number(entry.amount || 0), 0);

            // Refunds are cash outflows, not a new obligation to pay. Change the
            // agreed amount explicitly for a revised agreement; cancel to close it.
            const outstanding = Math.max(0, Math.round(booking.agreedAmount * 100) - Math.round(totalPayments * 100)) / 100;

            return {
                bookingId: booking.bookingId,
                tripId: booking.tripId,
                departureId: booking.departureId,
                tripTitle: "",
                currency: booking.currency,
                bookingStatus: booking.status,
                travellerName: booking.travellerName,
                travellerContact: booking.travellerContact,
                paymentStatus: booking.status === 'cancelled' ? 'Cancelled' : outstanding === 0 ? 'Paid' : totalPayments > 0 ? 'Partially paid' : 'Unpaid',
                agreedAmount: booking.agreedAmount,
                totalPayments,
                totalRefunds,
                adjustments,
                outstandingAmount: booking.status === 'cancelled' ? 0 : outstanding,
                overpayment: Math.max(0, Math.round(totalPayments * 100) - Math.round(booking.agreedAmount * 100)) / 100
            };
        });

        const tripIds = new Set([
            ...inRange.map(entry => FinanceModel.tripKey(entry)),
            ...relevantBookings.map(booking => booking.tripId)
        ]);

        const tripFinance = [...tripIds]
            .filter(Boolean)
            .map(tripId => {
                const tripEntries = inRange.filter(
                    entry => FinanceModel.tripKey(entry) === tripId
                );

                const tripBookings = relevantBookings.filter(
                    booking => booking.tripId === tripId && booking.status !== 'cancelled'
                );

                const tripSum = types =>
                    tripEntries
                        .filter(entry => types.includes(entry.type))
                        .reduce(
                            (total, entry) => total + Math.round(Number(entry.amount || 0) * 100),
                            0
                        ) / 100;

                const tripBalances = balances.filter(
                    balance => balance.tripId === tripId
                );

                return {
                    tripId,
                    departureId: filters.departureId || "",
                    departureDate: "",
                    confirmedBookingValue: tripBalances.length ? tripBookings.reduce(
                        (total, booking) => total + Math.round(booking.agreedAmount * 100),
                        0
                    ) / 100 : null,
                    paymentsReceived: tripSum(paymentTypes),
                    recordedExpenses: tripSum(["Expense"]),
                    recordedRefunds: tripSum(["Refund Issued"]),
                    otherIncome: tripSum(["Other Income"]),
                    outstandingBalances: tripBalances.length ? tripBalances.reduce(
                        (total, balance) => total + Math.round(balance.outstandingAmount * 100),
                        0
                    ) / 100 : null,
                    estimatedProfit: Math.round((
                        tripSum(paymentTypes) +
                        tripSum(["Other Income"]) -
                        tripSum(["Expense"]) -
                        tripSum(["Refund Issued"])) * 100) / 100
                };
            });

        return {
            confirmedBookingValue: relevantBookings.length ? relevantBookings.filter(b => b.status !== 'cancelled').reduce(
                (total, booking) => total + Math.round(booking.agreedAmount * 100),
                0
            ) / 100 : null,
            paymentsReceived: sum(paymentTypes),
            recordedExpenses: sum(["Expense"]),
            recordedRefunds: sum(["Refund Issued"]),
            otherIncome: sum(["Other Income"]),
            estimatedProfit: Math.round((
                sum(paymentTypes) +
                sum(["Other Income"]) -
                sum(["Expense"]) -
                sum(["Refund Issued"])) * 100) / 100,
            outstandingBalances: balances.length ? balances.reduce(
                (total, balance) => total + Math.round(balance.outstandingAmount * 100),
                0
            ) / 100 : null,
            balances,
            // Drill-downs use these exact contributors rather than a second filter pass.
            breakdowns: {
                confirmedBookingValue: { kind: 'bookings', rows: relevantBookings.filter(b => b.status !== 'cancelled'), excludedCancelled: relevantBookings.filter(b => b.status === 'cancelled').length },
                outstandingBalances: { kind: 'balances', rows: balances.map(b => ({ ...b, payments: entries.filter(e => e.bookingId === b.bookingId && e.tripId === b.tripId && e.currency === b.currency && paymentTypes.includes(e.type)) })) },
                paymentsReceived: { kind: 'entries', rows: inRange.filter(e => paymentTypes.includes(e.type)) },
                recordedExpenses: { kind: 'entries', rows: inRange.filter(e => e.type === 'Expense') },
                recordedRefunds: { kind: 'entries', rows: inRange.filter(e => e.type === 'Refund Issued') },
                estimatedProfit: {
                    kind: 'cash', rows: inRange.filter(e => [...paymentTypes, 'Other Income', 'Expense', 'Refund Issued'].includes(e.type)),
                    components: { payments: sum(paymentTypes), otherIncome: sum(['Other Income']), expenses: sum(['Expense']), refunds: sum(['Refund Issued']) }
                }
            },
            tripFinance,
            reportingPeriod: { start, end },
            currency: filters.currency
        };
    },

    balances(bookings = [], entries = [], filters = {}) {
        const organizerId = bookings[0]?.organizerId;

        if (!organizerId) return [];

        return this.summary(
            organizerId,
            {
                ...FinanceModel.defaults(),
                ...filters
            },
            entries,
            bookings
        ).balances || [];
    }
};

function financeBookingMatchesTraveller(booking, entry) {
    if (booking.travellerId && entry.travellerId) return booking.travellerId === entry.travellerId;
    if (booking.enquiryId && entry.enquiryId) return booking.enquiryId === entry.enquiryId;
    const clean = value => String(value || '').trim().toLowerCase();
    const contact = value => String(value || '').includes('@') ? clean(value) : String(value || '').replace(/\D/g, '');
    // Legacy manual bookings can lack contact details. An explicitly selected
    // booking identity and matching name can still receive a payment.
    if (!contact(booking.travellerContact) && entry.travellerKey === 'booking:' + booking.bookingId) return !!clean(entry.travellerName) && clean(booking.travellerName) === clean(entry.travellerName);
    return !!clean(entry.travellerName) && !!contact(entry.travellerContact) && clean(booking.travellerName) === clean(entry.travellerName) && contact(booking.travellerContact) === contact(entry.travellerContact);
}
