"use strict";

/** Account-owned saved trips. The route is protected by the traveller guard. */
function SavedPage() {
    const s = useStore();
    const { user: me, ready } = useAuth();
    useEffect(() => {
        if (ready && me?.role === 'TRAVELLER') wishlistService.load().catch(() => {});
    }, [ready, me?.id]);
    if (!ready || me?.role !== 'TRAVELLER') return null;
    const trips = wishlistService.trips();
    const loading = s.wishlistLoading || s.tripsLoading;
    const error = s.wishlistError || s.tripsError;
    const unavailable = wishlistService.ids().length - trips.length;
    const retry = () => {
        wishlistService.load().catch(() => {});
        dataService.loadIntoStore().catch(() => {});
    };
    return React.createElement("main", { className: "max-w-shell mx-auto px-5 lg:px-8 py-10 md:py-14 pb-28 md:pb-14" },
        React.createElement(SectionHead, { title: "Saved trips", sub: "Trips saved to your traveller account." }),
        error ? React.createElement("div", { role: "alert" },
            React.createElement(EmptyState, { title: "Saved trips could not be loaded", body: "Your saved trips are still in your account. Please try again.",
                action: React.createElement(Btn, { onClick: retry }, "Try again") }))
        : loading ? React.createElement(TripGrid, { trips: [], loading: true, cols: "4" })
        : React.createElement(React.Fragment, null,
            unavailable > 0 && React.createElement("p", { className: "mb-6 text-slatey", role: "status" },
                unavailable + " saved " + (unavailable === 1 ? "trip is" : "trips are") + " no longer available to view."),
            trips.length === 0
                ? React.createElement(EmptyState, { icon: "heart", title: unavailable ? "No available saved trips" : "Your next adventure starts here",
                    body: "Tap the heart on a trip to save it to your account.",
                    action: React.createElement(Btn, { size: "lg", onClick: () => go('/explore') }, "Explore trips") })
                : React.createElement("div", { className: "grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" },
                    trips.map(t => React.createElement("div", { key: t.id, className: "relative" },
                        React.createElement(TripCard, { trip: t }),
                        React.createElement("button", { type: "button", onClick: () => wishlistService.toggle(t.id),
                            className: "mt-2.5 w-full h-10 rounded-full border border-line text-[13.5px] font-semibold text-slatey hover:border-bad hover:text-bad transition-colors" }, "Remove from saved"))))));
}
