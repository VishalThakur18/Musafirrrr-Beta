"use strict";
/* ============================================================
   PAGE — SAVED TRIPS  (#/saved)
   ============================================================ */

/** Saved trips (#/saved). */
function SavedPage() {
    const s = useStore();
    const trips = wishlistService.trips();
    const me = authService.current();
    return (React.createElement("main", { className: "max-w-shell mx-auto px-5 lg:px-8 py-10 md:py-14 pb-28 md:pb-14" },
        React.createElement(SectionHead, { title: "Saved trips", sub: trips.length ? `${trips.length} ${trips.length === 1 ? 'trip' : 'trips'} you're keeping an eye on.` : '' }),
        !me && trips.length > 0 && (React.createElement("div", { className: "mb-7 rounded-2xl bg-sand border border-line p-4 flex flex-col sm:flex-row sm:items-center gap-3" },
            React.createElement(Icon, { name: "info", size: 18, className: "text-earth shrink-0" }),
            React.createElement("p", { className: "text-[14.5px] text-slatey flex-1" }, "These are saved on this device. Create an account and they move with you."),
            React.createElement(Btn, { size: "sm", onClick: () => go('/signup') }, "Create account"))),
        trips.length === 0 ? (React.createElement(EmptyState, { icon: "heart", title: "Your next adventure starts here", body: "Tap the heart on any trip to keep it here. You don't need an account to save.", action: React.createElement(Btn, { size: "lg", onClick: () => go('/explore') }, "Explore trips") })) : (React.createElement("div", { className: "grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" }, trips.map(t => (React.createElement("div", { key: t.id, className: "relative" },
            React.createElement(TripCard, { trip: t }),
            React.createElement("button", { onClick: () => wishlistService.toggle(t.id), className: "mt-2.5 w-full h-10 rounded-full border border-line text-[13.5px] font-semibold text-slatey hover:border-bad hover:text-bad transition-colors" }, "Remove from saved"))))))));
}
