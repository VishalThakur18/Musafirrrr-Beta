"use strict";
/* ============================================================
   SHARED — TRIP CARD, GRID & WISHLIST BUTTON
   ============================================================ */

/** Heart button to save/unsave a trip. */
function WishlistButton({ tripId, className, floating = true, onPhoto = false, showLabel = false }) {
    const s = useStore();
    const on = s.wishlist.includes(tripId);
    return (React.createElement("button", { type: "button", "aria-pressed": on, "aria-label": on ? 'Remove from saved trips' : 'Save this trip', onClick: e => { e.preventDefault(); e.stopPropagation(); wishlistService.toggle(tripId); }, className: cls('w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90', onPhoto ? 'trip-card__save-button' : floating ? 'bg-white/92 backdrop-blur border border-white/60 shadow-card hover:bg-white' : 'border border-line bg-white hover:bg-sand', !onPhoto && (on ? 'text-bad' : 'text-ink/70 hover:text-ink'), className) },
        React.createElement(Icon, { name: "heart", size: 17, fill: on ? 'currentColor' : 'none', stroke: 1.8 }),
        showLabel && React.createElement("span", null, on ? "Saved" : "Save")));
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

/** Reusable image-led trip card for all listings; color sampling stays separate. */

/** Reusable image-led trip card with shared trip information. */
function TripCard({ trip, priority = false }) {
    const src = tripCoverSrc(trip);
    const coverLayout = tripCoverLayout();
    const [tone, setTone] = useState({
        src: null,
        value: DEFAULT_PHOTO_TONE
    });

    const org = trip.organizer || organizerService.byId(trip.organizerId);
    const soon = daysUntil(trip.startDate);

    return React.createElement(
        "article",
        {
            className: "trip-card",
            style: {
                "--photo-tone":
                    tone.src === src ? tone.value : DEFAULT_PHOTO_TONE
            }
        },

        React.createElement(
            "div",
            {
                className: "trip-card__link"
            },

            React.createElement(
                "div",
                {
                    className: "trip-card__photo",
                    style: coverLayout.style
                },

                React.createElement("img", {
                    ...responsivePhoto(src, 960, '(max-width: 639px) calc(100vw - 40px), (max-width: 1023px) 48vw, 360px'),
                    onError: e => originalPhotoOnError(e, src),
                    onLoad: e => setTone({
                        src,
                        value: photoTone(e.currentTarget)
                    }),
                    alt: trip.destination,
                    loading: priority ? 'eager' : 'lazy',
                    fetchPriority: priority ? 'high' : 'auto',
                    decoding: "async",
                    width: coverLayout.width,
                    height: coverLayout.height
                }),

                React.createElement(
                    "span",
                    { className: "trip-card__category" },
                    trip.category
                ),

                trip.status === 'SOLD_OUT' &&
                    React.createElement(
                        Tag_,
                        { tone: "bad" },
                        "Sold out"
                    ),

                trip.status === 'DRAFT' &&
                    React.createElement(
                        Tag_,
                        { tone: "warn" },
                        "Draft"
                    ),

                soon > 0 &&
                soon <= 21 &&
                trip.status === 'PUBLISHED' &&
                    React.createElement(
                        Tag_,
                        { tone: "beige" },
                        "Leaves in ",
                        soon,
                        "d"
                    )
            ),

            React.createElement(
                "div",
                { className: "trip-card__note" },

                React.createElement(
                    "div",
                    { className: "trip-card__eyebrow" },

                    React.createElement(
                        "span",
                        null,
                        trip.destination
                    ),

                    trip.rating > 0 &&
                        React.createElement(
                            "span",
                            {
                                className: "trip-card__rating",
                                "aria-label":
                                    'Rated ' + trip.rating + ' out of 5'
                            },
                            "★ ",
                            trip.rating
                        )
                ),

                React.createElement(
                    "h3",
                    { title: trip.title },
                    React.createElement(Link, { to: '/trip/' + trip.slug, className: "trip-card__navigation" }, trip.title)
                ),

                React.createElement(
                    "div",
                    { className: "trip-card__organizer flex items-center gap-2" },

                    org && React.createElement(
                        OrgLogo,
                        { org, size: 20 }
                    ),

                    React.createElement(
                        "span",
                        null,
                        org ? org.name : 'Independent organizer'
                    ),

                    org && org.verified &&
                        React.createElement(
                            Icon,
                            {
                                name: "shield",
                                size: 13,
                                className: "text-ok shrink-0"
                            }
                        ),

                        React.createElement(OrgRating, { org })
                ),

                React.createElement(
                    "div",
                    { className: "trip-card__dates" },
                    dateRange(trip.startDate, trip.endDate),
                    " · ",
                    React.createElement("span", { className: "trip-card__duration" }, dur(trip))
                ),

                React.createElement(
                    "div",
                    { className: "trip-card__footer" },

                    React.createElement(
                        "div",
                        null,

                        React.createElement(
                            "strong",
                            null,
                            INR(trip.price)
                        ),

                        React.createElement(
                            "span",
                            { className: "trip-card__per" },
                            "per person"
                        )
                    ),

                    React.createElement(CompareButton, { trip })
                ),

                React.createElement(
                    "div",
                    { className: "trip-card__spots" },
                    React.createElement(
                        SpotsMeter,
                        { trip, compact: true }
                    )
                ),

                React.createElement(
                    "span",
                    { className: "trip-card__cta" },
                    "View trip",
                    React.createElement(
                        "span",
                        { "aria-hidden": true },
                        " ↗"
                    )
                )
            )
        ),

        React.createElement(
            WishlistButton,
            {
                tripId: trip.id,
                onPhoto: true,
                className: "trip-card__save"
            }
        )
    );
}


/** Responsive grid of trip cards (with loading/empty states). */
function TripGrid({ trips, loading, error, onRetry, cols = '3', empty, priority = false }) {
    const c = cols === '4'
        ? 'grid gap-5 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
        : 'grid gap-5 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
    if (loading && !trips.length)
        return React.createElement("div", { className: c }, Array.from({ length: 6 }).map((_, i) => React.createElement(CardSkeleton, { key: i })));
    if (error && !trips.length)
        return React.createElement('div', { role: 'alert' }, React.createElement(EmptyState, {
            title: 'Trips could not be loaded', body: 'Please try again in a moment.',
            action: onRetry && React.createElement(Btn, { onClick: onRetry }, 'Try again')
        }));
    if (!trips.length)
        return empty || React.createElement(EmptyState, { title: "No trips match those filters", body: "Try widening the dates or raising the budget \u2014 new trips get listed every week.", action: React.createElement(Btn, { onClick: () => go('/explore') }, "Clear filters") });
    return React.createElement("div", { className: cls(c, 'trip-card-grid') },
        trips.map((t, index) => React.createElement(TripCard, { key: t.id, trip: t, priority: priority && index < 2 })));
}

/** Horizontally scrolling row. */
function ScrollRow({ children, label }) {
    return (React.createElement("div", { className: "u-scroll -mx-5 px-5 md:mx-0 md:px-0", "aria-label": label },
        React.createElement("div", { className: "flex gap-4 md:gap-5 pb-1" }, children)));
}
