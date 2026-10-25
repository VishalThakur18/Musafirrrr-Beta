"use strict";

/**
 * Frontend contracts only.
 * All amounts use major currency units. Null means unknown.
 *
 * No database requests, storage, booking mutations, or inferred accounting
 * rules belong in this model.
 */

const FinanceModel = (() => {
    const types = [
        "Payment Received",
        "Advance Payment",
        "Partial Payment",
        "Expense",
        "Refund Issued",
        "Other Income",
        "Adjustment"
    ];

    const currencies = ["INR", "USD", "EUR", "GBP"];

    const methods = [
        "UPI",
        "Cash",
        "Bank Transfer",
        "Card",
        "Other"
    ];

    const paymentTypes = [
        "Payment Received",
        "Advance Payment",
        "Partial Payment"
    ];

    const expenses = [
        "Transport",
        "Accommodation",
        "Meals",
        "Activities",
        "Guides and Vendors",
        "Permits",
        "Marketing",
        "Other Expenses"
    ];

    const tripKey = entry =>
        entry?.customTripId || entry?.tripId || "";

    const tripLabel = (entry, trips = []) => {
        if (!entry) return "General";

        if (entry.customTripTitle) {
            return entry.customTripTitle;
        }

        const trip = trips.find(item => item.id === entry.tripId);

        return (
            trip?.title ||
            entry.tripTitle ||
            (entry.tripId ? "Trip unavailable" : "General")
        );
    };

    const validContact = value => {
        const text = String(value ?? "").trim();

        const validEmail =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);

        const digits = text.replace(/\D/g, "");

        const validPhone =
            /^[+\d\s().-]+$/.test(text) &&
            digits.length >= 7 &&
            digits.length <= 15;

        return validEmail || validPhone;
    };

    const categories = type => {
        if (type === "Expense") {
            return expenses;
        }

        if (type === "Refund Issued") {
            return ["Traveller Refund"];
        }

        if (type === "Other Income") {
            return ["Other Income"];
        }

        if (type === "Adjustment") {
            return ["Adjustment"];
        }

        return ["Traveller Payment"];
    };

    const today = () => {
        const date = new Date();

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };

    const validDate = value => {
        if (typeof value !== "string") return false;

        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            return false;
        }

        const [year, month, day] = value.split("-").map(Number);
        const date = new Date(Date.UTC(year, month - 1, day));

        return (
            date.getUTCFullYear() === year &&
            date.getUTCMonth() === month - 1 &&
            date.getUTCDate() === day
        );
    };

    const money = (amount, currency = "INR") => {
        if (
            amount === null ||
            amount === undefined ||
            amount === "" ||
            !Number.isFinite(Number(amount)) ||
            !currencies.includes(currency)
        ) {
            return "Not available yet";
        }

        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency
        }).format(Number(amount));
    };

    const defaults = () => ({
        period: "30",
        start: "",
        end: "",
        tripId: "",
        departureId: "",
        type: "",
        category: "",
        currency: "INR",
        search: "",
        sort: "desc"
    });

    function range(filters, now = today()) {
        if (filters.period === "custom") {
            return [filters.start || "", filters.end || ""];
        }

        if (filters.period === "month") {
            return [now.slice(0, 7) + "-01", now];
        }

        const period = Number(filters.period);

        if (![7, 30, 90].includes(period)) {
            return ["", ""];
        }

        const [year, month, day] = now.split("-").map(Number);

        const date = new Date(Date.UTC(year, month - 1, day));

        date.setUTCDate(date.getUTCDate() - period + 1);

        const start =
            `${date.getUTCFullYear()}-` +
            `${String(date.getUTCMonth() + 1).padStart(2, "0")}-` +
            `${String(date.getUTCDate()).padStart(2, "0")}`;

        return [start, now];
    }

    function filter(entries, filters = defaults()) {
        if (!Array.isArray(entries)) return [];

        const [start, end] = range(filters);

        if (
            !validDate(start) ||
            !validDate(end) ||
            start > end
        ) {
            return [];
        }

        const search = String(filters.search || "")
            .trim()
            .toLowerCase();

        return entries
            .filter(entry => {
                if (!entry || typeof entry !== "object") {
                    return false;
                }

                if (entry.currency !== filters.currency) {
                    return false;
                }

                if (
                    !validDate(entry.date) ||
                    entry.date < start ||
                    entry.date > end
                ) {
                    return false;
                }

                if (
                    filters.tripId &&
                    tripKey(entry) !== filters.tripId
                ) {
                    return false;
                }

                if (
                    filters.departureId &&
                    entry.departureId !== filters.departureId
                ) {
                    return false;
                }

                if (filters.type && entry.type !== filters.type) {
                    return false;
                }

                if (
                    filters.category &&
                    entry.category !== filters.category
                ) {
                    return false;
                }

                if (search) {
                    const searchable = [
                        entry.description,
                        entry.referenceNumber,
                        entry.bookingId,
                        entry.category,
                        entry.travellerName,
                        entry.travellerContact,
                        entry.customTripTitle,
                        entry.tripTitle
                    ]
                        .map(value => String(value || ""))
                        .join(" ")
                        .toLowerCase();

                    if (!searchable.includes(search)) {
                        return false;
                    }
                }

                return true;
            })
            .sort((a, b) => {
                const comparison = a.date.localeCompare(b.date);

                return filters.sort === "asc"
                    ? comparison
                    : -comparison;
            });
    }

    function validate(entry) {
        const errors = {};

        if (
            !types.includes(entry.type) ||
            entry.type === "Adjustment"
        ) {
            errors.type = "Choose a supported entry type.";
        }

        const amountText = String(entry.amount ?? "");

        if (
            !/^\d+(\.\d{1,2})?$/.test(amountText) ||
            !Number.isFinite(Number(amountText)) ||
            Number(amountText) <= 0 ||
            Number(amountText) > 999999999999
        ) {
            errors.amount =
                "Enter a positive amount with up to two decimal places (maximum 999,999,999,999).";
        }

        if (!currencies.includes(entry.currency)) {
            errors.currency = "Choose a supported currency.";
        }

        if (
            !validDate(entry.date) ||
            entry.date > today()
        ) {
            errors.date =
                "Choose a valid date on or before today.";
        }

        if (
            !categories(entry.type).includes(entry.category)
        ) {
            errors.category =
                "Choose a category for this entry type.";
        }

        if (
            entry.paymentMethod &&
            !methods.includes(entry.paymentMethod)
        ) {
            errors.paymentMethod =
                "Choose an available payment method.";
        }

        return errors;
    }

    /**
     * Groups payments by organizer, trip, traveller identity and currency.
     * Uses integer minor units internally to avoid floating-point drift.
     *
     * Refunds are reported separately and are not automatically deducted
     * from the amount paid or used to infer an outstanding booking balance.
     */
    function travellerPayments(entries) {
        const groups = new Map();

        if (!Array.isArray(entries)) {
            return [];
        }

        entries
            .filter(entry =>
                entry &&
                (
                    paymentTypes.includes(entry.type) ||
                    entry.type === "Refund Issued"
                )
            )
            .forEach(entry => {
                const identity =
                    entry.travellerKey ||
                    `unassigned:${entry.id}`;

                const key = JSON.stringify([
                    entry.organizerId,
                    tripKey(entry),
                    identity,
                    entry.currency
                ]);

                if (!groups.has(key)) {
                    groups.set(key, {
                        key,
                        organizerId: entry.organizerId,
                        tripId: entry.tripId || null,
                        customTripId: entry.customTripId || null,
                        customTripTitle: entry.customTripTitle || "",
                        tripTitle: entry.tripTitle || "",
                        travellerKey: identity,
                        travellerName: entry.travellerName || "",
                        travellerContact: entry.travellerContact || "",
                        currency: entry.currency,
                        paidMinor: 0,
                        refundMinor: 0,
                        paymentCount: 0,
                        refundCount: 0,
                        entries: [],
                        preview: false
                    });
                }

                const row = groups.get(key);
                const amountMinor = Math.round(
                    Number(entry.amount) * 100
                );

                if (!Number.isFinite(amountMinor)) {
                    return;
                }

                if (entry.type === "Refund Issued") {
                    row.refundMinor += amountMinor;
                    row.refundCount += 1;
                } else {
                    row.paidMinor += amountMinor;
                    row.paymentCount += 1;
                }

                row.entries.push(entry);
                row.preview = row.preview || !!entry.preview;
            });

        return [...groups.values()].map(row => ({
            ...row,
            paid: row.paymentCount
                ? row.paidMinor / 100
                : null,
            refunded: row.refundCount
                ? row.refundMinor / 100
                : null
        }));
    }

    /**
     * Protects CSV exports against spreadsheet formula injection.
     */
    const csvCell = value => {
        let text = String(value ?? "");

        if (/^[\s]*[=+@-]/.test(text)) {
            text = "'" + text;
        }

        return '"' + text.replace(/"/g, '""') + '"';
    };

    const csv = rows =>
        "\uFEFF" +
        rows
            .map(row => row.map(csvCell).join(","))
            .join("\r\n");

    return {
        types,
        currencies,
        methods,
        paymentTypes,
        tripKey,
        tripLabel,
        validContact,
        travellerPayments,
        csv,
        categories,
        today,
        validDate,
        money,
        defaults,
        range,
        filter,
        validate
    };
})();