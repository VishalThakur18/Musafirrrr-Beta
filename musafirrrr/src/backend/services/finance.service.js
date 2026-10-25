"use strict";

/**
 * Finance data access for the organizer dashboard.
 * Database columns are mapped to camelCase before reaching the UI.
 */
const financeApi = {
    client() {
        if (!window.sbClient) {
            throw new Error("Supabase is not initialized.");
        }
        return window.sbClient;
    },

    async list(organizerId) {
        if (!organizerId) throw new Error("Organizer not found.");

        const { data, error } = await this.client()
            .from("finance_entries")
            .select("*")
            .eq("organizer_id", organizerId)
            .order("event_date", { ascending: false })
            .order("created_at", { ascending: false });

        if (error) throw error;
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
                  : row.id,
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
            custom_trip_title: entry.customTripTitle || entry.tripTitle || null,
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

        const { data, error } = await this.client()
            .from("finance_bookings")
            .select("*")
            .eq("organizer_id", organizerId)
            .neq("status", "cancelled")
            .order("created_at", { ascending: false });

        if (error) throw error;

        return (data || []).map(row => this.bookingFromDb(row));
    },

    async createBooking(booking, organizerId) {
        if (!organizerId) throw new Error("Organizer not found.");

        const agreedAmount = Number(booking.agreedAmount);

        if (!Number.isFinite(agreedAmount) || agreedAmount < 0) {
            throw new Error("Enter a valid agreed booking amount.");
        }

        const payload = {
            organizer_id: organizerId,
            trip_id: booking.tripId,
            departure_id: booking.departureId || null,
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

    /**
     * Synchronous because the page uses this result directly during render.
     * entries and bookings must already be loaded by list() and listBookings().
     */
    summary(organizerId, filters, entries = [], bookings = []) {
        if (!organizerId || !filters) return {};

        const [start, end] = FinanceModel.range(filters);
        const paymentTypes = FinanceModel.paymentTypes;

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
                .reduce((total, entry) => total + Number(entry.amount || 0), 0);

        const relevantBookings = bookings.filter(booking =>
            booking.organizerId === organizerId &&
            booking.status !== "cancelled" &&
            booking.currency === filters.currency &&
            (!filters.tripId || booking.tripId === filters.tripId) &&
            (!filters.departureId ||
                booking.departureId === filters.departureId)
        );

        const bookingIds = new Set(
            relevantBookings.map(booking => booking.bookingId)
        );

        const balances = relevantBookings.map(booking => {
            const linkedEntries = entries.filter(
                entry => entry.bookingId === booking.bookingId
            );

            const totalPayments = linkedEntries
                .filter(entry => paymentTypes.includes(entry.type))
                .reduce((total, entry) => total + Number(entry.amount || 0), 0);

            const totalRefunds = linkedEntries
                .filter(entry => entry.type === "Refund Issued")
                .reduce((total, entry) => total + Number(entry.amount || 0), 0);

            const adjustments = linkedEntries
                .filter(entry => entry.type === "Adjustment")
                .reduce((total, entry) => total + Number(entry.amount || 0), 0);

            const netPaid = totalPayments - totalRefunds + adjustments;

            return {
                bookingId: booking.bookingId,
                tripId: booking.tripId,
                departureId: booking.departureId,
                tripTitle: "",
                currency: booking.currency,
                bookingStatus: booking.status,
                agreedAmount: booking.agreedAmount,
                totalPayments,
                totalRefunds,
                adjustments,
                outstandingAmount: Math.max(0, booking.agreedAmount - netPaid)
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
                    booking => booking.tripId === tripId
                );

                const tripSum = types =>
                    tripEntries
                        .filter(entry => types.includes(entry.type))
                        .reduce(
                            (total, entry) => total + Number(entry.amount || 0),
                            0
                        );

                const tripBalances = balances.filter(
                    balance => balance.tripId === tripId
                );

                return {
                    tripId,
                    departureId: filters.departureId || "",
                    departureDate: "",
                    confirmedBookingValue: tripBookings.reduce(
                        (total, booking) => total + booking.agreedAmount,
                        0
                    ),
                    paymentsReceived: tripSum(paymentTypes),
                    recordedExpenses: tripSum(["Expense"]),
                    recordedRefunds: tripSum(["Refund Issued"]),
                    otherIncome: tripSum(["Other Income"]),
                    outstandingBalances: tripBalances.reduce(
                        (total, balance) => total + balance.outstandingAmount,
                        0
                    ),
                    estimatedProfit:
                        tripSum(paymentTypes) +
                        tripSum(["Other Income"]) -
                        tripSum(["Expense"]) -
                        tripSum(["Refund Issued"])
                };
            });

        return {
            confirmedBookingValue: relevantBookings.reduce(
                (total, booking) => total + booking.agreedAmount,
                0
            ),
            paymentsReceived: sum(paymentTypes),
            recordedExpenses: sum(["Expense"]),
            recordedRefunds: sum(["Refund Issued"]),
            otherIncome: sum(["Other Income"]),
            estimatedProfit:
                sum(paymentTypes) +
                sum(["Other Income"]) -
                sum(["Expense"]) -
                sum(["Refund Issued"]),
            outstandingBalances: balances.reduce(
                (total, balance) => total + balance.outstandingAmount,
                0
            ),
            balances,
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