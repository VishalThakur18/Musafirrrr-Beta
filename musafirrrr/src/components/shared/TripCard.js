"use strict";
/* ============================================================
   SHARED — TRIP CARD, GRID & WISHLIST BUTTON
   ============================================================ */

/** Heart button to save/unsave a trip. */
function WishlistButton({ tripId, className, floating = true }) {
    const s = useStore();
    const on = s.wishlist.includes(tripId);
    return (React.createElement("button", { type: "button", "aria-pressed": on, "aria-label": on ? 'Remove from saved trips' : 'Save this trip', onClick: e => { e.preventDefault(); e.stopPropagation(); wishlistService.toggle(tripId); }, className: cls('w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90', floating ? 'bg-white/92 backdrop-blur border border-white/60 shadow-card hover:bg-white' : 'border border-line bg-white hover:bg-sand', on ? 'text-bad' : 'text-ink/70 hover:text-ink', className) },
        React.createElement(Icon, { name: "heart", size: 17, fill: on ? 'currentColor' : 'none', stroke: 1.8 })));
}

/** Shows how many spots are left. */
function SpotsMeter({ trip, compact }) {
    if (trip.status === 'COMPLETED')
        return React.createElement("span", { className: "text-[12.5px] text-muted" }, "Trip completed");
    if (trip.availableSpots === 0)
        return React.createElement("span", { className: "text-[12.5px] font-semibold text-bad" }, "Sold out");
    const pct = Math.max(6, Math.round(trip.availableSpots / trip.totalSpots * 100));
    const low = trip.availableSpots <= 5;
    return (React.createElement("div", { className: compact ? '' : 'w-full' },
        React.createElement("span", { className: cls('text-[12.5px] font-semibold', low ? 'text-earth' : 'text-slatey') },
            trip.availableSpots,
            " ",
            trip.availableSpots === 1 ? 'spot' : 'spots',
            " left"),
        !compact && React.createElement("span", { className: "block mt-1.5 h-1 rounded-full bg-shell overflow-hidden" },
            React.createElement("span", { className: cls('block h-full rounded-full', low ? 'bg-earth' : 'bg-slatey'), style: { width: pct + '%' } }))));
}

/** Trip summary card. */
function TripCard({ trip, compact }) {
    const org = organizerService.byId(trip.organizerId);
    const soon = daysUntil(trip.startDate);
    return (React.createElement(Link, { to: '/trip/' + trip.slug, className: "group block rounded-xl2 overflow-hidden bg-lightbeige border border-line hover:border-ink/25 hover:shadow-lift transition-all duration-200 focus-visible:shadow-lift" },
        React.createElement("div", { className: "relative aspect-[4/3] overflow-hidden bg-shell" },
            React.createElement("img", { src: imgSrc(trip.coverImage), alt: trip.title + ' — ' + trip.destination, loading: "lazy", className: "w-full h-full object-cover transition-transform duration-[400ms] group-hover:scale-[1.04]" }),
            React.createElement("div", { className: "absolute top-3 left-3 flex gap-2" },
                React.createElement(Tag_, { tone: "ink", className: "backdrop-blur bg-ink/85" }, trip.category),
                trip.status === 'SOLD_OUT' && React.createElement(Tag_, { tone: "bad" }, "Sold out"),
                trip.status === 'DRAFT' && React.createElement(Tag_, { tone: "warn" }, "Draft")),
            React.createElement(WishlistButton, { tripId: trip.id, className: "absolute top-2.5 right-2.5" }),
            React.createElement("div", { className: "absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2" },
                React.createElement("span", { className: "text-white font-semibold text-[13px] tracking-[.14em] uppercase drop-shadow" }, trip.destination),
                soon > 0 && soon <= 21 && trip.status === 'PUBLISHED' && React.createElement(Tag_, { tone: "beige", className: "bg-beige/95" },
                    "Leaves in ",
                    soon,
                    "d"))),
        React.createElement("div", { className: "p-4 sm:p-[18px]" },
            React.createElement("h3", { className: "text-[17px] font-bold leading-snug tracking-[-0.01em] text-ink" }, trip.title),
            React.createElement("div", { className: "mt-2 flex items-center gap-2 text-[13px] text-slatey" },
                org && React.createElement(Avatar, { kind: org.logoKind, seed: org.logoSeed, size: 20, name: org.name }),
                React.createElement("span", { className: "truncate" }, org ? org.name : 'Independent organizer'),
                org && org.verified && React.createElement(Icon, { name: "shield", size: 13, className: "text-ok shrink-0" })),
            React.createElement("div", { className: "mt-3 flex items-center gap-3 text-[13px] text-muted" },
                React.createElement("span", { className: "inline-flex items-center gap-1.5" },
                    React.createElement(Icon, { name: "cal", size: 14 }),
                    dateRange(trip.startDate, trip.endDate)),
                React.createElement("span", { className: "w-px h-3 bg-line" }),
                React.createElement("span", null, dur(trip))),
            React.createElement("div", { className: "mt-4 pt-4 border-t border-line flex items-end justify-between gap-3" },
                React.createElement("div", null,
                    React.createElement("div", { className: "text-[19px] font-extrabold tracking-tight text-ink leading-none" }, INR(trip.price)),
                    React.createElement("div", { className: "text-[12px] text-muted mt-1" }, "per person")),
                React.createElement(SpotsMeter, { trip: trip, compact: true })))));
}

/** Responsive grid of trip cards (with loading/empty states). */
function TripGrid({ trips, loading, cols = '3', empty }) {
    const c = cols === '4'
        ? 'grid gap-5 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
        : 'grid gap-5 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
    if (loading)
        return React.createElement("div", { className: c }, Array.from({ length: 6 }).map((_, i) => React.createElement(CardSkeleton, { key: i })));
    if (!trips.length)
        return empty || React.createElement(EmptyState, { title: "No trips match those filters", body: "Try widening the dates or raising the budget \u2014 new trips get listed every week.", action: React.createElement(Btn, { onClick: () => go('/explore') }, "Clear filters") });
    return React.createElement("div", { className: c }, trips.map(t => React.createElement(TripCard, { key: t.id, trip: t })));
}

/** Horizontally scrolling row. */
function ScrollRow({ children, label }) {
    return (React.createElement("div", { className: "u-scroll -mx-5 px-5 md:mx-0 md:px-0", "aria-label": label },
        React.createElement("div", { className: "flex gap-4 md:gap-5 pb-1" }, children)));
}
