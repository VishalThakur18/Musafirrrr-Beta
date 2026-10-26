"use strict";

function FinanceEmptyState({ title, body, action }) {
    return React.createElement(
        "div",
        { className: "finance-empty" },
        React.createElement(Icon, { name: "wallet", size: 26 }),
        React.createElement("h3", null, title),
        React.createElement("p", null, body),
        action
    );
}

function FinanceSummaryCard({ label, value, currency, description, icon, onClick, disabled }) {
    const h = React.createElement;

    return h(
        "button",
        { type: 'button', className: "finance-metric", onClick, disabled, 'aria-haspopup': 'dialog', 'aria-label': `View ${label} breakdown` },
        h(
            "span",
            { className: 'finance-metric-header' },
            h("span", null, label),
            h(Icon, { name: icon, size: 19 })
        ),
        h("strong", null, FinanceModel.money(value, currency)),
        h("span", { className: 'finance-metric-description' }, description),
        h('span', { className: 'finance-metric-link' }, 'View breakdown →')
    );
}

function FinanceFilterBar({ filters: f, onChange, trips, departures, reset }) {
    const h = React.createElement;
    const m = FinanceModel;

    const select = (key, label, options, disabled = false) =>
        h(
            "label",
            { key },
            h("span", null, label),
            h(
                "select",
                {
                    value: f[key],
                    disabled,
                    onChange: e =>
                        onChange({
                            [key]: e.target.value,
                            ...(key === "tripId" ? { departureId: "" } : {})
                        })
                },
                options.map(([value, text]) =>
                    h("option", { key: value, value }, text)
                )
            )
        );

    const dates = m.range(f);
    const valid =
        m.validDate(dates[0]) &&
        m.validDate(dates[1]) &&
        dates[0] <= dates[1];

    const deps = departures.filter(d => d.tripId === f.tripId);

    return h(
        "section",
        {
            className: "finance-panel",
            "aria-label": "Reporting filters"
        },
        h(
            "div",
            { className: "finance-filters" },
            select("period", "Reporting period", [
                ["7", "Last 7 days"],
                ["30", "Last 30 days"],
                ["90", "Last 90 days"],
                ["month", "This month"],
                ["custom", "Custom date range"]
            ]),
            select(
                "tripId",
                "Trip",
                [
                    ["", trips.length ? "All trips" : "Trip data unavailable"],
                    ...trips.map(t => [
                        t.id,
                        t.title +
                            (t.custom
                                ? " · Custom trip"
                                : " · Registered trip")
                    ])
                ],
                !trips.length
            ),
            select(
                "departureId",
                "Departure",
                [
                    ["", deps.length ? "All departures" : "No departure records"],
                    ...deps.map(d => [d.id, d.date || d.id])
                ],
                !deps.length
            ),
            select(
                "currency",
                "Currency",
                m.currencies.map(c => [c, c])
            ),
            select("type", "Transaction type", [
                ["", "All types"],
                ...m.types.map(t => [t, t])
            ]),
            select("category", "Category", [
                ["", "All categories"],
                ...[
                    ...new Set(m.types.flatMap(m.categories))
                ].map(c => [c, c])
            ]),
            f.period === "custom" &&
                ["start", "end"].map(key =>
                    h(
                        "label",
                        { key },
                        h(
                            "span",
                            null,
                            key === "start" ? "From date" : "To date"
                        ),
                        h("input", {
                            type: "date",
                            value: f[key],
                            "aria-describedby": "finance-range-help",
                            onChange: e =>
                                onChange({ [key]: e.target.value })
                        })
                    )
                )
        ),
        h(
            "div",
            { className: "finance-section-heading" },
            h(
                "p",
                {
                    id: "finance-range-help",
                    className: valid ? "finance-help" : "finance-error",
                    role: valid ? undefined : "alert"
                },
                valid
                    ? `${dates[0]} → ${dates[1]} · ${f.currency} · Filtered by recorded transaction date.`
                    : "Choose both dates with the end on or after the start."
            ),
            h(Btn, { variant: "ghost", onClick: reset }, "Reset filters")
        )
    );
}

function FinanceChart({ entries, currency }) {
    const h = React.createElement;

    const series = [
        [
            "Payments received",
            ["Payment Received", "Advance Payment", "Partial Payment"],
            "#315746"
        ],
        ["Recorded expenses", ["Expense"], "#997143"],
        ["Recorded refunds", ["Refund Issued"], "#a4534b"]
    ];

    const relevant = entries.filter(e =>
        series.some(s => s[1].includes(e.type))
    );

    if (!relevant.length) {
        return h(FinanceEmptyState, {
            title: "Your financial picture starts here",
            body: "Payments, expenses and refunds will appear here when saved records are available."
        });
    }

    const dates = [...new Set(relevant.map(e => e.date))].sort();

    const points = dates.map(date =>
        series.map(s => {
            const records = relevant.filter(
                e => e.date === date && s[1].includes(e.type)
            );

            return records.length
                ? records.reduce((sum, e) => sum + Number(e.amount || 0), 0)
                : null;
        })
    );

    const max = Math.max(1, ...points.flat().filter(v => v !== null));

    return h(
        "div",
        null,
        h(
            "p",
            { className: "finance-help" },
            "Recorded transaction amounts only. Other income and adjustments are excluded from these chart series."
        ),
        h(
            "div",
            {
                className: "finance-chart-scroll",
                tabIndex: 0,
                role: "region",
                "aria-label": "Financial chart"
            },
            h(
                "svg",
                {
                    viewBox: `0 0 ${Math.max(600, dates.length * 80 + 110)} 270`,
                    role: "img",
                    "aria-label": `Recorded payments, expenses and refunds in ${currency}`
                },
                h("text", { x: 8, y: 18 }, `Amount (${currency})`),
                [0, 0.5, 1].map(fraction =>
                    h(
                        "g",
                        { key: fraction },
                        h("line", {
                            x1: 90,
                            x2: Math.max(590, dates.length * 80 + 100),
                            y1: 220 - fraction * 170,
                            y2: 220 - fraction * 170,
                            stroke: "#e5e9e2"
                        }),
                        h(
                            "text",
                            {
                                x: 5,
                                y: 225 - fraction * 170
                            },
                            new Intl.NumberFormat("en-IN", {
                                notation: "compact",
                                maximumFractionDigits: 1
                            }).format(max * fraction)
                        )
                    )
                ),
                dates.map((date, i) =>
                    h(
                        "g",
                        { key: date },
                        points[i].map(
                            (amount, j) =>
                                amount !== null &&
                                h(
                                    "rect",
                                    {
                                        key: j,
                                        x: 100 + i * 80 + j * 18,
                                        y: 220 - (amount / max) * 170,
                                        width: 14,
                                        height: (amount / max) * 170,
                                        rx: 3,
                                        fill: series[j][2]
                                    },
                                    h(
                                        "title",
                                        null,
                                        `${date}: ${series[j][0]} ${FinanceModel.money(amount, currency)}`
                                    )
                                )
                        ),
                        h(
                            "text",
                            {
                                x: 100 + i * 80,
                                y: 240
                            },
                            date.slice(5)
                        )
                    )
                ),
                h("text", { x: 260, y: 264 }, "Recorded date")
            )
        ),
        h(
            "div",
            { className: "finance-legend" },
            series.map(s =>
                h(
                    "span",
                    { key: s[0] },
                    h("i", { style: { background: s[2] } }),
                    s[0]
                )
            )
        ),
        h(
            "details",
            null,
            h("summary", null, "View accessible chart data"),
            dates.map((date, i) =>
                h(
                    "p",
                    { key: date, className: "finance-help" },
                    date,
                    " — ",
                    series
                        .map(
                            (s, j) =>
                                `${s[0]}: ${FinanceModel.money(points[i][j], currency)}`
                        )
                        .join(" · ")
                )
            )
        )
    );
}

function FinancialTransactionsTable({
    entries,
    trips,
    onView,
    onEdit,
    onAdd,
    hasEntries
}) {
    const h = React.createElement;

    if (!entries.length) {
        return h(FinanceEmptyState, {
            title: hasEntries ? "No matching entries" : "No financial records yet",
            body: hasEntries
                ? "Try resetting your filters or choosing another currency or date range."
                : "Start organizing your trip finances by adding your first financial entry.",
            action: h(
                Btn,
                { onClick: onAdd, icon: "plus" },
                "Add Financial Entry"
            )
        });
    }

    const headings = [
        "Date",
        "Transaction Type",
        "Description",
        "Related Trip",
        "Traveller / Contact",
        "Related Booking",
        "Category",
        "Amount",
        "Payment Method",
        "Actions"
    ];

    return h(
        "div",
        {
            className: "finance-table-wrap",
            tabIndex: 0,
            role: "region",
            "aria-label": "Financial transactions"
        },
        h(
            "table",
            { className: "finance-table" },
            h(
                "caption",
                { className: "finance-help" },
                `${entries.length} saved entries`
            ),
            h(
                "thead",
                null,
                h(
                    "tr",
                    null,
                    headings.map(label =>
                        h("th", { key: label, scope: "col" }, label)
                    )
                )
            ),
            h(
                "tbody",
                null,
                entries.map(e =>
                    h(
                        "tr",
                        { key: e.id },
                        [
                            e.date,
                            h(
                                "span",
                                {
                                    className: "finance-badge",
                                    "data-tone":
                                        e.type === "Expense"
                                            ? "expense"
                                            : e.type === "Refund Issued"
                                              ? "refund"
                                              : e.type === "Adjustment"
                                                ? "neutral"
                                                : "income"
                                },
                                e.type
                            ),
                            h(
                                "span",
                                null,
                                e.description || "No description"
                            ),
                            h(
                                "span",
                                null,
                                FinanceModel.tripLabel(e, trips),
                                e.customTripId &&
                                    h(
                                        "small",
                                        { className: "finance-unsaved" },
                                        "Custom trip"
                                    )
                            ),
                            h(
                                "span",
                                null,
                                e.travellerName || "Not linked",
                                h(
                                    "small",
                                    { className: "finance-contact" },
                                    e.travellerContact || ""
                                )
                            ),
                            e.bookingId || "Unallocated",
                            e.category || "Other",
                            FinanceModel.money(e.amount, e.currency),
                            e.paymentMethod || "Not specified",
                            h(
                                "div",
                                { className: "finance-actions" },
                                h(
                                    Btn,
                                    {
                                        variant: "ghost",
                                        size: "sm",
                                        onClick: () => onView(e),
                                        "aria-label": `View ${e.description || e.type} on ${e.date}`
                                    },
                                    "View"
                                ),
                                h(
                                    Btn,
                                    {
                                        variant: "outline",
                                        size: "sm",
                                        onClick: () => onEdit(e)
                                    },
                                    "Edit"
                                )
                            )
                        ].map((value, i) =>
                            h(
                                "td",
                                {
                                    key: headings[i],
                                    "data-label": headings[i]
                                },
                                value
                            )
                        )
                    )
                )
            )
        )
    );
}

function TripFinanceSummary({
    trips,
    rows,
    entries = [],
    currency,
    selectedTripId,
    onSelect
}) {
    const h = React.createElement;

    const metrics = [
        ["confirmedBookingValue", "Confirmed booking value"],
        ["paymentsReceived", "Recorded payments received"],
        ["recordedExpenses", "Recorded expenses"],
        ["recordedRefunds", "Recorded refunds"],
        ["outstandingBalances", "Outstanding balances"],
        ["estimatedProfit", "Recorded cash surplus"]
    ];

    return h(
        "section",
        { className: "finance-panel" },
        h("h2", null, "Financial Performance by Trip"),
        h(
            "p",
            { className: "finance-help" },
            "Trip metrics are shown only when the corresponding financial data is available."
        ),
        !trips.length
            ? h(FinanceEmptyState, {
                  title: "No trip information available",
                  body: "Your registered trips will appear here when available."
              })
            : h(
                  "div",
                  { className: "finance-trip-grid" },
                  trips
                      .filter(t => !selectedTripId || t.id === selectedTripId)
                      .map(trip => {
                          const tripRows = rows.filter(
                              r => r.tripId === trip.id && r.currency === currency
                          );

                          return h(
                              "details",
                              {
                                  key: trip.id,
                                  className: "finance-trip"
                              },
                              h(
                                  "summary",
                                  null,
                                  h("strong", null, trip.title),
                                  h("span", null, trip.destination || "Destination not available"),
                                  h("small", null, "View financial details")
                              ),
                              trip.custom &&
                                  h(
                                      "span",
                                      { className: "finance-badge" },
                                      "Custom trip · finance only"
                                  ),
                              h(TravellerPayments, {
                                  entries: entries.filter(
                                      e => FinanceModel.tripKey(e) === trip.id
                                  ),
                                  trips,
                                  compact: true
                              }),
                              !tripRows.length &&
                                  h(
                                      "p",
                                      { className: "finance-help" },
                                      "No trip-level summary is available for this selection."
                                  ),
                              (tripRows.length ? tripRows : [{}]).map((row, i) =>
                                  h(
                                      "div",
                                      { key: row.departureId || i },
                                      h(
                                          "p",
                                          { className: "finance-help" },
                                          row.departureDate ||
                                              "Departure financial information unavailable"
                                      ),
                                      h(
                                          "dl",
                                          null,
                                          metrics.map(([key, label]) =>
                                              h(
                                                  "div",
                                                  { key },
                                                  h("dt", null, label),
                                                  h(
                                                      "dd",
                                                      null,
                                                      row[key] == null
                                                          ? "Not available"
                                                          : FinanceModel.money(
                                                                row[key],
                                                                currency
                                                            )
                                                  )
                                              )
                                          )
                                      )
                                  )
                              ),
                              h(
                                  Btn,
                                  {
                                      variant: "outline",
                                      size: "sm",
                                      onClick: () => onSelect(trip.id)
                                  },
                                  "Filter entries to this trip"
                              )
                          );
                      })
              )
    );
}

function OutstandingBalances({ balances, currency }) {
    const h = React.createElement;

    return h(
        "section",
        { className: "finance-panel" },
        h("h2", null, "Outstanding Balances"),
        h(
            "p",
            { className: "finance-help" },
            "Balances depend on confirmed booking amounts and allocated payments. Refunds are shown separately."
        ),
        !balances.length
            ? h(FinanceEmptyState, {
                  title: "Balances are not available yet",
                  body: "Create confirmed booking records and allocate payments before outstanding balances can be calculated."
              })
            : balances.map(b =>
                  h(
                      "article",
                      {
                          key: b.bookingId,
                          className: "finance-trip"
                      },
                      h("h3", null, b.bookingId),
                      h("p", null, b.tripTitle || b.tripId || "Trip not specified"),
                      h(
                          "span",
                          { className: "finance-badge" },
                          b.bookingStatus || "Booking"
                      ),
                      h(
                          "dl",
                          null,
                          [
                              ["agreedAmount", "Agreed booking amount"],
                              ["totalPayments", "Payments allocated"],
                              ["totalRefunds", "Recorded refunds"],
                              ["adjustments", "Adjustments"],
                              ["outstandingAmount", "Outstanding amount"]
                          ].map(([key, label]) =>
                              h(
                                  "div",
                                  { key },
                                  h("dt", null, label),
                                  h(
                                      "dd",
                                      null,
                                      b[key] == null
                                          ? "Not available"
                                          : FinanceModel.money(b[key], currency)
                                  )
                              )
                          )
                      )
                  )
              )
    );
}

function FinanceReports({ trips, entries = [], filters }) {
    const h = React.createElement;

    return h(
        "section",
        {
            className: "finance-panel",
            id: "finance-reports"
        },
        h("h2", null, "Reports & Exports"),
        h(FinanceRecordExport, { entries, trips, filters }),
        h(
            "p",
            { className: "finance-help" },
            "The CSV export contains the filtered transaction records. Booking and accounting summaries require their own reporting rules."
        )
    );
}

function RevenueFinancePage({ data = {}, onFiltersChange }) {
    const h = React.createElement;
    const m = FinanceModel;
    const auth = useAuth();
    const organizerId =
        auth && auth.user && auth.user.organizer
            ? auth.user.organizer.id
            : null;

    const [filters, setFilters] = useState(() => m.defaults());

    const [lookup, setLookup] = useState({
        organizerId: null,
        trips: [],
        contacts: [],
        loading: true,
        tripsError: false,
        contactsError: false
    });

    const [lookupVersion, setLookupVersion] = useState(0);
    const [savedEntries, setSavedEntries] = useState([]);
    const [savedBookings, setSavedBookings] = useState([]);
    const [financeStatus, setFinanceStatus] = useState("loading");
    const [financeError, setFinanceError] = useState("");
    const [refreshVersion, setRefreshVersion] = useState(0);
    const [editor, setEditor] = useState(null);
    const [bookingEditor, setBookingEditor] = useState(null);
    const [metricDetail, setMetricDetail] = useState(null);
    const [detail, setDetail] = useState(null);
    const [notice, setNotice] = useState("");
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (typeof onFiltersChange === "function") {
            onFiltersChange(filters);
        }
    }, [filters, onFiltersChange]);

    useEffect(() => {
        if (!organizerId || data.status === "denied") {
            setSavedEntries([]);
            setSavedBookings([]);
            setFinanceStatus(organizerId ? "ready" : "error");
            setFinanceError(
                organizerId
                    ? ""
                    : "Your organizer profile could not be identified. Sign in again and retry."
            );
            return undefined;
        }

        if (
            typeof financeApi === "undefined" ||
            !financeApi ||
            typeof financeApi.list !== "function"
        ) {
            setFinanceStatus("error");
            setFinanceError(
                "Finance service is not loaded. Check the script order in index.html."
            );
            return undefined;
        }

        let cancelled = false;
        setFinanceStatus("loading");
        setFinanceError("");

        Promise.all([
            financeApi.list(organizerId),
            typeof financeApi.listBookings === "function"
                ? financeApi.listBookings(organizerId)
                : Promise.resolve([])
        ])
            .then(([entryResult, bookingResult]) => {
                if (cancelled) return;

                setSavedEntries(
                    Array.isArray(entryResult) ? entryResult : []
                );
                setSavedBookings(
                    Array.isArray(bookingResult) ? bookingResult : []
                );
                setFinanceStatus("ready");
            })
            .catch(error => {
                if (cancelled) return;

                console.error("Could not load finance records:", error);
                setFinanceStatus("error");
                setFinanceError(
                    error && error.message
                        ? error.message
                        : "Could not load financial records."
                );
            });

        return () => {
            cancelled = true;
        };
    }, [organizerId, refreshVersion, data.status]);

    useEffect(() => {
        if (!organizerId || data.status === "denied") {
            return undefined;
        }

        let cancelled = false;

        setLookup({
            organizerId,
            trips: [],
            contacts: [],
            loading: true,
            tripsError: false,
            contactsError: false
        });

        Promise.allSettled([
            organizerApi.trips(organizerId),
            organizerApi.enquiries(organizerId)
        ]).then(([tripResult, contactResult]) => {
            if (cancelled) return;

            const tripsResult =
                tripResult.status === "fulfilled" &&
                Array.isArray(tripResult.value)
                    ? tripResult.value.filter(
                          t => t && t.organizerId === organizerId
                      )
                    : [];

            const contactsResult =
                contactResult.status === "fulfilled" &&
                Array.isArray(contactResult.value)
                    ? contactResult.value.filter(
                          c => c && c.organizerId === organizerId
                      )
                    : [];

            setLookup({
                organizerId,
                trips: tripsResult,
                contacts: contactsResult,
                loading: false,
                tripsError: tripResult.status === "rejected",
                contactsError: contactResult.status === "rejected"
            });
        });

        return () => {
            cancelled = true;
        };
    }, [organizerId, lookupVersion, data.status]);

    const registeredTrips =
        lookup.organizerId === organizerId ? lookup.trips : [];

    const customTrips = [
        ...new Map(
            savedEntries
                .filter(e => e && e.customTripId)
                .map(e => [
                    e.customTripId,
                    {
                        id: e.customTripId,
                        title: e.customTripTitle || "Custom trip",
                        custom: true,
                        destination: "Outside platform / private trip"
                    }
                ])
        ).values()
    ];

    const trips = [...registeredTrips, ...customTrips];

    const contacts =
        lookup.organizerId === organizerId ? lookup.contacts : [];

    const entries = savedEntries.filter(
        e => e && e.organizerId === organizerId
    );

    const visible = m.filter(entries, filters);

    const updateFilters = patch =>
        setFilters(current => ({ ...current, ...patch }));

    const add = () =>
        setEditor({
            initial: null,
            key: `new-${Date.now()}`
        });

    const resetFilters = () => setFilters(m.defaults());

    const dates = m.range(filters);
    const validRange =
        m.validDate(dates[0]) &&
        m.validDate(dates[1]) &&
        dates[0] <= dates[1];

    const filteredBookings = savedBookings.filter(b => {
        if (!b || b.organizerId !== organizerId) return false;
        if (filters.tripId && b.tripId !== filters.tripId) return false;
        if (filters.departureId && b.departureId !== filters.departureId) {
            return false;
        }
        if (b.currency && b.currency !== filters.currency) return false;
        return true;
    });

    const summary =
    typeof financeApi !== "undefined" &&
    financeApi &&
    typeof financeApi.summary === "function"
        && financeStatus === 'ready' ? financeApi.summary(
              organizerId,
              filters,
              entries,
              filteredBookings
          )
        : {};

    const balances = Array.isArray(summary.balances)
        ? summary.balances
        : [];

    const metrics = [
        [
            "confirmedBookingValue",
            "Confirmed Booking Value",
            "Organizer-reported agreed value; not cash received.",
            "wallet"
        ],
        [
            "paymentsReceived",
            "Payments Received",
            "Recorded external payments, including advances and partial payments.",
            "wallet"
        ],
        [
            "outstandingBalances",
            "Outstanding Balances",
            "Current balances from all linked payments. No bookings means unavailable, not fully paid.",
            "clock"
        ],
        [
            "recordedExpenses",
            "Recorded Expenses",
            "Organizer-maintained expense records.",
            "bag"
        ],
        [
            "recordedRefunds",
            "Recorded Refunds",
            "Refunds recorded as issued externally.",
            "arrow"
        ],
        [
            "estimatedProfit",
            "Recorded Cash Surplus",
            "Recorded income minus expenses and refunds for the selected transactions; not final profit.",
            "chart"
        ]
    ];

    const saveEntry = async entry => {
        if (!organizerId) {
            setFinanceError(
                "Your organizer profile could not be identified. Sign in again."
            );
            throw new Error('Your organizer profile could not be identified.');
        }

        setBusy(true);
        setFinanceError("");

        try {
            const existing = entries.some(item => item.id === entry.id);

            if (existing) {
                await financeApi.update(entry.id, entry, organizerId);
            } else {
                await financeApi.create(entry, organizerId);
            }

            setEditor(null);
            setNotice(
                existing
                    ? "Financial entry updated."
                    : "Financial entry saved."
            );
            setRefreshVersion(v => v + 1);
        } catch (error) {
            console.error("Could not save finance entry:", error);
            setFinanceError(
                error && error.message
                    ? error.message
                    : "Could not save the financial entry."
            );
            throw error;
        } finally {
            setBusy(false);
        }
    };

    const removeEntry = async entry => {
        if (
            !entry ||
            !entry.id ||
            typeof financeApi === "undefined" ||
            typeof financeApi.remove !== "function"
        ) {
            return;
        }

        if (!window.confirm("Delete this financial entry? This cannot be undone.")) {
            return;
        }

        setBusy(true);
        setFinanceError("");

        try {
            await financeApi.remove(entry.id, organizerId);
            setNotice("Financial entry deleted.");
            setRefreshVersion(v => v + 1);
            setDetail(null);
        } catch (error) {
            console.error("Could not delete finance entry:", error);
            setFinanceError(
                error && error.message
                    ? error.message
                    : "Could not delete the financial entry."
            );
        } finally {
            setBusy(false);
        }
    };

    if (data.status === "denied") {
        return h(
            "div",
            { className: "finance-ui" },
            h("h1", null, "Revenue & Finance"),
            h(
                "p",
                { role: "alert" },
                "You do not have permission to view financial records."
            )
        );
    }

    if (data.status === "loading") {
        return h(
            "div",
            { className: "finance-ui", "aria-busy": true },
            h("h1", null, "Revenue & Finance"),
            h("p", { role: "status" }, "Loading financial information…")
        );
    }

    if (data.status === "error") {
        return h(
            "div",
            { className: "finance-ui" },
            h("h1", null, "Revenue & Finance"),
            h(
                "p",
                { role: "alert" },
                "Financial information could not be loaded. Please try again later."
            )
        );
    }

    return h(
        "div",
        { className: "finance-ui finance-page" },

        h(
            "header",
            { className: "finance-header" },
            h(
                "div",
                null,
                h(
                    "span",
                    { className: "finance-kicker" },
                    "YOUR BUSINESS, IN PERSPECTIVE"
                ),
                h("h1", null, "Revenue & Finance"),
                h(
                    "p",
                    null,
                    "Manage trip finances, track recorded payments, and review your business performance."
                )
            ),
            h(
                "div",
                { className: "finance-actions" },
                h(
                    Btn,
                    {
                        variant: "outline",
                        onClick: () =>
                            document
                                .getElementById("finance-reports")
                                ?.scrollIntoView({ behavior: "smooth" })
                    },
                    "Reports & Exports"
                ),
                h(
                    Btn,
                    { icon: "plus", onClick: add, disabled: busy },
                    "Add Financial Entry"
                )
            )
        ),

        h(
            "div",
            { className: "finance-notice", role: "note" },
            h("strong", null, "Organizer-maintained financial records"),
            h(
                "p",
                null,
                "Financial information is entered by organizers and is not independently verified by Musafirrrr."
            ),
            h(
                "p",
                null,
                "Only recorded transactions count as recorded cash activity. Booking value, payments, refunds, expenses and estimated profit remain separate."
            )
        ),

        financeStatus === "loading" &&
            h(
                "p",
                { className: "finance-notice", role: "status" },
                "Loading saved finance records…"
            ),

        financeStatus === "error" &&
            h(
                "div",
                { className: "finance-notice", role: "alert" },
                h("p", null, financeError || "Finance records could not be loaded."),
                h(
                    Btn,
                    { variant: "outline", onClick: () => setRefreshVersion(v => v + 1) },
                    "Retry finance loading"
                )
            ),

        financeStatus !== "error" &&
            financeError &&
            h(
                "div",
                { className: "finance-notice", role: "alert" },
                h("p", null, financeError)
            ),

        h(
            "div",
            {
                className: "finance-notice",
                role:
                    lookup.tripsError || lookup.contactsError
                        ? "alert"
                        : "status"
            },
            lookup.loading
                ? "Loading registered trips and traveller contacts…"
                : lookup.tripsError || lookup.contactsError
                  ? "Some trip or traveller contact data could not be loaded. You can still enter financial records manually."
                  : "Registered trips and traveller contacts loaded.",
            (lookup.tripsError || lookup.contactsError) &&
                h(
                    Btn,
                    {
                        variant: "outline",
                        size: "sm",
                        onClick: () => setLookupVersion(v => v + 1)
                    },
                    "Retry trip and contact loading"
                )
        ),

        h(
            "div",
            { className: "finance-metrics" },
            metrics.map(([key, label, description, icon]) =>
                h(FinanceSummaryCard, {
                    key,
                    label,
                    description,
                    icon,
                    value:
                        summary && summary[key] != null
                            ? summary[key]
                            : null,
                    currency: filters.currency,
                    disabled: financeStatus !== 'ready',
                    onClick: () => setMetricDetail({ metric: key, label, value: summary[key], breakdown: summary.breakdowns?.[key], filters: { ...filters }, trips: [...trips] })
                })
            )
        ),

        metricDetail && h(FinanceMetricBreakdown, { snapshot: metricDetail, onClose: () => setMetricDetail(null) }),
        h(FinanceFilterBar, {
            filters,
            onChange: updateFilters,
            trips,
            departures: data.departures || [],
            reset: resetFilters
        }),

        !validRange &&
            h(
                "p",
                { className: "finance-error", role: "alert" },
                "Choose a valid reporting date range before reviewing filtered totals."
            ),

        h(
            "section",
            { className: "finance-panel" },
            h(
                "div",
                { className: "finance-section-heading" },
                h("h2", null, "Financial Overview"),
                h(
                    "span",
                    { className: "finance-badge" },
                    `${filters.currency} · recorded activity`
                )
            ),
            h(FinanceChart, {
                entries: visible,
                currency: filters.currency
            })
        ),

        h(
            "section",
            { className: "finance-panel" },
            h(
                "div",
                { className: "finance-section-heading" },
                h(
                    "div",
                    null,
                    h("h2", null, "Financial Transactions"),
                    h(
                        "p",
                        { className: "finance-help" },
                        "View, edit and delete saved organizer-entered transactions."
                    )
                ),
                h(
                    "span",
                    { className: "finance-badge" },
                    `${visible.length} entries`
                )
            ),

            h(
                "div",
                { className: "finance-transaction-tools" },
                h(
                    "label",
                    null,
                    h("span", null, "Search entries"),
                    h("input", {
                        type: "search",
                        value: filters.search || "",
                        placeholder: "Traveller, contact, trip or reference",
                        onChange: e =>
                            updateFilters({ search: e.target.value })
                    })
                ),
                h(
                    "label",
                    null,
                    h("span", null, "Sort by date"),
                    h(
                        "select",
                        {
                            value: filters.sort || "desc",
                            onChange: e =>
                                updateFilters({ sort: e.target.value })
                        },
                        h("option", { value: "desc" }, "Newest first"),
                        h("option", { value: "asc" }, "Oldest first")
                    )
                )
            ),

            notice &&
                h(
                    "p",
                    { className: "finance-notice", role: "status" },
                    notice
                ),

            h(FinancialTransactionsTable, {
                entries: visible,
                trips,
                hasEntries: entries.length > 0,
                onAdd: add,
                onView: setDetail,
                onEdit: entry =>
                    setEditor({ initial: entry, key: entry.id })
            }),

            h(
                "div",
                { className: "finance-actions" },
                h(
                    Btn,
                    {
                        variant: "outline",
                        disabled: busy,
                        onClick: () => setRefreshVersion(v => v + 1)
                    },
                    "Refresh records"
                )
            )
        ),

        h(TravellerPayments, { entries: visible, trips }),

        h(TripFinanceSummary, {
            trips,
            entries: visible,
            rows: Array.isArray(summary.tripFinance)
                ? summary.tripFinance
                : [],
            currency: filters.currency,
            selectedTripId: filters.tripId,
            onSelect: tripId =>
                updateFilters({ tripId, departureId: "" })
        }),

        h(FinanceBookingBalances, {
            balances: Array.isArray(balances) ? balances : [],
            bookings: savedBookings,
            entries: entries.filter(e => e.currency === filters.currency && (!filters.tripId || m.tripKey(e) === filters.tripId) && (!filters.departureId || e.departureId === filters.departureId)),
            trips, currency: filters.currency, ready: financeStatus === 'ready' && !busy,
            onCreate: () => setBookingEditor({ initial: null, key: 'new' }),
            onManage: booking => setBookingEditor({ initial: booking, key: booking.bookingId }),
            onEditEntry: entry => setEditor({ initial: entry, key: entry.id }),
            onPayment: booking => setEditor({ key: 'payment-' + booking.bookingId, initial: {
                type: 'Payment Received', category: 'Traveller Payment', amount: '', date: m.today(), currency: booking.currency,
                tripId: booking.tripId, bookingId: booking.bookingId, departureId: booking.departureId || '',
                travellerName: booking.travellerName, travellerContact: booking.travellerContact,
                travellerId: booking.travellerId, enquiryId: booking.enquiryId,
                travellerKey: booking.travellerId ? 'platform:' + booking.travellerId : booking.enquiryId ? 'lead:' + booking.enquiryId : 'booking:' + booking.bookingId,
                description: '', notes: '', referenceNumber: '', paymentMethod: ''
            } })
        }),
        bookingEditor && h(FinanceBookingForm, {
            key: bookingEditor.key, initial: bookingEditor.initial, trips: registeredTrips, contacts,
            onClose: () => setBookingEditor(null),
            onSave: async booking => {
                const saved = booking.bookingId
                    ? await financeApi.updateBooking(booking.bookingId, booking, organizerId)
                    : await financeApi.createBooking(booking, organizerId);
                setSavedBookings(current => [saved, ...current.filter(b => b.bookingId !== saved.bookingId)]);
                setBookingEditor(null); setNotice('Finance booking saved. Link existing payments or record a new payment against it.');
                setRefreshVersion(v => v + 1);
            }
        }),

        h(FinanceReports, {
            trips,
            entries: visible,
            filters
        }),

        editor &&
            h(FinancialEntryForm, {
                key: editor.key,
                initial: editor.initial,
                organizerId,
                trips,
                contacts,
                entries,
                contactsLoading: lookup.loading,
                contactsError: lookup.contactsError,
                departures: data.departures || [],
                bookings: data.bookings || savedBookings,
                onClose: () => setEditor(null),
                onPreview: saveEntry
            }),

        detail &&
            h(
                FinanceDialog,
                {
                    title: "Financial entry details",
                    onClose: () => setDetail(null)
                },
                h(
                    "p",
                    { className: "finance-notice" },
                    "Organizer-reported saved record"
                ),
                h(
                    "p",
                    null,
                    m.tripLabel(detail, trips),
                    detail.customTripId ? " · Custom trip" : ""
                ),
                h(
                    "dl",
                    { className: "finance-detail" },
                    [
                        ["travellerName", "Traveller"],
                        ["travellerContact", "Contact"],
                        ["date", "Date"],
                        ["type", "Type"],
                        ["description", "Description"],
                        ["category", "Category"],
                        ["paymentMethod", "External payment method"],
                        ["tripId", "Registered trip ID"],
                        ["customTripId", "Custom trip ID"],
                        ["departureId", "Departure ID"],
                        ["bookingId", "Booking ID"],
                        ["referenceNumber", "Reference number"],
                        ["notes", "Private notes"]
                    ].map(([key, label]) =>
                        h(
                            "div",
                            { key },
                            h("dt", null, label),
                            h("dd", null, detail[key] || "Not specified")
                        )
                    ),
                    h(
                        "div",
                        null,
                        h("dt", null, "Amount"),
                        h(
                            "dd",
                            null,
                            m.money(detail.amount, detail.currency)
                        )
                    )
                ),
                h(
                    "div",
                    { className: "finance-actions" },
                    h(
                        Btn,
                        {
                            variant: "outline",
                            disabled: busy,
                            onClick: () => {
                                setEditor({
                                    initial: detail,
                                    key: detail.id
                                });
                                setDetail(null);
                            }
                        },
                        "Edit"
                    ),
                    h(
                        Btn,
                        {
                            variant: "outline",
                            disabled: busy,
                            onClick: () => removeEntry(detail)
                        },
                        "Delete"
                    ),
                    h(
                        Btn,
                        { onClick: () => setDetail(null) },
                        "Close"
                    )
                )
            )
    );
}
