"use strict";
/* ============================================================
   PAGE — TRAVELLER DASHBOARD  (#/traveller/dashboard)
   ============================================================ */

/** Traveller dashboard. */
function TravellerDashboard() {
    const s = useStore();
    const me = authService.current();
    const mine = enquiryService.forTraveller(me.id).filter(e => e.status !== 'CANCELLED');
    const upcoming = mine.map(e => ({ e, t: tripService.byId(e.tripId) })).filter(x => x.t);
    const saved = wishlistService.trips().slice(0, 4);
    const recent = s.recent.map(id => tripService.byId(id)).filter(Boolean).slice(0, 4);
    const prefs = me.prefs || {};
    const recs = filterTrips(s.trips, { max: prefs.budget, sort: 'recommended' })
        .filter(t => !prefs.types || !prefs.types.length || prefs.types.includes(t.category)).slice(0, 4);
    return (React.createElement("main", { className: "max-w-shell mx-auto px-5 lg:px-8 py-10 md:py-14 pb-28 md:pb-14" },
        React.createElement("div", { className: "flex items-center gap-4" },
            React.createElement(Avatar, { kind: me.avatarKind || 'valley', seed: me.avatarSeed || 5, size: 56, name: me.name }),
            React.createElement("div", null,
                React.createElement("h1", { className: "text-[28px] sm:text-[34px] font-extrabold tracking-[-0.03em] leading-tight" },
                    "Welcome back, ",
                    me.name.split(' ')[0]),
                React.createElement("p", { className: "text-[15px] text-slatey mt-0.5" },
                    upcoming.length,
                    " open ",
                    upcoming.length === 1 ? 'enquiry' : 'enquiries',
                    " \u00B7 ",
                    s.wishlist.length,
                    " saved ",
                    s.wishlist.length === 1 ? 'trip' : 'trips'))),
        React.createElement("div", { className: "mt-8" },
            React.createElement(SearchBar, { variant: "compact" })),
        React.createElement("section", { className: "mt-12" },
            React.createElement(SectionHead, { title: "Your enquiries", action: upcoming.length ? React.createElement(Link, { to: "/traveller/my-trips", className: "text-[14.5px] font-semibold hover:text-earth" }, "See all") : null }),
            upcoming.length === 0 ? (React.createElement(EmptyState, { icon: "bag", title: "No enquiries yet", body: "When you register interest in a trip, it shows up here with the organizer's contact.", action: React.createElement(Btn, { onClick: () => go('/explore') }, "Find a trip") })) : (React.createElement("div", { className: "grid gap-4 md:grid-cols-2" }, upcoming.slice(0, 4).map(({ e, t }) => React.createElement(EnquiryRowTraveller, { key: e.id, e: e, t: t }))))),
        saved.length > 0 && React.createElement("section", { className: "mt-14" },
            React.createElement(SectionHead, { title: "Saved trips", action: React.createElement(Link, { to: "/saved", className: "text-[14.5px] font-semibold hover:text-earth" }, "See all") }),
            React.createElement("div", { className: "grid gap-5 sm:grid-cols-2 lg:grid-cols-4" }, saved.map(t => React.createElement(TripCard, { key: t.id, trip: t })))),
        recent.length > 0 && React.createElement("section", { className: "mt-14" },
            React.createElement(SectionHead, { title: "Recently viewed" }),
            React.createElement("div", { className: "grid gap-5 sm:grid-cols-2 lg:grid-cols-4" }, recent.map(t => React.createElement(TripCard, { key: t.id, trip: t })))),
        React.createElement("section", { className: "mt-14" },
            React.createElement(SectionHead, { title: "Picked for you", sub: `Based on your budget of ${INR(prefs.budget || 20000)}${prefs.types && prefs.types.length ? ' and a liking for ' + prefs.types.join(' and ').toLowerCase() + ' trips' : ''}.`, action: React.createElement(Link, { to: "/traveller/profile", className: "text-[14.5px] font-semibold hover:text-earth" }, "Edit preferences") }),
            React.createElement(TripGrid, { trips: recs, cols: "4" }))));
}

/** One enquiry row for travellers. */
function EnquiryRowTraveller({ e, t }) {
    const org = organizerService.byId(e.organizerId);
    return (React.createElement("div", { className: "rounded-2xl border border-line p-4 flex gap-4" },
        React.createElement("img", { src: imgSrc(t.coverImage), alt: "", className: "w-20 h-20 rounded-xl object-cover shrink-0" }),
        React.createElement("div", { className: "min-w-0 flex-1" },
            React.createElement("div", { className: "flex items-start justify-between gap-3" },
                React.createElement(Link, { to: '/trip/' + t.slug, className: "font-bold text-[15.5px] tracking-tight hover:underline underline-offset-4 truncate" }, t.title),
                React.createElement(StatusTag, { status: e.status })),
            React.createElement("div", { className: "text-[13px] text-muted mt-1" },
                dateRange(t.startDate, t.endDate),
                " \u00B7 ",
                e.travellerCount,
                " ",
                e.travellerCount === 1 ? 'traveller' : 'travellers'),
            React.createElement("div", { className: "text-[13px] text-slatey mt-0.5" },
                "with ",
                org ? org.name : 'organizer'),
            React.createElement("div", { className: "mt-3 flex gap-2" },
                React.createElement(WhatsAppButton, { trip: t, org: org, size: "sm", label: "WhatsApp" }),
                React.createElement(Btn, { size: "sm", variant: "outline", onClick: () => go('/trip/' + t.slug) }, "View trip")))));
}
