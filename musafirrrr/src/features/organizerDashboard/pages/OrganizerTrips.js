"use strict";
/* ============================================================
   PAGE — ORGANIZER TRIPS  (#/organizer/trips)
   ============================================================ */

/** Number box that saves when you leave it, not on every keystroke. */
function SpotsInput({ trip, onCommit }) {
    const [v, setV] = useState(String(trip.availableSpots));
    useEffect(() => { setV(String(trip.availableSpots)); }, [trip.availableSpots]);
    const commit = () => {
        const n = Math.max(0, Math.min(trip.totalSpots, parseInt(v, 10) || 0));
        setV(String(n));
        if (n !== trip.availableSpots)
            onCommit(n);
    };
    return React.createElement("input", { type: "number", "aria-label": "Spots left for " + trip.title, min: "0", max: trip.totalSpots, value: v,
        onChange: e => setV(e.target.value), onBlur: commit,
        onKeyDown: e => { if (e.key === 'Enter')
            e.target.blur(); },
        className: "w-20 h-9 px-2.5 rounded-lg border border-line text-[14px]" });
}

/** Organizer's trip list. */
function OrganizerTrips({ selectedTripId, initialStatus } = {}) {
    const { user: me } = useAuth();
    const org = me ? me.organizer : null;
    const orgId = org ? org.id : null;
    const [tab, setTab] = useState(['PUBLISHED', 'DRAFT', 'SOLD_OUT', 'COMPLETED'].includes(initialStatus) ? initialStatus : 'ALL');
    const [search, setSearch] = useState('');
    const [del, setDel] = useState(null);
    const [working, setWorking] = useState(null);

    const { loading, error, data, reload } = useAsync(
        () => orgId
            ? Promise.all([organizerApi.trips(orgId), organizerApi.enquiries(orgId)])
            : Promise.resolve([[], []]),
        [orgId]
    );

    if (!org)
        return React.createElement(EmptyState, { icon: "user", title: "Your community profile is missing", body: "We couldn't find your organizer profile. Please contact support." });
    if (loading && !data)
        return React.createElement("p", { className: "text-slatey py-10" }, "Loading your trips...");
    if (error && !data)
        return React.createElement("div", { className: "py-10" },
            React.createElement("p", { role: "alert", className: "text-bad mb-4" }, "We couldn't load your trips."),
            React.createElement(Btn, { onClick: reload }, "Try again"));

    const all = data ? data[0] : [];
    const leads = data ? data[1] : [];
    const query = search.trim().toLowerCase();
    const list = all.filter(t => (!selectedTripId || t.id === selectedTripId) && (tab === 'ALL' || t.status === tab) && (!query || [t.title, t.destination].some(value => String(value || '').toLowerCase().includes(query))));
    const leadCount = id => leads.filter(e => e.tripId === id).length;

    /** Runs one action at a time, shows errors, reloads the list (unless the action returns false). */
    const run = async (id, fn, okMsg) => {
        if (working)
            return;
        setWorking(id);
        try {
            const r = await fn();
            if (okMsg)
                toast(okMsg);
            if (r !== false)
                reload();
        }
        catch (x) {
            console.error(x);
            toast(x.message || 'Something went wrong. Try again.', 'bad');
        }
        finally {
            setWorking(null);
        }
    };

    const commitSpots = (t, n) => run(t.id, () => {
        let status = null;
        if (t.status === 'PUBLISHED' && n === 0)
            status = 'sold_out';
        else if (t.status === 'SOLD_OUT' && n > 0)
            status = 'published';
        return organizerApi.setTripSpots(t.id, n, status);
    });

    const askDelete = t => {
        if (leadCount(t.id) > 0) {
            toast('This trip has enquiries, so it can\'t be deleted. Unpublish it instead.', 'bad');
            return;
        }
        setDel(t);
    };

    return (React.createElement(React.Fragment, null,
        React.createElement("div", { className: "flex items-end justify-between gap-4 flex-wrap mb-6" },
            React.createElement(SectionHead, { title: "My trips", sub: "Publish, edit, duplicate or retire the trips on your page." }),
            React.createElement(Btn, { icon: "plus", onClick: () => go('/organizer/create'), className: "mb-6" }, "Create trip")),
        selectedTripId && React.createElement('div', { className: 'mb-5 flex items-center justify-between gap-3 flex-wrap', role: 'status' },
            React.createElement('p', { className: 'text-sm text-slatey' }, all.some(t => t.id === selectedTripId) ? 'Showing the listing selected from Departures.' : 'This listing is no longer available in your trips.'),
            React.createElement(Link, { to: '/organizer/trips', className: 'text-sm font-semibold underline underline-offset-4' }, 'Show all trips')),
        React.createElement("div", { className: "org-search" },
            React.createElement(Field, { label: "Find a trip" }, React.createElement(Input, { type: "search", value: search, onChange: e => setSearch(e.target.value), placeholder: "Search by trip name or destination" })),
            React.createElement("p", { role: "status" }, list.length, " of ", all.length, " trips")),
        React.createElement("div", { className: "flex gap-2 flex-wrap mb-6" }, ['ALL', 'PUBLISHED', 'DRAFT', 'SOLD_OUT', 'COMPLETED'].map(st => (React.createElement(Chip, { key: st, active: tab === st, onClick: () => setTab(st) },
            st === 'ALL' ? 'All' : st === 'SOLD_OUT' ? 'Sold out' : st.charAt(0) + st.slice(1).toLowerCase(),
            React.createElement("span", { className: "ml-1 text-[12px] opacity-70" }, st === 'ALL' ? all.length : all.filter(t => t.status === st).length))))),
        list.length === 0
            ? React.createElement(EmptyState, { icon: "compass", title: all.length ? "No matching trips" : "No trips here", body: all.length ? "Try another search or status filter." : "Create a trip and it will show up in this list the moment you save it.", action: all.length ? React.createElement(Btn, { variant: "outline", onClick: () => { setSearch(''); setTab('ALL'); } }, "Clear filters") : React.createElement(Btn, { onClick: () => go('/organizer/create') }, "Create trip") })
            : React.createElement("div", { className: "space-y-3" }, list.map(t => (React.createElement("div", { key: t.id, className: "org-trip-row rounded-2xl border border-line p-4 flex flex-col sm:flex-row gap-4" },
                React.createElement("img", { src: tripCoverSrc(t), alt: "", className: "w-full sm:w-32 h-32 sm:h-24 rounded-xl object-cover" }),
                React.createElement("div", { className: "flex-1 min-w-0" },
                    React.createElement("div", { className: "flex items-start gap-3 justify-between" },
                        React.createElement("div", { className: "min-w-0" },
                            React.createElement(Link, { to: '/trip/' + t.slug, className: "font-bold text-[16px] tracking-tight hover:underline underline-offset-4" }, t.title),
                            React.createElement("div", { className: "text-[13px] text-muted mt-1" },
                                t.destination, " \u00B7 ", dateRange(t.startDate, t.endDate), " \u00B7 ", dur(t), " \u00B7 ", INR(t.price))),
                        React.createElement(StatusTag, { status: t.status })),
                    React.createElement("div", { className: "mt-3 flex flex-wrap items-center gap-4 text-[13px] text-slatey" },
                        React.createElement("span", { className: "inline-flex items-center gap-1.5" },
                            React.createElement(Icon, { name: "users", size: 14 }),
                            t.availableSpots, "/", t.totalSpots, " open"),
                        React.createElement("span", { className: "inline-flex items-center gap-1.5" },
                            React.createElement(Icon, { name: "inbox", size: 14 }),
                            leadCount(t.id), " leads")),
                    React.createElement("div", { className: "mt-3.5 flex flex-wrap gap-2" },
                        React.createElement(Btn, { size: "sm", variant: "outline", icon: "edit", onClick: () => go('/organizer/edit/' + t.id) }, "Edit"),
                        t.status === 'DRAFT' && React.createElement(Btn, { size: "sm", onClick: () => run(t.id, () => organizerApi.setTripStatus(t.id, t.availableSpots === 0 ? 'sold_out' : 'published'), 'Published') }, "Publish"),
                        t.status === 'PUBLISHED' && React.createElement(Btn, { size: "sm", variant: "outline", onClick: () => run(t.id, () => organizerApi.setTripStatus(t.id, 'draft'), 'Unpublished \u2014 back to draft') }, "Unpublish"),
                        t.status === 'SOLD_OUT' && React.createElement(Btn, { size: "sm", variant: "outline", onClick: () => run(t.id, () => organizerApi.setTripSpots(t.id, Math.max(1, t.availableSpots), 'published'), 'Reopened') }, "Reopen"),
                        React.createElement(Btn, { size: "sm", variant: "outline", icon: "copy", onClick: () => run(t.id, async () => {
                                const newId = await organizerApi.duplicateTrip(t.id, orgId);
                                toast('Duplicated as a draft');
                                go('/organizer/edit/' + newId);
                                return false;
                            }) }, "Duplicate"),
                        React.createElement(Btn, { size: "sm", variant: "ghost", className: "text-bad hover:bg-[#F7E9E7]", icon: "trash", onClick: () => askDelete(t) }, "Delete")),
                    t.status !== 'COMPLETED' && React.createElement("div", { className: "mt-3 flex items-center gap-3" },
                        React.createElement("label", { className: "text-[13px] font-semibold text-slatey" }, "Spots left"),
                        React.createElement(SpotsInput, { trip: t, onCommit: n => commitSpots(t, n) }),
                        React.createElement("span", { className: "text-[12.5px] text-muted" }, "of ", t.totalSpots))))))),
        React.createElement(Confirm, { open: !!del, title: "Delete this trip?", body: del ? `"${del.title}" and its public page will be removed. This can't be undone.` : '', onClose: () => setDel(null), onConfirm: () => {
                const target = del;
                if (target)
                    run(target.id, () => organizerApi.deleteTrip(target.id), 'Trip deleted');
            } })));
}
