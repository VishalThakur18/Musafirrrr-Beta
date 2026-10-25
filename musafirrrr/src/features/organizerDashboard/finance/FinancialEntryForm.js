"use strict";

/** Feature-local focus management for the finance dialog. */
function FinanceDialog({ title, onClose, children }) {
    const ref = useRef(null);

    useEffect(() => {
        const container = ref.current;
        if (!container) return undefined;

        const previous = document.activeElement;
        const dialog = container.closest('[role="dialog"]');

        if (!dialog) return undefined;

        const controls = () => [
            ...dialog.querySelectorAll(
                'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]'
            )
        ];

        container.querySelector("input, select, button")?.focus();

        const trap = event => {
            if (event.key !== "Tab") return;

            const items = controls();
            if (!items.length) return;

            const first = items[0];
            const last = items[items.length - 1];

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (
                !event.shiftKey &&
                document.activeElement === last
            ) {
                event.preventDefault();
                first.focus();
            }
        };

        dialog.addEventListener("keydown", trap);

        return () => {
            dialog.removeEventListener("keydown", trap);

            if (previous?.isConnected) {
                previous.focus();
            }
        };
    }, []);

    return React.createElement(
        Modal,
        {
            open: true,
            onClose,
            label: title,
            size: "lg"
        },
        React.createElement(
            "div",
            {
                className: "finance-ui finance-dialog",
                ref
            },
            React.createElement("h2", null, title),
            children
        )
    );
}

function FinancialEntryForm({
    initial,
    organizerId,
    trips = [],
    contacts = [],
    entries = [],
    contactsLoading = false,
    contactsError = false,
    departures = [],
    bookings = [],
    onClose,
    onPreview
}) {
    const h = React.createElement;
    const m = FinanceModel;

    const [value, setValue] = useState(() => ({
        type: "Payment Received",
        amount: "",
        currency: "INR",
        date: m.today(),
        category: "Traveller Payment",
        tripId: "",
        customTripTitle: "",
        travellerKey: "",
        travellerName: "",
        travellerContact: "",
        enquiryId: null,
        travellerId: null,
        departureId: "",
        bookingId: "",
        paymentMethod: "",
        description: "",
        referenceNumber: "",
        notes: "",
        ...initial,
        ...(initial ? { tripId: m.tripKey(initial) } : {})
    }));

    const [errors, setErrors] = useState({});
    const [review, setReview] = useState(false);
    const [pending, setPending] = useState(false);
    const [failure, setFailure] = useState("");

    const set = (key, next) => {
        setValue(current => ({
            ...current,
            [key]: next,

            ...(key === "type"
                ? { category: m.categories(next)[0] }
                : {}),

            ...(key === "tripId"
                ? {
                    departureId: "",
                    bookingId: "",
                    customTripTitle: "",
                    travellerKey: "",
                    travellerName: "",
                    travellerContact: "",
                    enquiryId: null,
                    travellerId: null
                }
                : {}),

            ...(key === "departureId"
                ? { bookingId: "" }
                : {})
        }));

        setErrors(current => {
            const nextErrors = { ...current };
            delete nextErrors[key];
            return nextErrors;
        });

        setReview(false);
        setFailure("");
    };

    const field = (key, label, options, extra = {}) =>
        h(
            "label",
            { key },
            h("span", null, label),

            h(
                options ? "select" : "input",
                {
                    id: "finance-" + key,
                    "aria-label": label,
                    value: value[key] ?? "",
                    onChange: event => set(key, event.target.value),
                    "aria-invalid": !!errors[key],
                    "aria-describedby": errors[key]
                        ? "finance-error-" + key
                        : undefined,
                    ...extra
                },

                options &&
                    options.map(option =>
                        h(
                            "option",
                            {
                                key:
                                    typeof option === "string"
                                        ? option
                                        : option[0],
                                value:
                                    typeof option === "string"
                                        ? option
                                        : option[0]
                            },
                            typeof option === "string"
                                ? option
                                : option[1]
                        )
                    )
            ),

            errors[key] &&
                h(
                    "small",
                    {
                        className: "finance-error",
                        id: "finance-error-" + key
                    },
                    errors[key]
                )
        );

    const payment = [
        "Payment Received",
        "Advance Payment",
        "Partial Payment",
        "Refund Issued"
    ].includes(value.type);

    const custom =
        value.tripId === "__custom__" ||
        !!trips.find(trip => trip.id === value.tripId)?.custom;

    const travellerOptions = new Map();

    if (!custom) {
        contacts
            .filter(contact => contact.tripId === value.tripId)
            .forEach(contact => {
                const key = contact.travellerId
                    ? "platform:" + contact.travellerId
                    : "lead:" + contact.id;

                if (!travellerOptions.has(key)) {
                    travellerOptions.set(key, {
                        key,
                        name: contact.name || "",
                        contact:
                            contact.phone ||
                            contact.email ||
                            "",
                        enquiryId: contact.id,
                        travellerId: contact.travellerId || null
                    });
                }
            });
    }

    entries
        .filter(
            entry =>
                m.tripKey(entry) === value.tripId &&
                entry.travellerKey
        )
        .forEach(entry => {
            if (!travellerOptions.has(entry.travellerKey)) {
                travellerOptions.set(entry.travellerKey, {
                    key: entry.travellerKey,
                    name: entry.travellerName || "",
                    contact: entry.travellerContact || "",
                    enquiryId: entry.enquiryId || null,
                    travellerId: entry.travellerId || null
                });
            }
        });

    if (
        initial?.travellerKey &&
        m.tripKey(initial) === value.tripId &&
        !travellerOptions.has(initial.travellerKey)
    ) {
        travellerOptions.set(initial.travellerKey, {
            key: initial.travellerKey,
            name: initial.travellerName || "",
            contact: initial.travellerContact || "",
            enquiryId: initial.enquiryId || null,
            travellerId: initial.travellerId || null
        });
    }

    const chooseTraveller = event => {
        const person = travellerOptions.get(event.target.value);

        setValue(current => ({
            ...current,
            travellerKey: person?.key || "",
            travellerName: person?.name || "",
            travellerContact: person?.contact || "",
            enquiryId: person?.enquiryId || null,
            travellerId: person?.travellerId || null
        }));

        setErrors(current => {
            const nextErrors = { ...current };
            delete nextErrors.travellerName;
            delete nextErrors.travellerContact;
            return nextErrors;
        });

        setReview(false);
        setFailure("");
    };

    const availableDepartures = departures.filter(
        departure => departure.tripId === value.tripId
    );

    const availableBookings = bookings.filter(
        booking =>
            booking.tripId === value.tripId &&
            (!value.departureId ||
                booking.departureId === value.departureId)
    );

    const submit = event => {
        event.preventDefault();

        const next = m.validate(value);

        if (
            value.tripId &&
            value.tripId !== "__custom__" &&
            !trips.some(trip => trip.id === value.tripId)
        ) {
            next.tripId = "Choose an available trip.";
        }

        if (
            value.tripId === "__custom__" &&
            !value.customTripTitle.trim()
        ) {
            next.customTripTitle = "Enter a title for this custom trip.";
        }

        if (payment && !value.travellerName.trim()) {
            next.travellerName =
                "Select a traveller or enter their name.";
        }

        if (
            payment &&
            !m.validContact(value.travellerContact.trim())
        ) {
            next.travellerContact =
                "Enter a valid phone number (7–15 digits) or email address.";
        }

        if (
            value.departureId &&
            !availableDepartures.some(
                departure => departure.id === value.departureId
            )
        ) {
            next.departureId =
                "Choose a departure belonging to this trip.";
        }

        if (
            payment &&
            value.bookingId &&
            !availableBookings.some(
                booking => booking.bookingId === value.bookingId
            )
        ) {
            next.bookingId =
                "Choose a booking belonging to this trip and departure.";
        }

        if (
            value.tripId === "__custom__" &&
            value.bookingId
        ) {
            next.bookingId =
                "Custom trips cannot be linked to platform bookings.";
        }

        setErrors(next);

        if (Object.keys(next).length) {
            setReview(false);

            const firstError = Object.keys(next)[0];

            setTimeout(() => {
                document
                    .getElementById("finance-" + firstError)
                    ?.focus();
            }, 0);

            return;
        }

        setReview(true);
        setFailure("");
    };

    const apply = async () => {
        if (pending) return;

        if (typeof onPreview !== "function") {
            setFailure("The finance save handler is not connected.");
            return;
        }

        if (!organizerId) {
            setFailure(
                "Your organizer profile could not be identified. Please sign in again."
            );
            return;
        }

        setPending(true);
        setFailure("");

        try {
            const selectedTrip = trips.find(t => t.id === value.tripId);

const isCustomTrip =
    value.tripId === "__custom__" ||
    !!selectedTrip?.custom;

const customTripId = isCustomTrip
    ? (
        selectedTrip?.id ||
        value.customTripId ||
        `custom-${crypto.randomUUID()}`
    )
    : null;

const payload = {
    ...value,
    amount: Number(value.amount),
    organizerId,
    id: value.id || crypto.randomUUID(),

    tripId: isCustomTrip
        ? null
        : value.tripId || null,

    customTripId,
    customTripTitle: isCustomTrip
        ? (
            value.customTripTitle ||
            selectedTrip?.title ||
            value.tripTitle ||
            ""
        ).trim()
        : "",

    tripTitle: isCustomTrip
        ? (
            value.customTripTitle ||
            selectedTrip?.title ||
            value.tripTitle ||
            ""
        ).trim()
        : selectedTrip?.title || "",

    travellerName: payment
        ? value.travellerName.trim()
        : "",

    travellerContact: payment
        ? value.travellerContact.trim()
        : "",

    enquiryId: payment ? value.enquiryId : null,

    travellerId: payment
        ? contacts.find(c => c.id === value.enquiryId)?.travellerId || null
        : null,

    bookingId: payment && !isCustomTrip
        ? value.bookingId || null
        : null,

    preview: false
};

await onPreview(payload);
        } catch (error) {
            console.error("Could not save finance entry:", error);

            setFailure(
                error && error.message
                    ? error.message
                    : "Could not save the financial entry. Please try again."
            );
        } finally {
            setPending(false);
        }
    };

    return h(
        FinanceDialog,
        {
            title: initial
                ? "Edit Financial Entry"
                : "Add Financial Entry",
            onClose: pending ? () => {} : onClose
        },

        h(
            "p",
            { className: "finance-notice" },
            "Organizer-maintained records. Payments are recorded for tracking only; Musafirrrr does not process money."
        ),

        h(
            "form",
            {
                onSubmit: submit,
                noValidate: true
            },

            h(
                "div",
                { className: "finance-fields" },

                field(
                    "type",
                    "Entry type *",
                    m.types.filter(type => type !== "Adjustment")
                ),

                field(
                    "amount",
                    "Amount *",
                    null,
                    {
                        type: "number",
                        min: "0.01",
                        step: "0.01",
                        inputMode: "decimal",
                        placeholder: "0.00",
                        required: true
                    }
                ),

                field("currency", "Currency *", m.currencies),

                field(
                    "date",
                    "Date *",
                    null,
                    {
                        type: "date",
                        max: m.today(),
                        required: true
                    }
                ),

                field(
                    "category",
                    "Category *",
                    m.categories(value.type)
                ),

                field(
                    "paymentMethod",
                    "External payment method",
                    [["", "Not specified"], ...m.methods]
                ),

                field(
                    "tripId",
                    "Related trip",
                    [
                        ["", "General / no trip"],
                        ["__custom__", "+ Create custom trip title"],
                        ...trips.map(trip => [
                            trip.id,
                            trip.title +
                                (trip.custom
                                    ? " · Custom trip"
                                    : " · Registered trip")
                        ])
                    ]
                ),

                value.tripId === "__custom__" &&
                    field(
                        "customTripTitle",
                        "Custom trip title *",
                        null,
                        {
                            required: true,
                            maxLength: 160,
                            placeholder: "e.g. Private Kerala group"
                        }
                    ),

                custom &&
                    h(
                        "p",
                        {
                            className: "finance-help finance-wide"
                        },
                        "Custom trips are kept as finance-only references. They are not published as platform trip listings."
                    ),

                !custom &&
                    field(
                        "departureId",
                        "Related departure",
                        [
                            [
                                "",
                                availableDepartures.length
                                    ? "No departure selected"
                                    : "No departure records available"
                            ],
                            ...availableDepartures.map(departure => [
                                departure.id,
                                departure.date || departure.id
                            ])
                        ],
                        {
                            disabled: !availableDepartures.length
                        }
                    ),

                payment &&
                    h(
                        "label",
                        { className: "finance-wide" },
                        h("span", null, "Traveller"),
                        h(
                            "select",
                            {
                                value: value.travellerKey || "",
                                onChange: chooseTraveller,
                                "aria-label": "Traveller"
                            },
                            h(
                                "option",
                                { value: "" },
                                "Enter a new traveller manually"
                            ),
                            [...travellerOptions.values()].map(person =>
                                h(
                                    "option",
                                    {
                                        key: person.key,
                                        value: person.key
                                    },
                                    `${person.name || "Unnamed traveller"} · ${person.contact || "Contact missing"}`
                                )
                            )
                        )
                    ),

                payment &&
                    !custom &&
                    h(
                        "p",
                        {
                            className: "finance-help finance-wide",
                            role: contactsError ? "alert" : "status"
                        },
                        contactsLoading
                            ? "Loading traveller contacts from your enquiries…"
                            : contactsError
                              ? "Traveller contacts could not be loaded. You can enter details manually."
                              : "Contacts come from your trip enquiries. Selecting a contact does not confirm a booking or record a payment automatically."
                    ),

                payment &&
                    field(
                        "travellerName",
                        "Traveller name *",
                        null,
                        {
                            maxLength: 120,
                            required: true,
                            readOnly: !!value.travellerKey &&
                                !!travellerOptions.get(value.travellerKey)?.name
                        }
                    ),

                payment &&
                    field(
                        "travellerContact",
                        "Traveller contact (phone or email) *",
                        null,
                        {
                            maxLength: 160,
                            required: true,
                            readOnly: !!value.travellerKey &&
                                !!travellerOptions.get(value.travellerKey)?.contact
                        }
                    ),

                payment &&
                    !custom &&
                    field(
                        "bookingId",
                        value.type === "Refund Issued"
                            ? "Refund relates to booking"
                            : "Related confirmed booking",
                        [
                            [
                                "",
                                availableBookings.length
                                    ? "Unallocated"
                                    : "Booking records not connected"
                            ],
                            ...availableBookings.map(booking => [
                                booking.bookingId,
                                booking.bookingId
                            ])
                        ],
                        {
                            disabled: !availableBookings.length
                        }
                    ),

                field(
                    "description",
                    "Description",
                    null,
                    {
                        maxLength: 300,
                        placeholder: "Reason or transaction details"
                    }
                ),

                field(
                    "referenceNumber",
                    "External reference number",
                    null,
                    {
                        maxLength: 120,
                        placeholder: "Optional receipt or transfer reference"
                    }
                ),

                h(
                    "label",
                    { className: "finance-wide" },
                    h("span", null, "Private notes"),
                    h("textarea", {
                        value: value.notes || "",
                        maxLength: 2000,
                        rows: 3,
                        onChange: event => set("notes", event.target.value)
                    })
                )
            ),

            h(
                "p",
                { className: "finance-help" },
                "Adjustments are unavailable until an accounting policy is defined."
            ),

            review &&
                h(
                    "div",
                    { className: "finance-notice", role: "status" },
                    h("strong", null, "Review your entry"),
                    h(
                        "p",
                        null,
                        `${custom ? "Custom trip: " : "Trip: "}${
                            custom
                                ? value.customTripTitle || "Custom trip"
                                : trips.find(trip => trip.id === value.tripId)?.title || "General"
                        }`
                    ),
                    payment &&
                        h(
                            "p",
                            null,
                            `${value.travellerName} · ${value.travellerContact}`
                        ),
                    h(
                        "p",
                        null,
                        `${value.type} · ${m.money(Number(value.amount), value.currency)} · ${value.date} · ${value.category}`
                    ),
                    h(
                        "p",
                        null,
                        value.description || "No description"
                    ),
                    h(
                        "p",
                        null,
                        "Confirm to save this record to the finance service."
                    )
                ),

            failure &&
                h(
                    "p",
                    {
                        role: "alert",
                        className: "finance-error"
                    },
                    failure
                ),

            h(
                "div",
                { className: "finance-actions" },

                h(
                    Btn,
                    {
                        type: "button",
                        variant: "outline",
                        onClick: onClose,
                        disabled: pending
                    },
                    "Cancel"
                ),

                review
                    ? h(
                          Btn,
                          {
                              type: "button",
                              onClick: apply,
                              disabled: pending,
                              loading: pending
                          },
                          pending
                              ? "Saving…"
                              : initial
                                ? "Save Changes"
                                : "Save Financial Entry"
                      )
                    : h(
                          Btn,
                          {
                              type: "submit",
                              disabled: pending
                          },
                          "Review Entry"
                      )
            )
        )
    );
}