"use strict";
/* ============================================================
   PAGE — TRAVELLER MY TRIPS  (#/traveller/my-trips)
   ============================================================ */

/** Traveller's enquiries list. */
function TravellerMyTrips() {
    const s = useStore();
    const me = authService.current();
    const [tab, setTab] = useState('open');
    const rows = enquiryService.forTraveller(me.id).map(e => ({ e, t: tripService.byId(e.tripId) })).filter(x => x.t);
    const list = rows.filter(({ e, t }) => tab === 'open' ? e.status !== 'CANCELLED' && t.status !== 'COMPLETED' : (e.status === 'CANCELLED' || t.status === 'COMPLETED'));
    return (React.createElement("main", { className: "max-w-shell mx-auto px-5 lg:px-8 py-10 md:py-14 pb-28 md:pb-14" },
        React.createElement(SectionHead, { title: "My trips", sub: "Every trip you've enquired about, and where it stands." }),
        React.createElement("div", { className: "border-b border-line flex gap-6 mb-7" }, [['open', 'Open'], ['past', 'Past & cancelled']].map(([v, l]) => (React.createElement("button", { key: v, onClick: () => setTab(v), className: cls('pb-3 text-[15px] font-semibold border-b-2 -mb-px', tab === v ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-slatey') }, l)))),
        list.length === 0
            ? React.createElement(EmptyState, { icon: "bag", title: tab === 'open' ? 'Nothing booked yet' : 'Nothing here', body: tab === 'open' ? 'Find a trip, send an enquiry, and track it from this page.' : 'Past and cancelled enquiries will collect here.', action: React.createElement(Btn, { onClick: () => go('/explore') }, "Explore trips") })
            : React.createElement("div", { className: "grid gap-4 md:grid-cols-2" }, list.map(({ e, t }) => React.createElement(EnquiryRowTraveller, { key: e.id, e: e, t: t })))));
}
