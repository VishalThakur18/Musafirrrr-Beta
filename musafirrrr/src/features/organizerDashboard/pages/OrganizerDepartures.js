
"use strict";

const DEPARTURE_CHECKLIST = [
    "Confirm transport",
    "Confirm accommodation",
    "Assign trip leader",
    "Share meeting point and packing list",
    "Check traveller details",
    "Send departure reminder"
];

const DEPARTURE_STATUSES = [
    "Upcoming",
    "Filling Fast",
    "Full",
    "Completed",
    "Cancelled"
];

function departureStatus(item) {
    if (item.status === "COMPLETED") return "Completed";
    if (item.status === "CANCELLED") return "Cancelled";
    if (item.status === "SOLD_OUT" || item.remaining === 0) return "Full";

    if (
        item.remaining !== null &&
        item.total > 0 &&
        item.remaining / item.total <= 0.2
    ) {
        return "Filling Fast";
    }

    return "Upcoming";
}

function departureCountdown(item) {
    const status = departureStatus(item);

    if (status === "Cancelled") return "Departure cancelled";
    if (status === "Completed") return "Journey completed";
    if (!item.start) return "Date not set";

    const days = daysUntil(item.start);

    if (days > 0) {
        return `Leaves in ${days} ${days === 1 ? "day" : "days"}`;
    }

    if (days === 0) return "Leaves today";

    return item.end && daysUntil(item.end) >= 0
        ? "Journey in progress"
        : "Departure has passed · review status";
}

function departurePayload(source, values) {
    const total = Number(values.total);
    const sold = Number(values.sold);
    const remaining = total - sold;

    return {
        title: source.title,
        destination: source.destination,
        region: source.region || "",
        starting_location: source.startingLocation,
        category: source.category,
        group_type: source.groupType,
        description: source.description || "",
        start_date: values.start,
        end_date: values.end,
        duration_days: Math.max(
            1,
            Math.round(
                (new Date(values.end + "T00:00:00") -
                    new Date(values.start + "T00:00:00")) /
                    86400000
            ) + 1
        ),
        duration_nights: Math.max(
            0,
            Math.round(
                (new Date(values.end + "T00:00:00") -
                    new Date(values.start + "T00:00:00")) /
                    86400000
            )
        ),
        price: source.price,
        currency: source.currency,
        advance_amount: source.advanceAmount,
        total_spots: total,
        spots_left: remaining,
        meeting_point: source.meetingPoint,
        cancellation_policy: source.cancellationPolicy,
        important_info: source.importantInfo,
        status: source.status === "PUBLISHED" ? "published" : "draft",
        cover_image_url:
            source.images?.[0] ||
            source.coverImage?.url ||
            null,
        images: source.images || [],
        itinerary: (source.itinerary || []).map(day => ({
            title: day.title,
            description: day.detail
        })),
        included: source.included || [],
        excluded: source.excluded || []
    };
}

function OrganizerDepartures() {
    const { user } = useAuth();
    const orgId = user?.organizer?.id;

    const { data, loading, error, reload } = useAsync(
        () => orgId
            ? organizerApi.trips(orgId)
            : Promise.resolve([]),
        [orgId]
    );

    if (loading) {
        return React.createElement(
            "p",
            { role: "status" },
            "Loading your departures..."
        );
    }

    if (error) {
        return React.createElement(
            "div",
            { role: "alert" },
            "Could not load departures. ",
            React.createElement(Btn, { onClick: reload }, "Try again")
        );
    }

    return React.createElement(DepartureWorkspace, {
    key: orgId,
    trips: data || [],
    organizerId: orgId,
    reloadTrips: reload
});
}

function DepartureWorkspace({ trips, organizerId, reloadTrips }) {
    const h = React.createElement;

    const [departures, setDepartures] = useState([]);
    const [loadingDetails, setLoadingDetails] = useState(true);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("All");
    const [editor, setEditor] = useState(null);
    const [notice, setNotice] = useState("");
    const [error, setError] = useState("");
    const [expanded, setExpanded] = useState({});

    useEffect(() => {
        let cancelled = false;

        async function loadDetails() {
            setLoadingDetails(true);
            setError("");

            try {
                const rows = await Promise.all(
                    trips.map(async trip => {
                        const [paused, checklist] = await Promise.all([
                            organizerApi.getTripEnquiryPause(trip.id),
                            organizerApi.getDepartureChecklist(trip.id)
                        ]);

                        return {
                            id: trip.id,
                            tripId: trip.id,
                            start: trip.startDate || "",
                            end: trip.endDate || "",
                            total: Number(trip.totalSpots) || 0,
                            remaining: Number.isFinite(trip.availableSpots)
                                ? trip.availableSpots
                                : null,
                            paused,
                            checklist,
                            status: trip.status,
                            source: true
                        };
                    })
                );

                if (!cancelled) setDepartures(rows);
            } catch (err) {
                if (!cancelled) {
                    setError(err.message || "Could not load departure details.");
                }
            } finally {
                if (!cancelled) setLoadingDetails(false);
            }
        }

        loadDetails();

        return () => {
            cancelled = true;
        };
    }, [trips]);

    const tripById = Object.fromEntries(
        trips.map(trip => [trip.id, trip])
    );

    const visible = departures
        .filter(item => {
            const trip = tripById[item.tripId];
            if (!trip) return false;

            const status = departureStatus(item);

            return (
                (filter === "All" || status === filter) &&
                `${trip.title} ${trip.destination}`
                    .toLowerCase()
                    .includes(search.trim().toLowerCase())
            );
        })
        .sort((a, b) =>
            (a.start || "9999").localeCompare(b.start || "9999")
        );

    const active = departures.filter(item =>
        !["Completed", "Cancelled"].includes(departureStatus(item))
    );

    const groups = trips
        .map(trip => ({
            trip,
            items: visible.filter(item => item.tripId === trip.id)
        }))
        .filter(group => group.items.length);

    async function togglePause(item) {
        setSaving(true);
        setError("");
        setNotice("");

        try {
            const paused = await organizerApi.setTripEnquiryPause(
                item.tripId,
                !item.paused
            );

            setDepartures(current =>
                current.map(row =>
                    row.id === item.id ? { ...row, paused } : row
                )
            );

            setNotice(paused
                ? "Enquiries paused successfully."
                : "Enquiries resumed successfully.");
        } catch (err) {
            setError(err.message || "Could not update enquiry settings.");
        } finally {
            setSaving(false);
        }
    }

    async function toggleChecklist(item, label, checked) {
        setSaving(true);
        setError("");
        setNotice("");

        try {
            const existing = item.checklist.find(row => row.item === label);

            if (existing) {
                await organizerApi.setDepartureChecklistItem(
                    existing.id,
                    checked
                );
            } else if (checked) {
                await organizerApi.addDepartureChecklistItem(
                    item.tripId,
                    label
                );
            }

            const checklist = await organizerApi.getDepartureChecklist(
                item.tripId
            );

            setDepartures(current =>
                current.map(row =>
                    row.id === item.id
                        ? { ...row, checklist }
                        : row
                )
            );
        } catch (err) {
            setError(err.message || "Could not save checklist progress.");
        } finally {
            setSaving(false);
        }
    }

    
    async function saveDeparture(values) {
        setSaving(true);
        setError("");
        setNotice("");

        try {
            const savedId = await organizerApi.saveDeparture(
                values.tripId || values.id || null,
                organizerId,
                values
            );

            await reloadTrips();

            const updatedTrips = await organizerApi.trips(organizerId);
            const savedTrip = updatedTrips.find(
                trip => trip.id === savedId
            );

            if (!savedTrip) {
                throw new Error(
                    "Saved successfully, but the listing could not be refreshed. Reload the page."
                );
            }

            const [paused, checklist] = await Promise.all([
                organizerApi.getTripEnquiryPause(savedId),
                organizerApi.getDepartureChecklist(savedId)
            ]);

            const row = {
                id: savedId,
                tripId: savedId,
                start: savedTrip.startDate || "",
                end: savedTrip.endDate || "",
                total: Number(savedTrip.totalSpots) || 0,
                remaining: Number.isFinite(savedTrip.availableSpots)
                    ? savedTrip.availableSpots
                    : null,
                paused,
                checklist,
                status: savedTrip.status,
                source: true
            };

            setDepartures(current => {
                const exists = current.some(item => item.id === savedId);

                return exists
                    ? current.map(item =>
                        item.id === savedId ? row : item
                    )
                    : [...current, row];
            });

            setEditor(null);
            setNotice(values.id
                ? "Departure updated successfully."
                : "New departure created as a draft listing.");
        } catch (err) {
            setError(err.message || "Could not save the departure.");
        } finally {
            setSaving(false);
        }
    }


    function openEditor(item) {
        setEditor({
            ...item,
            editKey: crypto.randomUUID(),
            sold: item.total - (item.remaining ?? item.total)
        });
    }

    function addDeparture(tripId) {
        const source = tripById[tripId || trips[0]?.id];

        if (!source) return;

        setEditor({
            id: null,
            tripId: source.id,
            start: "",
            end: "",
            total: source.totalSpots || 1,
            sold: 0,
            status: "Upcoming",
            paused: false,
            checklist: [],
            editKey: crypto.randomUUID()
        });
    }

    async function changeStatus(item, status) {
        setSaving(true);
        setError("");
        setNotice("");

        try {
            const dbStatus = {
                "Full": "sold_out",
                "Completed": "completed",
                "Cancelled": "cancelled",
                "Upcoming": "published",
                "Filling Fast": "published"
            }[status];

            await organizerApi.setTripStatus(item.tripId, dbStatus);

            setDepartures(current =>
                current.map(row =>
                    row.id === item.id
                        ? { ...row, status: dbStatus.toUpperCase() }
                        : row
                )
            );

            setNotice("Departure status updated.");
        } catch (err) {
            setError(err.message || "Could not update departure status.");
        } finally {
            setSaving(false);
        }
    }

    if (loadingDetails) {
        return h("p", { role: "status" }, "Loading departure settings...");
    }

    return h("div", { className: "od-departures" },
        h("div", { className: "od-departures-heading" },
            h("div", null,
                h("span", { className: "od-kicker" }, "PLAN EVERY DEPARTURE"),
                h("h1", null, "Departures & seats"),
                h("p", null, "Manage each trip listing, its capacity and preparation.")
            ),
            h(Btn, {
                icon: "plus",
                disabled: !trips.length || saving,
                onClick: () => addDeparture()
            }, "Add departure")
        ),

        h("div", { className: "org-stat-grid" },
            h(Stat, {
                label: "Active departures",
                value: active.length,
                sub: "Excludes completed / cancelled",
                icon: "cal"
            }),
            h(Stat, {
                label: "Total seats",
                value: active.reduce((sum, item) => sum + item.total, 0),
                sub: "Across active departures",
                icon: "users"
            }),
            h(Stat, {
                label: "Remaining seats",
                value: active.some(item => item.remaining === null)
                    ? "—"
                    : active.reduce((sum, item) => sum + item.remaining, 0),
                sub: "Across active departures",
                icon: "grid"
            }),
            h(Stat, {
                label: "Enquiries paused",
                value: active.filter(item => item.paused).length,
                sub: "Saved settings",
                icon: "inbox"
            })
        ),

        notice && h("p", {
            className: "od-departure-notice",
            role: "status"
        }, notice),

        error && h("p", {
            className: "text-bad",
            role: "alert"
        }, error),

        editor && h(DepartureEditor, {
            key: editor.editKey,
            initial: editor,
            trips,
            departures,
            saving,
            onCancel: () => setEditor(null),
            onApply: saveDeparture
        }),

        h("section", {
            className: "org-panel od-departure-filters",
            "aria-label": "Filter departures"
        },
            h("label", null,
                h("span", null, "Find a trip or destination"),
                h("input", {
                    type: "search",
                    value: search,
                    placeholder: "Search your departures",
                    onChange: event => setSearch(event.target.value)
                })
            ),
            h("label", null,
                h("span", null, "Departure status"),
                h("select", {
                    value: filter,
                    onChange: event => setFilter(event.target.value)
                }, ["All", ...DEPARTURE_STATUSES].map(status =>
                    h("option", { key: status, value: status }, status)
                ))
            ),
            h("p", null,
                `${visible.length} ${visible.length === 1 ? "departure" : "departures"}`
            )
        ),

        !groups.length && h(EmptyState, {
            icon: "cal",
            title: trips.length ? "No matching departures" : "Start with a trip listing",
            body: trips.length
                ? "Try another search or filter."
                : "Create a trip before managing departures.",
            action: trips.length
                ? h(Btn, {
                    variant: "outline",
                    onClick: () => {
                        setSearch("");
                        setFilter("All");
                    }
                }, "Clear filters")
                : h(Btn, {
                    onClick: () => go("/organizer/create")
                }, "Create trip")
        }),

        groups.map(({ trip, items }) =>
            h("section", {
                key: trip.id,
                className: "org-panel od-departure-group"
            },
                h("div", { className: "od-departure-group-heading" },
                    h("img", { src: tripCoverSrc(trip), alt: "" }),
                    h("div", null,
                        h("h2", null,
                            h(Link, {
                                to: "/organizer/trips?trip=" + encodeURIComponent(trip.id),
                                className: "od-departure-trip-link",
                                title: "View this listing in My trips"
                            }, trip.title)
                        ),
                        h("p", null, trip.destination)
                    ),
                    h(Btn, {
                        size: "sm",
                        variant: "outline",
                        icon: "plus",
                        disabled: saving,
                        onClick: () => addDeparture(trip.id)
                    }, "Add date")
                ),

                items.map(item => {
                    const status = departureStatus(item);
                    const remaining = item.remaining;
                    const closed = [
                        "Full",
                        "Completed",
                        "Cancelled"
                    ].includes(status);

                    const checklistDone = item.checklist.filter(
                        row => row.is_completed
                    ).length;

                    const checklistChecked = label =>
                        item.checklist.some(
                            row => row.item === label && row.is_completed
                        );

                    const percent = item.total && remaining !== null
                        ? Math.max(0, Math.min(
                            100,
                            (item.total - remaining) / item.total * 100
                        ))
                        : 0;

                    return h("article", {
                        key: item.id,
                        className: "od-departure-card",
                        "aria-label": trip.title + " departure " + item.start
                    },
                        h("div", { className: "od-departure-top" },
                            h("div", null,
                                h("h3", null,
                                    item.start
                                        ? dateRange(item.start, item.end || item.start)
                                        : "Dates to be set"
                                ),
                                h("p", {
                                    className: "od-departure-countdown"
                                }, departureCountdown(item))
                            ),
                            h("div", { className: "od-departure-badges" },
                                h("span", {
                                    className: "od-departure-badge",
                                    "data-status": status
                                }, status),
                                h("span", null, "Saved listing")
                            )
                        ),

                        h("div", { className: "od-departure-capacity" },
                            h("div", null,
                                h("span", null, "Total seats"),
                                h("strong", null, item.total)
                            ),
                            h("div", null,
                                h("span", null, "Seats sold"),
                                h("strong", null,
                                    remaining === null
                                        ? "—"
                                        : item.total - remaining
                                )
                            ),
                            h("div", null,
                                h("span", null, "Remaining seats"),
                                h("strong", null, remaining === null ? "—" : remaining)
                            )
                        ),

                        h("div", {
                            className: "od-departure-meter",
                            role: "img",
                            "aria-label": remaining === null
                                ? "Capacity unavailable"
                                : `${remaining} of ${item.total} seats remaining`
                        }, h("span", {
                            style: { width: percent + "%" }
                        })),

                        h("div", { className: "od-departure-actions" },
                            h(Btn, {
                                size: "sm",
                                variant: "outline",
                                icon: "edit",
                                disabled: saving,
                                onClick: () => openEditor(item)
                            }, "Edit departure"),

                            h(Btn, {
                                size: "sm",
                                variant: "outline",
                                disabled: saving || closed,
                                onClick: () => togglePause(item)
                            }, item.paused ? "Resume enquiries" : "Pause enquiries"),

                            !["Completed", "Cancelled"].includes(status) &&
                                h(Btn, {
                                    size: "sm",
                                    variant: "outline",
                                    disabled: saving,
                                    onClick: () => changeStatus(
                                        item,
                                        status === "Full" ? "Upcoming" : "Full"
                                    )
                                }, status === "Full" ? "Reopen departure" : "Mark full")
                        ),

                        h("p", {
                            className: "od-departure-enquiry-state"
                        }, closed
                            ? "Enquiries closed by trip status"
                            : item.paused
                                ? "Enquiries paused"
                                : "Enquiries enabled"),

                        h("button", {
                            type: "button",
                            className: "od-checklist-toggle",
                            "aria-expanded": !!expanded[item.id],
                            "aria-controls": "checklist-" + item.id,
                            onClick: () => setExpanded(state => ({
                                ...state,
                                [item.id]: !state[item.id]
                            }))
                        },
                            h("span", null, "Preparation checklist"),
                            h("span", null,
                                `${checklistDone} / ${DEPARTURE_CHECKLIST.length} ready`,
                                expanded[item.id] ? " −" : " +"
                            )
                        ),

                        expanded[item.id] &&
                            h("div", {
                                id: "checklist-" + item.id,
                                className: "od-departure-checklist"
                            }, DEPARTURE_CHECKLIST.map(label =>
                                h("label", { key: label },
                                    h("input", {
                                        type: "checkbox",
                                        checked: checklistChecked(label),
                                        disabled: saving,
                                        onChange: event => toggleChecklist(
                                            item,
                                            label,
                                            event.target.checked
                                        )
                                    }),
                                    h("span", null, label)
                                )
                            ))
                    );
                })
            )
        )
    );
}

function DepartureEditor({
    initial,
    trips,
    departures,
    saving,
    onCancel,
    onApply
}) {
    const h = React.createElement;

    const [form, setForm] = useState({
        ...initial,
        sold: initial.sold ?? 0
    });

    const [error, setError] = useState("");
    const ref = useRef(null);

    useEffect(() => {
        ref.current?.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }, []);

    const change = (key, value) => {
        setError("");
        setForm(state => ({ ...state, [key]: value }));
    };

    const field = (label, key, type, extra = {}) =>
        h("label", null,
            h("span", null, label),
            h("input", {
                type,
                value: form[key] ?? "",
                onChange: event => change(key, event.target.value),
                ...extra
            })
        );

    async function submit(event) {
        event.preventDefault();

        const total = Number(form.total);
        const sold = Number(form.sold);

        if (!form.start || !form.end || form.end < form.start) {
            setError("Choose an end date on or after the departure date.");
            return;
        }

        if (
            !Number.isInteger(total) ||
            total < 1 ||
            total > 10000 ||
            !Number.isInteger(sold) ||
            sold < 0 ||
            sold > total
        ) {
            setError("Enter valid total and sold seat counts.");
            return;
        }

        await onApply({ ...form, total, sold });
    }

    return h("form", {
        ref,
        onSubmit: submit,
        className: "org-panel od-departure-editor"
    },
        h("h2", null, initial.id ? "Edit departure" : "Add a departure date"),
        h("p", null,
            "Each departure is stored as its own trip listing."
        ),

        h("div", { className: "od-departure-form-grid" },
            h("label", null,
                h("span", null, "Trip listing"),
                h("select", {
                    value: form.tripId || "",
                    disabled: !!initial.id,
                    onChange: event => change("tripId", event.target.value)
                }, trips.map(trip =>
                    h("option", {
                        key: trip.id,
                        value: trip.id
                    }, trip.title)
                ))
            ),

            field("Departure date", "start", "date", { required: true }),
            field("Return date", "end", "date", {
                required: true,
                min: form.start
            }),
            field("Total seats", "total", "number", {
                required: true,
                min: 1,
                max: 10000,
                step: 1
            }),
            field("Organizer-confirmed seats sold", "sold", "number", {
                required: true,
                min: 0,
                max: form.total || 10000,
                step: 1
            })
        ),

        error && h("p", {
            role: "alert",
            className: "text-bad"
        }, error),

        h("div", { className: "od-departure-actions" },
            h(Btn, {
                type: "submit",
                disabled: saving
            }, saving ? "Saving..." : initial.id ? "Save changes" : "Create departure"),

            h(Btn, {
                type: "button",
                variant: "ghost",
                disabled: saving,
                onClick: onCancel
            }, "Cancel")
        )
    );
}
